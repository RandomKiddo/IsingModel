import { IsingModel, type BoundaryCondition } from './IsingModel';
import Chart from 'chart.js/auto';

// Setup Canvas Constants
const GRID_SIZE = 100;
const CANVAS_SIZE = 400;

const canvas = document.getElementById('grid-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
canvas.width = CANVAS_SIZE;
canvas.height = CANVAS_SIZE;

const model = new IsingModel({
  size: GRID_SIZE,
  temperature: 2.27,
  field: 0.0,
  J: 1.0,
  boundary: 'periodic',
});

let stepsPerFrame = 1;

// --- Chart Factory Helper ---
const maxPoints = 100;
function createChart(
  canvasId: string, 
  label: string, 
  color: string, 
  minY?: number, 
  maxY?: number
) {
  const chartCtx = (document.getElementById(canvasId) as HTMLCanvasElement).getContext('2d')!;
  return new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: Array.from({ length: maxPoints }, (_, i) => i),
      datasets: [
        {
          label,
          data: Array(maxPoints).fill(0),
          borderColor: color,
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
          min: minY, // If passed undefined, Chart.js auto-scales
          max: maxY, // If passed undefined, Chart.js auto-scales
          grid: { color: '#2e2e38' },
        },
        x: { display: false },
      },
    },
  });
}

const magChart = createChart('mag-chart-canvas', 'Magnetization <M>', '#6366f1', -1.0, 1.0);
const energyChart = createChart('energy-chart-canvas', 'Energy per Spin (E)', '#ec4899');

// --- Control Listeners ---
const tempSlider = document.getElementById('temp') as HTMLInputElement;
const tempVal = document.getElementById('temp-val')!;
const speedSlider = document.getElementById('speed') as HTMLInputElement;
const speedVal = document.getElementById('speed-val')!;

// 1. Temperature Control
function setTemperature(val: number) {
  model.params.temperature = val;
  tempSlider.value = val.toString();
  tempVal.textContent = val.toFixed(2);
}
tempSlider.addEventListener('input', () => setTemperature(parseFloat(tempSlider.value)));

// 2. Magnetic Field (H) Control (ADDED)
const fieldSlider = document.getElementById('field') as HTMLInputElement;
const fieldVal = document.getElementById('field-val')!;
fieldSlider.addEventListener('input', () => {
  const val = parseFloat(fieldSlider.value);
  model.params.field = val;
  fieldVal.textContent = val.toFixed(2);
});

// 3. Coupling Constant (J) Control (ADDED)
const jSlider = document.getElementById('coupling') as HTMLInputElement;
const jVal = document.getElementById('j-val')!;
jSlider.addEventListener('input', () => {
  const val = parseFloat(jSlider.value);
  model.params.J = val;
  jVal.textContent = val.toFixed(2);
});

// 4. Boundary Condition Control (ADDED)
const boundarySelect = document.getElementById('boundary') as HTMLSelectElement;
boundarySelect.addEventListener('change', () => {
  model.params.boundary = boundarySelect.value as BoundaryCondition;
});

// 5. Simulation Speed Control
speedSlider.addEventListener('input', () => {
  stepsPerFrame = parseInt(speedSlider.value, 10);
  speedVal.textContent = stepsPerFrame.toString();
});

// 6. Reset Button (ADDED)
const resetBtn = document.getElementById('reset-btn')!;
resetBtn.addEventListener('click', () => {
  model.grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => (Math.random() < 0.5 ? 1 : -1))
  );
});

// Presets
document.getElementById('preset-zero')!.addEventListener('click', () => setTemperature(0.1));
document.getElementById('preset-tc')!.addEventListener('click', () => setTemperature(2.27));
document.getElementById('preset-high')!.addEventListener('click', () => setTemperature(5.0));

// --- Render Loop ---
function drawGrid() {
  const cellSize = CANVAS_SIZE / GRID_SIZE;
  const imgData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const data = imgData.data;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const color = model.grid[i][j] === 1 ? 255 : 0;
      for (let px = 0; px < cellSize; px++) {
        for (let py = 0; py < cellSize; py++) {
          const x = Math.floor(i * cellSize + px);
          const y = Math.floor(j * cellSize + py);
          const idx = (y * CANVAS_SIZE + x) * 4;
          data[idx] = data[idx + 1] = data[idx + 2] = color;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

function loop() {
  // Speed control: Run multiple sweeps per frame
  for (let s = 0; s < stepsPerFrame; s++) {
    model.step();
  }

  drawGrid();

  // Dual Plotting
  magChart.data.datasets[0].data.push(model.getMagnetization());
  magChart.data.datasets[0].data.shift();
  magChart.update('none');

  energyChart.data.datasets[0].data.push(model.getEnergy());
  energyChart.data.datasets[0].data.shift();
  energyChart.update('none');

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

function syncControlsWithModel() {
  tempSlider.value = model.params.temperature.toString();
  tempVal.textContent = model.params.temperature.toFixed(2);

  fieldSlider.value = model.params.field.toString();
  fieldVal.textContent = model.params.field.toFixed(2);

  jSlider.value = model.params.J.toString();
  jVal.textContent = model.params.J.toFixed(2);

  boundarySelect.value = model.params.boundary;
  
  speedSlider.value = stepsPerFrame.toString();
  speedVal.textContent = stepsPerFrame.toString();
}

// Call it once on startup
syncControlsWithModel();
