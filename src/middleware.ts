import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

// --- CONFIGURATION ---
const SUPER_ADMIN_EMAIL = "nexjmr07@gmail.com";

// Rutas que requieren protección estricta (admin only)
const ADMIN_ROUTES_PATTERN = /^\/admin/;
const ADMIN_API_PATTERN = /^\/api\/admin/;

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;

        // 1. Verificación de Seguridad: Super-Admin Check
        // Si intenta acceder a cualquier ruta /admin o /api/admin, el email DEBE coincidir.
        if (ADMIN_ROUTES_PATTERN.test(pathname) || ADMIN_API_PATTERN.test(pathname)) {
            const userEmail = token?.email;

            if (userEmail !== SUPER_ADMIN_EMAIL) {
                console.warn(`[SECURITY ALERT] Unauthorized access attempt to ${pathname} by ${userEmail} (IP: ${req.ip || 'unknown'})`);

                // A. Protección de Rutas de API Sensibles
                // Si es una llamada a API, devolvemos JSON 403 inmediato.
                if (pathname.startsWith('/api/')) {
                    return NextResponse.json(
                        { error: "Forbidden: Super Admin privileges required." },
                        { status: 403 }
                    );
                }

                // B. Protección de Rutas de UI
                // Si es una página, redirigimos a una página de error o al lobby.
                // Usamos 307 Temporary Redirect para no cachear la redirección de seguridad.
                const url = req.nextUrl.clone();
                url.pathname = "/403-forbidden"; // O volver a "/lobby" con ?error=access_denied
                return NextResponse.redirect(url);
            }
        }

        // Si pasa todas las comprobaciones, permite continuar
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Lógica base: El token debe existir.
                // Si no existe token, 'withAuth' redirige automáticamente al login.
                // Si es una API route, querremos manejar esto tal vez devolviendo 401 en lugar de redirigir,
                // pero withAuth por defecto redirige. Para APIs protegidas por este middleware, la redirección es aceptable
                // porque el cliente (browser) manejará el redirect.
                return !!token;
            },
        },
        pages: {
            signIn: '/login', // Redirección si no hay sesión
        },
    }
)

export const config = {
    // Matcher optimizado para interceptar solo lo necesario, mejorando el rendimiento.
    // Incluye /admin y /api/admin. Excluye assets estáticos (_next, imágenes, etc).
    matcher: [
        "/admin/:path*",
        "/api/admin/:path*"
    ],
}
