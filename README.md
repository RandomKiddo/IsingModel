# 2D Ising Model Simulation

An interactive, real-time web application simulating phase transitions and critical phenomena in the 2D Ising model using TypeSCript, HTML 5 Canvas, and Chart.js.

## 📄 Overview

The **Ising Model** is a foundational mathematical model of ferromagnetism in statistical mechanics. This project simulates a 2D square lattice of interacting magnetic spins ($s_j \in \{-1, +1\}$) undergoing thermal fluctuations, phase transitions, and dynamic magnetic sweeps.

### Key Features

* Real-Time Lattice Rendering: High-performance HTML5 Canvas rendering capable of handling high Monte Carlo step throughput at 60 FPS.
* Dual Simulation Engines: 
  * Metropolis-Hastings (Local Flips): Ideal for non-equilibrium dynamics, domain wall formation, and hysteresis loops.
  * Wolff Cluster Algorithm (Global Flips): Drastically reduces critical slowing down near the critical temperature ($T_{\rm c}$).
    * **Note:** With the Wolff algorithm, we have implement frame-skipping to reduce the "strobing" appearance of the lattice flips.
* Three Boundary Conditions: Swap dynamically between Periodic (bulk), Open (surface effects), and Fixed (+1 locked perimeter) boundary conditions.
* Synchronized Charting: Live updates for:
  * Magnetization per spin ($\langle M\rangle$ vs. Time).
  * Energy per spin ($E$ vs. Time).
  * Dynamics hysteresis loop ($\langle M\rangle$ vs. $H$) with time-faded trail opacity.
* CVD-Accessible Theme: Designed with high contrast using dark slate and emerald teal to support users with color vision deficiencies.
* Interactive Control Panel: Adjust $T$, $H$, $J$, simulation speed, presents, or toggle auto-sweeps and pause/resume states.

## 🔬 Physics Summary

The system is goverend by the 2D spin Hamiltonian:

$$
\mathcal{H} = -J \sum_{\langle i, j\rangle} s_i s_j - H \sum_i s_i,
$$

Where:
* $J$ is the spin-spin coupling constant ($J>0$ for ferromagnetism, $J<0$ for antiferromagnetism).
* $\langle i,j\rangle denotes summation over nearest-neighbor lattice pairs.
* $H$ is the external magnetic field.

In two dimensions, the model undergoes a second-order phase transition at Lars Onsager's critical temperature:

$$
T_{\rm c} = \frac{2J}{k_{\rm B}\ln{\left(1+\sqrt{2}\right)}}\approx 2.269\frac{J}{k_{\rm B}}.
$$

* Below $T_{\rm c}$ ($T<T_{\rm c}$): Spontaneous symmetry breaking forms large aligned domains with non-zero net magnetization ($\langle M\rangle \neq 0$).
* Above $T_{\rm c}$ ($T>T_{\rm c}$): Thermal fluctuations dominate, destroying long-range order ($\langle M\rangle \rightarrow 0$).

For more information, see the [blog post]().

## 🛠️ Tech Stack & Optimizations

* Language: TypeScript
* Visualization: HTML 5 Canvas API & Chart.js
* Build Tool: Vite
* Typesetting: KaTeX

### Performance Benchmarks

To keep single threaded JavaScript running at 60 FPS under heavy statistical sampling:

1. Continguous Memory: Spins are mapped into a 1D `Int8Array (y * L + x)` for optimal CPU cache locality.
2. Precomputed Boltzmann Factors: Acceptance probabilities for local energy changes ($\Delta E \in \{4J, 8J\}$) are pre-calculated to avoid exepnsive runtime `Math.exp` calls.
3. Decoupled Execution: Physics logic executes over dynamic MCS sub-loops white Canvas/Chart rendering is synchronized with borwser `requestAnimationFrame`.

## 🚀 Quick Start

### Prerequisites

* [Node.js](https://www.google.com/search?q=https://nodejs.org/) (v18 or higher recommended).
* `npm` or `pnpm`. 

### Installation & Local Setup

1. Clone the repository:
```sh
git clone https://github.com/RandomKiddo/IsingModel.git
cd IsingModel
```

2. Install dependencies:
```sh
npm install
```

3. Start the local development server:
```sh
npm run dev
```

4. Open your browser and navigate to the `localhost`, typically `http://localhost:5173/IsingModel/`. 

### Build for Production

To compile static producing assets:
```sh
npm run build
```
The compiled bundle will be outputted to the `dist/` folder.

## 🚢 Deployment

This repository includes a pre-configured GitHub Actions workflow in `.github/workflows/deploy.yml` that automatically builds and deploys the Vite application to GitHub Pages whenever changes are pushed to `master`.

You can view the live deployment [here]().

## 📜 License

Distributed under the MIT License. See LICENSE for details.

Copyright © 2026 RandomKiddo

___
<br />

[Back to Top](#2d-ising-model-simulation)

<sub>This page was last edited on 08.06.2026.</sub>