// Persistencia local: todo el estado vive en localStorage bajo una sola clave.
const KEY = 'golfplan:v1';

const defaults = () => ({
  profile: null,   // { name, handicap, days[], minutes, weaknesses[], clubs[] }
  sessions: [],    // { id, date, drillId, attempts, successes, notes }
  rounds: [],      // { id, date, course, holes, par, score, fairways, fwPossible, gir, putts, udAtt, udMade, penalties, notes }
  shots: [],       // { id, date, club, carry }
  plan: null,      // { week, seed, days: [{ dow, items: [{ drillId, sessionId }] }] }
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
  } catch {
    return defaults();
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('No se pudo guardar', err);
  }
}

export const getState = () => state;

export function update(fn) {
  fn(state);
  save();
}

export function replaceState(data) {
  state = { ...defaults(), ...data };
  save();
}

export function exportState() {
  return JSON.stringify({ app: 'golfplan', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Evita que el navegador borre los datos cuando le falta espacio.
navigator.storage?.persist?.().catch(() => {});
