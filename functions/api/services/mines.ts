import { SupabaseClient } from '@supabase/supabase-js';

export interface MinesState {
    grid: boolean[]; // true = mine, false = gem
    revealed: number[]; // indices of revealed cells
    mineCount: number;
    bet: number;
    status: 'playing' | 'win' | 'loss';
    multiplier: number;
}

export class MinesService {
    constructor(private supabase: SupabaseClient) { }

    async getGameState(userId: string): Promise<MinesState | null> {
        const { data, error } = await this.supabase
            .from('mines_games')
            .select('state')
            .eq('user_id', userId)
            .single();
        return data ? data.state : null;
    }

    async saveGameState(userId: string, state: MinesState): Promise<void> {
        await this.supabase
            .from('mines_games')
            .upsert({ user_id: userId, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    }

    async clearGameState(userId: string): Promise<void> {
        await this.supabase.from('mines_games').delete().eq('user_id', userId);
    }

    initGame(bet: number, mineCount: number): MinesState {
        const totalCells = 25;
        const grid = new Array(totalCells).fill(false);
        let minesPlaced = 0;

        while (minesPlaced < mineCount) {
            const randomIndex = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * totalCells);
            if (!grid[randomIndex]) {
                grid[randomIndex] = true;
                minesPlaced++;
            }
        }

        return {
            grid,
            revealed: [],
            mineCount,
            bet,
            status: 'playing',
            multiplier: 1
        };
    }

    calculateMultiplier(mineCount: number, revealedCount: number): number {
        // Formula: Multiplier = (Total! / (Total - Revealed)!) / ((Total - Mines)! / (Total - Mines - Revealed)!)
        // Incorporating a house edge (e.g., 0.95 RTP)
        const houseEdge = 0.95;

        const combinations = (n: number, k: number): number => {
            if (k < 0 || k > n) return 0;
            if (k === 0 || k === n) return 1;
            if (k > n / 2) k = n - k;

            let res = 1;
            for (let i = 1; i <= k; i++) {
                res = res * (n - i + 1) / i;
            }
            return res;
        };

        const total = 25;
        const prob = combinations(total - mineCount, revealedCount) / combinations(total, revealedCount);
        return parseFloat((houseEdge / prob).toFixed(2));
    }

    reveal(state: MinesState, index: number): MinesState {
        if (state.status !== 'playing' || state.revealed.includes(index)) return state;

        if (state.grid[index]) {
            state.status = 'loss';
            state.multiplier = 0;
        } else {
            state.revealed.push(index);
            state.multiplier = this.calculateMultiplier(state.mineCount, state.revealed.length);

            // Auto-win if all gems are found
            if (state.revealed.length === 25 - state.mineCount) {
                state.status = 'win';
            }
        }

        return state;
    }
}
