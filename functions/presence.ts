
export class PresenceDO {
    state: DurableObjectState;
    users: Set<string>;

    constructor(state: DurableObjectState, env: any) {
        this.state = state;
        this.users = new Set();

        // Restore state if needed, though for presence ephemeral is usually fine
        this.state.blockConcurrencyWhile(async () => {
            // Load stored count if we were persisting it
        });
    }

    async fetch(request: Request) {
        const url = new URL(request.url);

        // Simple HTTP poll for admin
        if (url.pathname === '/count') {
            return new Response(JSON.stringify({ count: this.users.size }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // WebSocket upgrade for real-time clients (optional, using HTTP heartbeat for now for simplicity)
        if (url.pathname === '/heartbeat') {
            const userId = url.searchParams.get('userId');
            if (userId) {
                this.users.add(userId);
                // Auto-remove after 30s of no heartbeat?
                // For now, let's keep it simple: we rely on this class being called.
                // A better way is using Alarms to cleanup, but we'll implement a simple prune on fetch.
            }
            return new Response('OK');
        }

        return new Response('Not Found', { status: 404 });
    }

    // Optional: Cleanup logic
    async alarm() {
        // Cleanup stale users
    }
}
