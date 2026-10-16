// Cálculos de golf sin interfaz: totales de una vuelta hoyo a hoyo, putt frente a una referencia,
// índice de hándicap WHS y prueba de nivel. Funciones puras, probadas en tests/golf.test.js.

// ── Vuelta hoyo a hoyo ──
// Cada hoyo: { par, score, putts, fw: 'si' | 'no' | null, pen, putt1: metros | null }.
export const isGir = (h) => h.score != null && h.putts != null && h.score - h.putts <= h.par - 2;

export function totalsFromHoles(holes) {
  const sum = (k) => holes.reduce((a, h) => a + (h[k] ?? 0), 0);
  const withPutts = holes.every((h) => h.putts != null);
  const fwHoles = holes.filter((h) => h.par >= 4 && h.fw);
  const missed = holes.filter((h) => !isGir(h) && h.putts != null);
  return {
    par: sum('par'),
    score: holes.every((h) => h.score != null) ? sum('score') : null,
    putts: withPutts ? sum('putts') : null,
    fairways: fwHoles.length ? fwHoles.filter((h) => h.fw === 'si').length : null,
    fwPossible: fwHoles.length || null,
    gir: withPutts ? holes.filter(isGir).length : null,
    // Up & down: fallar el green y aun así hacer par o mejor.
    udAtt: withPutts ? missed.length : null,
    udMade: withPutts ? missed.filter((h) => h.score <= h.par).length : null,
    penalties: sum('pen'),
  };
}

// ── Putt frente a una referencia ──
// Putts esperados según la distancia del primer putt (en metros). Referencia aproximada de
// jugadores profesionales, a partir de las tablas de Mark Broadie ("Every Shot Counts").
const PUTT_BASELINE = [
  [0.6, 1.01], [0.9, 1.04], [1.2, 1.13], [1.5, 1.23], [1.8, 1.34], [2.1, 1.42], [2.4, 1.5],
  [2.7, 1.56], [3, 1.61], [4.6, 1.78], [6.1, 1.87], [9.1, 1.98], [12.2, 2.06], [15.2, 2.14],
  [18.3, 2.21], [27.4, 2.4],
];

export function expectedPutts(meters) {
  const t = PUTT_BASELINE;
  if (meters <= t[0][0]) return t[0][1];
  if (meters >= t[t.length - 1][0]) return t[t.length - 1][1];
  const i = t.findIndex(([d]) => d >= meters);
  const [d0, p0] = t[i - 1], [d1, p1] = t[i];
  return p0 + ((meters - d0) / (d1 - d0)) * (p1 - p0);
}

// Golpes ganados (+) o perdidos (−) con el putt frente a la referencia, en los hoyos con distancia anotada.
export function puttingGained(holes) {
  const known = holes.filter((h) => h.putt1 != null && h.putts != null && h.putts > 0);
  if (!known.length) return null;
  const value = known.reduce((a, h) => a + expectedPutts(h.putt1) - h.putts, 0);
  return { value: Math.round(value * 10) / 10, holes: known.length };
}

// ── Hándicap WHS ──
// Diferencial = (113 / slope) × (golpes − valoración del campo), redondeado a una décima.
export const scoreDifferential = (score, rating, slope) => Math.round((113 / slope) * (score - rating) * 10) / 10;

// Cuántos diferenciales se promedian según las vueltas disponibles (de 3 a 20) y su ajuste.
const WHS_TABLE = {
  3: [1, -2], 4: [1, -1], 5: [1, 0], 6: [2, -1], 7: [2, 0], 8: [2, 0], 9: [3, 0], 10: [3, 0], 11: [3, 0],
  12: [4, 0], 13: [4, 0], 14: [4, 0], 15: [5, 0], 16: [5, 0], 17: [6, 0], 18: [6, 0], 19: [7, 0], 20: [8, 0],
};

// Usa las vueltas de 18 hoyos con golpes, valoración y slope (las 20 más recientes).
// Simplificado: no aplica el ajuste por doble bogey neto ni las condiciones del día (PCC).
export function handicapIndex(rounds) {
  const eligible = rounds
    .filter((r) => r.holes === 18 && r.score != null && r.rating != null && r.slope != null)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .slice(0, 20);
  const entry = WHS_TABLE[eligible.length];
  if (!entry) return { index: null, eligible: eligible.length, used: 0 };
  const [used, adjust] = entry;
  const best = eligible.map((r) => scoreDifferential(r.score, r.rating, r.slope)).sort((a, b) => a - b).slice(0, used);
  const avg = best.reduce((a, b) => a + b, 0) / used + adjust;
  const index = Math.min(54, Math.round(avg * 10) / 10);
  return { index, eligible: eligible.length, used };
}

// ── Prueba de nivel ──
// Cinco estaciones de 6 bolas, siempre iguales, para comparar el nivel en el tiempo (0–100).
export const COMBINE = [
  { id: 'puttCorto', name: 'Putt corto', cat: 'putt', task: '6 putts desde 1,5 m, cada uno desde una caída distinta.', success: 'Embocado.' },
  { id: 'puttLargo', name: 'Putt largo', cat: 'putt', task: '6 putts desde 10 m.', success: 'Queda a menos de 1 m del hoyo.' },
  { id: 'chip', name: 'Chip', cat: 'juegocorto', task: '6 chips desde 5 m fuera del green a una bandera a 15 m.', success: 'Queda a menos de 2 m.' },
  { id: 'wedge', name: 'Wedge', cat: 'approach', task: '6 golpes a una bandera a 50 m.', success: 'Queda a menos de 5 m.' },
  { id: 'salida', name: 'Salida', cat: 'largo', task: '6 golpes con driver a una calle imaginaria de 30 m.', success: 'Termina dentro de la calle.' },
];
export const COMBINE_BALLS = 6;

export const combineScore = (stations) =>
  Math.round((COMBINE.reduce((a, s) => a + (stations[s.id] ?? 0), 0) / (COMBINE.length * COMBINE_BALLS)) * 100);
