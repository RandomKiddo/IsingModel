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
const maxPoints = 300; 
function createChart(canvasId: string, label: string, color: string, yTitle: string, minY?: number, maxY?: number) {
  const chartCtx = (document.getElementById(canvasId) as HTMLCanvasElement).getContext('2d')!;
  return new Chart(chartCtx, {
    type: 'line',
    data: {
      labels: Array.from({ length: maxPoints }, (_, i) => i),
      datasets: [{ label, data: Array(maxPoints).fill(0), borderColor: color, borderWidth: 2, pointRadius: 0, tension: 0.1 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        y: { min: minY, max: maxY, grid: { color: '#2e2e38' }, title: { display: true, text: yTitle, color: '#888899', font: { size: 11 } } },
        x: { title: { display: true, text: 'Time (Steps)', color: '#888899', font: { size: 11 } }, ticks: { display: false } },
      },
    },
  });
}

// 1. Line Charts (Magnetization & Energy)
const magChart = createChart('mag-chart-canvas', 'Magnetization ⟨M⟩', '#6366f1', 'Magnetization ⟨M⟩', -1.0, 1.0);
const energyChart = createChart('energy-chart-canvas', 'Energy per Spin (E)', '#ec4899', 'Energy per Spin (E)', -2.0, 2.0);

// 2. Scatter Chart (Hysteresis M vs H)
const hystCtx = (document.getElementById('hyst-chart-canvas') as HTMLCanvasElement).getContext('2d')!;
const hystChart = new Chart(hystCtx, {
  type: 'scatter',
  data: {
    datasets: [
      {
        type: 'line',
        label: '⟨M⟩ vs H',
        data: [],
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        showLine: false,
        pointRadius: 1.25,
        borderWidth: 1.25,
        pointBackgroundColor: [],
        pointBorderColor: [],
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { min: -2.0, max: 2.0, title: { display: true, text: 'Magnetic Field (H)', color: '#888899' }, grid: { color: '#2e2e38' } },
      y: { min: -1.0, max: 1.0, title: { display: true, text: 'Magnetization ⟨M⟩', color: '#888899' }, grid: { color: '#2e2e38' } },
    },
    plugins: {
      legend: {
        labels: {
          usePointStyle: false
        }
      }
    }
  },
});

// --- Dynamic Energy Bounds Logic ---
let minObservedEnergy = -2.0;
let maxObservedEnergy = 2.0;

function updateEnergyChartBounds() {
  const currentData = energyChart.data.datasets[0].data as number[];

  if (currentData.length === 0) {
    return;
  }

  let min = Math.min(...currentData);
  let max = Math.max(...currentData);

  let span = max-min; 

  const MIN_SPAN = 1.0;
  if (span < MIN_SPAN) {
    const mid = (min+max)/2;
    min = mid - MIN_SPAN/2;
    max = max + MIN_SPAN/2;
    span = MIN_SPAN;
  }

  const paddedMin = min - span*0.15;
  const paddedMax = max + span*0.15;

  if (energyChart.options.scales?.y) {
    energyChart.options.scales.y.min = paddedMin;
    energyChart.options.scales.y.max = paddedMax;
  }
}

function resetEnergyBounds() {
  minObservedEnergy = -2.0;
  maxObservedEnergy = 2.0;
  if (energyChart.options.scales?.y) {
    energyChart.options.scales.y.min = minObservedEnergy;
    energyChart.options.scales.y.max = maxObservedEnergy;
  }
}

// --- Control Listeners ---
const tempSlider = document.getElementById('temp') as HTMLInputElement;
const tempVal = document.getElementById('temp-val')!;
const fieldSlider = document.getElementById('field') as HTMLInputElement;
const fieldVal = document.getElementById('field-val')!;
const jSlider = document.getElementById('coupling') as HTMLInputElement;
const jVal = document.getElementById('j-val')!;
const boundarySelect = document.getElementById('boundary') as HTMLSelectElement;
const speedSlider = document.getElementById('speed') as HTMLInputElement;
const speedVal = document.getElementById('speed-val')!;
const algoSelect = document.getElementById('algorithm') as HTMLSelectElement;
const resetBtn = document.getElementById('reset-btn')!;
const resetBtnGrid = document.getElementById('reset-btn-grid')!;
const hystBtn = document.getElementById('hysteresis-btn')!;
const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;

// Synchronize controls with model state on startup
function syncControlsWithModel() {
  tempSlider.value = model.params.temperature.toString();
  tempVal.textContent = model.params.temperature.toFixed(2);

  fieldSlider.value = model.params.field.toString();
  fieldVal.textContent = model.params.field.toFixed(2);

  jSlider.value = model.params.J.toString();
  jVal.textContent = model.params.J.toFixed(2);

  boundarySelect.value = model.params.boundary;
  algoSelect.value = model.algorithm;

  speedSlider.value = stepsPerFrame.toString();
  speedVal.textContent = stepsPerFrame.toString();
}

syncControlsWithModel();

function setTemperature(val: number) {
  model.params.temperature = val;
  tempSlider.value = val.toString();
  tempVal.textContent = val.toFixed(2);
}

tempSlider.addEventListener('input', () => setTemperature(parseFloat(tempSlider.value)));

fieldSlider.addEventListener('input', () => {
  const val = parseFloat(fieldSlider.value);
  model.params.field = val;
  fieldVal.textContent = val.toFixed(2);
  resetEnergyBounds();
});

jSlider.addEventListener('input', () => {
  const val = parseFloat(jSlider.value);
  model.params.J = val;
  jVal.textContent = val.toFixed(2);
  resetEnergyBounds();
});

boundarySelect.addEventListener('change', () => {
  model.params.boundary = boundarySelect.value as BoundaryCondition;
});

algoSelect.addEventListener('change', () => {
  model.algorithm = algoSelect.value as 'metropolis' | 'wolff';
});

speedSlider.addEventListener('input', () => {
  stepsPerFrame = parseInt(speedSlider.value, 10);
  speedVal.textContent = stepsPerFrame.toString();
});

resetBtn.addEventListener('click', () => {
  model.grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => (Math.random() < 0.5 ? 1 : -1))
  );
  resetEnergyBounds();
});

resetBtnGrid.addEventListener('click', () => {
  model.params.temperature = 2.27;
  tempSlider.value = '2.27';
  tempVal.textContent = '2.27';

  model.params.field = 0.0;
  fieldSlider.value = '0.0';
  fieldVal.textContent = '0.0';

  model.params.J = 1.0;
  jSlider.value = '1.0';
  jVal.textContent = '1.0';

  model.params.boundary = 'periodic';
  boundarySelect.value = 'periodic';

  model.algorithm = 'metropolis';
  algoSelect.value = 'metropolis';

  isSweepingHysteresis = false;
  hystBtn.textContent = 'Start Field Sweep ($H$)';
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(hystBtn, {
      delimiters: [{ left: '$', right: '$', display: false }],
    });
  }

  speedSlider.value = '1';
  speedVal.textContent = '1';
});

let isPaused = false;
pauseBtn.addEventListener('click', () =>{
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
  pauseBtn.classList.toggle('active', isPaused);
})

// Presets
document.getElementById('preset-zero')!.addEventListener('click', () => setTemperature(0.1));
document.getElementById('preset-tc')!.addEventListener('click', () => setTemperature(2.27));
document.getElementById('preset-high')!.addEventListener('click', () => setTemperature(5.0));

// --- Hysteresis Auto-Sweep Logic ---
let isSweepingHysteresis = false;
let sweepDirection = 1; // 1 = increasing H, -1 = decreasing H

hystBtn.addEventListener('click', () => {
  isSweepingHysteresis = !isSweepingHysteresis;
  hystBtn.textContent = isSweepingHysteresis ? 'Stop Field Sweep' : 'Start Field Sweep ($H$)';
  
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(hystBtn, {
      delimiters: [{ left: '$', right: '$', display: false }],
    });
  }
  
  if (isSweepingHysteresis) {
    hystChart.data.datasets[0].data = []; // Clear previous loop data
  }
});

// --- Render Loop ---
function drawGrid() {
  const cellSize = CANVAS_SIZE / GRID_SIZE;
  const imgData = ctx.createImageData(CANVAS_SIZE, CANVAS_SIZE);
  const data = imgData.data;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      for (let px = 0; px < cellSize; px++) {
        for (let py = 0; py < cellSize; py++) {
          const x = Math.floor(i * cellSize + px);
          const y = Math.floor(j * cellSize + py);
          const idx = (y * CANVAS_SIZE + x) * 4;

          const spin = model.grid[i][j];
          const r = spin === 1 ? 20  : 51;
          const g = spin === 1 ? 184 : 65;
          const b = spin === 1 ? 166 : 85;

          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

let wolffFrameSkip = 0;
function loop() {
  if (!isPaused) {
    // If Hysteresis sweep is active, ramp H up/down smoothly
    if (isSweepingHysteresis) {
      const dataset = hystChart.data.datasets[0];
      const points = dataset.data as { x: number, y: number}[];

      points.push({ x: model.params.field, y: model.getMagnetization() });

      const MAX_TRAIL = 400;
      if (points.length > MAX_TRAIL) {
        points.shift();
      }

      const total = points.length;
      const colors = points.map((_, i) => {
        const alpha = (0.15 + 0.85*(i/total)).toFixed(2);
        return `rgba(16, 185, 129, ${alpha})`;
      });

      (dataset as any).pointBackgroundColor = colors;
      (dataset as any).pointBorderColor = colors;

      hystChart.update('none');

      let currentH = model.params.field + sweepDirection * 0.01;
      if (currentH > 2.0) {
        currentH = 2.0;
        sweepDirection = -1;
      } else if (currentH < -2.0) {
        currentH = -2.0;
        sweepDirection = 1;
      }
      model.params.field = currentH;
      fieldSlider.value = currentH.toString();
      fieldVal.textContent = currentH.toFixed(2);
    }

    if (model.algorithm === 'metropolis') {
      for (let s = 0; s < stepsPerFrame; s++) {
        model.step();
      }
    } else {
      ++wolffFrameSkip;
      if (wolffFrameSkip >= 10) {
        model.step();
        wolffFrameSkip =0 ;
      }
    }

    drawGrid();

    const currentM = model.getMagnetization();
    const currentE = model.getEnergy();

    // 1. Magnetization Plot
    magChart.data.datasets[0].data.push(currentM);
    magChart.data.datasets[0].data.shift();
    magChart.update('none');

    // 2. Energy Plot
    energyChart.data.datasets[0].data.push(currentE);
    energyChart.data.datasets[0].data.shift();
    updateEnergyChartBounds();
    energyChart.update('none');

    // 3. Hysteresis Scatter Plot
    if (isSweepingHysteresis) {
      const points = hystChart.data.datasets[0].data as { x: number; y: number }[];
      points.push({ x: model.params.field, y: currentM });
      if (points.length > 400) points.shift(); // Keep latest 400 points
      hystChart.update('none');
    }
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
