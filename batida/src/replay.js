// Buffer circular imutavel com os ultimos quadros do mundo (os mundos ja sao imutaveis, entao guarda so a referencia).
export const pushFrame = (buffer, world) => {
  const frames = buffer.frames.length >= buffer.cap
    ? [...buffer.frames.slice(buffer.frames.length - buffer.cap + 1), world]
    : [...buffer.frames, world];
  return { ...buffer, frames };
};

// Quadro do replay no tempo `t` (segundos desde o inicio do buffer), a `fps` quadros por segundo.
export const frameAt = (buffer, t, fps) => {
  if (!buffer.frames.length) return null;
  const index = Math.min(buffer.frames.length - 1, Math.max(0, Math.floor(t * fps)));
  return buffer.frames[index];
};

export const replayDuration = (buffer, fps) => buffer.frames.length / fps;
