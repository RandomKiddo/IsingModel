/*
 * File: IsingModel.ts
 * 
 * Description Placeholder
 * 
 * Programmer: Neil Ghugare
 * 
 * Revision History:
 * 08/03/2026 - Created initial version.
 * 
 * Notes:
 */


export type BoundaryCondition = 'periodic' | 'open' | 'fixed';

export interface ModelParams {
    size: number;                 // Grid size N x N
    temperature: number;          // Temperature (T)
    field: number;                // External magnetic field (H)
    J: number;                    // Coupling constant (+1 ferromagnetic, -1 antiferromagnetic)
    boundary: BoundaryCondition;  // Boundary condition
}

export class IsingModel {
    public params: ModelParams;
    public grid: number[][];

    constructor(params: ModelParams) {
        this.params = params;
        this.grid = Array.from({ length: params.size }, () => 
            Array.from({ length:params.size }, () => (Math.random() < 0.5 ? 1 : -1))
        );
    }

    private getSpin(i: number, j: number): number {
        const N = this.params.size;

        if (this.params.boundary === 'periodic') {
            const x = (i+N) % N;
            const y = (j+N) % N;

            return this.grid[x][y];
        } else if (this.params.boundary === 'open') {
            if (i < 0 || i >= N || j < 0 || j >= N) {
                return 0;
            }

            return this.grid[i][j];
        } else {  // 'fixed'
            if (i < 0 || i >= N || j < 0 || j >= N) {
                return 1;  // Locked to +1
            }

            return this.grid[i][j];
        }
    }

    public step(): void {
        const N = this.params.size;
        const { temperature: T, field: H, J } = this.params;

        for (let k = 0; k < N*N; ++k) {
            const i = Math.floor(Math.random() * N);
            const j = Math.floor(Math.random() * N);
            const spin = this.grid[i][j];

            const neighbors = 
                this.getSpin(i+1, j) +
                this.getSpin(i-1, j) +
                this.getSpin(i, j+1) +
                this.getSpin(i, j-1);
            
            const deltaE = 2 * spin * (J*neighbors + H);

            if (deltaE <= 0 || Math.random() < Math.exp(-deltaE/T)) {
                this.grid[i][j] = -spin; // Flip accepted
            }
        }
    }

    public getMagnetization(): number {
        let total = 0;
        const N = this.params.size;

        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < N; ++j) {
                total += this.grid[i][j];
            }
        }

        return total/(N*N);
    }

    public getEnergy(): number {
        let interactionSum = 0;
        let fieldSum = 0;
        const N = this.params.size;

        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < N; ++j) {
                const spin = this.grid[i][j];

                const right = this.getSpin(i+1, j);
                const down = this.getSpin(i, j+1);

                interactionSum += spin*(right + down);
                fieldSum += spin;
            }
        }

        const totalE = -this.params.J*interactionSum - this.params.field*fieldSum;

        return totalE / (N*N); // Normalized energy per spin
    }
}