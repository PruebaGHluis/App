// Tests del motor del plan (js/plan.js). Se ejecutan con `npm test` (node --test), sin dependencias.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  isoDate, weekKey, addDays, daysAgo, mean, stdev, roundStats, computeFocus, generatePlan, hashStr,
} from '../js/plan.js';
import { DRILLS, drillById } from '../js/data.js';

const profile = (over = {}) => ({
  name: '', handicap: 15, days: [0, 2, 4], minutes: 45, weaknesses: [], clubs: [], ...over,
});

describe('fechas', () => {
  test('isoDate usa la fecha local en formato YYYY-MM-DD', () => {
    assert.equal(isoDate(new Date(2026, 9, 16, 23, 30)), '2026-10-16');
    assert.equal(isoDate(new Date(2026, 0, 1, 0, 5)), '2026-01-01');
  });

  test('addDays cruza meses y años', () => {
    assert.equal(addDays('2026-10-31', 1), '2026-11-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  });

  test('weekKey devuelve el lunes de la semana', () => {
    assert.equal(weekKey(new Date(2026, 9, 12)), '2026-10-12'); // lunes
    assert.equal(weekKey(new Date(2026, 9, 16)), '2026-10-12'); // viernes
    assert.equal(weekKey(new Date(2026, 9, 18)), '2026-10-12'); // domingo
    assert.equal(weekKey(new Date(2026, 9, 19)), '2026-10-19'); // lunes siguiente
  });
});

describe('estadística', () => {
  test('mean ignora valores vacíos y devuelve null sin datos', () => {
    assert.equal(mean([1, 2, 3]), 2);
    assert.equal(mean([4, null, NaN, 6]), 5);
    assert.equal(mean([]), null);
    assert.equal(mean([null]), null);
  });

  test('stdev es la desviación muestral y necesita al menos dos valores', () => {
    assert.equal(stdev([5]), null);
    assert.ok(Math.abs(stdev([2, 4, 4, 4, 5, 5, 7, 9]) - 2.138) < 0.001);
  });
});

describe('roundStats', () => {
  test('vuelta de 18 hoyos', () => {
    const s = roundStats({ holes: 18, score: 85, par: 72, fairways: 7, fwPossible: 14, gir: 6, putts: 33, udAtt: 8, udMade: 2 });
    assert.equal(s.overPar18, 13);
    assert.equal(s.fwPct, 50);
    assert.ok(Math.abs(s.girPct - 33.33) < 0.01);
    assert.equal(s.putts18, 33);
    assert.equal(s.udPct, 25);
  });

  test('una vuelta de 9 hoyos se normaliza a 18', () => {
    const s = roundStats({ holes: 9, score: 44, par: 36, gir: 3, putts: 16 });
    assert.equal(s.overPar18, 16);
    assert.equal(s.putts18, 32);
    assert.ok(Math.abs(s.girPct - 33.33) < 0.01);
  });

  test('los datos que faltan dan null, no ceros', () => {
    const s = roundStats({ holes: 18, score: 80 });
    assert.equal(s.overPar18, null);
    assert.equal(s.fwPct, null);
    assert.equal(s.girPct, null);
    assert.equal(s.putts18, null);
    assert.equal(s.udPct, null);
  });

  test('sin intentos de up & down no hay porcentaje', () => {
    assert.equal(roundStats({ holes: 18, udAtt: 0, udMade: 0 }).udPct, null);
  });
});

describe('computeFocus', () => {
  test('sin datos, pesos base y sin motivos', () => {
    const { weights, reasons } = computeFocus(profile(), [], []);
    assert.deepEqual(weights, { largo: 1, approach: 1, juegocorto: 1, bunker: 0.6, putt: 1 });
    assert.ok(Object.values(reasons).every((r) => r.length === 0));
  });

  test('un punto débil marcado sube su peso y lo explica', () => {
    const { weights, reasons } = computeFocus(profile({ weaknesses: ['putt'] }), [], []);
    assert.equal(weights.putt, 2.5);
    assert.deepEqual(reasons.putt, ['Punto débil marcado']);
  });

  test('las vueltas recientes señalan áreas débiles', () => {
    const rounds = [
      { date: '2026-10-01', holes: 18, fairways: 5, fwPossible: 14, gir: 4, putts: 35, udAtt: 10, udMade: 2 },
    ];
    const { weights, reasons } = computeFocus(profile(), rounds, []);
    assert.equal(weights.largo, 2.5); // calles < 50% (+1) y GIR < 40% (+0,5)
    assert.equal(weights.approach, 2);
    assert.equal(weights.putt, 2);
    assert.equal(weights.juegocorto, 2);
    assert.match(reasons.putt[0], /35\.0 putts/);
  });

  test('solo cuentan las 5 vueltas más recientes', () => {
    const good = (d) => ({ date: d, holes: 18, putts: 28 });
    const rounds = [
      { date: '2026-01-01', holes: 18, putts: 45 }, // antigua: no debe pesar
      good('2026-10-01'), good('2026-10-02'), good('2026-10-03'), good('2026-10-04'), good('2026-10-05'),
    ];
    assert.equal(computeFocus(profile(), rounds, []).weights.putt, 1);
  });

  test('dos o más sesiones recientes por debajo del objetivo suman foco', () => {
    const d = drillById('reloj-putt');
    const low = (id, daysBack) => ({ id, date: daysAgo(daysBack), drillId: d.id, attempts: 10, successes: 2 });
    const { weights, reasons } = computeFocus(profile(), [], [low('a', 1), low('b', 3)]);
    assert.equal(weights.putt, 1.5);
    assert.deepEqual(reasons.putt, ['Por debajo del objetivo en los ejercicios']);
    // Una sola sesión no basta, y las de hace más de 30 días no cuentan.
    assert.equal(computeFocus(profile(), [], [low('a', 1)]).weights.putt, 1);
    assert.equal(computeFocus(profile(), [], [low('a', 40), low('b', 45)]).weights.putt, 1);
  });
});

describe('generatePlan', () => {
  const week = '2026-10-12';

  test('con la misma semilla genera el mismo plan', () => {
    const a = generatePlan(profile(), [], [], 1234, week);
    const b = generatePlan(profile(), [], [], 1234, week);
    assert.deepEqual(a, b);
    assert.equal(a.week, week);
  });

  test('los días son los del perfil, ordenados', () => {
    const plan = generatePlan(profile({ days: [5, 0, 3] }), [], [], 1, week);
    assert.deepEqual(plan.days.map((d) => d.dow), [0, 3, 5]);
  });

  test('sin días elegidos no hay sesiones', () => {
    assert.deepEqual(generatePlan(profile({ days: [] }), [], [], 1, week).days, []);
  });

  test('cada sesión cabe en el tiempo disponible y no repite área', () => {
    for (const minutes of [30, 45, 60, 90, 120]) {
      for (let seed = 1; seed <= 20; seed++) {
        const plan = generatePlan(profile({ minutes, days: [0, 1, 2, 3, 4, 5, 6] }), [], [], seed, week);
        for (const day of plan.days) {
          const drills = day.items.map((it) => drillById(it.drillId));
          assert.ok(drills.every(Boolean), 'todos los ejercicios existen');
          assert.ok(drills.reduce((a, d) => a + d.minutes, 0) <= minutes, `cabe en ${minutes} min`);
          assert.equal(new Set(drills.map((d) => d.cat)).size, drills.length, 'sin áreas repetidas en un día');
          assert.ok(day.items.every((it) => it.sessionId === null), 'empieza sin marcar');
        }
      }
    }
  });

  test('con hándicap mayor de 10 no entran ejercicios avanzados', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const plan = generatePlan(profile({ handicap: 18, days: [0, 1, 2, 3, 4, 5, 6], minutes: 120 }), [], [], seed, week);
      const levels = plan.days.flatMap((d) => d.items.map((it) => drillById(it.drillId).level));
      assert.ok(!levels.includes('avanzado'));
    }
  });

  test('con hándicap de 10 o menos pueden entrar ejercicios avanzados', () => {
    const advanced = new Set(DRILLS.filter((d) => d.level === 'avanzado').map((d) => d.id));
    let seen = false;
    for (let seed = 1; seed <= 60 && !seen; seed++) {
      const plan = generatePlan(profile({ handicap: 4, days: [0, 1, 2, 3, 4, 5, 6], minutes: 120 }), [], [], seed, week);
      seen = plan.days.some((d) => d.items.some((it) => advanced.has(it.drillId)));
    }
    assert.ok(seen);
  });

  test('un punto débil aparece más a menudo en el plan', () => {
    const count = (weaknesses) => {
      let n = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const plan = generatePlan(profile({ weaknesses, minutes: 30 }), [], [], seed, week);
        n += plan.days.flatMap((d) => d.items).filter((it) => drillById(it.drillId).cat === 'bunker').length;
      }
      return n;
    };
    assert.ok(count(['bunker']) > count([]) * 1.5);
  });
});

describe('hashStr', () => {
  test('es estable y distingue cadenas', () => {
    assert.equal(hashStr('2026-10-12'), hashStr('2026-10-12'));
    assert.notEqual(hashStr('2026-10-12'), hashStr('2026-10-19'));
    assert.ok(Number.isInteger(hashStr('x')) && hashStr('x') >= 0);
  });
});

describe('datos de ejercicios', () => {
  test('cada ejercicio está completo y su id es único', () => {
    const ids = new Set();
    for (const d of DRILLS) {
      assert.ok(!ids.has(d.id), `id repetido: ${d.id}`);
      ids.add(d.id);
      assert.ok(['largo', 'approach', 'juegocorto', 'bunker', 'putt'].includes(d.cat), d.id);
      assert.ok(['medio', 'avanzado'].includes(d.level), d.id);
      assert.ok(d.minutes >= 5 && d.attempts >= 1 && d.target > 0 && d.target <= 100, d.id);
      assert.ok(d.name && d.summary && d.success && d.tip && d.steps.length, d.id);
    }
  });
});
