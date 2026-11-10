import assert from 'node:assert/strict';
import { test } from 'node:test';
import { TUNE_SECONDS, renderTune } from '../demo/tune.js';

test('a melodia de demonstração é um WAV válido, sem estourar o volume', () => {
  const bytes = renderTune();
  const view = new DataView(bytes.buffer);
  const text = (offset) => String.fromCharCode(...bytes.subarray(offset, offset + 4));

  assert.equal(text(0), 'RIFF');
  assert.equal(text(8), 'WAVE');
  assert.equal(text(36), 'data');
  assert.equal(view.getUint32(24, true), 22050);
  assert.equal(view.getUint32(40, true), bytes.length - 44);
  assert.ok(Math.abs((bytes.length - 44) / 2 / 22050 - TUNE_SECONDS) < 0.01);

  let peak = 0;
  for (let offset = 44; offset < bytes.length; offset += 2) peak = Math.max(peak, Math.abs(view.getInt16(offset, true)));
  assert.ok(peak > 8000 && peak < 32767, `pico ${peak}`);
});
