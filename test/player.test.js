import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { Window } from 'happy-dom';
import { Player } from '../index.js';

// O fluxo principal com um DOM de verdade (happy-dom) e um áudio de mentira,
// que guarda o que foi pedido e emite os eventos que um <audio> emitiria.
class FakeAudio extends EventTarget {
  paused = true;
  currentTime = 0;
  duration = NaN;
  preload = '';
  playCalls = 0;
  loaded = 0;
  playError = null;

  constructor(source) {
    super();
    this.src = source;
  }

  emit(type) {
    this.dispatchEvent(new Event(type));
  }

  load() {
    this.loaded++;
  }

  removeAttribute() {
    this.src = '';
  }

  ready(duration) {
    this.duration = duration;
    this.emit('loadedmetadata');
  }

  async play() {
    this.playCalls++;
    if (this.playError) throw this.playError;
    this.paused = false;
    this.emit('playing');
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.emit('pause');
  }

  tick(currentTime) {
    this.currentTime = currentTime;
    this.emit('timeupdate');
  }
}

let window;
let document;
let father;

const mount = (music = 'songs/Fetty_Wap_-_My_Way.mp3', options = {}) => {
  let audio;
  const player = new Player(father, music, { createAudio: (source) => (audio = new FakeAudio(source)), ...options });
  const root = father.lastElementChild;
  return {
    player,
    root,
    get audio() { return audio; },
    button: root.querySelector('.player__button'),
    track: root.querySelector('.player__track'),
    bar: root.querySelector('.player__bar'),
    title: root.querySelector('.player__title'),
    time: root.querySelector('.player__time'),
  };
};

const click = (element, init = {}) => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, ...init }));
const settle = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  window = new Window();
  document = window.document;
  father = document.createElement('div');
  document.body.append(father);
});

test('monta o componente dentro do elemento pai, com o nome tirado do endereço', () => {
  const { root, title, time, button, track, audio } = mount();

  assert.equal(root.className, 'player');
  assert.equal(title.textContent, 'Fetty Wap - My Way');
  assert.equal(time.textContent, '0:00 / --:--');
  assert.equal(button.getAttribute('aria-label'), 'Tocar: Fetty Wap - My Way');
  assert.equal(track.getAttribute('role'), 'slider');
  assert.equal(audio.src, 'songs/Fetty_Wap_-_My_Way.mp3');
  assert.equal(audio.preload, 'metadata');
});

test('vários players na mesma página dividem uma única folha de estilo', () => {
  mount();
  mount();
  mount();
  assert.equal(father.children.length, 3);
  assert.equal(document.querySelectorAll('style#player-styles').length, 1);
});

test('clique no botão toca e pausa', async () => {
  const { button, root, audio } = mount();

  click(button);
  await settle();
  assert.equal(audio.paused, false);
  assert.equal(root.dataset.status, 'playing');
  assert.equal(button.getAttribute('aria-label'), 'Pausar: Fetty Wap - My Way');

  click(button);
  assert.equal(audio.paused, true);
  assert.equal(root.dataset.status, 'paused');
});

test('o progresso acompanha o tempo da música', () => {
  const { audio, bar, time, track } = mount();
  audio.ready(24);
  audio.tick(6);

  assert.equal(bar.style.width, '25%');
  assert.equal(time.textContent, '0:06 / 0:24');
  assert.equal(track.getAttribute('aria-valuenow'), '25');
  assert.equal(track.getAttribute('aria-valuetext'), '0:06 / 0:24');
});

test('clique na faixa leva a música até aquele ponto', () => {
  const { audio, track, bar } = mount();
  track.getBoundingClientRect = () => ({ left: 100, width: 400 });
  audio.ready(24);

  click(track, { clientX: 300 });
  assert.equal(audio.currentTime, 12);
  assert.equal(bar.style.width, '50%');
});

test('regressão de 2016: clicar na faixa antes de o áudio carregar não lança erro', () => {
  const { audio, track } = mount();
  track.getBoundingClientRect = () => ({ left: 0, width: 200 });

  assert.doesNotThrow(() => click(track, { clientX: 150 }));
  assert.equal(audio.currentTime, 0);

  audio.ready(40);
  assert.equal(audio.currentTime, 30, 'o pedido guardado é atendido quando a duração chega');
});

test('duplo clique para e volta ao início', async () => {
  const { audio, button, bar, root } = mount();
  audio.ready(24);
  click(button);
  await settle();
  audio.tick(10);

  button.dispatchEvent(new window.MouseEvent('dblclick', { bubbles: true }));
  assert.equal(audio.paused, true);
  assert.equal(audio.currentTime, 0);
  assert.equal(bar.style.width, '0%');
  assert.equal(root.dataset.status, 'paused');
});

test('teclado: setas, Home e End movem a música', () => {
  const { audio, track } = mount();
  audio.ready(100);
  const press = (key) => track.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

  press('ArrowRight');
  assert.equal(audio.currentTime, 5);
  press('End');
  assert.equal(audio.currentTime, 100);
  press('Home');
  assert.equal(audio.currentTime, 0);
});

test('ao terminar, a música volta para o início', () => {
  const { audio, bar } = mount();
  audio.ready(24);
  audio.tick(24);
  audio.emit('ended');

  assert.equal(audio.currentTime, 0);
  assert.equal(bar.style.width, '0%');
});

test('regressão de 2016: música que não carrega aparece na tela', async () => {
  const { audio, button, title, root } = mount();
  audio.playError = Object.assign(new Error('no supported source'), { name: 'NotSupportedError' });

  click(button);
  await settle();
  assert.equal(root.dataset.status, 'error');
  assert.equal(title.textContent, 'Não foi possível tocar esta música');
  assert.equal(button.disabled, true);
});

test('play interrompido por um pause não é tratado como erro', async () => {
  const { audio, player } = mount();
  audio.playError = Object.assign(new Error('interrupted'), { name: 'AbortError' });

  await player.play();
  assert.equal(player.state.status, 'idle');
});

test('preload "none": o áudio só é criado no primeiro uso', () => {
  const mounted = mount('a.mp3', { preload: 'none' });
  assert.equal(mounted.audio, undefined);

  click(mounted.button);
  assert.equal(mounted.audio.playCalls, 1);
  assert.equal(mounted.audio.preload, 'none');
});

test('opções: título, cores e textos', () => {
  const { title, root, button } = mount('a.mp3', { title: 'Minha música', colors: { accent: '#0a7' }, labels: { play: 'Play' } });
  assert.equal(title.textContent, 'Minha música');
  assert.equal(root.style.getPropertyValue('--player-accent'), '#0a7');
  assert.equal(button.getAttribute('aria-label'), 'Play: Minha música');
});

test('emite statechange com o novo estado', () => {
  const { audio, player } = mount();
  const seen = [];
  player.addEventListener('statechange', (event) => seen.push(event.detail));

  audio.ready(24);
  assert.deepEqual(seen, [{ status: 'idle', currentTime: 0, duration: 24 }]);
  assert.equal(player.state, seen[0]);
});

test('destroy remove o componente, solta o áudio e desliga os ouvintes', async () => {
  const { audio, player, button } = mount();
  player.destroy();

  assert.equal(father.children.length, 0);
  assert.equal(audio.src, '');
  assert.equal(audio.loaded, 1);

  click(button);
  await settle();
  assert.equal(audio.playCalls, 0);
});

test('argumentos inválidos dizem o que faltou', () => {
  assert.throws(() => new Player(null, 'a.mp3'), { name: 'TypeError', message: /elemento/ });
  assert.throws(() => new Player(father, ''), { name: 'TypeError', message: /endereço/ });
});
