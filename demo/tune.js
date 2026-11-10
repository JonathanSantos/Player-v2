// Uma melodia curta sintetizada em JavaScript, para o Player ter o que tocar
// sem depender de um arquivo de áudio hospedado em outro lugar.

const SAMPLE_RATE = 22050;
const NOTE_SECONDS = 0.25;

// Semitons em relação ao Lá 440. `null` é pausa.
const A = 0, C = 3, D = 5, E = 7, G = 10;
const PHRASES = [
  [A, C, E, A + 12, E, C, A, null],
  [G - 12, A, D, G, D, A, G - 12, null],
  [C, E, G, C + 12, G, E, C, null],
  [D, E, G, E, D, C, A, null],
];
const MELODY = [...PHRASES, ...PHRASES, ...PHRASES].flat();

const frequencyOf = (semitones) => 220 * 2 ** (semitones / 12);

/** Amostra de uma nota: senoide com um harmônico e um decaimento, para soar como tecla. */
const sampleNote = (frequency, time) => {
  const envelope = Math.min(1, time / 0.01) * Math.exp(-5 * time);
  const wave = Math.sin(2 * Math.PI * frequency * time) + 0.3 * Math.sin(4 * Math.PI * frequency * time);
  return wave * envelope * 0.5;
};

const writeText = (view, offset, text) => {
  for (let index = 0; index < text.length; index++) view.setUint8(offset + index, text.charCodeAt(index));
};

/**
 * Sintetiza a melodia e devolve os bytes de um arquivo WAV (PCM 16 bits, mono).
 * @returns {Uint8Array}
 */
export const renderTune = () => {
  const samplesPerNote = Math.round(SAMPLE_RATE * NOTE_SECONDS);
  const sampleCount = MELODY.length * samplesPerNote;
  const view = new DataView(new ArrayBuffer(44 + sampleCount * 2));

  writeText(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeText(view, 8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, 'data');
  view.setUint32(40, sampleCount * 2, true);

  MELODY.forEach((semitones, noteIndex) => {
    if (semitones === null) return;

    const frequency = frequencyOf(semitones);
    for (let index = 0; index < samplesPerNote; index++) {
      const sample = sampleNote(frequency, index / SAMPLE_RATE);
      view.setInt16(44 + (noteIndex * samplesPerNote + index) * 2, Math.round(sample * 32767), true);
    }
  });

  return new Uint8Array(view.buffer);
};

/** Duração da melodia, em segundos. */
export const TUNE_SECONDS = MELODY.length * NOTE_SECONDS;

/** Um endereço `blob:` com a melodia, pronto para entregar ao Player. */
export const createTuneUrl = () => URL.createObjectURL(new Blob([renderTune()], { type: 'audio/wav' }));
