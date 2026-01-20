/**
 * Antigravity Slot Engine
 * Matemáticas de casino con soporte para RTP dinámico
 */

export interface Symbol {
    id: string;
    name: string;
    weight: number;
    multiplier: number;
}

export class SlotEngine {
    private symbols: Symbol[] = [
        { id: 'planet_1', name: 'Planeta Tierra', weight: 600, multiplier: 2 },
        { id: 'planet_2', name: 'Marte', weight: 500, multiplier: 5 },
        { id: 'galaxy_1', name: 'Andrómeda', weight: 150, multiplier: 20 },
        { id: 'galaxy_2', name: 'Sombrero', weight: 100, multiplier: 50 },
        { id: 'blackhole', name: 'Gargantúa', weight: 20, multiplier: 500 },
    ];

    /**
     * Ajusta los pesos de los símbolos según el RTP configurado.
     * Un RTP más bajo reduce el peso de los símbolos con multiplicadores altos.
     */
    private getAdjustedSymbols(rtp: number): Symbol[] {
        return this.symbols.map(s => {
            if (s.multiplier > 10) {
                // Escala el peso de los premios grandes basado en el RTP (0.0 a 1.0)
                return { ...s, weight: Math.floor(s.weight * rtp) };
            }
            return s;
        });
    }

    /**
     * Genera un giro (Spin) para un slot de 3x3
     */
    spin(rtp: number = 0.95) {
        const adjustedSymbols = this.getAdjustedSymbols(rtp);
        const totalWeight = adjustedSymbols.reduce((sum, s) => sum + s.weight, 0);

        const getRandomSymbol = () => {
            let random = Math.random() * totalWeight;
            for (const symbol of adjustedSymbols) {
                if (random < symbol.weight) return symbol;
                random -= symbol.weight;
            }
            return adjustedSymbols[0];
        };

        // Generar matriz 3x3
        const grid = [
            [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
            [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
            [getRandomSymbol(), getRandomSymbol(), getRandomSymbol()],
        ];

        // Verificar línea central (Lógica simplificada)
        const centerLine = grid[1];
        let win = false;
        let payoutMultiplier = 0;
        let winningSymbol = null;

        if (centerLine[0].id === centerLine[1].id && centerLine[1].id === centerLine[2].id) {
            win = true;
            payoutMultiplier = centerLine[0].multiplier;
            winningSymbol = centerLine[0];
        }

        return {
            grid: grid.map(row => row.map(s => s.id)),
            win,
            payoutMultiplier,
            winningSymbol: winningSymbol ? winningSymbol.name : null
        };
    }
}
