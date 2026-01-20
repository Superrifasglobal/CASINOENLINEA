import { ReconciliationService } from './functions/api/services/reconciliation';

export interface Env {
    DB: D1Database;
}

export default {
    // Manejador del Cron Trigger
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
        console.log(`[CRON] Iniciando reconciliación de saldos: ${event.scheduledTime}`);

        const service = new ReconciliationService(env.DB);

        ctx.waitUntil(
            service.reconcileAllUsers().then((results) => {
                if (results.length > 0) {
                    console.warn(`[CRON] Reconciliación completada con ${results.length} discrepancias encontradas.`);
                } else {
                    console.log('[CRON] Reconciliación completada. Todos los saldos coinciden.');
                }
            }).catch((err) => {
                console.error('[CRON] Error durante la reconciliación:', err);
            })
        );
    },
};
