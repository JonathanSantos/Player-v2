/**
 * O que o Player sabe sobre a música em um dado instante.
 *
 * @typedef {object} PlayerState
 * @property {'idle' | 'loading' | 'playing' | 'paused' | 'error'} status
 * @property {number} currentTime  Em segundos.
 * @property {number} duration     Em segundos; `NaN` até o navegador ler o arquivo.
 */

/** @type {PlayerState} */
export const INITIAL_STATE = Object.freeze({ status: 'idle', currentTime: 0, duration: NaN });

// Um erro encerra a conversa: nenhum evento atrasado do áudio tira o Player desse estado.
const unlessFailed = (transition) => (state, event) => (state.status === 'error' ? state : transition(state, event));

/** Cada evento do elemento de áudio e o que ele muda no estado. */
const TRANSITIONS = {
  loadedmetadata: (state, { duration }) => ({ ...state, duration }),
  durationchange: (state, { duration }) => ({ ...state, duration }),
  timeupdate: (state, { currentTime }) => ({ ...state, currentTime }),
  waiting: unlessFailed((state) => ({ ...state, status: 'loading' })),
  playing: unlessFailed((state) => ({ ...state, status: 'playing' })),
  pause: unlessFailed((state) => ({ ...state, status: 'paused' })),
  ended: unlessFailed((state) => ({ ...state, status: 'paused', currentTime: 0 })),
  error: (state) => ({ ...state, status: 'error' }),
};

export const AUDIO_EVENTS = Object.keys(TRANSITIONS);

/**
 * O próximo estado depois de um evento. Nunca altera o estado recebido.
 * @param {PlayerState} state
 * @param {{ type: string, currentTime?: number, duration?: number }} event
 * @returns {PlayerState}
 */
export const reduce = (state, event) => {
  const transition = TRANSITIONS[event.type];
  return transition ? Object.freeze(transition(state, event)) : state;
};
