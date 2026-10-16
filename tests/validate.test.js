// Tests del saneado de datos externos (js/validate.js): copias importadas y localStorage.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { sanitizeState, isBackup } from '../js/validate.js';

const XSS = '<img src=x onerror=alert(1)>';

const valid = () => ({
  profile: { name: 'Ana', handicap: 14.2, days: [0, 2, 4], minutes: 45, weaknesses: ['putt'], clubs: ['D', 'H7', 'PW'] },
  sessions: [{ id: 'mgx1abc', date: '2026-10-09', drillId: 'reloj-putt', attempts: 12, successes: 10, notes: 'viento' }],
  rounds: [{
    id: 'mgx2def', date: '2026-10-11', course: 'Club de Campo', holes: 18, par: 72, score: 82,
    fairways: 8, fwPossible: 14, gir: 7, putts: 31, udAtt: 8, udMade: 3, penalties: 1, notes: '',
  }],
  shots: [{ id: 'mgx3ghi00', date: '2026-10-03', club: 'H7', carry: 140 }],
  plan: { week: '2026-10-12', seed: 123, start: '2026-10-12', days: [{ dow: 0, items: [{ drillId: 'reloj-putt', sessionId: 'mgx1abc' }] }] },
  lastWeek: { week: '2026-10-05', done: 7, total: 9, met: 4 },
});

describe('sanitizeState', () => {
  test('los datos válidos pasan sin cambios', () => {
    const { state, dropped } = sanitizeState(valid());
    assert.deepEqual(state, valid());
    assert.equal(dropped, 0);
  });

  test('descarta campos desconocidos', () => {
    const data = { ...valid(), extra: XSS, __proto__: { polluted: true } };
    data.sessions[0].onclick = XSS;
    const { state } = sanitizeState(data);
    assert.deepEqual(Object.keys(state).sort(), ['lastWeek', 'plan', 'profile', 'rounds', 'sessions', 'shots']);
    assert.ok(!('onclick' in state.sessions[0]));
  });

  test('una cifra con HTML no llega al estado', () => {
    const data = valid();
    data.rounds[0].score = XSS;
    data.rounds[0].putts = '31';
    data.rounds[0].holes = 18;
    const r = sanitizeState(data).state.rounds[0];
    assert.equal(r.score, null);
    assert.equal(r.putts, null); // un texto no se convierte en número
  });

  test('descarta registros con identificadores, fechas o referencias no válidas', () => {
    const data = valid();
    data.sessions.push(
      { ...data.sessions[0], id: `x" onmouseover="alert(1)` },
      { ...data.sessions[0], id: 'ok2', date: '9/10/2026' },
      { ...data.sessions[0], id: 'ok3', drillId: XSS },
      { ...data.sessions[0], id: 'ok4', successes: 13 }, // más aciertos que intentos
    );
    data.rounds.push({ ...data.rounds[0], id: 'r2', holes: '18' }, { ...data.rounds[0], id: 'r3', holes: 27 });
    data.shots.push({ ...data.shots[0], id: 's2', club: XSS }, { ...data.shots[0], id: 's3', carry: 5 });
    const { state, dropped } = sanitizeState(data);
    assert.equal(state.sessions.length, 1);
    assert.equal(state.rounds.length, 1);
    assert.equal(state.shots.length, 1);
    assert.equal(dropped, 8);
  });

  test('los textos libres se conservan (se escapan al pintar) pero se recortan', () => {
    const data = valid();
    data.rounds[0].course = XSS;
    data.sessions[0].notes = 'a'.repeat(2000);
    const { state } = sanitizeState(data);
    assert.equal(state.rounds[0].course, XSS);
    assert.equal(state.sessions[0].notes.length, 500);
  });

  test('las cifras fuera de rango quedan vacías', () => {
    const data = valid();
    Object.assign(data.rounds[0], { holes: 9, par: 72, gir: 12, udAtt: 4, udMade: 6 });
    const r = sanitizeState(data).state.rounds[0];
    assert.equal(r.par, null);   // 72 no es un par posible en 9 hoyos
    assert.equal(r.gir, null);
    assert.equal(r.udMade, null);
  });

  test('perfil: hándicap obligatorio y listas filtradas', () => {
    const data = valid();
    Object.assign(data.profile, { days: [0, 0, 9, '1', 3], minutes: 999, weaknesses: ['putt', XSS, 'constructor'], clubs: ['D', XSS] });
    const p = sanitizeState(data).state.profile;
    assert.deepEqual(p.days, [0, 3]);
    assert.equal(p.minutes, 45);
    assert.deepEqual(p.weaknesses, ['putt']);
    assert.deepEqual(p.clubs, ['D']);
    assert.equal(sanitizeState({ ...valid(), profile: { ...valid().profile, handicap: XSS } }).state.profile, null);
  });

  test('un plan dañado se descarta entero', () => {
    const data = valid();
    data.plan.days[0].items[0].drillId = XSS;
    assert.equal(sanitizeState(data).state.plan, null);
    assert.equal(sanitizeState({ ...valid(), plan: { week: 'x', seed: 1, days: [] } }).state.plan, null);
  });

  test('una marca del plan con id no válido se queda sin marcar', () => {
    const data = valid();
    data.plan.days[0].items[0].sessionId = XSS;
    assert.equal(sanitizeState(data).state.plan.days[0].items[0].sessionId, null);
  });

  test('entradas que no son objetos dan un estado vacío', () => {
    for (const raw of [null, 42, 'texto', [], { sessions: 'no' }]) {
      const { state } = sanitizeState(raw);
      assert.equal(state.profile, null);
      assert.deepEqual(state.sessions, []);
      assert.equal(state.plan, null);
    }
  });
});

describe('isBackup', () => {
  test('reconoce una copia de Golf Plan', () => {
    assert.ok(isBackup({ app: 'golfplan', sessions: [] }));
    assert.ok(!isBackup({ app: 'otra', sessions: [] }));
    assert.ok(!isBackup({ app: 'golfplan' }));
    assert.ok(!isBackup(null));
  });
});
