// Calcula onde cada pote e cada botao fica, para qualquer tamanho e proporcao de tela.
const AREA = Object.freeze({ side: 0.03, top: 0.19, height: 0.6 });
const JAR = Object.freeze({ widthInGems: 1.22, extraHeightInGems: 0.3, floorInGems: 0.22, liftRoomInGems: 1.45 });
const GEM = Object.freeze({ ofCellWidth: 0.64, maxOfScreenHeight: 0.085 });
const BUTTON = Object.freeze({ y: 0.905, radiusOfShortSide: 0.062, minRadius: 24, maxRadius: 40, spacing: 3.1 });
const MAX_ROWS = 3;
const HIT_PADDING_IN_GEMS = 0.25;

export const BUTTON_IDS = Object.freeze(['undo', 'restart', 'hint']);

const gemSizeFor = (area, rows, count, capacity, view) => {
  const cols = Math.ceil(count / rows);
  const byWidth = (area.w / cols) * GEM.ofCellWidth;
  const byHeight = (area.h / rows) / (capacity + JAR.extraHeightInGems + JAR.liftRoomInGems);
  return Math.min(byWidth, byHeight, view.height * GEM.maxOfScreenHeight);
};

const bestRows = (area, count, capacity, view) => {
  const options = Array.from({ length: Math.min(MAX_ROWS, count) }, (_, i) => i + 1);
  return options.reduce((best, rows) =>
    (gemSizeFor(area, rows, count, capacity, view) > gemSizeFor(area, best, count, capacity, view) ? rows : best), 1);
};

export const computeLayout = (view, jarCount, capacity) => {
  const area = {
    x: view.width * AREA.side,
    y: view.height * AREA.top,
    w: view.width * (1 - AREA.side * 2),
    h: view.height * AREA.height,
  };
  const rows = bestRows(area, jarCount, capacity, view);
  const cols = Math.ceil(jarCount / rows);
  const gem = gemSizeFor(area, rows, jarCount, capacity, view);
  const jarW = gem * JAR.widthInGems;
  const jarH = gem * (capacity + JAR.extraHeightInGems);
  const cellH = area.h / rows;
  const cellW = Math.min(area.w / cols, jarW * 1.7);

  const jars = Array.from({ length: jarCount }, (_, index) => {
    const row = Math.floor(index / cols);
    const inRow = row < rows - 1 ? cols : jarCount - cols * (rows - 1);
    const col = index - row * cols;
    const cx = view.width / 2 + (col - (inRow - 1) / 2) * cellW;
    const y = area.y + row * cellH + (cellH - jarH + gem * JAR.liftRoomInGems) / 2;
    return { cx, x: cx - jarW / 2, y, w: jarW, h: jarH };
  });

  const shortSide = Math.min(view.width, view.height);
  const radius = Math.min(BUTTON.maxRadius, Math.max(BUTTON.minRadius, shortSide * BUTTON.radiusOfShortSide));
  const buttons = BUTTON_IDS.map((id, index) => ({
    id,
    x: view.width / 2 + (index - 1) * radius * BUTTON.spacing,
    y: view.height * BUTTON.y,
    r: radius,
  }));

  return { gem, jars, buttons };
};

export const slotCenter = (jar, slot, gem) => ({
  x: jar.cx,
  y: jar.y + jar.h - gem * JAR.floorInGems - gem * (slot + 0.5),
});

export const hoverCenter = (jar, gem) => ({ x: jar.cx, y: jar.y - gem * 0.72 });

export const jarAt = (layout, x, y) => {
  const pad = layout.gem * HIT_PADDING_IN_GEMS;
  return layout.jars.findIndex((jar) =>
    x >= jar.x - pad && x <= jar.x + jar.w + pad && y >= jar.y - layout.gem * 1.3 && y <= jar.y + jar.h + pad);
};

export const buttonAt = (layout, x, y) =>
  layout.buttons.find((button) => Math.hypot(x - button.x, y - button.y) <= button.r * 1.25)?.id ?? null;
