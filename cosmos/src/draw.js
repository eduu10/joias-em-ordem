// Ajudantes de desenho usados por todos os modulos visuais.
const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const hsl = ([h, s, l], lightShift = 0, alpha = 1) =>
  `hsl(${h} ${s}% ${Math.min(100, Math.max(0, l + lightShift))}% / ${alpha})`;

export const roundRectPath = (ctx, x, y, w, h, radius) => {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const drawText = (ctx, text, x, y, size, options = {}) => {
  const { color = '#ffffff', weight = 800, align = 'center', shadow = true } = options;
  ctx.font = `${weight} ${Math.round(size)}px ${FONT_STACK}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (shadow) {
    ctx.fillStyle = 'rgba(20, 8, 50, 0.45)';
    ctx.fillText(text, x, y + Math.max(1, size * 0.07));
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
};

// Reduz o tamanho da fonte ate o texto caber na largura dada.
export const fitText = (ctx, text, maxWidth, size, weight = 800) => {
  ctx.font = `${weight} ${Math.round(size)}px ${FONT_STACK}`;
  const width = ctx.measureText(text).width;
  return width <= maxWidth ? size : size * (maxWidth / width);
};
