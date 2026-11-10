// As contas do Player. Funções puras: recebem números e textos, devolvem
// números e textos. Nada aqui conhece o DOM ou o elemento de áudio.

const SEEK_STEP_SECONDS = 5;

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const isKnown = (duration) => Number.isFinite(duration) && duration > 0;

/** Quanto da música já tocou, de 0 a 100. Antes de a duração ser conhecida, 0. */
export const progressPercent = (currentTime, duration) => {
  if (!isKnown(duration)) return 0;
  return clamp((currentTime * 100) / duration, 0, 100);
};

/**
 * Em que ponto da faixa o clique caiu, de 0 a 100.
 * `clientX` e `rect` estão no mesmo referencial (a janela), então basta subtrair.
 * @param {number} clientX
 * @param {{ left: number, width: number }} rect
 */
export const percentFromPointer = (clientX, rect) => {
  if (!(rect.width > 0)) return 0;
  return clamp(((clientX - rect.left) * 100) / rect.width, 0, 100);
};

/** O instante da música que corresponde a um percentual, ou `null` se a duração ainda é desconhecida. */
export const timeFromPercent = (percent, duration) => {
  if (!isKnown(duration)) return null;
  return (duration * clamp(percent, 0, 100)) / 100;
};

const KEY_TARGETS = {
  ArrowRight: (currentTime) => currentTime + SEEK_STEP_SECONDS,
  ArrowUp: (currentTime) => currentTime + SEEK_STEP_SECONDS,
  ArrowLeft: (currentTime) => currentTime - SEEK_STEP_SECONDS,
  ArrowDown: (currentTime) => currentTime - SEEK_STEP_SECONDS,
  Home: () => 0,
  End: (currentTime, duration) => duration,
};

/** Para onde uma tecla leva a música, em percentual. `null` quando a tecla não é de navegação. */
export const percentForKey = (key, currentTime, duration) => {
  const target = KEY_TARGETS[key];
  if (!target || !isKnown(duration)) return null;
  return progressPercent(clamp(target(currentTime, duration), 0, duration), duration);
};

/** `75` vira `1:15`. Enquanto o tempo não é conhecido, `--:--`. */
export const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';

  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

const safeDecode = (text) => {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
};

/**
 * O nome da música tirado do endereço do arquivo:
 * `.../Fetty_Wap_-_My_Way.mp3` vira `Fetty Wap - My Way`.
 */
export const titleFromUrl = (url) => {
  if (/^(blob|data):/i.test(url)) return '';

  const path = url.split(/[?#]/)[0];
  const fileName = safeDecode(path.slice(path.lastIndexOf('/') + 1));
  return fileName.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_+]+/g, ' ').replace(/\s+/g, ' ').trim();
};
