// Camera em perspectiva: converte uma posicao do mundo (metros) em um ponto da tela de 360 x 640.
// A camera fica atras e acima do robo, olhando para o horizonte.
export const CAMERA = Object.freeze({
  height: 5.4,
  back: 11.5,
  focal: 560,
  horizonY: 250,
  centerX: 180,
  follow: 0.35,
  nearDepth: 2,
});

// A camera fica alta e longe (os obstaculos aparecem maiores ao longe); em troca, larguras e alturas
// do mundo sao ampliadas por este fator para o robo continuar grande na tela.
export const VISUAL = 1.635;
// Altura dos olhos da camera em metros do mundo: acima disso nao se ve a tampa das caixas.
export const EYE_HEIGHT = CAMERA.height / VISUAL;

export const LANE_WIDTH = 1.2;
export const ROAD_HALF = 2.05;
// Pixels por metro na distancia do robo: os desenhos dos personagens usam esta escala como base.
export const PLAYER_SCALE = (VISUAL * CAMERA.focal) / CAMERA.back;

// Posicao lateral em metros do centro de uma faixa (pode ser fracionaria).
export const laneX = (lane) => (lane - 1) * LANE_WIDTH;

// Deslocamento lateral da camera: acompanha um pouco o robo.
export const cameraX = (playerLane) => laneX(playerLane) * CAMERA.follow;

/**
 * @param {number} x metros a direita do centro da pista
 * @param {number} y metros acima da pista
 * @param {number} z metros a frente do robo
 * @param {number} camX deslocamento lateral da camera
 * @returns {{x: number, y: number, scale: number}} ponto na tela e pixels por metro naquela distancia
 */
export const project = (x, y, z, camX = 0) => {
  const scale = (VISUAL * CAMERA.focal) / Math.max(CAMERA.nearDepth, z + CAMERA.back);
  return { x: CAMERA.centerX + (x - camX) * scale, y: CAMERA.horizonY + (EYE_HEIGHT - y) * scale, scale };
};

