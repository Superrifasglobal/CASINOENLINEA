export interface Card {
    suit: string;
    value: string;
    rank: number;
}

export interface BlackjackState {
    deck: Card[];
    playerHand: Card[];
    dealerHand: Card[];
    status: 'playing' | 'player_win' | 'dealer_win' | 'push' | 'blackjack';
    bet: number;
}

export class BlackjackService {
    private readonly suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    private readonly values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    constructor(private db: D1Database) { }

    async getGameState(userId: string): Promise<BlackjackState | null> {
        const res = await this.db.prepare('SELECT state FROM blackjack_games WHERE user_id = ?')
            .bind(userId).first<{ state: string }>();
        return res ? JSON.parse(res.state) : null;
    }

    async saveGameState(userId: string, state: BlackjackState): Promise<void> {
        await this.db.prepare('INSERT OR REPLACE INTO blackjack_games (user_id, state, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
            .bind(userId, JSON.stringify(state)).run();
    }

    async clearGameState(userId: string): Promise<void> {
        await this.db.prepare('DELETE FROM blackjack_games WHERE user_id = ?').bind(userId).run();
    }

    private createDeck(): Card[] {
        const deck: Card[] = [];
        for (const suit of this.suits) {
            for (const value of this.values) {
                let rank = parseInt(value);
                if (['J', 'Q', 'K'].includes(value)) rank = 10;
                if (value === 'A') rank = 11;
                deck.push({ suit, value, rank });
            }
        }
        return this.shuffle(deck);
    }

    private shuffle(deck: Card[]): Card[] {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private calculateScore(hand: Card[]): number {
        let score = hand.reduce((sum, card) => sum + card.rank, 0);
        let aces = hand.filter(card => card.value === 'A').length;
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }

    async initGame(userId: string, bet: number): Promise<BlackjackState> {
        // Build initial state
        const deck = this.createDeck();
        const playerHand = [deck.pop()!, deck.pop()!];
        const dealerHand = [deck.pop()!, deck.pop()!];

        const playerScore = this.calculateScore(playerHand);
        let status: BlackjackState['status'] = 'playing';

        if (playerScore === 21) {
            status = 'blackjack';
            // Payout handled in the caller (router) to ensure atomicity with status check
        }

        const state: BlackjackState = {
            deck,
            playerHand,
            dealerHand,
            status,
            bet
        };

        // We store this in KV or D1. Given the context, D1 is safer for financial state.
        // Let's assume a table 'active_games' exists or we use a temporary session blob.
        // For simplicity in this worker, we'll return it and let the caller manage D1 persistence if needed, 
        // but it's better if this service handles it.

        return state;
    }

    async hit(state: BlackjackState): Promise<BlackjackState> {
        if (state.status !== 'playing') return state;

        const card = state.deck.pop()!;
        state.playerHand.push(card);

        const score = this.calculateScore(state.playerHand);
        if (score > 21) {
            state.status = 'dealer_win';
        }

        return state;
    }

    async stand(state: BlackjackState): Promise<BlackjackState> {
        if (state.status !== 'playing') return state;

        let dealerScore = this.calculateScore(state.dealerHand);
        while (dealerScore < 17) {
            state.dealerHand.push(state.deck.pop()!);
            dealerScore = this.calculateScore(state.dealerHand);
        }

        const playerScore = this.calculateScore(state.playerHand);
        if (dealerScore > 21 || playerScore > dealerScore) {
            state.status = 'player_win';
        } else if (dealerScore > playerScore) {
            state.status = 'dealer_win';
        } else {
            state.status = 'push';
        }

        return state;
    }
}
