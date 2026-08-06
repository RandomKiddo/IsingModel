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
    public algorithm: 'metropolis' | 'wolff' = 'metropolis';

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
        if (this.algorithm === 'metropolis') {
            this.stepMetropolis();
        } else {
            this.stepWolff();
        }
    }

    private stepMetropolis(): void {
        const N = this.params.size;

        for (let k = 0; k < N*N; ++k) {
            const i = Math.floor(Math.random()*N);
            const j = Math.floor(Math.random()*N);

            const currentSpin = this.grid[i][j];

            const neighbors =
            this.getSpin(i+1, j) +
            this.getSpin(i-1, j) +
            this.getSpin(i, j+1) +
            this.getSpin(i, j-1);

            const dE = 2*currentSpin * (this.params.J*neighbors + this.params.field);

            if (dE <= 0 || Math.random() < Math.exp(-dE/this.params.temperature)) {
                this.grid[i][j] = -currentSpin;
            }
        }
    }

    private stepWolff(): void {
        const N = this.params.size;
        const seedI = Math.floor(Math.random()*N);
        const seedJ = Math.floor(Math.random()*N);
        const clusterSpin = this.grid[seedI][seedJ];

        const pAdd = 1-Math.exp(-2*this.params.J/this.params.temperature);
        if (pAdd <= 0) {
            return;
        }

        const stack: [number, number][] = [[seedI, seedJ]];

        const inCluster = new Uint8Array(N*N);
        inCluster[seedI*N + seedJ] = 1;

        while (stack.length > 0) {
            const [i, j] = stack.pop()!;
            this.grid[i][j] = -clusterSpin;

            const neighbors: [number, number][] = [
                [(i+1)%N, j],
                [(i-1+N)%N, j],
                [i, (j+1)%N],
                [i, (j-1+N)%N],
            ];

            for (const [ni, nj] of neighbors) {
                const idx = ni*N + nj;
                if (!inCluster[idx] && this.grid[ni][nj] === clusterSpin) {
                    if (Math.random() < pAdd) {
                        inCluster[idx] = 1;
                        stack.push([ni, nj]);
                    }
                }
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