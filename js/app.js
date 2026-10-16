import { getState, update, uid, replaceState, exportState } from './store.js';
import { CATEGORIES, CLUBS, DEFAULT_CLUBS, DRILLS, drillById, clubById } from './data.js';
import {
  DOW, DOW_SHORT, weekKey, addDays, todayISO, todayDow, daysAgo, hashStr,
  mean, stdev, roundStats, computeFocus, generatePlan,
} from './plan.js';
import { lineChart } from './charts.js';
import { isBackup } from './validate.js';
import { totalsFromHoles, puttingGained, handicapIndex, COMBINE, COMBINE_BALLS, combineScore } from './golf.js';

const $ = (sel, el = document) => el.querySelector(sel);
const view = $('#view');
const sheet = $('#sheet');

// ── Utilidades ──
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
const fmtDate = (iso, opts = { day: 'numeric', month: 'short' }) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', opts);
const fmtSigned = (v) => (v > 0 ? '+' : '') + (Number.isInteger(v) ? v : v.toFixed(1));
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
const byDateDesc = (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
const byDateAsc = (a, b) => -byDateDesc(a, b);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const CLOSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const APP_REGIONS = '.topbar, #view, .tabbar';

// Hándicap: se guarda como número; los hándicaps plus se guardan en negativo y se muestran con "+".
const fmtHcp = (v) => (v === '' || v == null ? '' : v < 0 ? '+' + String(-v).replace('.', ',') : String(v).replace('.', ','));
function parseHcp(text) {
  const m = String(text ?? '').trim().replace(',', '.').match(/^([+-]?)(\d{1,2}(?:\.\d)?)$/);
  if (!m) return null;
  const v = Number(m[2]) * (m[1] ? -1 : 1);
  return v >= -10 && v <= 54 ? v : null;
}

function toast(msg, kind = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('win', kind === 'win');
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), kind === 'win' ? 3400 : 2600);
}

// Diálogo de confirmación propio (sustituye a confirm()). Devuelve una promesa con true/false.
function ask(message, { ok = 'Aceptar', danger = false, detail = '' } = {}) {
  const dlg = $('#ask');
  dlg.innerHTML = `<form method="dialog">
    <p class="ask-msg">${esc(message)}</p>
    ${detail ? `<p class="small muted">${esc(detail)}</p>` : ''}
    <div class="ask-actions">
      <button class="btn" value="cancel" autofocus>Cancelar</button>
      <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'}" value="ok">${esc(ok)}</button>
    </div></form>`;
  dlg.returnValue = '';
  dlg.showModal();
  return new Promise((resolve) => dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok'), { once: true }));
}

// ── Hoja inferior ──
let sheetOpener = null;

function openSheet(html) {
  if (sheet.hidden) sheetOpener = document.activeElement;
  delete sheet.dataset.dirty;
  sheet.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">
      <div class="grab"></div>
      <button type="button" class="x-btn sheet-close" data-action="close-sheet" aria-label="Cerrar">${CLOSE_SVG}</button>
      ${html}</div>`;
  sheet.querySelector('.sheet-panel h2')?.setAttribute('id', 'sheet-title');
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
  document.querySelectorAll(APP_REGIONS).forEach((el) => { el.inert = true; });
  sheet.querySelector('.sheet-panel').focus();
}
function closeSheet() {
  sheet.hidden = true;
  sheet.innerHTML = '';
  delete sheet.dataset.dirty;
  document.body.style.overflow = '';
  document.querySelectorAll(APP_REGIONS).forEach((el) => { el.inert = false; });
  if (sheetOpener?.isConnected) sheetOpener.focus();
  sheetOpener = null;
}
// Cierre pedido por el usuario: si ha escrito algo, pregunta antes de descartarlo.
async function requestCloseSheet() {
  if (sheet.dataset.dirty && !(await ask('¿Descartar lo que has escrito?', { ok: 'Descartar', danger: true }))) return;
  closeSheet();
}

const catDot = (cat) => `<span class="dot cat-${cat}" aria-hidden="true"></span>`;

// Anillo de objetivo: el arco es el valor (0-100), la marca es el objetivo y, si se cumple,
// el centro se enciende con un check o con el texto central.
function ring(value, { target = null, size = 34, stroke = 4, center = '', label = '' } = {}) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  const met = value != null && value >= (target ?? 100);
  const low = !met && target != null && value < target * 0.8;
  const c = size / 2, r = (size - stroke) / 2, len = 2 * Math.PI * r;
  let tick = '';
  if (target != null) {
    const a = (target / 100) * 2 * Math.PI - Math.PI / 2;
    const r1 = r - stroke / 2, r2 = r + stroke * 1.1; // solo hacia fuera, para no tocar la cifra central
    tick = `<line class="ring-tick" x1="${c + r1 * Math.cos(a)}" y1="${c + r1 * Math.sin(a)}" x2="${c + r2 * Math.cos(a)}" y2="${c + r2 * Math.sin(a)}"/>`;
  }
  const rc = r - stroke / 2 - Math.max(1.5, size * 0.04);
  const core = met ? `<circle class="ring-core" cx="${c}" cy="${c}" r="${rc}"/>` : '';
  const mark = met && !center
    ? `<path class="ring-check" stroke-width="${Math.max(2.2, size * 0.07)}" d="M${c - rc * 0.45} ${c + rc * 0.02} L${c - rc * 0.1} ${c + rc * 0.36} L${c + rc * 0.48} ${c - rc * 0.32}"/>`
    : '';
  // El texto central cabe dentro del núcleo: cuantos más caracteres, más pequeño.
  const fs = size * (center.length >= 5 ? 0.17 : center.length === 4 ? 0.2 : 0.26);
  const text = center ? `<text class="ring-text" x="${c}" y="${c}" text-anchor="middle" dominant-baseline="central" font-size="${fs}">${center}</text>` : '';
  return `<svg class="ring ${met ? 'met' : ''} ${low ? 'low' : ''}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
      ${label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"'} style="--len:${len.toFixed(1)}">
    <circle class="ring-track" cx="${c}" cy="${c}" r="${r}" stroke-width="${stroke}"/>
    <circle class="ring-arc" cx="${c}" cy="${c}" r="${r}" stroke-width="${stroke}" transform="rotate(-90 ${c} ${c})"
      stroke-dasharray="${len.toFixed(1)} ${len.toFixed(1)}" stroke-dashoffset="${(len * (1 - v / 100)).toFixed(1)}" ${v === 0 ? 'opacity="0"' : ''}/>
    ${tick}${core}${mark}${text}
  </svg>`;
}

function resultBadge(successes, attempts, target) {
  const p = pct(successes, attempts);
  return `<span class="score ${p >= target ? 'met' : ''}" role="img" aria-label="${successes} de ${attempts}, ${p}%, objetivo ${target}%">
    ${ring(p, { target })}<span class="score-pct num" aria-hidden="true">${p}%</span></span>`;
}

// Celebración a pantalla completa para los logros: objetivo cumplido, sesión y semana completadas.
function celebrate({ title, detail, value = 100, target = null, center = '' }) {
  const el = $('#celebrate');
  const rays = Array.from({ length: 12 }, (_, i) => `<span class="ray" style="--a:${i * 30}deg"></span>`).join('');
  el.innerHTML = `<div class="burst">${rays}${ring(value, { target, size: 168, stroke: 14, center })}</div>
    <h2>${esc(title)}</h2>
    <p>${esc(detail)}</p>
    <button class="btn" data-action="close-celebrate">Seguir</button>`;
  el.hidden = false;
  el.querySelector('.btn').focus();
  if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([30, 60, 30]);
  clearTimeout(celebrate.timer);
  celebrate.timer = setTimeout(closeCelebrate, 3600);
}
function closeCelebrate() {
  const el = $('#celebrate');
  if (el.hidden) return;
  clearTimeout(celebrate.timer);
  el.hidden = true;
  el.innerHTML = '';
}

function stepper(name, label, value, min = 0, max = null) {
  const lim = `data-min="${min}" ${max != null ? `data-max="${max}"` : ''}`;
  return `<div class="field"><span>${label}</span>
    <div class="stepper">
      <button type="button" data-action="step" data-name="${name}" data-delta="-1" ${lim} aria-label="Restar ${label.toLowerCase()}">−</button>
      <input type="number" inputmode="numeric" name="${name}" value="${value}" min="${min}" ${max != null ? `max="${max}"` : ''} required>
      <button type="button" data-action="step" data-name="${name}" data-delta="1" ${lim} aria-label="Sumar ${label.toLowerCase()}">+</button>
    </div></div>`;
}

// ── Plan semanal ──
const sessionById = (id) => getState().sessions.find((s) => s.id === id);
const isTicked = (it) => !!(it.sessionId && sessionById(it.sessionId));
// Los días anteriores al alta se muestran, pero no cuentan para el progreso de la semana.
const dayCounts = (plan, day) => !plan.start || addDays(plan.week, day.dow) >= plan.start;
const dayMinutes = (day) => day.items.reduce((a, it) => a + (drillById(it.drillId)?.minutes || 0), 0);
let justDone = null;

function weekSummary(plan) {
  const items = plan.days.filter((d) => dayCounts(plan, d)).flatMap((d) => d.items);
  const sessions = items.filter(isTicked).map((it) => sessionById(it.sessionId));
  const met = sessions.filter((s) => pct(s.successes, s.attempts) >= (drillById(s.drillId)?.target ?? 101)).length;
  return { week: plan.week, done: sessions.length, total: items.length, met };
}

function ensurePlan() {
  const st = getState();
  const wk = weekKey();
  if (!st.plan || st.plan.week !== wk) {
    update((s) => {
      if (s.plan?.week === addDays(wk, -7)) s.lastWeek = weekSummary(s.plan);
      s.plan = generatePlan(s.profile, s.rounds, s.sessions, hashStr(wk), wk);
    });
  }
  return getState().plan;
}

// Marca en el plan el ejercicio de un registro. Si no viene de un día concreto (p. ej. desde la ficha
// del ejercicio), usa el hueco pendiente de ese ejercicio en el día del registro, o el primero de la semana.
function linkToPlan(plan, session, day, idx) {
  if (!plan) return;
  const explicit = day !== '' && day != null ? plan.days[day]?.items[idx] : null;
  if (explicit?.drillId === session.drillId) { explicit.sessionId = session.id; return; }
  const offset = Math.round((new Date(session.date + 'T00:00:00') - new Date(plan.week + 'T00:00:00')) / 864e5);
  if (offset < 0 || offset > 6) return;
  const free = plan.days.flatMap((d) => d.items
    .filter((it) => it.drillId === session.drillId && !isTicked(it))
    .map((it) => ({ dow: d.dow, it })));
  const pick = free.find((x) => x.dow === offset) || free[0];
  if (pick) pick.it.sessionId = session.id;
}

// Al regenerar el plan de la misma semana, conserva el día de alta y las marcas de los ejercicios que siguen en él.
function carryTicks(oldPlan, plan) {
  if (!oldPlan || oldPlan.week !== plan.week) return plan;
  if (oldPlan.start) plan.start = oldPlan.start;
  const done = oldPlan.days.flatMap((d) => d.items.filter(isTicked).map((it) => ({ dow: d.dow, ...it })));
  const slots = plan.days.flatMap((d) => d.items.map((it) => ({ dow: d.dow, it })));
  for (const t of done) {
    const match = slots.find((s) => !s.it.sessionId && s.it.drillId === t.drillId && s.dow === t.dow)
      || slots.find((s) => !s.it.sessionId && s.it.drillId === t.drillId);
    if (match) match.it.sessionId = t.sessionId;
  }
  return plan;
}

function planItem(di, ii, it, primary) {
  const d = drillById(it.drillId);
  if (!d) return '';
  const s = isTicked(it) && sessionById(it.sessionId);
  const p = s ? pct(s.successes, s.attempts) : null;
  // Hecho: un solo anillo con el resultado frente al objetivo. Pendiente: círculo vacío y botón.
  return `<li><div class="item ${s ? 'done' : ''} ${s && s.id === justDone ? 'just' : ''} cat-${d.cat}">
    ${s ? `<span class="result">${ring(p, { target: d.target, size: 30 })}</span>` : '<span class="check" aria-hidden="true"></span>'}
    <button class="grow item" style="padding:0" data-nav="ejercicio/${d.id}">
      <span class="grow"><span class="name">${esc(d.name)}${s ? `<span class="sr-only"> (hecho: ${s.successes} de ${s.attempts}, objetivo ${d.target}%)</span>` : ''}</span>
      <span class="meta row">${catDot(d.cat)} ${CATEGORIES[d.cat].short} · ${d.minutes} min · ${d.attempts} intentos</span></span>
    </button>
    ${s ? `<span class="score-pct num ${p >= d.target ? 'met' : ''}" aria-hidden="true">${p}%</span>`
        : `<button class="btn btn-sm ${primary ? 'btn-primary' : ''}" data-action="log" data-drill="${d.id}" data-day="${di}" data-idx="${ii}" aria-label="Registrar ${esc(d.name)}">Registrar</button>`}
  </div></li>`;
}

function focusSentence(weights, reasons) {
  const ranked = Object.keys(weights).filter((c) => reasons[c].length).sort((a, b) => weights[b] - weights[a]).slice(0, 2);
  if (!ranked.length) return 'Plan equilibrado: todavía no hay datos que señalen un punto débil.';
  const part = (c) => `<strong>${CATEGORIES[c].name}</strong> <span class="muted">(${esc(reasons[c].join(' · ').toLowerCase())})</span>`;
  return `Esta semana, más ${ranked.map(part).join(' y ')}.`;
}

function renderPlan() {
  const st = getState();
  const plan = ensurePlan();
  const { weights, reasons } = computeFocus(st.profile, st.rounds, st.sessions);
  const today = todayDow();
  const { done, total } = weekSummary(plan);
  const dayLabel = (day) => `${DOW[day.dow].toLowerCase()} ${fmtDate(addDays(plan.week, day.dow))}`;
  const di = (day) => plan.days.indexOf(day);

  if (!plan.days.length) {
    return '<div class="card empty">No has elegido días de entrenamiento. Configúralos en tu perfil.</div>';
  }

  // Resumen de la semana pasada (una vez, hasta que se cierra).
  const lw = st.lastWeek;
  const lastWeekCard = lw && lw.total && lw.week === addDays(plan.week, -7) && !lw.dismissed
    ? `<section class="card summary">
        <div class="card-title"><h2>Tu semana pasada</h2>
          <button class="x-btn" data-action="dismiss-summary" aria-label="Cerrar resumen">${CLOSE_SVG}</button></div>
        <p><strong class="num">${lw.done} de ${lw.total}</strong> ejercicios hechos · <strong class="num">${lw.met}</strong> con el objetivo cumplido.</p>
        <p class="small muted">${lw.done === lw.total ? 'Semana completa. Así es como se baja hándicap.'
          : lw.done * 2 >= lw.total ? 'Buena constancia. Esta semana, a por todos.'
          : 'Semana nueva, plan nuevo: empieza por la próxima sesión.'}</p>
      </section>`
    : '';

  // Bloque principal: qué hacer ahora.
  const todayPlan = plan.days.find((d) => d.dow === today && dayCounts(plan, d));
  const nextDay = plan.days.find((d) => d.dow > today);
  let hero;
  if (total && done === total) {
    hero = `<section class="card hero win"><h2>Semana completada</h2>
      <p class="small">Has hecho los ${total} ejercicios del plan. El lunes tendrás uno nuevo, ajustado a tus resultados.</p>
      ${todayPlan ? `<ul class="list">${todayPlan.items.map((it, ii) => planItem(di(todayPlan), ii, it, true)).join('')}</ul>` : ''}</section>`;
  } else if (todayPlan) {
    const pending = todayPlan.items.filter((it) => !isTicked(it)).length;
    hero = `<section class="card hero ${pending ? '' : 'win'}">
      <h2>${pending ? 'Hoy toca entrenar' : 'Sesión de hoy completada'}</h2>
      <p class="small"><strong class="num">${plural(todayPlan.items.length, 'ejercicio', 'ejercicios')} · ${dayMinutes(todayPlan)} min.</strong>
        ${pending ? 'Toca uno para ver cómo se hace y registra el resultado al terminar.'
        : nextDay ? `Próxima sesión: ${dayLabel(nextDay)}.` : 'No quedan más sesiones esta semana.'}</p>
      <ul class="list">${todayPlan.items.map((it, ii) => planItem(di(todayPlan), ii, it, true)).join('')}</ul>
    </section>`;
  } else {
    hero = `<section class="card hero"><h2>Hoy descansas</h2>
      <p class="small">${nextDay
        ? `Próxima sesión: <strong>${dayLabel(nextDay)}</strong> · ${plural(nextDay.items.length, 'ejercicio', 'ejercicios')} · ${dayMinutes(nextDay)} min.`
        : 'No quedan sesiones esta semana. El lunes tendrás un plan nuevo.'}
        Mientras, puedes registrar una vuelta o añadir distancias.</p></section>`;
  }

  const maxW = Math.max(...Object.values(weights));
  const focusBars = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, w]) => `
      <div class="cat-${cat}" style="margin-top:10px">
        <div class="row between small"><span class="row">${catDot(cat)} ${CATEGORIES[cat].name}</span>
          <span class="muted">${esc(reasons[cat].join(' · '))}</span></div>
        <div class="bar" style="margin-top:4px"><span style="width:${(w / maxW) * 100}%"></span></div>
      </div>`)
    .join('');

  const weekCard = `<section class="card">
    <div class="week">
      ${ring(total ? (done / total) * 100 : 0, { size: 92, stroke: 10, center: `${done}/${total}`, label: `${done} de ${total} ejercicios hechos esta semana` })}
      <div class="grow">
        <h2>Semana del ${fmtDate(plan.week, { day: 'numeric', month: 'long' })}</h2>
        <p class="small focus-line">${focusSentence(weights, reasons)}</p>
      </div>
    </div>
    <details class="focus-more"><summary class="small">Por qué este plan</summary>
      <p class="small muted">Se calcula con tus puntos débiles, tus últimas 5 vueltas y tus resultados del último mes, y se recalcula cada lunes. Si acabas de registrar vueltas o resultados y quieres aplicarlos ya, genera otro plan.</p>
      ${focusBars}
      <button class="btn btn-block" data-action="regen-plan" style="margin-top:14px">Generar otro plan para esta semana</button>
    </details>
  </section>`;

  const upcoming = plan.days.filter((d) => d.dow > today).map((day) => `<section class="card">
      <div class="card-title"><h3>${DOW[day.dow]} <span class="muted small">${fmtDate(addDays(plan.week, day.dow))}</span></h3>
        <span class="muted small num">${dayMinutes(day)} min</span></div>
      <ul class="list">${day.items.map((it, ii) => planItem(di(day), ii, it, false)).join('')}</ul>
    </section>`).join('');

  const past = plan.days.filter((d) => d.dow < today || (d.dow === today && !dayCounts(plan, d)));
  let pastCard = '';
  if (past.length) {
    const counted = past.filter((d) => dayCounts(plan, d));
    const items = counted.flatMap((d) => d.items);
    const line = counted.length ? `${items.filter(isTicked).length}/${items.length} hechos` : 'antes de empezar el plan';
    pastCard = `<details class="card past"><summary><strong>Días anteriores</strong> <span class="muted small">· ${line}</span></summary>
      ${past.map((day) => `<div class="past-day">
        <h3>${DOW[day.dow]} <span class="muted small">${fmtDate(addDays(plan.week, day.dow))}${dayCounts(plan, day) ? '' : ' · antes de empezar, no cuenta'}</span></h3>
        <ul class="list">${day.items.map((it, ii) => planItem(di(day), ii, it, false)).join('')}</ul></div>`).join('')}
    </details>`;
  }

  return `<div class="stack">
    ${lastWeekCard}
    ${hero}
    ${weekCard}
    ${upcoming}
    ${pastCard}
  </div>`;
}

// ── Ejercicios ──
let drillFilter = 'todos';

function lastSession(drillId) {
  return getState().sessions.filter((s) => s.drillId === drillId).sort(byDateDesc)[0];
}

function renderDrills() {
  const advanced = Number(getState().profile.handicap) <= 10;
  const inPlan = new Set(ensurePlan().days.flatMap((d) => d.items.filter((it) => !isTicked(it)).map((it) => it.drillId)));
  const chips = [['todos', 'Todos'], ...Object.entries(CATEGORIES).map(([k, v]) => [k, v.short])]
    .map(([k, label]) => `<button class="chip ${drillFilter === k ? 'active' : ''}" data-action="filter" data-cat="${k}" aria-pressed="${drillFilter === k}">${label}</button>`)
    .join('');
  const list = DRILLS.filter((d) => drillFilter === 'todos' || d.cat === drillFilter)
    .map((d) => {
      const last = lastSession(d.id);
      return `<li><button class="item cat-${d.cat}" data-nav="ejercicio/${d.id}">
        ${catDot(d.cat)}
        <span class="grow"><span class="name">${esc(d.name)}</span>
          <span class="meta">${esc(d.summary)}</span>
          <span class="meta">${d.minutes} min · objetivo ${d.target}%${d.level === 'avanzado' ? ' · avanzado' : ''}${inPlan.has(d.id) ? ' · <strong class="in-plan">en tu plan</strong>' : ''}</span></span>
        ${last ? resultBadge(last.successes, last.attempts, d.target) : ''}
      </button></li>`;
    }).join('');
  return `<div class="stack">
    ${levelTestCard()}
    <div class="chips" role="group" aria-label="Filtrar por área">${chips}</div>
    ${!advanced ? '<p class="small muted">Los ejercicios marcados como avanzados no entran en tu plan automático (hándicap > 10), pero puedes hacerlos cuando quieras.</p>' : ''}
    <div class="card"><ul class="list">${list}</ul></div>
  </div>`;
}

// ── Prueba de nivel ──
// Siempre las mismas 30 bolas en 5 estaciones: una cifra de 0 a 100 comparable en el tiempo.
const testsByDate = () => [...getState().tests].sort(byDateDesc);

function levelTestCard() {
  const tests = testsByDate();
  const last = tests[0];
  const best = tests.length ? Math.max(...tests.map((t) => combineScore(t.stations))) : null;
  if (!last) {
    return `<section class="card">
      <h2>Prueba de nivel</h2>
      <p class="small muted">30 bolas en 5 estaciones (putt corto y largo, chip, wedge y salida). Unos 40 minutos. Repítela cada pocas semanas para ver si mejoras de verdad.</p>
      <button class="btn btn-primary btn-block" data-action="level-test" style="margin-top:10px">Hacer la prueba</button>
    </section>`;
  }
  const score = combineScore(last.stations);
  return `<section class="card">
    <div class="whs">
      ${ring(score, { size: 72, stroke: 8, center: String(score), label: `Última prueba de nivel: ${score} de 100` })}
      <div class="grow"><h2>Prueba de nivel</h2>
        <p class="small muted">Última: ${fmtDate(last.date)} · mejor marca ${best} de 100 · ${plural(tests.length, 'prueba', 'pruebas')}</p></div>
    </div>
    <button class="btn btn-block" data-action="level-test" style="margin-top:12px">Repetir la prueba</button>
  </section>`;
}

function levelProgress() {
  const tests = testsByDate();
  if (!tests.length) return '';
  const chrono = [...tests].reverse();
  const last = tests[0];
  const chart = chrono.length >= 2
    ? lineChart(chrono.map((t) => ({ t: t.date, label: fmtDate(t.date), y: combineScore(t.stations) })), { min: 0, max: 100, label: 'Evolución de la prueba de nivel' })
    : '<p class="small muted">Repite la prueba para ver tu evolución.</p>';
  const rows = COMBINE.map((s) => {
    const best = Math.max(...tests.map((t) => t.stations[s.id]));
    return `<tr><td class="cat-${s.cat}"><span class="row">${catDot(s.cat)} ${s.name}</span></td>
      <td class="right num">${last.stations[s.id]}/${COMBINE_BALLS}</td><td class="right num muted">${best}/${COMBINE_BALLS}</td></tr>`;
  }).join('');
  return `<div class="card"><h2>Prueba de nivel</h2>
    ${chart}
    <table class="tbl" style="margin-top:8px"><thead><tr><th>Estación</th><th class="right">Última</th><th class="right">Mejor</th></tr></thead><tbody>${rows}</tbody></table>
  </div>`;
}

function openLevelTestSheet() {
  openSheet(`<h2>Prueba de nivel</h2>
    <p class="small muted">6 bolas por estación. Anota cuántas cumplen el criterio. Hazla siempre igual para poder comparar.</p>
    <form class="stack" data-form="level">
      ${COMBINE.map((s) => `<div class="cat-${s.cat}">
        ${stepper(`st_${s.id}`, `${s.name}`, 0, 0, COMBINE_BALLS)}
        <p class="small muted hint">${catDot(s.cat)} ${esc(s.task)} <strong>Acierto:</strong> ${esc(s.success)}</p>
      </div>`).join('')}
      <label class="field">Fecha<input type="date" name="date" value="${todayISO()}" max="${todayISO()}" required></label>
      <button class="btn btn-primary btn-block">Guardar</button>
    </form>`);
}

function renderDrill(id) {
  const d = drillById(id);
  if (!d) return '<div class="card empty">Ejercicio no encontrado.</div>';
  const history = getState().sessions.filter((s) => s.drillId === id).sort(byDateDesc);
  const chrono = [...history].reverse();
  const chart = chrono.length >= 2
    ? lineChart(chrono.map((s) => ({ t: s.date, label: fmtDate(s.date), y: pct(s.successes, s.attempts) })),
        { target: d.target, min: 0, max: 100, suffix: '%', label: `Evolución de ${d.name}` })
    : '';
  const avg = mean(history.slice(0, 5).map((s) => pct(s.successes, s.attempts)));

  return `<div class="stack">
    <button class="btn btn-ghost btn-sm" data-nav="entrenar" style="padding-left:0"><svg class="back-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Ejercicios</button>
    <div class="card cat-${d.cat}">
      <div class="row small muted">${catDot(d.cat)} ${CATEGORIES[d.cat].name} · ${d.minutes} min · ${d.attempts} intentos${d.level === 'avanzado' ? ' · avanzado' : ''}</div>
      <h2 style="margin-top:6px">${esc(d.name)}</h2>
      <p class="muted">${esc(d.summary)}</p>
      <ol class="steps">${d.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <p><strong>Cuenta como acierto:</strong> ${esc(d.success)}</p>
      <p><strong>Objetivo:</strong> ${d.target}% de aciertos.</p>
      <div class="tip">${esc(d.tip)}</div>
    </div>
    ${history.length ? `<div class="card">
      <div class="history-head">
        ${ring(avg, { target: d.target, size: 72, stroke: 8, center: `${Math.round(avg)}%`, label: `Media de las últimas ${Math.min(5, history.length)} sesiones: ${Math.round(avg)}%, objetivo ${d.target}%` })}
        <div><h2>Historial</h2><p class="small muted">Media de las últimas ${plural(Math.min(5, history.length), 'sesión', 'sesiones')} · objetivo ${d.target}%</p></div>
      </div>
      ${chart}
      <ul class="list">${history.map((s) => `<li><div class="item">
        <span class="grow"><span class="name">${fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        ${s.notes ? `<span class="meta">${esc(s.notes)}</span>` : ''}</span>
        ${resultBadge(s.successes, s.attempts, d.target)}
        <button class="x-btn" data-action="del-session" data-id="${s.id}" aria-label="Borrar registro del ${fmtDate(s.date)}">${CLOSE_SVG}</button>
      </div></li>`).join('')}</ul>
    </div>` : ''}
    <div class="dock"><button class="btn btn-primary btn-block" data-action="log" data-drill="${d.id}">Registrar resultado</button></div>
  </div>`;
}

function openLogSheet(drillId, day, idx) {
  const d = drillById(drillId);
  // Si se registra un día pasado del plan, la fecha por defecto es ese día.
  const plan = getState().plan;
  const planDay = day != null && day !== '' ? plan?.days[day] : null;
  const planDate = planDay ? addDays(plan.week, planDay.dow) : null;
  const date = planDate && planDate < todayISO() ? planDate : todayISO();
  openSheet(`<h2>${esc(d.name)}</h2>
    <p class="small muted">Acierto: ${esc(d.success)} · Objetivo ${d.target}%</p>
    <form class="stack" data-form="session" data-drill="${d.id}" data-day="${day ?? ''}" data-idx="${idx ?? ''}">
      <div class="grid2">${stepper('successes', 'Aciertos', 0)}${stepper('attempts', 'Intentos', d.attempts, 1)}</div>
      <p class="small muted hint">Mantén pulsado + o − para avanzar rápido.</p>
      <label class="field">Fecha<input type="date" name="date" value="${date}" max="${todayISO()}" required></label>
      <label class="field">Notas (opcional)<textarea name="notes" rows="2" placeholder="Sensaciones, viento, qué falló…"></textarea></label>
      <button class="btn btn-primary btn-block">Guardar</button>
    </form>`);
}

// ── Vueltas ──
function renderRounds() {
  const rounds = [...getState().rounds].sort(byDateDesc);
  const recent = rounds.slice(0, 5).map(roundStats);
  const avg = (k) => mean(recent.map((r) => r[k]));
  const stat = (v, label, fmt = (x) => Math.round(x)) =>
    `<div class="stat"><div class="v">${v == null ? '–' : fmt(v)}</div><div class="l">${label}</div></div>`;

  const sgOf = (r) => (r.holesData ? puttingGained(r.holesData) : null);
  const list = rounds.map((r) => {
    const s = roundStats(r);
    const sg = sgOf(r);
    const bits = [
      r.holesData && 'hoyo a hoyo',
      s.fwPct != null && `Calles ${Math.round(s.fwPct)}%`,
      s.girPct != null && `GIR ${Math.round(s.girPct)}%`,
      r.putts != null && `${r.putts} putts`,
      s.udPct != null && `U&D ${Math.round(s.udPct)}%`,
      sg && `Putt ${fmtSigned(sg.value).replace('.', ',')} vs. ref. en ${plural(sg.holes, 'hoyo', 'hoyos')}`,
    ].filter(Boolean).join(' · ');
    return `<li><button class="item" data-action="edit-round" data-id="${r.id}">
      <span class="grow"><span class="name">${esc(r.course || 'Vuelta')} <span class="muted small">${r.holes} hoyos</span></span>
        <span class="meta">${fmtDate(r.date, { day: 'numeric', month: 'short', year: 'numeric' })}${bits ? ' · ' + bits : ''}</span></span>
      ${r.score != null ? `<span class="badge num">${r.score}${r.par != null ? ` (${fmtSigned(r.score - r.par)})` : ''}</span>` : ''}
    </button></li>`;
  }).join('');

  // Putt frente a la referencia: media por vuelta, escalada a 18 hoyos, de las vueltas recientes con distancia en 9 hoyos o más.
  const sgRecent = rounds.slice(0, 5).map(sgOf).filter((g) => g && g.holes >= 9); // con menos hoyos la cifra no es fiable
  const sgLine = sgRecent.length
    ? `<p class="small">Putt frente a la referencia profesional: <strong class="num">${fmtSigned(Math.round(mean(sgRecent.map((g) => (g.value / g.holes) * 18)) * 10) / 10).replace('.', ',')}</strong>
        golpes por vuelta <span class="muted">(${plural(sgRecent.length, 'vuelta', 'vueltas')} con la distancia del primer putt en 9 hoyos o más; lo normal en amateurs es perder golpes)</span></p>`
    : '';

  return `<div class="stack">
    ${rounds.length ? handicapCard() : ''}
    ${rounds.length ? `<div class="card">
      <div class="card-title"><h2>${recent.length === 1 ? 'Tu última vuelta' : `Media de las últimas ${recent.length} vueltas`}</h2><span class="muted small">normalizado a 18 hoyos</span></div>
      <div class="grid3">
        ${stat(avg('overPar18'), 'Golpes sobre par', fmtSigned)}
        ${stat(avg('putts18'), 'Putts', (x) => x.toFixed(1))}
        ${stat(avg('girPct'), 'Greens en reg. %')}
        ${stat(avg('fwPct'), 'Calles %')}
        ${stat(avg('udPct'), 'Up & down %')}
        ${stat(mean(rounds.slice(0, 5).map((r) => (r.penalties == null ? null : r.penalties * (18 / r.holes)))), 'Penalidades', (x) => x.toFixed(1))}
      </div>${sgLine}</div>
      <div class="card"><ul class="list">${list}</ul></div>`
    : `<div class="card empty">Aún no has registrado vueltas.<br>Con unas pocas, el plan de cada semana se adapta a donde pierdes golpes.</div>`}
    <div class="dock"><button class="btn btn-primary btn-block" data-action="new-round">Registrar vuelta</button></div>
  </div>`;
}

// Índice de hándicap calculado con las vueltas (WHS simplificado) y opción de llevarlo al perfil.
function handicapCard() {
  const st = getState();
  const { index, eligible, used } = handicapIndex(st.rounds);
  if (index == null) {
    return `<div class="card hint-card"><h2>Tu hándicap, calculado</h2>
      <p class="small">Añade la valoración y el slope del campo (en "Para el hándicap") a tus vueltas de 18 hoyos y la app calculará tu índice con el sistema WHS. Llevas ${eligible} de 3.</p></div>`;
  }
  const current = st.profile.handicap;
  return `<section class="card">
    <div class="whs">
      ${ring(null, { size: 72, stroke: 8, center: fmtHcp(index), label: `Hándicap calculado: ${fmtHcp(index)}` })}
      <div class="grow"><h2>Tu hándicap, calculado</h2>
        <p class="small muted">Media de tus ${plural(used, 'mejor diferencial', 'mejores diferenciales')} de las últimas ${plural(eligible, 'vuelta', 'vueltas')} de 18 hoyos (WHS, sin el ajuste de doble bogey neto). En tu perfil: ${fmtHcp(current)}.</p></div>
    </div>
    ${index !== current ? `<button class="btn btn-block" data-action="use-hcp" data-v="${index}" style="margin-top:12px">Usar ${fmtHcp(index)} en mi perfil</button>` : ''}
  </section>`;
}

// ── Vuelta hoyo a hoyo ──
// Borrador de la hoja abierta: los hoyos y cuál se está editando. Un hoyo sin golpes aún no se ha jugado.
let holeDraft = null;

const courseByName = (name) => {
  const key = name.trim().toLowerCase();
  return key ? getState().courses.find((c) => c.name.toLowerCase() === key) : null;
};
const blankHoles = (n, pars) => Array.from({ length: n }, (_, i) =>
  ({ par: pars?.length === n ? pars[i] : 4, score: null, putts: null, fw: null, pen: 0, putt1: null }));

function holePanel() {
  const { holes, i } = holeDraft;
  const h = holes[i];
  const played = holes.filter((x) => x.score != null);
  const t = totalsFromHoles(played);
  const radio = (name, value, label, checked) =>
    `<label class="chip-check"><input type="radio" name="${name}" value="${value}" ${checked ? 'checked' : ''} data-change="hole-par"><span>${label}</span></label>`;
  return `<div class="hole-nav" role="group" aria-label="Ir al hoyo">
      ${holes.map((x, k) => `<button type="button" class="${k === i ? 'cur' : ''} ${x.score != null ? 'filled' : ''}" data-action="hole-go" data-i="${k}"
        aria-label="Hoyo ${k + 1}${x.score != null ? `, ${x.score} golpes` : ''}" ${k === i ? 'aria-current="step"' : ''}>${k + 1}</button>`).join('')}
    </div>
    <div class="hole-card">
      <div class="card-title"><h3>Hoyo ${i + 1} <span class="muted small">de ${holes.length}</span></h3>
        <span class="small num">${played.length ? `${t.score} (${fmtSigned(t.score - t.par)}) en ${played.length}` : 'Sin hoyos jugados'}</span></div>
      <fieldset><legend>Par</legend><div class="chips">${[3, 4, 5].map((p) => radio('h_par', p, `Par ${p}`, h.par === p)).join('')}</div></fieldset>
      <div class="grid2">${stepper('h_score', 'Golpes', h.score ?? h.par, 1, 20)}${stepper('h_putts', 'Putts', h.putts ?? 2, 0, 10)}</div>
      ${h.par >= 4 ? `<fieldset><legend>¿Cogiste la calle?</legend><div class="chips">
        ${[['si', 'Sí'], ['no', 'No']].map(([v, l]) => `<label class="chip-check"><input type="radio" name="h_fw" value="${v}" ${h.fw === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
      </div></fieldset>` : ''}
      <div class="grid2">${stepper('h_pen', 'Penalidad', h.pen, 0, 10)}
        <label class="field">Primer putt (m)<input name="h_putt1" inputmode="decimal" value="${h.putt1 != null ? String(h.putt1).replace('.', ',') : ''}" placeholder="Opcional" autocomplete="off"></label></div>
      <div class="hole-actions">
        <button type="button" class="btn" data-action="hole-go" data-i="${i - 1}" ${i === 0 ? 'disabled' : ''}>Anterior</button>
        ${i < holes.length - 1
          ? `<button type="button" class="btn btn-primary" data-action="hole-go" data-i="${i + 1}">Hoyo ${i + 2}</button>`
          : '<button class="btn btn-primary">Guardar vuelta</button>'}
      </div>
    </div>`;
}

// Pasa al borrador lo que hay en los campos del hoyo actual.
function syncHole(f) {
  if (!holeDraft || !f.h_score) return;
  const h = holeDraft.holes[holeDraft.i];
  h.par = Number(f.querySelector('[name="h_par"]:checked')?.value) || h.par;
  h.score = num(f.h_score.value);
  h.putts = num(f.h_putts.value);
  h.pen = num(f.h_pen.value) ?? 0;
  h.fw = h.par >= 4 ? f.querySelector('[name="h_fw"]:checked')?.value ?? null : null;
  const p1 = Number(f.h_putt1.value.trim().replace(',', '.'));
  h.putt1 = f.h_putt1.value.trim() && p1 > 0 && p1 <= 60 ? p1 : null;
}

function renderHolePanel(f) {
  const panel = f.querySelector('.hole-panel');
  panel.innerHTML = holeDraft && f.dataset.mode === 'hoyos' ? holePanel() : '';
}

function openRoundSheet(id) {
  const st = getState();
  const r = id ? st.rounds.find((x) => x.id === id) : null;
  const mode = r ? (r.holesData ? 'hoyos' : 'totales') : 'totales';
  const n = r?.holes ?? 18;
  holeDraft = { holes: r?.holesData ? structuredClone(r.holesData) : blankHoles(n, courseByName(r?.course ?? '')?.pars), i: 0 };
  const v = (k, def = '') => esc(r?.[k] ?? def);
  const field = (name, label, def = '') =>
    `<label class="field">${label}<input type="number" inputmode="numeric" name="${name}" value="${v(name, def)}" min="0"></label>`;
  const hasStats = r && ['fairways', 'gir', 'putts', 'udAtt', 'udMade'].some((k) => r[k] != null) || (r?.penalties ?? 0) > 0;
  const seg = (value, label) =>
    `<label class="chip-check"><input type="radio" name="mode" value="${value}" ${mode === value ? 'checked' : ''} data-change="round-mode"><span>${label}</span></label>`;
  openSheet(`<h2>${r ? 'Editar vuelta' : 'Nueva vuelta'}</h2>
    <form class="stack" data-form="round" data-id="${r?.id ?? ''}" data-mode="${mode}">
      <fieldset><legend>Cómo apuntarla</legend><div class="chips">${seg('totales', 'Totales')}${seg('hoyos', 'Hoyo a hoyo')}</div></fieldset>
      <div class="grid2">
        <label class="field">Fecha<input type="date" name="date" value="${v('date', todayISO())}" max="${todayISO()}" required></label>
        <label class="field">Hoyos<select name="holes" data-change="holes">
          <option value="18" ${n === 18 ? 'selected' : ''}>18</option>
          <option value="9" ${n === 9 ? 'selected' : ''}>9</option></select></label>
      </div>
      <label class="field">Campo<input name="course" value="${v('course')}" placeholder="Nombre del campo" autocomplete="off" list="courses-list" data-change="round-course"></label>
      <datalist id="courses-list">${st.courses.map((c) => `<option value="${esc(c.name)}">`).join('')}</datalist>
      <div class="mode-totales stack">
        <div class="grid2">${field('score', 'Golpes')}${field('par', 'Par del campo', 72)}</div>
        <details class="group" ${hasStats ? 'open' : ''}>
          <summary><strong>Estadísticas</strong> <span class="muted small">· opcional, afinan tu plan</span></summary>
          <div class="stack group-body">
            <div class="grid2">${field('fairways', 'Calles cogidas')}${field('fwPossible', 'Calles posibles', 14)}</div>
            <div class="grid2">${field('gir', 'Greens en regulación (GIR)')}${field('putts', 'Putts')}</div>
            <p class="small muted">Up & down: veces que fallaste el green y aun así hiciste par o mejor.</p>
            <div class="grid2">${field('udAtt', 'Up & down: intentos')}${field('udMade', 'Up & down: conseguidos')}</div>
            ${field('penalties', 'Golpes de penalidad', 0)}
          </div>
        </details>
      </div>
      <div class="mode-hoyos">
        <p class="small muted">Golpes y putts de cada hoyo; los greens en regulación y los up & down se calculan solos. La distancia del primer putt, si la apuntas, compara tu putt con una referencia profesional.</p>
        <div class="hole-panel"></div>
      </div>
      <details class="group" ${r?.rating != null ? 'open' : ''}>
        <summary><strong>Para el hándicap</strong> <span class="muted small">· vueltas de 18 hoyos</span></summary>
        <div class="stack group-body">
          <p class="small muted">Valoración y slope de las barras desde las que jugaste; vienen en la tarjeta del campo.</p>
          <div class="grid2">
            <label class="field">Valoración<input name="rating" inputmode="decimal" value="${r?.rating != null ? String(r.rating).replace('.', ',') : ''}" placeholder="Ej.: 71,2" autocomplete="off"></label>
            <label class="field">Slope<input type="number" inputmode="numeric" name="slope" value="${v('slope')}" placeholder="Ej.: 128" min="55" max="155"></label>
          </div>
        </div>
      </details>
      <label class="field">Notas<textarea name="notes" rows="2">${v('notes')}</textarea></label>
      <button class="btn btn-primary btn-block">Guardar</button>
      ${r ? `<button type="button" class="btn btn-danger btn-block" data-action="del-round" data-id="${r.id}">Borrar vuelta</button>` : ''}
    </form>`);
  renderHolePanel(sheet.querySelector('form'));
}

// ── Distancias ──
function clubStats(club) {
  const shots = getState().shots.filter((s) => s.club === club).sort(byDateDesc).slice(0, 30);
  const vals = shots.map((s) => s.carry);
  if (!vals.length) return null;
  return { n: vals.length, avg: mean(vals), sd: stdev(vals), min: Math.min(...vals), max: Math.max(...vals) };
}

function renderDistances() {
  const st = getState();
  const clubs = CLUBS.filter((c) => st.profile.clubs.includes(c.id) || st.shots.some((s) => s.club === c.id));
  const stats = clubs.map((c) => ({ c, s: clubStats(c.id) }));
  const scaleMax = Math.max(50, ...stats.filter((x) => x.s).map((x) => x.s.max)) * 1.05;
  const rows = stats.map(({ c, s }) => `<tr data-action="club-detail" data-club="${c.id}" style="cursor:pointer">
      <td><button class="cell-btn" data-action="club-detail" data-club="${c.id}" aria-label="Ver golpes de ${c.name}"><strong>${c.id}</strong> <span class="muted small">${c.name}</span></button></td>
      <td class="right">${s ? `<strong>${Math.round(s.avg)}</strong>` : '<span class="muted">–</span>'}</td>
      <td class="right muted">${s?.sd != null ? '±' + Math.round(s.sd) : ''}</td>
      <td style="width:35%">${s ? `<div class="range-track" title="${s.min}–${s.max} m">
        <span class="r" style="left:${(s.min / scaleMax) * 100}%;width:${Math.max(((s.max - s.min) / scaleMax) * 100, 1)}%"></span>
        <span class="a" style="left:${(s.avg / scaleMax) * 100}%"></span></div>` : ''}</td>
    </tr>`).join('');
  const empty = !st.shots.length
    ? `<div class="card hint-card"><h2>Cómo medir tus distancias</h2>
        <p class="small">En el campo de prácticas con medidor (o en el campo con un telémetro), pega 5–10 bolas con cada palo y apunta dónde <strong>bota</strong> cada una: eso es el vuelo (carry). Descarta los fallos claros. Con 5 golpes por palo ya verás tu media y tu dispersión.</p></div>`
    : '';
  return `<div class="stack">
    ${empty}
    <div class="card">
      <table class="tbl"><thead><tr><th>Palo</th><th class="right">Media (m)</th><th class="right">Disp.</th><th>Rango</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="small muted" style="margin-top:10px">Distancia de vuelo (carry) en metros. Se usan los últimos 30 golpes de cada palo. "Disp." es la dispersión típica: cuanto menor, más regular. Toca un palo para ver o borrar sus golpes.</p>
    </div>
    <div class="dock"><button class="btn btn-primary btn-block" data-action="add-shots">Añadir distancias</button></div>
  </div>`;
}

const MIN_CARRY = 10, MAX_CARRY = 400;

// "142 148,5; 139" → [142, 148.5, 139]. La coma con 1-2 cifras detrás es decimal; si no, separa golpes.
function parseCarries(text) {
  const tokens = text.trim().split(/[\s;]+/)
    .flatMap((t) => (/^\d+,\d{1,2}$/.test(t) ? [t.replace(',', '.')] : t.split(',')))
    .filter(Boolean);
  const values = tokens.map(Number);
  const bad = tokens.filter((_, i) => !(values[i] >= MIN_CARRY && values[i] <= MAX_CARRY));
  return { values, bad };
}

function openShotsSheet(club) {
  const clubs = CLUBS.filter((c) => getState().profile.clubs.includes(c.id));
  openSheet(`<h2>Añadir distancias</h2>
    <form class="stack" data-form="shots">
      <div class="grid2">
        <label class="field">Palo<select name="club">${clubs.map((c) => `<option value="${c.id}" ${c.id === club ? 'selected' : ''}>${c.id} · ${c.name}</option>`).join('')}</select></label>
        <label class="field">Fecha<input type="date" name="date" value="${todayISO()}" max="${todayISO()}" required></label>
      </div>
      <label class="field">Distancias en metros<input name="values" inputmode="decimal" placeholder="Ej.: 142 148 145 139" required autocomplete="off"></label>
      <p class="small muted">Puedes meter varios golpes a la vez separados por espacios. Los decimales con coma también valen (142,5). Usa solo golpes normales, no los fallos claros.</p>
      <button class="btn btn-primary btn-block">Guardar</button>
    </form>`);
}

function openClubDetail(club) {
  const c = clubById(club);
  const shots = getState().shots.filter((s) => s.club === club).sort(byDateDesc);
  openSheet(`<div class="card-title"><h2>${c.id} · ${c.name}</h2>
      <button class="btn btn-sm btn-primary" data-action="add-shots" data-club="${club}">Añadir</button></div>
    ${shots.length ? `<ul class="list">${shots.map((s) => `<li><div class="item">
      <span class="grow">${fmtDate(s.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      <strong class="num">${s.carry} m</strong>
      <button class="x-btn" data-action="del-shot" data-id="${s.id}" data-club="${club}" aria-label="Borrar golpe de ${s.carry} m">${CLOSE_SVG}</button>
    </div></li>`).join('')}</ul>` : '<p class="empty">Sin golpes registrados.</p>'}`);
}

// ── Progreso ──
let progressDrill = null;

function renderProgress() {
  const st = getState();
  const sessions = st.sessions;
  const withData = DRILLS.filter((d) => sessions.some((s) => s.drillId === d.id));
  if (!withData.some((d) => d.id === progressDrill)) progressDrill = withData[0]?.id ?? null;

  // Volumen
  const last28 = sessions.filter((s) => s.date >= daysAgo(27));
  const balls = last28.reduce((a, s) => a + s.attempts, 0);
  const activeDays = new Set(last28.map((s) => s.date)).size;

  // Por categoría: últimos 30 días frente a los 30 anteriores
  const catRows = Object.entries(CATEGORIES).map(([cat, info]) => {
    const rate = (from, to) => {
      const ss = sessions.filter((s) => s.date >= from && s.date < to && drillById(s.drillId)?.cat === cat);
      const r = mean(ss.map((s) => (s.successes / s.attempts) * 100 / drillById(s.drillId).target));
      return r == null ? null : Math.round(r * 100);
    };
    const now = rate(daysAgo(29), addDays(todayISO(), 1));
    const prev = rate(daysAgo(59), daysAgo(29));
    const diff = now != null && prev != null ? now - prev : null;
    return `<div class="area cat-${cat}">
      ${ring(now, { size: 64, stroke: 7, center: now == null ? '–' : `${now}%`,
        label: now == null ? `${info.name}: sin datos` : `${info.name}: ${now}% del objetivo${diff == null ? '' : `, ${fmtSigned(diff)} puntos`}` })}
      <span class="name row">${catDot(cat)} ${info.short}</span>
      ${diff == null ? '' : `<span class="badge ${diff >= 0 ? 'ok' : 'warn'}">${fmtSigned(diff)} pp</span>`}
    </div>`;
  }).join('');

  // Ejercicio concreto
  let drillBlock = '<p class="empty">Registra resultados en los ejercicios para ver tu evolución.</p>';
  if (progressDrill) {
    const d = drillById(progressDrill);
    const hist = sessions.filter((s) => s.drillId === d.id).sort(byDateAsc);
    drillBlock = `<label class="field">Ejercicio<select data-change="progress-drill">
        ${withData.map((x) => `<option value="${x.id}" ${x.id === d.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      ${hist.length >= 2
        ? lineChart(hist.map((s) => ({ t: s.date, label: fmtDate(s.date), y: pct(s.successes, s.attempts) })), { target: d.target, min: 0, max: 100, suffix: '%', label: `Evolución de ${d.name}` })
        : '<p class="small muted">Necesitas al menos dos registros de este ejercicio para ver la gráfica.</p>'}`;
  }

  // Vueltas
  const rounds = [...st.rounds].sort(byDateAsc);
  const roundChart = (key, title, opts) => {
    const pts = rounds.map((r) => ({ t: r.date, label: fmtDate(r.date), y: roundStats(r)[key] })).filter((p) => p.y != null);
    return pts.length >= 2 ? `<div><h3 class="small" style="margin:12px 0 4px">${title}</h3>${lineChart(pts, { label: title, ...opts })}</div>` : '';
  };
  const roundCharts = [
    roundChart('overPar18', 'Golpes sobre par (18 hoyos)'),
    roundChart('putts18', 'Putts por vuelta'),
    roundChart('girPct', 'Greens en regulación', { min: 0, max: 100, suffix: '%' }),
    roundChart('fwPct', 'Calles cogidas', { min: 0, max: 100, suffix: '%' }),
    roundChart('udPct', 'Up & down', { min: 0, max: 100, suffix: '%' }),
  ].join('');

  return `<div class="stack">
    <p class="volume"><span class="muted">En 28 días:</span>
      <strong class="num">${last28.length}</strong> ejercicios · <strong class="num">${balls}</strong> bolas ·
      <strong class="num">${activeDays}</strong> ${activeDays === 1 ? 'día' : 'días'} entrenando</p>
    <div class="card"><h2>Evolución por ejercicio</h2><div style="margin-top:10px">${drillBlock}</div></div>
    <div class="card">
      <h2>Rendimiento por área</h2>
      <p class="small muted">Cuánto del objetivo alcanzas en los últimos 30 días (100% = justo en el objetivo) y el cambio frente a los 30 días anteriores, en puntos porcentuales (pp).</p>
      <div class="area-rings">${catRows}</div>
    </div>
    ${levelProgress()}
    <div class="card"><h2>Vueltas</h2>
      ${roundCharts || '<p class="small muted">Registra al menos dos vueltas para ver tendencias.</p>'}</div>
  </div>`;
}

// ── Perfil ──
const OB_STEPS = 3;

function renderProfile() {
  const st = getState();
  const p = st.profile || { name: '', handicap: '', days: [0, 2, 4], minutes: 45, weaknesses: [], clubs: DEFAULT_CLUBS };
  const first = !st.profile;
  const check = (name, value, label, checked, aria = '') =>
    `<label class="chip-check"><input type="checkbox" name="${name}" value="${value}" ${checked ? 'checked' : ''} ${aria ? `aria-label="${aria}"` : ''}><span>${label}</span></label>`;

  const game = `<div class="grid2">
      <label class="field">Nombre<input name="name" value="${esc(p.name)}" autocomplete="given-name"></label>
      <label class="field">Hándicap<input name="handicap" value="${esc(fmtHcp(p.handicap))}" inputmode="decimal" required
        pattern="(\\+|-)?\\d{1,2}([.,]\\d)?" placeholder="Ej.: 14,2" aria-describedby="hcp-hint"></label>
    </div>
    <p class="small muted" id="hcp-hint">Si eres hándicap plus, escríbelo con signo: +1,5.</p>`;
  const time = `<fieldset><legend>Días de entrenamiento</legend>
      <div class="chips">${DOW_SHORT.map((l, i) => check('days', i, l, p.days.includes(i), DOW[i])).join('')}</div></fieldset>
    <label class="field">Tiempo por sesión<select name="minutes">
      ${[30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${Number(p.minutes) === m ? 'selected' : ''}>${m} minutos</option>`).join('')}</select></label>`;
  const weak = `<fieldset><legend>Puntos débiles</legend>
      <div class="chips">${Object.entries(CATEGORIES).map(([k, v]) => check('weaknesses', k, v.short, p.weaknesses.includes(k))).join('')}</div></fieldset>`;
  const clubs = `<fieldset><legend>Palos en tu bolsa</legend>
      <div class="chips">${CLUBS.map((c) => check('clubs', c.id, c.id, p.clubs.includes(c.id), c.name)).join('')}</div></fieldset>`;

  if (first) {
    return `<div class="stack">
      <div class="card highlight"><h2>Te damos la bienvenida</h2>
        <p class="small">Tres preguntas rápidas y tendrás tu plan semanal. Podrás cambiarlo todo cuando quieras.</p></div>
      <form class="card stack onboarding-form" data-form="profile" data-step="1" novalidate>
        <p class="small muted step-count" aria-live="polite">Paso 1 de ${OB_STEPS}</p>
        <div class="ob-step stack" data-step="1"><h2 tabindex="-1">Tu juego</h2>${game}</div>
        <div class="ob-step stack" data-step="2" hidden><h2 tabindex="-1">Tu tiempo</h2>${time}</div>
        <div class="ob-step stack" data-step="3" hidden><h2 tabindex="-1">Qué quieres mejorar</h2>${weak}
          <p class="small muted">Si no lo tienes claro, déjalo en blanco: el plan aprenderá de tus vueltas y ejercicios.</p>
          <details class="group"><summary><strong>Palos en tu bolsa</strong> <span class="muted small">· ${p.clubs.length} marcados</span></summary>
            <div class="group-body">${clubs}</div></details>
        </div>
        <div class="ob-nav">
          <button type="button" class="btn" data-action="ob-back" hidden>Atrás</button>
          <button type="button" class="btn btn-primary" data-action="ob-next">Siguiente</button>
          <button class="btn btn-primary" data-ob-submit hidden>Crear mi plan</button>
        </div>
      </form>
    </div>`;
  }

  return `<div class="stack">
    <form class="card stack" data-form="profile">
      ${game}${time}${weak}${clubs}
      <button class="btn btn-primary btn-block">Guardar cambios</button>
    </form>
    <div class="card stack">
      <h2>Copia de seguridad</h2>
      <p class="small muted">Tus datos se guardan solo en este dispositivo. Exporta una copia de vez en cuando o para pasarlos a otro móvil.</p>
      <div class="grid2">
        <button class="btn" data-action="export">Exportar</button>
        <button class="btn" data-action="import-pick">Importar</button>
        <input type="file" id="import-file" accept="application/json,.json" data-change="import" hidden>
      </div>
      <button class="btn btn-danger btn-block" data-action="reset">Borrar todos los datos</button>
    </div>
  </div>`;
}

function setObStep(f, n) {
  f.dataset.step = n;
  f.querySelectorAll('.ob-step').forEach((s) => { s.hidden = Number(s.dataset.step) !== n; });
  f.querySelector('[data-action="ob-back"]').hidden = n === 1;
  f.querySelector('[data-action="ob-next"]').hidden = n === OB_STEPS;
  f.querySelector('[data-ob-submit]').hidden = n !== OB_STEPS;
  f.querySelector('.step-count').textContent = `Paso ${n} de ${OB_STEPS}`;
  f.querySelector(`.ob-step[data-step="${n}"] h2`).focus();
}

// ── Router ──
const TITLES = { plan: 'Plan semanal', entrenar: 'Ejercicios', ejercicio: 'Ejercicio', vueltas: 'Vueltas', distancias: 'Distancias', progreso: 'Progreso', perfil: 'Perfil' };
const routes = { plan: renderPlan, entrenar: renderDrills, ejercicio: renderDrill, vueltas: renderRounds, distancias: renderDistances, progreso: renderProgress, perfil: renderProfile };

function currentRoute() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const r = !getState().profile ? 'perfil' : routes[name] ? name : 'plan';
  return { r, arg };
}

function render({ keepScroll = false } = {}) {
  const { r, arg } = currentRoute();
  const y = window.scrollY;
  $('#title').textContent = !getState().profile ? 'Golf Plan' : TITLES[r];
  document.body.classList.toggle('onboarding', !getState().profile);
  const tab = r === 'ejercicio' ? 'entrenar' : r;
  document.querySelectorAll('.tabbar [data-nav]').forEach((b) => {
    const on = b.dataset.nav === tab;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  view.innerHTML = routes[r](arg);
  window.scrollTo(0, keepScroll ? y : 0);
}

const go = (path) => {
  if (location.hash === '#/' + path) render();
  else location.hash = '#/' + path;
};

// ── Acciones ──
let stepHeld = false;

const actions = {
  'close-sheet': requestCloseSheet,
  'close-celebrate': closeCelebrate,
  step(el, fromHold = false) {
    if (!fromHold && stepHeld) { stepHeld = false; return; } // el clic que sigue a mantener pulsado
    const f = el.closest('form');
    const input = f.elements[el.dataset.name];
    let v = Math.max(Number(el.dataset.min), (Number(input.value) || 0) + Number(el.dataset.delta));
    if (el.dataset.name === 'successes' && f.elements.attempts) v = Math.min(v, Number(f.elements.attempts.value) || v);
    if (el.dataset.max) v = Math.min(v, Number(el.dataset.max));
    input.value = v;
    sheet.dataset.dirty = '1';
  },
  log(el) { openLogSheet(el.dataset.drill, el.dataset.day, el.dataset.idx); },
  'level-test'() { openLevelTestSheet(); },
  async 'use-hcp'(el) {
    const v = Number(el.dataset.v);
    if (!(await ask(`¿Usar ${fmtHcp(v)} como hándicap en tu perfil?`, { ok: 'Usar', detail: 'El plan de esta semana se recalcula; las marcas de los ejercicios que sigan en él se conservan.' }))) return;
    update((s) => {
      s.profile.handicap = v;
      s.plan = carryTicks(s.plan, generatePlan(s.profile, s.rounds, s.sessions, hashStr(weekKey() + Date.now())));
    });
    render({ keepScroll: true });
    toast('Hándicap actualizado y plan recalculado');
  },
  'hole-go'(el) {
    const f = el.closest('form');
    syncHole(f);
    holeDraft.i = Math.max(0, Math.min(holeDraft.holes.length - 1, Number(el.dataset.i)));
    renderHolePanel(f);
    f.querySelector('.hole-card h3')?.scrollIntoView({ block: 'nearest' });
  },
  filter(el) { drillFilter = el.dataset.cat; render({ keepScroll: true }); },
  async 'regen-plan'() {
    if (!(await ask('¿Generar un plan distinto para esta semana?', { ok: 'Generar', detail: 'Tus registros se conservan, y también las marcas de los ejercicios que sigan en el plan.' }))) return;
    update((s) => { s.plan = carryTicks(s.plan, generatePlan(s.profile, s.rounds, s.sessions, (Math.random() * 2 ** 32) >>> 0)); });
    render();
    toast('Plan nuevo generado');
  },
  'dismiss-summary'() {
    update((s) => { if (s.lastWeek) s.lastWeek.dismissed = true; });
    render({ keepScroll: true });
  },
  async 'del-session'(el) {
    if (!(await ask('¿Borrar este registro?', { ok: 'Borrar', danger: true }))) return;
    update((s) => { s.sessions = s.sessions.filter((x) => x.id !== el.dataset.id); });
    render({ keepScroll: true });
  },
  'new-round'() { openRoundSheet(); },
  'edit-round'(el) { openRoundSheet(el.dataset.id); },
  async 'del-round'(el) {
    if (!(await ask('¿Borrar esta vuelta?', { ok: 'Borrar', danger: true }))) return;
    update((s) => { s.rounds = s.rounds.filter((x) => x.id !== el.dataset.id); });
    closeSheet();
    render({ keepScroll: true });
  },
  'add-shots'(el) { openShotsSheet(el.dataset.club); },
  'club-detail'(el) { openClubDetail(el.dataset.club); },
  async 'del-shot'(el) {
    if (!(await ask('¿Borrar este golpe?', { ok: 'Borrar', danger: true }))) return;
    update((s) => { s.shots = s.shots.filter((x) => x.id !== el.dataset.id); });
    openClubDetail(el.dataset.club);
    render({ keepScroll: true });
  },
  'ob-next'(el) {
    const f = el.closest('form');
    const n = Number(f.dataset.step);
    const step = f.querySelector(`.ob-step[data-step="${n}"]`);
    for (const input of step.querySelectorAll('input')) if (!input.reportValidity()) return;
    if (n === 1 && parseHcp(f.handicap.value) == null) return toast('Escribe tu hándicap entre +10 y 54, p. ej. 14,2');
    if (n === 2 && !f.querySelector('[name="days"]:checked')) return toast('Elige al menos un día de entrenamiento');
    setObStep(f, n + 1);
  },
  'ob-back'(el) {
    const f = el.closest('form');
    setObStep(f, Number(f.dataset.step) - 1);
  },
  'import-pick'() { $('#import-file').click(); },
  export() {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `golf-plan-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  async reset() {
    if (!(await ask('¿Borrar todos tus datos?', { ok: 'Continuar', danger: true, detail: 'Se borrarán tu perfil, registros, vueltas y distancias de este dispositivo.' }))) return;
    if (!(await ask('Esta acción no se puede deshacer. ¿Seguro?', { ok: 'Borrar todo', danger: true }))) return;
    replaceState({});
    go('perfil');
  },
};

const forms = {
  session(f) {
    const attempts = Number(f.attempts.value);
    const successes = Number(f.successes.value);
    if (!(attempts >= 1) || !(successes >= 0)) return toast('Revisa los números');
    if (successes > attempts) return toast('Los aciertos no pueden superar los intentos');
    const { drill, day, idx } = f.dataset;
    const session = { id: uid(), date: f.date.value, drillId: drill, attempts, successes, notes: f.notes.value.trim() };
    update((s) => {
      s.sessions.push(session);
      linkToPlan(s.plan, session, day, idx);
    });
    closeSheet();
    justDone = session.id;
    render({ keepScroll: true });
    justDone = null;

    const d = drillById(drill);
    const p = pct(successes, attempts);
    const met = p >= d.target;
    const plan = getState().plan;
    const planDay = plan?.days.find((x) => x.items.some((it) => it.sessionId === session.id));
    if (planDay && dayCounts(plan, planDay) && planDay.items.every(isTicked)) {
      const w = weekSummary(plan);
      if (w.done === w.total) {
        return celebrate({ title: '¡Semana completada!', detail: `${w.total} de ${w.total} ejercicios · ${plural(w.met, 'objetivo cumplido', 'objetivos cumplidos')}`, center: `${w.done}/${w.total}` });
      }
      const when = planDay.dow === todayDow() ? 'de hoy' : `del ${DOW[planDay.dow].toLowerCase()}`;
      return celebrate({ title: `¡Sesión ${when} completada!`, detail: `${plural(planDay.items.length, 'ejercicio hecho', 'ejercicios hechos')} · ${w.done} de ${w.total} esta semana`, center: `${planDay.items.length}/${planDay.items.length}` });
    }
    if (met) return celebrate({ title: '¡Objetivo cumplido!', detail: `${d.name}: ${successes} de ${attempts} · objetivo ${d.target}%`, value: p, target: d.target, center: `${p}%` });
    const need = Math.ceil((d.target / 100) * attempts) - successes;
    toast(`${p}% guardado. Te faltaron ${plural(need, 'acierto', 'aciertos')} para el ${d.target}%.`);
  },
  round(f) {
    const r = { id: f.dataset.id || uid(), date: f.date.value, course: f.course.value.trim(), notes: f.notes.value.trim(), holes: Number(f.holes.value) };
    const byHole = f.dataset.mode === 'hoyos';
    if (byHole) {
      syncHole(f);
      const missing = holeDraft.holes.map((h, i) => (h.score == null ? i + 1 : null)).filter(Boolean);
      if (missing.length) {
        holeDraft.i = missing[0] - 1;
        renderHolePanel(f);
        return toast(`Faltan los golpes ${missing.length === 1 ? 'del hoyo' : 'de los hoyos'} ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? '…' : ''}`);
      }
      Object.assign(r, totalsFromHoles(holeDraft.holes), { holesData: structuredClone(holeDraft.holes) });
    } else {
      for (const k of ['par', 'score', 'fairways', 'fwPossible', 'gir', 'putts', 'udAtt', 'udMade', 'penalties']) r[k] = num(f[k].value);
      if (r.score == null) return toast('Escribe los golpes de la vuelta');
    }
    const ratingText = f.rating.value.trim().replace(',', '.');
    if (ratingText) {
      const rating = Number(ratingText);
      if (!(rating >= 30 && rating <= 90)) return toast('La valoración del campo suele estar entre 60 y 80 (p. ej. 71,2)');
      r.rating = Math.round(rating * 10) / 10;
    }
    if (f.slope.value !== '') {
      const slope = Number(f.slope.value);
      if (!(Number.isInteger(slope) && slope >= 55 && slope <= 155)) return toast('El slope va de 55 a 155');
      r.slope = slope;
    }
    if (r.udMade != null && r.udAtt != null && r.udMade > r.udAtt) return toast('Up & down: conseguidos no puede superar intentos');
    if (r.fairways != null && r.fwPossible != null && r.fairways > r.fwPossible) return toast('Calles cogidas no puede superar las posibles');
    if (r.gir != null && r.gir > r.holes) return toast('GIR no puede superar el número de hoyos');
    if (r.fwPossible != null && r.fwPossible > r.holes) return toast('Calles posibles no puede superar el número de hoyos');
    if (r.par != null && (r.par < r.holes * 3 || r.par > r.holes * 5)) return toast(`Con ${r.holes} hoyos el par debe estar entre ${r.holes * 3} y ${r.holes * 5}`);
    if (r.score != null && r.score < r.holes) return toast(`Con ${r.holes} hoyos no puedes hacer menos de ${r.holes} golpes`);
    const isNew = !f.dataset.id;
    update((s) => {
      const i = s.rounds.findIndex((x) => x.id === r.id);
      if (i >= 0) s.rounds[i] = r; else s.rounds.push(r);
      // Recuerda el campo para la próxima vuelta: pares (si se apuntó hoyo a hoyo), valoración y slope.
      if (r.course) {
        let c = s.courses.find((x) => x.name.toLowerCase() === r.course.toLowerCase());
        if (!c) { c = { name: r.course.slice(0, 80) }; s.courses.unshift(c); s.courses.splice(100); }
        if (r.holesData) c.pars = r.holesData.map((h) => h.par);
        if (r.holes === 18 && r.rating != null) c.rating = r.rating;
        if (r.holes === 18 && r.slope != null) c.slope = r.slope;
      }
    });
    closeSheet();
    render({ keepScroll: true });
    toast(isNew ? 'Vuelta guardada. Contará en el plan del próximo lunes.' : 'Vuelta actualizada');
  },
  level(f) {
    const stations = {};
    for (const s of COMBINE) {
      const v = Number(f[`st_${s.id}`].value);
      if (!(Number.isInteger(v) && v >= 0 && v <= COMBINE_BALLS)) return toast(`${s.name}: escribe un número de 0 a ${COMBINE_BALLS}`);
      stations[s.id] = v;
    }
    const prevBest = getState().tests.reduce((m, t) => Math.max(m, combineScore(t.stations)), -1);
    update((s) => { s.tests.push({ id: uid(), date: f.date.value, stations }); });
    closeSheet();
    render({ keepScroll: true });
    const score = combineScore(stations);
    if (prevBest >= 0 && score > prevBest) {
      return celebrate({ title: '¡Nueva mejor marca!', detail: `Prueba de nivel: ${score} de 100 (antes ${prevBest})`, value: score, center: String(score) });
    }
    toast(prevBest < 0 ? `Prueba guardada: ${score} de 100. Repítela en unas semanas.` : `Prueba guardada: ${score} de 100 (mejor marca ${prevBest})`);
  },
  shots(f) {
    const { values, bad } = parseCarries(f.values.value);
    if (bad.length) return toast(`No se entiende «${bad.slice(0, 3).join(' ')}». Usa metros entre ${MIN_CARRY} y ${MAX_CARRY}.`);
    if (!values.length) return toast('Introduce al menos una distancia');
    const base = uid();
    update((s) => {
      // El sufijo mantiene el orden de entrada entre golpes del mismo día.
      values.forEach((carry, i) => s.shots.push({ id: base + String(i).padStart(2, '0'), date: f.date.value, club: f.club.value, carry: Math.round(carry) }));
    });
    closeSheet();
    render({ keepScroll: true });
    toast(`${values.length} ${values.length === 1 ? 'golpe guardado' : 'golpes guardados'}`);
  },
  profile(f) {
    // En el alta por pasos, pulsar Intro antes del último paso avanza en lugar de crear el plan.
    if (f.dataset.step && Number(f.dataset.step) < OB_STEPS) return actions['ob-next'](f.querySelector('[data-action="ob-next"]'));
    const data = new FormData(f);
    const profile = {
      name: String(data.get('name') || '').trim(),
      handicap: parseHcp(data.get('handicap')),
      days: data.getAll('days').map(Number),
      minutes: Number(f.minutes.value),
      weaknesses: data.getAll('weaknesses'),
      clubs: data.getAll('clubs'),
    };
    if (profile.handicap == null) return toast('Escribe tu hándicap entre +10 y 54, p. ej. 14,2');
    if (!profile.days.length) return toast('Elige al menos un día de entrenamiento');
    if (!profile.clubs.length) return toast('Elige al menos un palo');
    const old = getState().profile;
    const planChanged = !old || ['handicap', 'days', 'minutes', 'weaknesses'].some((k) => JSON.stringify(old[k]) !== JSON.stringify(profile[k]));
    update((s) => {
      s.profile = profile;
      if (planChanged) {
        s.plan = carryTicks(s.plan, generatePlan(profile, s.rounds, s.sessions, hashStr(weekKey() + Date.now())));
        if (!old) s.plan.start = todayISO(); // los días anteriores al alta no cuentan como fallados
      }
    });
    toast(old ? (planChanged ? 'Perfil guardado y plan actualizado' : 'Perfil guardado') : 'Tu plan está listo', old ? '' : 'win');
    go('plan');
  },
};

const changes = {
  'progress-drill'(el) { progressDrill = el.value; render({ keepScroll: true }); },
  // Ajusta par y calles posibles al cambiar de 18 a 9 hoyos (o al revés), salvo que el usuario los haya cambiado.
  holes(el) {
    const f = el.form;
    const holes = Number(el.value);
    const other = holes === 9 ? 18 : 9;
    if (f.par.value === '' || Number(f.par.value) === other * 4) f.par.value = holes * 4;
    if (f.fwPossible.value === '' || Number(f.fwPossible.value) === (other === 18 ? 14 : 7)) f.fwPossible.value = holes === 18 ? 14 : 7;
    // Hoyo a hoyo: conserva los hoyos ya apuntados y ajusta la lista al nuevo número.
    syncHole(f);
    const pars = courseByName(f.course.value)?.pars;
    holeDraft.holes = [...holeDraft.holes.slice(0, holes), ...blankHoles(holes, pars).slice(holeDraft.holes.length)].slice(0, holes);
    holeDraft.i = Math.min(holeDraft.i, holes - 1);
    renderHolePanel(f);
  },
  'round-mode'(el) {
    const f = el.form;
    syncHole(f);
    f.dataset.mode = el.value;
    renderHolePanel(f);
  },
  // Al elegir un campo guardado, rellena valoración, slope y los pares de los hoyos aún sin jugar.
  'round-course'(el) {
    const f = el.form;
    const c = courseByName(el.value);
    if (!c) return;
    if (f.rating.value === '' && c.rating != null) f.rating.value = String(c.rating).replace('.', ',');
    if (f.slope.value === '' && c.slope != null) f.slope.value = c.slope;
    if (c.pars?.length === holeDraft.holes.length) {
      syncHole(f);
      holeDraft.holes.forEach((h, i) => { if (h.score == null) h.par = c.pars[i]; });
      renderHolePanel(f);
    }
  },
  'hole-par'(el) {
    syncHole(el.form);
    renderHolePanel(el.form);
  },
  async import(el) {
    const file = el.files[0];
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw new Error('tamaño');
      const data = JSON.parse(await file.text());
      if (!isBackup(data)) throw new Error('formato');
      if (!(await ask('¿Reemplazar tus datos por los de la copia?', { ok: 'Importar', danger: true, detail: 'Se perderá lo que tengas ahora en este dispositivo.' }))) return;
      const dropped = replaceState(data);
      toast(dropped ? `Datos importados. Se descartaron ${plural(dropped, 'registro no válido', 'registros no válidos')}.` : 'Datos importados');
      go('plan');
    } catch {
      toast('El archivo no es una copia válida de Golf Plan');
    } finally {
      el.value = '';
    }
  },
};

document.addEventListener('click', (e) => {
  if (e.target.closest('#celebrate')) { closeCelebrate(); return; }
  const nav = e.target.closest('[data-nav]');
  if (nav) { closeSheet(); go(nav.dataset.nav); return; }
  const act = e.target.closest('[data-action]');
  if (act && actions[act.dataset.action]) actions[act.dataset.action](act);
});
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (forms[f.dataset.form]) { e.preventDefault(); forms[f.dataset.form](f); }
});
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-change]');
  if (el && changes[el.dataset.change]) changes[el.dataset.change](el);
});
document.addEventListener('input', (e) => { if (e.target.closest('#sheet form')) sheet.dataset.dirty = '1'; });
document.addEventListener('focusin', (e) => { if (e.target.matches('.stepper input')) e.target.select(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#celebrate').hidden) { closeCelebrate(); return; }
  if (e.key === 'Escape' && !sheet.hidden && !$('#ask').open) { e.preventDefault(); requestCloseSheet(); }
});

// Mantener pulsado + o − repite el paso.
let holdTimer = null;
document.addEventListener('pointerdown', (e) => {
  const btn = e.target.closest('[data-action="step"]');
  if (!btn) return;
  stepHeld = false;
  clearTimeout(holdTimer);
  holdTimer = setTimeout(function repeat() {
    stepHeld = true;
    actions.step(btn, true);
    holdTimer = setTimeout(repeat, 90);
  }, 450);
});
const stopHold = () => clearTimeout(holdTimer);
document.addEventListener('pointerup', stopHold);
document.addEventListener('pointercancel', stopHold);

window.addEventListener('hashchange', () => { if (!sheet.hidden) closeSheet(); render(); });

// Si la app se queda abierta y cambia la semana, se regenera el plan al volver.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && getState().profile && getState().plan?.week !== weekKey()) render();
});

render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
