import { percentForKey, percentFromPointer, timeFromPercent, titleFromUrl } from './core.js';
import { AUDIO_EVENTS, INITIAL_STATE, reduce } from './state.js';
import { ensureStyles } from './styles.js';
import { DEFAULT_LABELS, createView, describe, render } from './view.js';

/**
 * @typedef {object} PlayerOptions
 * @property {string} [title]      Nome exibido. Sem ele, o nome sai do endereço do arquivo.
 * @property {'none' | 'metadata' | 'auto'} [preload]  Padrão `metadata`. Com `none`, nada é baixado até o primeiro toque.
 * @property {{ background?: string, accent?: string, text?: string }} [colors]
 * @property {Partial<import('./view.js').Labels>} [labels]  Textos lidos por leitores de tela e mostrados em erros.
 * @property {(music: string) => HTMLAudioElement} [createAudio]  Troca a fábrica do áudio (testes, Web Audio...).
 */

const isElement = (value) => value?.nodeType === 1;

/**
 * Player de música. A assinatura é a de 2016: o elemento pai e o endereço da música.
 *
 * ```js
 * const player = new Player(document.querySelector('#player1'), 'musicas/My_Way.mp3');
 * ```
 *
 * Clique no botão toca e pausa, duplo clique para e volta ao início, clique na
 * faixa leva a música até aquele ponto. Emite `statechange` a cada mudança.
 */
export class Player extends EventTarget {
  #father;
  #music;
  #title;
  #labels;
  #preload;
  #createAudio;
  #audio = null;
  #view;
  #state = INITIAL_STATE;
  #pendingPercent = null;
  #listeners = new AbortController();

  /**
   * @param {Element} father
   * @param {string} music
   * @param {PlayerOptions} [options]
   */
  constructor(father, music, options = {}) {
    super();

    if (!isElement(father)) throw new TypeError('Player: o primeiro argumento precisa ser um elemento da página.');
    if (typeof music !== 'string' || music === '') throw new TypeError('Player: o segundo argumento precisa ser o endereço da música.');

    const document = father.ownerDocument;

    this.#father = father;
    this.#music = music;
    this.#title = options.title ?? titleFromUrl(music);
    this.#labels = { ...DEFAULT_LABELS, ...options.labels };
    this.#preload = options.preload ?? 'metadata';
    this.#createAudio = options.createAudio ?? ((source) => new document.defaultView.Audio(source));

    ensureStyles(document);
    this.#view = createView(document);
    this.#applyColors(options.colors);
    this.#listenToView();
    this.#render();
    father.append(this.#view.root);

    if (this.#preload !== 'none') this.audio;
  }

  get father() {
    return this.#father;
  }

  get music() {
    return this.#music;
  }

  get title() {
    return this.#title;
  }

  /** @returns {import('./state.js').PlayerState} */
  get state() {
    return this.#state;
  }

  /** O elemento raiz do componente. */
  get element() {
    return this.#view.root;
  }

  /**
   * O elemento de áudio, criado na primeira vez que alguém precisa dele
   * (o `_getInstanceAudio` de 2016).
   * @returns {HTMLAudioElement}
   */
  get audio() {
    if (this.#audio) return this.#audio;

    const audio = this.#createAudio(this.#music);
    audio.preload = this.#preload;
    this.#audio = audio;
    this.#listenToAudio(audio);
    return audio;
  }

  async play() {
    try {
      await this.audio.play();
    } catch (error) {
      // Pausar antes de o áudio começar interrompe o play(): isso não é um erro da música.
      if (error?.name !== 'AbortError') this.#dispatch({ type: 'error' });
    }
  }

  pause() {
    this.audio.pause();
  }

  toggle() {
    return this.audio.paused ? this.play() : this.pause();
  }

  /** Para e volta ao início. */
  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.#pendingPercent = null;
    this.#dispatch({ type: 'timeupdate', currentTime: 0 });
  }

  /**
   * Leva a música a um ponto, de 0 a 100. Se a duração ainda não é conhecida,
   * o pedido fica guardado e é atendido quando o arquivo carregar.
   * @param {number} percent
   */
  seek(percent) {
    const time = timeFromPercent(percent, this.audio.duration);

    if (time === null) {
      this.#pendingPercent = percent;
      return;
    }

    this.audio.currentTime = time;
    this.#dispatch({ type: 'timeupdate', currentTime: time });
  }

  /** Remove o componente da página, solta o áudio e desliga todos os ouvintes. */
  destroy() {
    this.#listeners.abort();
    this.#view.root.remove();

    if (!this.#audio) return;
    this.#audio.pause();
    this.#audio.removeAttribute('src');
    this.#audio.load();
    this.#audio = null;
  }

  #applyColors(colors = {}) {
    for (const [name, value] of Object.entries(colors)) {
      this.#view.root.style.setProperty(`--player-${name}`, value);
    }
  }

  #listenToView() {
    const { button, track } = this.#view;
    const { signal } = this.#listeners;

    button.addEventListener('click', () => this.toggle(), { signal });
    button.addEventListener('dblclick', () => this.stop(), { signal });

    track.addEventListener('click', (event) => {
      this.seek(percentFromPointer(event.clientX, track.getBoundingClientRect()));
    }, { signal });

    track.addEventListener('keydown', (event) => {
      const percent = percentForKey(event.key, this.audio.currentTime, this.audio.duration);
      if (percent === null) return;

      event.preventDefault();
      this.seek(percent);
    }, { signal });
  }

  #listenToAudio(audio) {
    const { signal } = this.#listeners;

    for (const type of AUDIO_EVENTS) {
      audio.addEventListener(type, () => {
        this.#dispatch({ type, currentTime: audio.currentTime, duration: audio.duration });
      }, { signal });
    }

    audio.addEventListener('loadedmetadata', () => this.#applyPendingSeek(), { signal });
    audio.addEventListener('ended', () => { audio.currentTime = 0; }, { signal });
  }

  #applyPendingSeek() {
    if (this.#pendingPercent === null) return;

    const percent = this.#pendingPercent;
    this.#pendingPercent = null;
    this.seek(percent);
  }

  #dispatch(event) {
    const next = reduce(this.#state, event);
    if (next === this.#state) return;

    this.#state = next;
    this.#render();
    this.dispatchEvent(new CustomEvent('statechange', { detail: next }));
  }

  #render() {
    render(this.#view, describe(this.#state, this.#title, this.#labels));
  }
}
