// Camera lateral que segue o carro. Tudo em pixels de tela (CSS); o mundo esta em metros.
const VIEW_METERS_HIGH = 19;
const CAR_WIDTHS = 2.7;
const FOLLOW = 5;

export const toScreen = (cam, x, y) => [(x - cam.x) * cam.ppm + cam.ax, (y - cam.y) * cam.ppm + cam.ay];

export const baseZoom = (view, carLen) => Math.min(view.height / VIEW_METERS_HIGH, view.width / (carLen * CAR_WIDTHS));

export const makeCamera = (view, x, y, ppm) => ({
  x, y, ppm, ax: view.width * 0.42, ay: view.height * (view.height > view.width ? 0.45 : 0.55), w: view.width, h: view.height,
});

// Proximo estado da camera, suavizado. `target` = { x, y, speed } do carro.
export const followCamera = (cam, view, target, carLen, dt) => {
  const zoom = baseZoom(view, carLen) / (1 + target.speed / 70);
  const k = Math.min(1, dt * FOLLOW);
  const lead = Math.min(4, target.speed * 0.08);
  const wantY = Math.min(target.y - 1, -2.2 + target.y * 0.15);
  return makeCamera(
    view,
    cam.x + (target.x + lead - cam.x) * Math.min(1, k * 2),
    cam.y + (Math.min(wantY, target.y) - cam.y) * k,
    cam.ppm + (zoom - cam.ppm) * k,
  );
};
