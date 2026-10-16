// Tests de los cálculos de golf (js/golf.js).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  isGir, totalsFromHoles, expectedPutts, puttingGained, scoreDifferential, handicapIndex, COMBINE, combineScore,
} from '../js/golf.js';

const h = (par, score, putts, fw = null, pen = 0, putt1 = null) => ({ par, score, putts, fw, pen, putt1 });

describe('vuelta hoyo a hoyo', () => {
  test('green en regulación: llegar en par − 2 golpes', () => {
    assert.ok(isGir(h(4, 4, 2)));     // 2 golpes al green en un par 4
    assert.ok(isGir(h(3, 2, 1)));     // birdie de un putt en par 3
    assert.ok(!isGir(h(4, 4, 1)));    // 3 golpes al green
    assert.ok(!isGir(h(5, 6, null))); // sin putts no se sabe
  });

  test('los totales salen de los hoyos', () => {
    const holes = [
      h(4, 4, 2, 'si'),           // GIR, calle
      h(4, 5, 1, 'no', 1),        // falla green, no salva el par; penalidad
      h(3, 3, 1),                 // falla green (2 al green en par 3) y salva el par: up & down
      h(5, 5, 2, 'si'),           // GIR
    ];
    assert.deepEqual(totalsFromHoles(holes), {
      par: 16, score: 17, putts: 6, fairways: 2, fwPossible: 3, gir: 2, udAtt: 2, udMade: 1, penalties: 1,
    });
  });

  test('sin putts no hay GIR ni up & down', () => {
    const t = totalsFromHoles([h(4, 5, null), h(4, 4, 2)]);
    assert.equal(t.putts, null);
    assert.equal(t.gir, null);
    assert.equal(t.udAtt, null);
    assert.equal(t.score, 9);
  });

  test('calles: solo pares 4 y 5 con dato', () => {
    const t = totalsFromHoles([h(3, 3, 2), h(4, 4, 2), h(5, 5, 2, 'no')]);
    assert.equal(t.fwPossible, 1);
    assert.equal(t.fairways, 0);
  });
});

describe('putt frente a la referencia', () => {
  test('interpola y limita la tabla', () => {
    assert.equal(expectedPutts(0.3), 1.01);
    assert.equal(expectedPutts(3), 1.61);
    assert.equal(expectedPutts(100), 2.4);
    const mid = expectedPutts(1.35);
    assert.ok(mid > 1.13 && mid < 1.23);
  });

  test('suma lo ganado o perdido en los hoyos con distancia', () => {
    const r = puttingGained([h(4, 4, 1, null, 0, 3), h(4, 5, 3, null, 0, 6.1), h(4, 4, 2)]);
    // 1,61 − 1 + 1,87 − 3 = −0,52 → −0,5
    assert.deepEqual(r, { value: -0.5, holes: 2 });
    assert.equal(puttingGained([h(4, 4, 2)]), null);
  });
});

describe('hándicap WHS', () => {
  test('diferencial con la fórmula oficial', () => {
    assert.equal(scoreDifferential(85, 72.0, 113), 13);
    assert.equal(scoreDifferential(90, 71.4, 131), 16);   // (113/131)·18,6 = 16,04
  });

  const rounds = (n, scores) => Array.from({ length: n }, (_, i) => ({
    id: `r${i}`, date: `2026-0${1 + Math.floor(i / 28)}-${String((i % 28) + 1).padStart(2, '0')}`,
    holes: 18, score: scores[i], rating: 72, slope: 113,
  }));

  test('menos de 3 vueltas válidas: sin índice', () => {
    assert.deepEqual(handicapIndex(rounds(2, [80, 82])), { index: null, eligible: 2, used: 0 });
  });

  test('3 vueltas: la mejor menos 2', () => {
    assert.equal(handicapIndex(rounds(3, [85, 82, 90])).index, 8);
  });

  test('6 vueltas: media de las 2 mejores menos 1', () => {
    assert.equal(handicapIndex(rounds(6, [85, 82, 90, 84, 88, 95])).index, 10);
  });

  test('20 vueltas: media de las 8 mejores, solo las 20 más recientes', () => {
    const scores = Array.from({ length: 25 }, (_, i) => 80 + (i % 10));
    const r = handicapIndex(rounds(25, scores));
    assert.equal(r.eligible, 20);
    assert.equal(r.used, 8);
    assert.ok(r.index >= 8 && r.index <= 12);
  });

  test('ignora vueltas de 9 hoyos o sin valoración y slope', () => {
    const rs = rounds(3, [85, 82, 90]);
    rs.push({ id: 'x', date: '2026-02-01', holes: 9, score: 40, rating: 36, slope: 113 });
    rs.push({ id: 'y', date: '2026-02-02', holes: 18, score: 70 });
    assert.equal(handicapIndex(rs).eligible, 3);
  });
});

describe('prueba de nivel', () => {
  test('cinco estaciones de 6 bolas, puntuación de 0 a 100', () => {
    assert.equal(COMBINE.length, 5);
    const all = Object.fromEntries(COMBINE.map((s) => [s.id, 6]));
    assert.equal(combineScore(all), 100);
    assert.equal(combineScore({}), 0);
    assert.equal(combineScore({ puttCorto: 6, puttLargo: 3, chip: 3, wedge: 0, salida: 3 }), 50);
  });
});
