import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatTime, percentForKey, percentFromPointer, progressPercent, timeFromPercent, titleFromUrl } from '../index.js';

test('progressPercent: a conta de 2016, com proteção para duração desconhecida', () => {
  assert.equal(progressPercent(30, 120), 25);
  assert.equal(progressPercent(0, NaN), 0);
  assert.equal(progressPercent(5, 0), 0);
  assert.equal(progressPercent(5, Infinity), 0);
  assert.equal(progressPercent(130, 120), 100);
});

test('percentFromPointer: usa só a posição do clique e a caixa do elemento', () => {
  const rect = { left: 100, width: 400 };
  assert.equal(percentFromPointer(300, rect), 50);
  assert.equal(percentFromPointer(100, rect), 0);
  assert.equal(percentFromPointer(50, rect), 0);
  assert.equal(percentFromPointer(900, rect), 100);
  assert.equal(percentFromPointer(300, { left: 0, width: 0 }), 0);
});

test('timeFromPercent: null enquanto a duração não é conhecida', () => {
  assert.equal(timeFromPercent(50, 24), 12);
  assert.equal(timeFromPercent(150, 24), 24);
  assert.equal(timeFromPercent(50, NaN), null);
});

test('percentForKey: setas andam 5 segundos, Home e End vão às pontas', () => {
  assert.equal(percentForKey('ArrowRight', 10, 100), 15);
  assert.equal(percentForKey('ArrowLeft', 10, 100), 5);
  assert.equal(percentForKey('ArrowLeft', 2, 100), 0);
  assert.equal(percentForKey('ArrowRight', 98, 100), 100);
  assert.equal(percentForKey('Home', 50, 100), 0);
  assert.equal(percentForKey('End', 50, 100), 100);
  assert.equal(percentForKey('Enter', 50, 100), null);
  assert.equal(percentForKey('ArrowRight', 0, NaN), null);
});

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(75.9), '1:15');
  assert.equal(formatTime(600), '10:00');
  assert.equal(formatTime(NaN), '--:--');
});

test('titleFromUrl: o nome da música sai do endereço', () => {
  assert.equal(titleFromUrl('http://html5.justhearit.com/songs/fe/263796/Fetty_Wap_-_My_Way.mp3'), 'Fetty Wap - My Way');
  assert.equal(titleFromUrl('musicas/Garota%20de%20Ipanema.ogg?v=2#t=10'), 'Garota de Ipanema');
  assert.equal(titleFromUrl('faixa%E0%A4%A.mp3'), 'faixa%E0%A4%A');
  assert.equal(titleFromUrl('blob:http://localhost/1b2c'), '');
});
