import { IsingModel, type BoundaryCondition } from './IsingModel';
import Chart from 'chart.js/auto';

// Setup Canvas Constants
const GRID_SIZE = 100;
const CANVAS_SIZE = 400;

const canvas = document.getElementById('grid-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

// Instantiate Simulation Engine
const model = new IsingModel({
  size: GRID_SIZE,
  temperature: 2.27,
  field: 0.0,
  J: 1.0,
  boundary: 'periodic',
});

// Setup Chart.js Real-time Plot
const chartCtx = (document.getElementById('chart-canvas') as HTMLCanvasElement).getContext('2d')!;
const maxDataPoints = 100;

const magChart = new Chart(chartCtx, {
  type: 'line',
  data: {
    labels: Array.from({ length: maxDataPoints }, (_, i) => i),
    datasets: [
      {
        label: 'Magnetization <M>',
        data: Array(maxDataPoints).fill(0),
        borderColor: '#6366f1',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.1,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: { 
        min: -1.0, 
        max: 1.0, 
        grid: { color: '#2e2e38' },
        ticks: { stepSize: 0.5 }
      },
      x: { display: false },
    },
  },
});

// UI Controls & Event Listeners
const tempSlider = document.getElementById('temp') as HTMLInputElement;
const tempVal = document.getElementById('temp-val')!;
const fieldSlider = document.getElementById('field') as HTMLInputElement;
const fieldVal = document.getElementById('field-val')!;
const jSlider = document.getElementById('coupling') as HTMLInputElement;
const jVal = document.getElementById('j-val')!;
const boundarySelect = document.getElementById('boundary') as HTMLSelectElement;
const resetBtn = document.getElementById('reset-btn')!;

tempSlider.addEventListener('input', () => {
  const val = parseFloat(tempSlider.value);
  model.params.temperature = val;
  tempVal.textContent = val.toFixed(2);
});

fieldSlider.addEventListener('input', () => {
  const val = parseFloat(fieldSlider.value);
  model.params.field = val;
  fieldVal.textContent = val.toFixed(2);
});

jSlider.addEventListener('input', () => {
  const val = parseFloat(jSlider.value);
  model.params.J = val;
  jVal.textContent = val.toFixed(2);
});

boundarySelect.addEventListener('change', () => {
  model.params.boundary = boundarySelect.value as BoundaryCondition;
});

resetBtn.addEventListener('click', () => {
  model.grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => (Math.random() < 0.5 ? 1 : -1))
  );
});

// Render Loop
function drawGrid() {
  const cellSize = CANVAS_SIZE / GRID_SIZE;
  const imgData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const data = imgData.data;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const spin = model.grid[i][j];
      const color = spin === 1 ? 255 : 0;

      for (let px = 0; px < cellSize; px++) {
        for (let py = 0; py < cellSize; py++) {
          const x = Math.floor(i * cellSize + px);
          const y = Math.floor(j * cellSize + py);
          const index = (y * CANVAS_SIZE + x) * 4;

          data[index] = color;
          data[index + 1] = color;
          data[index + 2] = color;
          data[index + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

let stepCounter = 0;

function loop() {
  model.step(); // Perform 1 Monte Carlo Sweep
  drawGrid();

  // Update chart every 2 frame renders
  stepCounter++;
  if (stepCounter % 2 === 0) {
    const currentM = model.getMagnetization();
    magChart.data.datasets[0].data.push(currentM);
    magChart.data.datasets[0].data.shift();
    magChart.update('none'); // Update plot efficiently without full re-animation
  }

  requestAnimationFrame(loop);
}

loop();

declare function renderMathInElement(element: HTMLElement, options?: object): void;

window.addEventListener('DOMContentLoaded', () => {
  renderMathInElement(document.body, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false }
    ],
    throwOnError: false
  });
});
