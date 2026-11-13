// Fundo: degrade, luz suave no alto e bolhas de luz flutuando devagar.
const BOKEH_COUNT = 16;
const TAU = Math.PI * 2;

// Numero "aleatorio" fixo por indice, para as bolhas nao precisarem de estado.
const noise = (index, salt) => {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const drawGradient = (ctx, w, h) => {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#4b1f8f');
  sky.addColorStop(0.45, '#3a1a78');
  sky.addColorStop(1, '#170d3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(w / 2, h * 0.12, 0, w / 2, h * 0.12, Math.max(w, h) * 0.75);
  glow.addColorStop(0, 'rgba(255, 140, 220, 0.34)');
  glow.addColorStop(0.5, 'rgba(120, 110, 255, 0.12)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
};

const drawBokeh = (ctx, w, h, time) => {
  const base = Math.min(w, h);
  for (let i = 0; i < BOKEH_COUNT; i += 1) {
    const speed = 0.008 + noise(i, 3) * 0.014;
    const rise = (noise(i, 2) - time * speed) % 1;
    const y = ((rise + 1) % 1) * (h * 1.2) - h * 0.1;
    const x = noise(i, 1) * w + Math.sin(time * 0.25 + i) * base * 0.03;
    const radius = base * (0.025 + noise(i, 4) * 0.075);
    const alpha = 0.035 + noise(i, 5) * 0.06;
    const hue = 250 + noise(i, 6) * 90;
    ctx.fillStyle = `hsl(${hue} 90% 78% / ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  }
};

const drawVignette = (ctx, w, h) => {
  const shade = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.8);
  shade.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shade.addColorStop(1, 'rgba(8, 2, 30, 0.55)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
};

export const drawBackground = (ctx, view, time) => {
  drawGradient(ctx, view.width, view.height);
  drawBokeh(ctx, view.width, view.height, time);
  drawVignette(ctx, view.width, view.height);
};
