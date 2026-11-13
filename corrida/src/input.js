// Entrada do jogador: gestos de deslizar, toques nas metades da tela e teclado.
// Este modulo so traduz eventos do navegador em comandos; quem decide o que fazer e o main.js.
import { ACTION } from './config.js';

const SWIPE_PIXELS = 22;
const KEYS = Object.freeze({
  ArrowLeft: ACTION.LEFT, KeyA: ACTION.LEFT,
  ArrowRight: ACTION.RIGHT, KeyD: ACTION.RIGHT,
  ArrowUp: ACTION.JUMP, KeyW: ACTION.JUMP, Space: ACTION.JUMP,
  ArrowDown: ACTION.SLIDE, KeyS: ACTION.SLIDE,
});
const CONFIRM_KEYS = Object.freeze(['Space', 'Enter']);

const swipeAction = (dx, dy) => {
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? ACTION.LEFT : ACTION.RIGHT;
  return dy < 0 ? ACTION.JUMP : ACTION.SLIDE;
};

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} handlers
 *   onDown(clientX, clientY): devolve true se o toque comeca um gesto de corrida;
 *   onAction(action): comando de ACTION; onKey(action, confirm): tecla (action pode ser null).
 * @returns {{cancel: () => void}} `cancel` descarta o gesto em andamento (pausa, anuncio, troca de tela)
 */
export const bindInput = (canvas, handlers) => {
  // So o dedo (ou botao) que comecou o gesto pode termina-lo.
  let gesture = null;
  const owns = (event) => gesture !== null && gesture.pointerId === event.pointerId;

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (gesture) return;
    if (!handlers.onDown(event.clientX, event.clientY)) return;
    gesture = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, fired: false };
    try { canvas.setPointerCapture?.(event.pointerId); } catch { /* ponteiro ja solto: segue sem captura */ }
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!owns(event) || gesture.fired) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PIXELS) return;
    // O comando sai assim que o dedo anda o bastante, sem esperar soltar.
    gesture = { ...gesture, fired: true };
    handlers.onAction(swipeAction(dx, dy));
  });

  canvas.addEventListener('pointerup', (event) => {
    if (!owns(event)) return;
    const tap = !gesture.fired;
    const { x } = gesture;
    gesture = null;
    if (tap) handlers.onAction(x < window.innerWidth / 2 ? ACTION.LEFT : ACTION.RIGHT);
  });

  canvas.addEventListener('pointercancel', (event) => {
    if (owns(event)) gesture = null;
  });

  window.addEventListener('keydown', (event) => {
    const action = KEYS[event.code] ?? null;
    const confirm = CONFIRM_KEYS.includes(event.code);
    if (!action && !confirm) return;
    event.preventDefault();
    if (!event.repeat) handlers.onKey(action, confirm);
  });

  return Object.freeze({ cancel: () => { gesture = null; } });
};
