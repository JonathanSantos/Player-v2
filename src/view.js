import { formatTime, progressPercent } from './core.js';

/**
 * @typedef {object} Labels
 * @property {string} play
 * @property {string} pause
 * @property {string} position
 * @property {string} untitled
 * @property {string} error
 */

/** @type {Labels} */
export const DEFAULT_LABELS = Object.freeze({
  play: 'Tocar',
  pause: 'Pausar',
  position: 'Posição da música',
  untitled: 'Música sem nome',
  error: 'Não foi possível tocar esta música',
});

/**
 * O componente descrito como dado, a mesma ideia do `this.components` de 2016.
 * A diferença: cada peça tem um nome (`ref`) em vez de uma posição no array.
 */
const TEMPLATE = {
  ref: 'root',
  tag: 'div',
  className: 'player',
  children: [
    { ref: 'button', tag: 'button', className: 'player__button', attributes: { type: 'button' } },
    {
      ref: 'track',
      tag: 'div',
      className: 'player__track',
      attributes: { role: 'slider', tabindex: '0', 'aria-valuemin': '0', 'aria-valuemax': '100' },
      children: [
        { ref: 'bar', tag: 'div', className: 'player__bar' },
        {
          tag: 'div',
          className: 'player__info',
          children: [
            { ref: 'title', tag: 'span', className: 'player__title' },
            { ref: 'time', tag: 'span', className: 'player__time' },
          ],
        },
      ],
    },
  ],
};

const build = (document, spec, refs) => {
  const element = document.createElement(spec.tag);
  element.className = spec.className;

  for (const [name, value] of Object.entries(spec.attributes ?? {})) element.setAttribute(name, value);
  for (const child of spec.children ?? []) element.append(build(document, child, refs));
  if (spec.ref) refs[spec.ref] = element;

  return element;
};

/**
 * Cria os elementos do Player e devolve cada um pelo nome.
 * @returns {{ root: HTMLElement, button: HTMLButtonElement, track: HTMLElement, bar: HTMLElement, title: HTMLElement, time: HTMLElement }}
 */
export const createView = (document) => {
  const refs = {};
  build(document, TEMPLATE, refs);
  return refs;
};

/**
 * Traduz o estado no que a tela deve mostrar. Função pura: o mesmo estado dá
 * sempre a mesma descrição.
 *
 * @param {import('./state.js').PlayerState} state
 * @param {string} title
 * @param {Labels} labels
 */
export const describe = (state, title, labels) => {
  const failed = state.status === 'error';
  const sounding = state.status === 'playing' || state.status === 'loading';
  const time = `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`;
  const name = title || labels.untitled;

  return {
    status: state.status,
    percent: progressPercent(state.currentTime, state.duration),
    buttonLabel: `${sounding ? labels.pause : labels.play}: ${name}`,
    buttonDisabled: failed,
    title: failed ? labels.error : name,
    time: failed ? '' : time,
    sliderLabel: `${labels.position}: ${name}`,
    sliderText: time,
    busy: state.status === 'loading',
  };
};

/** Aplica uma descrição aos elementos. É o único lugar que escreve no DOM depois da criação. */
export const render = (view, description) => {
  view.root.dataset.status = description.status;
  view.root.setAttribute('aria-busy', String(description.busy));

  view.button.setAttribute('aria-label', description.buttonLabel);
  view.button.disabled = description.buttonDisabled;

  view.bar.style.width = `${description.percent}%`;
  view.title.textContent = description.title;
  view.time.textContent = description.time;

  view.track.setAttribute('aria-label', description.sliderLabel);
  view.track.setAttribute('aria-valuenow', String(Math.round(description.percent)));
  view.track.setAttribute('aria-valuetext', description.sliderText);
};
