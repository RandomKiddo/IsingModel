/*
 * File: IsingModel.ts
 * 
 * TypeScript file that holds the Ising model simulation details and behavior.
 * 
 * Programmer: Neil Ghugare
 * 
 * Revision History:
 * 08/03/2026 - Created initial version.
 * 
 * Notes:
 */

// Boundary condition type, one of 'periodic', 'open', or 'fixed'
export type BoundaryCondition = 'periodic' | 'open' | 'fixed';

// Model parameter interface
export interface ModelParams {
    size: number;                 // Grid size N x N
    temperature: number;          // Temperature (T)
    field: number;                // External magnetic field (H)
    J: number;                    // Coupling constant (+1 ferromagnetic, -1 antiferromagnetic)
    boundary: BoundaryCondition;  // Boundary condition
}

// Ising model simulation class
export class IsingModel {
    public params: ModelParams;                               // Model parameters
    public grid: number[][];                                  // Ising model grid
    public algorithm: 'metropolis' | 'wolff' = 'metropolis';  // Spin flip algorithm being used, one of 'metropolis' or 'wolff'

    // Creates a new Ising model simulation
    constructor(params: ModelParams) {
        this.params = params;

        // Randomly populate spins on the grid
        this.grid = Array.from({ length: params.size }, () => 
            Array.from({ length:params.size }, () => (Math.random() < 0.5 ? 1 : -1))
        );
    }

    // Gets the current spin in the lattice at index [i, j]
    // Depends on the boundary conditions being used 
    private getSpin(i: number, j: number): number {
        const N = this.params.size;

        if (this.params.boundary === 'periodic') {
            const x = (i+N) % N;
            const y = (j+N) % N;

            return this.grid[x][y];
        } else if (this.params.boundary === 'open') {
            if (i < 0 || i >= N || j < 0 || j >= N) {
                return 0;  // Locked to 0
            }

            return this.grid[i][j];
        } else {  // 'fixed'
            if (i < 0 || i >= N || j < 0 || j >= N) {
                return 1;  // Locked to +1
            }

            return this.grid[i][j];
        }
    }

    // Take a step in the simulation
    public step(): void {
        if (this.algorithm === 'metropolis') {
            this.stepMetropolis();
        } else {
            this.stepWolff();
        }
    }

    // A metropolis step based on its defined behavior
    private stepMetropolis(): void {
        const N = this.params.size;

        // Iterate randomly over the grid
        for (let k = 0; k < N*N; ++k) {
            // Pick a random index and get the current spin
            const i = Math.floor(Math.random()*N);
            const j = Math.floor(Math.random()*N);

            const currentSpin = this.grid[i][j];

            // Calculate the spin of the neighbors (ignored diagonals)
            const neighbors =
            this.getSpin(i+1, j) +
            this.getSpin(i-1, j) +
            this.getSpin(i, j+1) +
            this.getSpin(i, j-1);

            // Calculate the change in energy dE
            const dE = 2*currentSpin * (this.params.J*neighbors + this.params.field);

            // Based on dE or a random probability, flip the current spin accordingly
            if (dE <= 0 || Math.random() < Math.exp(-dE/this.params.temperature)) {
                this.grid[i][j] = -currentSpin;
            }
        }
    }

    // A wolff step based on its defined behavior
    private stepWolff(): void {
        // Get the seed indices [seedI, seedJ] and the current clusterSpin
        const N = this.params.size;
        const seedI = Math.floor(Math.random()*N);
        const seedJ = Math.floor(Math.random()*N);
        const clusterSpin = this.grid[seedI][seedJ];

        // Check the probability based on 1-exp{-2J/T}
        // If it's negative, do not continue
        const pAdd = 1-Math.exp(-2*this.params.J/this.params.temperature);
        if (pAdd <= 0) {
            return;
        }

        const stack: [number, number][] = [[seedI, seedJ]];

        // Instantiate a new Uint8Array and instantiate values
        const inCluster = new Uint8Array(N*N);
        inCluster[seedI*N + seedJ] = 1;

        // Iterate over the stack
        while (stack.length > 0) {
            // Flip spins 
            const [i, j] = stack.pop()!;
            this.grid[i][j] = -clusterSpin;

            // Get indices for neighbors
            const neighbors: [number, number][] = [
                [(i+1)%N, j],
                [(i-1+N)%N, j],
                [i, (j+1)%N],
                [i, (j-1+N)%N],
            ];

            // Iterate over the indices [ni, nj] of the neighbors
            for (const [ni, nj] of neighbors) {
                const idx = ni*N + nj;

                // If not in the cluster and the spin is the same as the spin of the cluster,
                // and a probability check passes, then push this new index [ni, nj] to the stack
                if (!inCluster[idx] && this.grid[ni][nj] === clusterSpin) {
                    if (Math.random() < pAdd) {
                        inCluster[idx] = 1;
                        stack.push([ni, nj]);
                    }
                }
            }
        }
    }

    // Gets the current magnetization
    public getMagnetization(): number {
        let total = 0;
        const N = this.params.size;

        // Sum over the spins
        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < N; ++j) {
                total += this.grid[i][j];
            }
        }

        // Return the magnetization: sum of spins/N^2
        return total/(N*N);
    }

    // Gets the current energy
    public getEnergy(): number {
        let interactionSum = 0;
        let fieldSum = 0;
        const N = this.params.size;

        // Iterate over the lattice
        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < N; ++j) {
                const spin = this.grid[i][j];

                const right = this.getSpin(i+1, j);
                const down = this.getSpin(i, j+1);

                // Add the spin times the effects to the right and down to the interaction sum
                // The field sum increments by the spin
                // This helps also prevent double-counting
                interactionSum += spin*(right + down);
                fieldSum += spin;
            }
        }

        // Calculate the total energy via -J*interactionSum - H*fieldSum
        const totalE = -this.params.J*interactionSum - this.params.field*fieldSum;

        return totalE / (N*N);  // Normalized energy per spin
    }
}