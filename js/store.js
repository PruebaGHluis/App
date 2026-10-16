// Persistencia local: todo el estado vive en localStorage bajo una sola clave.
// Lo que se lee o se importa pasa siempre por sanitizeState: localStorage es una entrada no fiable.
import { sanitizeState } from './validate.js';

const KEY = 'golfplan:v1';

const defaults = () => ({
  profile: null,   // { name, handicap, days[], minutes, weaknesses[], clubs[] }
  sessions: [],    // { id, date, drillId, attempts, successes, notes }
  rounds: [],      // { id, date, course, holes, par, score, fairways, fwPossible, gir, putts, udAtt, udMade, penalties, notes, rating?, slope?, holesData? }
  shots: [],       // { id, date, club, carry }
  tests: [],       // { id, date, stations: { puttCorto, puttLargo, chip, wedge, salida } }
  courses: [],     // { name, pars[], rating?, slope? }
  plan: null,      // { week, seed, start?, days: [{ dow, items: [{ drillId, sessionId }] }] }
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults(), ...sanitizeState(JSON.parse(raw)).state } : defaults();
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

// Sustituye todo el estado; devuelve cuántos registros se descartaron por no ser válidos.
export function replaceState(data) {
  const { state: clean, dropped } = sanitizeState(data);
  state = { ...defaults(), ...clean };
  save();
  return dropped;
}

export function exportState() {
  return JSON.stringify({ app: 'golfplan', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 2);
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// Evita que el navegador borre los datos cuando le falta espacio.
navigator.storage?.persist?.().catch(() => {});
