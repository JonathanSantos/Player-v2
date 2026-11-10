import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INITIAL_STATE, reduce } from '../index.js';
import { DEFAULT_LABELS, describe } from '../src/view.js';

const run = (...events) => events.reduce(reduce, INITIAL_STATE);

test('o estado inicial é parado, no zero, sem duração', () => {
  assert.deepEqual(INITIAL_STATE, { status: 'idle', currentTime: 0, duration: NaN });
});

test('uma sessão comum: carregar, tocar, avançar, pausar', () => {
  const state = run(
    { type: 'loadedmetadata', duration: 24 },
    { type: 'playing' },
    { type: 'timeupdate', currentTime: 6 },
    { type: 'pause' },
  );
  assert.deepEqual(state, { status: 'paused', currentTime: 6, duration: 24 });
});

test('ao terminar, volta para o início (como em 2016)', () => {
  const state = run({ type: 'loadedmetadata', duration: 24 }, { type: 'playing' }, { type: 'timeupdate', currentTime: 24 }, { type: 'ended' });
  assert.deepEqual(state, { status: 'paused', currentTime: 0, duration: 24 });
});

test('erro é definitivo: eventos atrasados não o apagam', () => {
  const state = run({ type: 'error' }, { type: 'pause' }, { type: 'playing' });
  assert.equal(state.status, 'error');
});

test('evento desconhecido devolve o mesmo estado, e nenhum estado é mutável', () => {
  assert.equal(reduce(INITIAL_STATE, { type: 'volumechange' }), INITIAL_STATE);
  const state = run({ type: 'playing' });
  assert.throws(() => { state.status = 'idle'; }, TypeError);
});

test('describe: o que a tela mostra em cada estado', () => {
  const playing = describe({ status: 'playing', currentTime: 6, duration: 24 }, 'My Way', DEFAULT_LABELS);
  assert.deepEqual(playing, {
    status: 'playing',
    percent: 25,
    buttonLabel: 'Pausar: My Way',
    buttonDisabled: false,
    title: 'My Way',
    time: '0:06 / 0:24',
    sliderLabel: 'Posição da música: My Way',
    sliderText: '0:06 / 0:24',
    busy: false,
  });

  const idle = describe(INITIAL_STATE, '', DEFAULT_LABELS);
  assert.equal(idle.buttonLabel, 'Tocar: Música sem nome');
  assert.equal(idle.time, '0:00 / --:--');
  assert.equal(idle.percent, 0);

  const failed = describe({ ...INITIAL_STATE, status: 'error' }, 'My Way', DEFAULT_LABELS);
  assert.equal(failed.title, 'Não foi possível tocar esta música');
  assert.equal(failed.buttonDisabled, true);
});
