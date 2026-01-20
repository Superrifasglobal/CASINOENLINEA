import { compare, hash } from 'bcryptjs';
import { SignJWT } from 'jose';

export const onRequest = async (context) => {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const route = params.route; // 'register' or 'login' via [[route]]

    // Handle allow-list of routes
    const path = Array.isArray(route) ? route.join('/') : route;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    if (path === 'register') {
        return handleRegister(request, env);
    } else if (path === 'login') {
        return handleLogin(request, env);
    }

    return new Response('Not Found', { status: 404 });
};

// --- HANDLERS ---

// --- HANDLERS ---

async function handleRegister(request, env) {
    try {
        const { email, password, turnstileToken } = await request.json();
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

        // 1. Validations
        if (!email || !password || password.length < 8) {
            return new Response(JSON.stringify({ error: 'Invalid input. Password must be at least 8 chars.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Basic Email Regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. IP Abuse Check
        // Count existing accounts with this IP
        const ipCountRaw = await env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE signup_ip = ?').bind(ip).first();
        const ipCount = ipCountRaw ? ipCountRaw.count : 0;

        if (ipCount >= 2) {
            // Enforce Turnstile Verification
            if (!turnstileToken) {
                return new Response(JSON.stringify({
                    error: 'Too many accounts from this IP. Please complete the captcha.',
                    requiresCaptcha: true
                }), { status: 403, headers: { 'Content-Type': 'application/json' } });
            }

            const isValidCaptcha = await verifyTurnstile(turnstileToken, ip, env);
            if (!isValidCaptcha) {
                return new Response(JSON.stringify({ error: 'Invalid captcha' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
            }
        }

        // 3. Hash Password (bcrypt)
        const passwordHash = await hash(password, 10);
        const userId = crypto.randomUUID();

        // 4. Insert into D1
        // Default role 'user', balance 0, is_verified 0
        try {
            await env.DB.prepare(
                'INSERT INTO users (id, email, password_hash, balance, role, is_verified, signup_ip) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(userId, email, passwordHash, 0.0, 'user', 0, ip).run();
        } catch (e) {
            if (e.message.includes('UNIQUE')) {
                return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
            }
            throw e;
        }

        return new Response(JSON.stringify({ success: true, message: 'User registered successfully' }), { status: 201, headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

async function handleLogin(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    // 1. Rate Limiting (5 attempts per minute)
    const isAllowed = await checkRateLimit(env, ip);
    if (!isAllowed) {
        return new Response(JSON.stringify({ error: 'Too many login attempts. Please try again later.' }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Missing credentials' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // 2. Fetch User
        const user = await env.DB.prepare(
            'SELECT id, email, password_hash, role, is_verified FROM users WHERE email = ?'
        ).bind(email).first();

        if (!user) {
            // Don't reveal user existence
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // 3. Verify Password
        const isValid = await compare(password, user.password_hash);
        if (!isValid) {
            return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        // 4. Generate JWT
        const secret = new TextEncoder().encode(env.JWT_SECRET);
        const token = await new SignJWT({
            sub: user.id,
            email: user.email,
            role: user.role
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secret);

        // 5. Store Session in D1 (Optional but good for management as per schema)
        // Note: Schema has 'sessions' table, let's use it
        const sessionId = crypto.randomUUID();
        await env.DB.prepare(
            'INSERT INTO sessions (id, user_id, token, device_info, expires_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(
            sessionId,
            user.id,
            token,
            request.headers.get('User-Agent') || 'unknown',
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h from now
        ).run();

        return new Response(JSON.stringify({
            success: true,
            token,
            user: { id: user.id, email: user.email, role: user.role, is_verified: user.is_verified }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}

// --- HELPERS ---

async function checkRateLimit(env, ip) {
    // Use KV for Rate Limiting. Binding 'SESSIONS' is a KVNamespace.
    // Key: rate_limit:login:{ip}
    const key = `rate_limit:login:${ip}`;

    if (!env.SESSIONS) {
        console.warn("SESSIONS KV binding not found, skipping rate limit check");
        return true; // Fail open if KV not configured to avoid blocking
    }

    const currentStr = await env.SESSIONS.get(key);
    let current = currentStr ? parseInt(currentStr) : 0;

    if (current >= 5) {
        return false;
    }

    // Increment and set TTL to 60 seconds (window)
    // KV doesn't have atomic increment, so this is a 'loose' rate limit which is fine for this purpose
    // To be more precise, we could use D1 or DO, but KV is fast.
    await env.SESSIONS.put(key, (current + 1).toString(), { expirationTtl: 60 });

    return true;
}

async function verifyTurnstile(token, ip, env) {
    const secretKey = env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.warn("TURNSTILE_SECRET_KEY not configured, allowing request");
        return true;
    }

    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    formData.append('remoteip', ip);

    try {
        const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            body: formData,
            method: 'POST',
        });

        const outcome = await result.json();
        return outcome.success;
    } catch (e) {
        console.error("Turnstile verification failed", e);
        return false;
    }
}

