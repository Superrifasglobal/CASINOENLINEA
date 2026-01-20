export interface RankInfo {
    label: string;
    minXP: number;
    benefit: string;
    color: string;
}

export const RANKS: RankInfo[] = [
    { label: 'Polvo Espacial', minXP: 0, benefit: 'Ninguno', color: '#94a3b8' },
    { label: 'Satélite', minXP: 1000, benefit: 'Acceso a Torneos', color: '#38bdf8' },
    { label: 'Planeta', minXP: 5000, benefit: '0.5% Cashback', color: '#4ade80' },
    { label: 'Estrella', minXP: 20000, benefit: '1% Cashback', color: '#fbbf24' },
    { label: 'Agujero Negro', minXP: 100000, benefit: 'VIP Support + 2% Cashback', color: '#a855f7' }
];

export class XPService {
    constructor(private db: D1Database) { }

    async addXP(userId: string, betAmount: number) {
        // XP is proportional to risk (10 XP per 1 unit of currency bet)
        const xpToAdd = Math.floor(betAmount * 10);

        const user = await this.db.prepare(
            'SELECT xp, level FROM users WHERE id = ?'
        ).bind(userId).first<{ xp: number, level: number }>();

        if (!user) return null;

        const newXP = user.xp + xpToAdd;
        let newLevel = user.level;

        // Simple level logic: Level = floor(sqrt(XP / 100)) + 1
        const calculatedLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

        let leveledUp = false;
        if (calculatedLevel > user.level) {
            newLevel = calculatedLevel;
            leveledUp = true;
        }

        await this.db.prepare(
            'UPDATE users SET xp = ?, level = ? WHERE id = ?'
        ).bind(newXP, newLevel, userId).run();

        return {
            newXP,
            newLevel,
            leveledUp,
            rank: this.getRankInfo(newLevel, newXP)
        };
    }

    getRankInfo(level: number, xp: number): RankInfo {
        let currentRank = RANKS[0];
        for (const rank of RANKS) {
            if (xp >= rank.minXP) {
                currentRank = rank;
            } else {
                break;
            }
        }
        return currentRank;
    }

    async applyCashback(userId: string, lossAmount: number) {
        const user = await this.db.prepare(
            'SELECT level, xp FROM users WHERE id = ?'
        ).bind(userId).first<{ level: number, xp: number }>();

        if (!user) return;

        const rank = this.getRankInfo(user.level, user.xp);
        let cashbackPercent = 0;

        if (rank.label === 'Planeta') cashbackPercent = 0.005;
        if (rank.label === 'Estrella') cashbackPercent = 0.01;
        if (rank.label === 'Agujero Negro') cashbackPercent = 0.02;

        if (cashbackPercent > 0) {
            const cashbackAmount = lossAmount * cashbackPercent;
            await this.db.prepare(
                'UPDATE users SET balance = balance + ? WHERE id = ?'
            ).bind(cashbackAmount, userId).run();

            console.log(`[XP SYSTEM] Cashback de ${cashbackAmount} aplicado al usuario ${userId}`);
        }
    }
}
