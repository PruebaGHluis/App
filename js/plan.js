import { DRILLS, drillById } from './data.js';

export const DOW = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const DOW_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// ── Fechas (siempre en hora local, formato YYYY-MM-DD) ──
export function isoDate(d) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
}
export const todayISO = () => isoDate(new Date());
export const todayDow = () => (new Date().getDay() + 6) % 7; // 0 = lunes

export function weekKey(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return isoDate(x);
}
export function addDays(iso, n) {
  const x = new Date(iso + 'T00:00:00');
  x.setDate(x.getDate() + n);
  return isoDate(x);
}
export function daysAgo(n) {
  return addDays(todayISO(), -n);
}

// ── Estadística ──
export function mean(values) {
  const v = values.filter((x) => x != null && !Number.isNaN(x));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
export function stdev(values) {
  if (values.length < 2) return null;
  const m = mean(values);
  return Math.sqrt(values.reduce((a, b) => a + (b - m) ** 2, 0) / (values.length - 1));
}

// Métricas de una vuelta, normalizadas a 18 hoyos cuando procede.
export function roundStats(r) {
  const holes = Number(r.holes) || 18;
  const f = 18 / holes;
  const has = (v) => v != null && v !== '';
  return {
    overPar18: has(r.score) && has(r.par) ? (r.score - r.par) * f : null,
    fwPct: has(r.fairways) && r.fwPossible ? (r.fairways / r.fwPossible) * 100 : null,
    girPct: has(r.gir) ? (r.gir / holes) * 100 : null,
    putts18: has(r.putts) ? r.putts * f : null,
    udPct: r.udAtt ? ((r.udMade || 0) / r.udAtt) * 100 : null,
  };
}

// ── Foco de entrenamiento ──
// Combina los puntos débiles marcados, las estadísticas de las últimas vueltas
// y el rendimiento reciente en los ejercicios.
export function computeFocus(profile, rounds, sessions) {
  const weights = { largo: 1, approach: 1, juegocorto: 1, bunker: 0.6, putt: 1 };
  const reasons = { largo: [], approach: [], juegocorto: [], bunker: [], putt: [] };

  for (const c of profile.weaknesses || []) {
    weights[c] += 1.5;
    reasons[c].push('Punto débil marcado');
  }

  const recent = [...rounds].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(roundStats);
  if (recent.length) {
    const avg = (k) => mean(recent.map((r) => r[k]));
    const fw = avg('fwPct'), gir = avg('girPct'), putts = avg('putts18'), ud = avg('udPct');
    if (fw != null && fw < 50) { weights.largo += 1; reasons.largo.push(`Calles ${Math.round(fw)}%`); }
    if (gir != null && gir < 40) {
      weights.approach += 1; weights.largo += 0.5;
      reasons.approach.push(`Greens en regulación ${Math.round(gir)}%`);
    }
    if (putts != null && putts > 32) { weights.putt += 1; reasons.putt.push(`${putts.toFixed(1)} putts por vuelta`); }
    if (ud != null && ud < 35) { weights.juegocorto += 1; reasons.juegocorto.push(`Up & down ${Math.round(ud)}%`); }
  }

  const since = daysAgo(30);
  for (const cat of Object.keys(weights)) {
    const ratios = sessions
      .filter((s) => s.date >= since)
      .map((s) => ({ s, d: drillById(s.drillId) }))
      .filter(({ d }) => d && d.cat === cat)
      .map(({ s, d }) => (s.successes / s.attempts) * 100 / d.target);
    const r = mean(ratios);
    if (ratios.length >= 2 && r < 0.85) {
      weights[cat] += 0.5;
      reasons[cat].push('Por debajo del objetivo en los ejercicios');
    }
  }

  return { weights, reasons };
}

// ── Generador de plan semanal ──
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function weightedPick(items, weightOf, rng) {
  const total = items.reduce((a, it) => a + weightOf(it), 0);
  let r = rng() * total;
  for (const it of items) {
    r -= weightOf(it);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

export function generatePlan(profile, rounds, sessions, seed, week = weekKey()) {
  const rng = mulberry32(seed);
  const { weights } = computeFocus(profile, rounds, sessions);
  const advanced = Number(profile.handicap) <= 10;
  const pool = DRILLS.filter((d) => advanced || d.level !== 'avanzado');
  const usage = {};

  const days = [...profile.days].sort((a, b) => a - b).map((dow) => {
    let budget = Number(profile.minutes) || 45;
    const items = [];
    const usedCats = new Set();
    while (budget >= 10) {
      const cats = Object.keys(weights).filter(
        (c) => !usedCats.has(c) && pool.some((d) => d.cat === c && d.minutes <= budget),
      );
      if (!cats.length) break;
      const cat = weightedPick(cats, (c) => weights[c], rng);
      usedCats.add(cat);
      // Dentro de la categoría, prioriza los ejercicios menos repetidos esta semana.
      const options = pool.filter((d) => d.cat === cat && d.minutes <= budget);
      const minUse = Math.min(...options.map((d) => usage[d.id] || 0));
      const best = options.filter((d) => (usage[d.id] || 0) === minUse);
      const drill = best[Math.floor(rng() * best.length)];
      usage[drill.id] = (usage[drill.id] || 0) + 1;
      items.push({ drillId: drill.id, sessionId: null });
      budget -= drill.minutes;
    }
    return { dow, items };
  });

  return { week, seed, days };
}
