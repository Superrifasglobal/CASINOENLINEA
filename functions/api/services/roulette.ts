
export interface RouletteResult {
    winningNumber: number;
    win: boolean;
    payoutMultiplier: number;
    payout: number;
    betType: 'number' | 'color' | 'even_odd'; // Expandable
    betValue: string | number;
}

export class RouletteEngine {
    // European Roulette: 0-36
    private readonly numbers = Array.from({ length: 37 }, (_, i) => i);

    // Red numbers in standard roulette
    private readonly redNumbers = [
        1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
    ];

    /**
     * Generates a cryptographically secure random number between 0 and 36.
     */
    private getRandomNumber(): number {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        // Simple modulo might introduce slight bias, but for 0-36 range with Uint32 it's negligible for this demo.
        // For production "provably fair", we might want a better rejection sampling or specific library.
        return array[0] % 37;
    }

    private isRed(number: number): boolean {
        return this.redNumbers.includes(number);
    }

    private isBlack(number: number): boolean {
        return number !== 0 && !this.redNumbers.includes(number);
    }

    /**
     * Calculates the payout based on the bet and the winning number.
     * @param betType 'number' (0-36) or 'color' ('red', 'black')
     * @param betValue The specific number or color bet on
     * @param betAmount The amount wagered
     */
    spin(betType: string, betValue: string | number, betAmount: number): RouletteResult {
        const winningNumber = this.getRandomNumber();
        let win = false;
        let payoutMultiplier = 0;

        // Normalize inputs
        if (betType === 'number') {
            const targetNumber = Number(betValue);
            if (!isNaN(targetNumber) && targetNumber === winningNumber) {
                win = true;
                payoutMultiplier = 35 + 1; // 35:1 payout + return calculation usually implies "Total win amount" = stake * 36
            }
        } else if (betType === 'color') {
            const targetColor = String(betValue).toLowerCase();
            const winningColor = this.isRed(winningNumber) ? 'red' : (winningNumber === 0 ? 'green' : 'black');

            if (targetColor === winningColor) {
                win = true;
                payoutMultiplier = 2; // 1:1 payout -> 2x multiplier
            }
        }

        // Logic for Even/Odd can be added here

        return {
            winningNumber,
            win,
            payoutMultiplier,
            payout: win ? betAmount * payoutMultiplier : 0,
            betType: betType as any,
            betValue
        };
    }
}
