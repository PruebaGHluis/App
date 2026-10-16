// Saneado de los datos que vienen de fuera: una copia importada o lo guardado en localStorage.
// Solo pasan los campos conocidos, con su tipo y rango; lo demás se descarta antes de llegar al HTML.
import { CATEGORIES, CLUBS, drillById } from './data.js';

const ID = /^[a-z0-9_-]{1,40}$/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CLUB_IDS = new Set(CLUBS.map((c) => c.id));
const MINUTES = [30, 45, 60, 90, 120];

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const int = (v, min, max) => (Number.isInteger(v) && v >= min && v <= max ? v : null);
const num = (v, min, max) => (isNum(v) && v >= min && v <= max ? v : null);
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const id = (v) => (typeof v === 'string' && ID.test(v) ? v : null);
const date = (v) => (typeof v === 'string' && DATE.test(v) && !Number.isNaN(Date.parse(v + 'T00:00:00')) ? v : null);
const list = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);
const unique = (arr) => [...new Set(arr)];

function profile(p) {
  p = obj(p);
  const handicap = num(p?.handicap, -10, 54);
  if (!p || handicap == null) return null;
  return {
    name: str(p.name, 40),
    handicap,
    days: unique(list(p.days).filter((d) => int(d, 0, 6) != null)).sort((a, b) => a - b),
    minutes: MINUTES.includes(p.minutes) ? p.minutes : 45,
    weaknesses: unique(list(p.weaknesses).filter((c) => typeof c === 'string' && Object.hasOwn(CATEGORIES, c))),
    clubs: unique(list(p.clubs).filter((c) => CLUB_IDS.has(c))),
  };
}

function session(s) {
  s = obj(s);
  const attempts = int(s?.attempts, 1, 500);
  const successes = attempts == null ? null : int(s.successes, 0, attempts);
  if (!s || !id(s.id) || !date(s.date) || !drillById(s.drillId) || successes == null) return null;
  return { id: s.id, date: s.date, drillId: s.drillId, attempts, successes, notes: str(s.notes, 500) };
}

function round(r) {
  r = obj(r);
  if (!r || !id(r.id) || !date(r.date) || (r.holes !== 9 && r.holes !== 18)) return null;
  const h = r.holes;
  const udAtt = int(r.udAtt, 0, h);
  return {
    id: r.id, date: r.date, course: str(r.course, 80), holes: h,
    par: int(r.par, h * 3, h * 5),
    score: int(r.score, h, h * 12),
    fairways: int(r.fairways, 0, h),
    fwPossible: int(r.fwPossible, 0, h),
    gir: int(r.gir, 0, h),
    putts: int(r.putts, 0, h * 10),
    udAtt,
    udMade: int(r.udMade, 0, udAtt ?? h),
    penalties: int(r.penalties, 0, h * 10),
    notes: str(r.notes, 500),
  };
}

function shot(s) {
  s = obj(s);
  const carry = num(s?.carry, 10, 400);
  if (!s || !id(s.id) || !date(s.date) || !CLUB_IDS.has(s.club) || carry == null) return null;
  return { id: s.id, date: s.date, club: s.club, carry: Math.round(carry) };
}

// Un plan dañado no se intenta reparar: se descarta y la app genera uno nuevo.
function plan(p) {
  p = obj(p);
  if (!p || !date(p.week) || !isNum(p.seed)) return null;
  const days = [];
  for (const d of list(p.days)) {
    if (!obj(d) || int(d.dow, 0, 6) == null) return null;
    const items = [];
    for (const it of list(d.items)) {
      if (!obj(it) || !drillById(it.drillId)) return null;
      items.push({ drillId: it.drillId, sessionId: id(it.sessionId) });
    }
    days.push({ dow: d.dow, items });
  }
  const out = { week: p.week, seed: p.seed, days };
  if (date(p.start)) out.start = p.start;
  return out;
}

function lastWeek(w) {
  w = obj(w);
  if (!w || !date(w.week)) return undefined;
  const total = int(w.total, 0, 1000);
  const done = total == null ? null : int(w.done, 0, total);
  const met = done == null ? null : int(w.met, 0, done);
  if (met == null) return undefined;
  return { week: w.week, done, total, met, ...(w.dismissed === true ? { dismissed: true } : {}) };
}

const clean = (arr, fn) => list(arr).map(fn).filter(Boolean);

// Devuelve el estado saneado y cuántos registros se descartaron.
export function sanitizeState(raw) {
  const data = obj(raw) || {};
  const state = {
    profile: profile(data.profile),
    sessions: clean(data.sessions, session),
    rounds: clean(data.rounds, round),
    shots: clean(data.shots, shot),
    plan: plan(data.plan),
  };
  const lw = lastWeek(data.lastWeek);
  if (lw) state.lastWeek = lw;
  const dropped = ['sessions', 'rounds', 'shots']
    .reduce((n, k) => n + list(data[k]).length - state[k].length, 0);
  return { state, dropped };
}

// Una copia de seguridad válida de Golf Plan (antes de sanear su contenido).
export const isBackup = (data) => obj(data)?.app === 'golfplan' && Array.isArray(data.sessions);
