import { getState, update, uid, replaceState, exportState } from './store.js';
import { CATEGORIES, CLUBS, DEFAULT_CLUBS, DRILLS, drillById, clubById } from './data.js';
import {
  DOW, DOW_SHORT, weekKey, addDays, todayISO, todayDow, daysAgo, hashStr,
  mean, stdev, roundStats, computeFocus, generatePlan,
} from './plan.js';
import { lineChart } from './charts.js';

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
const CHECK_SVG = '<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7"/></svg>';

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2600);
}

function openSheet(html) {
  sheet.innerHTML = `<div class="sheet-backdrop" data-action="close-sheet"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeSheet() {
  sheet.hidden = true;
  sheet.innerHTML = '';
  document.body.style.overflow = '';
}

const catDot = (cat) => `<span class="dot cat-${cat}" aria-hidden="true"></span>`;

function resultBadge(successes, attempts, target) {
  const p = pct(successes, attempts);
  const cls = p >= target ? 'ok' : p >= target * 0.8 ? '' : 'warn';
  return `<span class="badge ${cls} num">${successes}/${attempts} · ${p}%</span>`;
}

function stepper(name, label, value, min = 0) {
  return `<div class="field"><span>${label}</span>
    <div class="stepper">
      <button type="button" data-action="step" data-name="${name}" data-delta="-1" data-min="${min}" aria-label="Restar">−</button>
      <input type="number" inputmode="numeric" name="${name}" value="${value}" min="${min}" required>
      <button type="button" data-action="step" data-name="${name}" data-delta="1" data-min="${min}" aria-label="Sumar">+</button>
    </div></div>`;
}

// ── Plan semanal ──
function ensurePlan() {
  const st = getState();
  const wk = weekKey();
  if (!st.plan || st.plan.week !== wk) {
    update((s) => { s.plan = generatePlan(s.profile, s.rounds, s.sessions, hashStr(wk), wk); });
  }
  return getState().plan;
}

const sessionById = (id) => getState().sessions.find((s) => s.id === id);

function renderPlan() {
  const st = getState();
  const plan = ensurePlan();
  const { weights, reasons } = computeFocus(st.profile, st.rounds, st.sessions);
  const today = todayDow();
  const allItems = plan.days.flatMap((d) => d.items);
  const done = allItems.filter((it) => it.sessionId && sessionById(it.sessionId)).length;

  const maxW = Math.max(...Object.values(weights));
  const focus = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, w]) => `
      <div class="cat-${cat}" style="margin-top:10px">
        <div class="row between small"><span class="row">${catDot(cat)} ${CATEGORIES[cat].name}</span>
          <span class="muted">${esc(reasons[cat].join(' · '))}</span></div>
        <div class="bar" style="margin-top:4px"><span style="width:${(w / maxW) * 100}%"></span></div>
      </div>`)
    .join('');

  const todayPlan = plan.days.find((d) => d.dow === today);
  const nextDay = plan.days.find((d) => d.dow > today);
  const todayCard = todayPlan
    ? `<div class="card highlight"><h2>Hoy toca entrenar</h2>
        <p class="small">${todayPlan.items.length} ejercicios · ${todayPlan.items.reduce((a, it) => a + (drillById(it.drillId)?.minutes || 0), 0)} min. Toca cada uno para ver cómo se hace.</p></div>`
    : `<div class="card highlight"><h2>Hoy es día de descanso</h2>
        <p class="small">${nextDay ? `Próxima sesión: ${DOW[nextDay.dow].toLowerCase()}.` : 'No quedan sesiones esta semana.'} Puedes registrar una vuelta o añadir distancias.</p></div>`;

  const days = plan.days.map((day, di) => {
    const date = addDays(plan.week, day.dow);
    const isToday = day.dow === today;
    const isPast = day.dow < today;
    const items = day.items.map((it, ii) => {
      const d = drillById(it.drillId);
      if (!d) return '';
      const s = it.sessionId && sessionById(it.sessionId);
      return `<li><div class="item ${s ? 'done' : ''} cat-${d.cat}">
        <span class="check">${s ? CHECK_SVG : ''}</span>
        <button class="grow item" style="padding:0" data-nav="ejercicio/${d.id}">
          <span class="grow"><span class="name">${esc(d.name)}</span>
          <span class="meta row">${catDot(d.cat)} ${CATEGORIES[d.cat].short} · ${d.minutes} min · ${d.attempts} intentos</span></span>
        </button>
        ${s ? resultBadge(s.successes, s.attempts, d.target)
            : `<button class="btn btn-sm ${isToday ? 'btn-primary' : ''}" data-action="log" data-drill="${d.id}" data-day="${di}" data-idx="${ii}">Registrar</button>`}
      </div></li>`;
    }).join('');
    return `<section class="card ${isToday ? 'today' : ''}" ${isPast && !isToday ? 'style="opacity:.75"' : ''}>
      <div class="card-title"><h3>${DOW[day.dow]} <span class="muted small">${fmtDate(date)}</span></h3>
        ${isToday ? '<span class="badge primary">Hoy</span>' : ''}</div>
      <ul class="list">${items}</ul>
    </section>`;
  }).join('');

  return `<div class="stack">
    ${todayCard}
    <div class="card">
      <div class="card-title"><h2>Semana del ${fmtDate(plan.week, { day: 'numeric', month: 'long' })}</h2>
        <span class="badge num">${done}/${allItems.length}</span></div>
      <div class="bar"><span style="width:${allItems.length ? (done / allItems.length) * 100 : 0}%"></span></div>
    </div>
    ${days || '<div class="card empty">No has elegido días de entrenamiento. Configúralos en tu perfil.</div>'}
    <details class="card">
      <summary><strong>Foco de la semana</strong> <span class="muted small">— por qué este plan</span></summary>
      <p class="small muted">Se calcula a partir de tus puntos débiles, tus últimas 5 vueltas y tus resultados en los ejercicios del último mes.</p>
      ${focus}
    </details>
    <button class="btn btn-block" data-action="regen-plan">Generar otro plan para esta semana</button>
  </div>`;
}

// ── Ejercicios ──
let drillFilter = 'todos';

function lastSession(drillId) {
  return getState().sessions.filter((s) => s.drillId === drillId).sort(byDateDesc)[0];
}

function renderDrills() {
  const advanced = Number(getState().profile.handicap) <= 10;
  const chips = [['todos', 'Todos'], ...Object.entries(CATEGORIES).map(([k, v]) => [k, v.short])]
    .map(([k, label]) => `<button class="chip ${drillFilter === k ? 'active' : ''}" data-action="filter" data-cat="${k}">${label}</button>`)
    .join('');
  const list = DRILLS.filter((d) => drillFilter === 'todos' || d.cat === drillFilter)
    .map((d) => {
      const last = lastSession(d.id);
      return `<li><button class="item cat-${d.cat}" data-nav="ejercicio/${d.id}">
        ${catDot(d.cat)}
        <span class="grow"><span class="name">${esc(d.name)}</span>
          <span class="meta">${esc(d.summary)}</span>
          <span class="meta">${d.minutes} min · objetivo ${d.target}%${d.level === 'avanzado' ? ' · avanzado' : ''}</span></span>
        ${last ? resultBadge(last.successes, last.attempts, d.target) : ''}
      </button></li>`;
    }).join('');
  return `<div class="stack">
    <div class="chips">${chips}</div>
    ${!advanced ? '<p class="small muted">Los ejercicios marcados como avanzados no entran en tu plan automático (hándicap > 10), pero puedes hacerlos cuando quieras.</p>' : ''}
    <div class="card"><ul class="list">${list}</ul></div>
  </div>`;
}

function renderDrill(id) {
  const d = drillById(id);
  if (!d) return '<div class="card empty">Ejercicio no encontrado.</div>';
  const history = getState().sessions.filter((s) => s.drillId === id).sort(byDateDesc);
  const chrono = [...history].reverse();
  const chart = chrono.length >= 2
    ? lineChart(chrono.map((s) => ({ label: fmtDate(s.date), y: pct(s.successes, s.attempts) })),
        { target: d.target, min: 0, max: 100, suffix: '%', label: `Evolución de ${d.name}` })
    : '';
  const avg = mean(history.slice(0, 5).map((s) => pct(s.successes, s.attempts)));

  return `<div class="stack">
    <button class="btn btn-ghost btn-sm" data-nav="entrenar" style="padding-left:0">‹ Ejercicios</button>
    <div class="card cat-${d.cat}">
      <div class="row small muted">${catDot(d.cat)} ${CATEGORIES[d.cat].name} · ${d.minutes} min · ${d.attempts} intentos${d.level === 'avanzado' ? ' · avanzado' : ''}</div>
      <h2 style="margin-top:6px">${esc(d.name)}</h2>
      <p class="muted">${esc(d.summary)}</p>
      <ol class="steps">${d.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      <p><strong>Cuenta como acierto:</strong> ${esc(d.success)}</p>
      <p><strong>Objetivo:</strong> ${d.target}% de aciertos.</p>
      <div class="tip">${esc(d.tip)}</div>
    </div>
    <button class="btn btn-primary btn-block" data-action="log" data-drill="${d.id}">Registrar resultado</button>
    ${history.length ? `<div class="card">
      <div class="card-title"><h3>Historial</h3>${avg != null ? `<span class="badge num">Media últimas 5: ${Math.round(avg)}%</span>` : ''}</div>
      ${chart}
      <ul class="list">${history.map((s) => `<li><div class="item">
        <span class="grow"><span class="name">${fmtDate(s.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        ${s.notes ? `<span class="meta">${esc(s.notes)}</span>` : ''}</span>
        ${resultBadge(s.successes, s.attempts, d.target)}
        <button class="x-btn" data-action="del-session" data-id="${s.id}" aria-label="Borrar registro">×</button>
      </div></li>`).join('')}</ul>
    </div>` : ''}
  </div>`;
}

function openLogSheet(drillId, day, idx) {
  const d = drillById(drillId);
  openSheet(`<h2>${esc(d.name)}</h2>
    <p class="small muted">Acierto: ${esc(d.success)}</p>
    <form class="stack" data-form="session" data-drill="${d.id}" data-day="${day ?? ''}" data-idx="${idx ?? ''}">
      <label class="field">Fecha<input type="date" name="date" value="${todayISO()}" max="${todayISO()}" required></label>
      <div class="grid2">${stepper('attempts', 'Intentos', d.attempts, 1)}${stepper('successes', 'Aciertos', 0)}</div>
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

  const list = rounds.map((r) => {
    const s = roundStats(r);
    const bits = [
      s.fwPct != null && `Calles ${Math.round(s.fwPct)}%`,
      s.girPct != null && `GIR ${Math.round(s.girPct)}%`,
      r.putts != null && `${r.putts} putts`,
      s.udPct != null && `U&D ${Math.round(s.udPct)}%`,
    ].filter(Boolean).join(' · ');
    return `<li><button class="item" data-action="edit-round" data-id="${r.id}">
      <span class="grow"><span class="name">${esc(r.course || 'Vuelta')} <span class="muted small">${r.holes} hoyos</span></span>
        <span class="meta">${fmtDate(r.date, { day: 'numeric', month: 'short', year: 'numeric' })}${bits ? ' · ' + bits : ''}</span></span>
      ${r.score != null ? `<span class="badge num">${r.score}${r.par != null ? ` (${fmtSigned(r.score - r.par)})` : ''}</span>` : ''}
    </button></li>`;
  }).join('');

  return `<div class="stack">
    <button class="btn btn-primary btn-block" data-action="new-round">+ Registrar vuelta</button>
    ${rounds.length ? `<div class="card">
      <div class="card-title"><h3>Media últimas ${recent.length} vueltas</h3><span class="muted small">normalizado a 18 hoyos</span></div>
      <div class="grid3">
        ${stat(avg('overPar18'), 'Sobre par', fmtSigned)}
        ${stat(avg('putts18'), 'Putts', (x) => x.toFixed(1))}
        ${stat(avg('girPct'), 'GIR %')}
        ${stat(avg('fwPct'), 'Calles %')}
        ${stat(avg('udPct'), 'Up & down %')}
        ${stat(mean(rounds.slice(0, 5).map((r) => (r.penalties == null ? null : r.penalties * (18 / r.holes)))), 'Penalidades', (x) => x.toFixed(1))}
      </div></div>
      <div class="card"><ul class="list">${list}</ul></div>`
    : `<div class="card empty">Aún no has registrado vueltas.<br>Con unas pocas, el plan se adapta solo a donde pierdes golpes.</div>`}
  </div>`;
}

function openRoundSheet(id) {
  const r = id ? getState().rounds.find((x) => x.id === id) : null;
  const v = (k, def = '') => esc(r?.[k] ?? def);
  const n = (name, label, def = '', extra = '') =>
    `<label class="field">${label}<input type="number" inputmode="numeric" name="${name}" value="${v(name, def)}" min="0" ${extra}></label>`;
  openSheet(`<h2>${r ? 'Editar vuelta' : 'Nueva vuelta'}</h2>
    <form class="stack" data-form="round" data-id="${r?.id ?? ''}">
      <div class="grid2">
        <label class="field">Fecha<input type="date" name="date" value="${v('date', todayISO())}" max="${todayISO()}" required></label>
        <label class="field">Hoyos<select name="holes">
          <option value="18" ${String(r?.holes ?? 18) === '18' ? 'selected' : ''}>18</option>
          <option value="9" ${String(r?.holes) === '9' ? 'selected' : ''}>9</option></select></label>
      </div>
      <label class="field">Campo<input name="course" value="${v('course')}" placeholder="Nombre del campo" autocomplete="off"></label>
      <div class="grid2">${n('score', 'Golpes', '', 'required')}${n('par', 'Par del campo', 72)}</div>
      <div class="grid2">${n('fairways', 'Calles cogidas')}${n('fwPossible', 'Calles posibles', 14)}</div>
      <div class="grid2">${n('gir', 'Greens en regulación')}${n('putts', 'Putts')}</div>
      <div class="grid2">${n('udAtt', 'Up & down: intentos')}${n('udMade', 'Up & down: conseguidos')}</div>
      ${n('penalties', 'Golpes de penalidad', 0)}
      <label class="field">Notas<textarea name="notes" rows="2">${v('notes')}</textarea></label>
      <p class="small muted">Up & down: veces que fallaste el green y luego hiciste par o mejor.</p>
      <button class="btn btn-primary btn-block">Guardar</button>
      ${r ? `<button type="button" class="btn btn-danger btn-block" data-action="del-round" data-id="${r.id}">Borrar vuelta</button>` : ''}
    </form>`);
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
      <td><strong>${c.id}</strong> <span class="muted small">${c.name}</span></td>
      <td class="right">${s ? `<strong>${Math.round(s.avg)}</strong>` : '<span class="muted">–</span>'}</td>
      <td class="right muted">${s?.sd != null ? '±' + Math.round(s.sd) : ''}</td>
      <td style="width:35%">${s ? `<div class="range-track" title="${s.min}–${s.max} m">
        <span class="r" style="left:${(s.min / scaleMax) * 100}%;width:${Math.max(((s.max - s.min) / scaleMax) * 100, 1)}%"></span>
        <span class="a" style="left:${(s.avg / scaleMax) * 100}%"></span></div>` : ''}</td>
    </tr>`).join('');
  return `<div class="stack">
    <button class="btn btn-primary btn-block" data-action="add-shots">+ Añadir distancias</button>
    <div class="card">
      <table class="tbl"><thead><tr><th>Palo</th><th class="right">Media (m)</th><th class="right">Disp.</th><th>Rango</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="small muted" style="margin-top:10px">Distancia de vuelo (carry) en metros. Se usan los últimos 30 golpes de cada palo. "Disp." es la dispersión típica: cuanto menor, más regular. Toca un palo para ver o borrar sus golpes.</p>
    </div>
  </div>`;
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
      <p class="small muted">Puedes meter varios golpes a la vez separados por espacios o comas. Usa solo golpes normales, no los fallos claros.</p>
      <button class="btn btn-primary btn-block">Guardar</button>
    </form>`);
}

function openClubDetail(club) {
  const c = clubById(club);
  const shots = getState().shots.filter((s) => s.club === club).sort(byDateDesc);
  openSheet(`<div class="card-title"><h2>${c.id} · ${c.name}</h2>
      <button class="btn btn-sm btn-primary" data-action="add-shots" data-club="${club}">+ Añadir</button></div>
    ${shots.length ? `<ul class="list">${shots.map((s) => `<li><div class="item">
      <span class="grow">${fmtDate(s.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      <strong class="num">${s.carry} m</strong>
      <button class="x-btn" data-action="del-shot" data-id="${s.id}" data-club="${club}" aria-label="Borrar golpe">×</button>
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
    return `<tr><td class="cat-${cat}"><span class="row">${catDot(cat)} ${info.short}</span></td>
      <td class="right">${now == null ? '<span class="muted">–</span>' : now + '%'}</td>
      <td class="right">${diff == null ? '' : `<span class="badge ${diff >= 0 ? 'ok' : 'warn'}">${fmtSigned(diff)}</span>`}</td></tr>`;
  }).join('');

  // Ejercicio concreto
  let drillBlock = '<p class="empty">Registra resultados en los ejercicios para ver tu evolución.</p>';
  if (progressDrill) {
    const d = drillById(progressDrill);
    const hist = sessions.filter((s) => s.drillId === d.id).sort(byDateAsc);
    drillBlock = `<label class="field">Ejercicio<select data-change="progress-drill">
        ${withData.map((x) => `<option value="${x.id}" ${x.id === d.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
      ${hist.length >= 2
        ? lineChart(hist.map((s) => ({ label: fmtDate(s.date), y: pct(s.successes, s.attempts) })), { target: d.target, min: 0, max: 100, suffix: '%', label: `Evolución de ${d.name}` })
        : '<p class="small muted">Necesitas al menos dos registros de este ejercicio para ver la gráfica.</p>'}`;
  }

  // Vueltas
  const rounds = [...st.rounds].sort(byDateAsc);
  const roundChart = (key, title, opts) => {
    const pts = rounds.map((r) => ({ label: fmtDate(r.date), y: roundStats(r)[key] })).filter((p) => p.y != null);
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
    <div class="grid3">
      <div class="stat"><div class="v">${last28.length}</div><div class="l">Ejercicios (28 días)</div></div>
      <div class="stat"><div class="v">${balls}</div><div class="l">Bolas / intentos</div></div>
      <div class="stat"><div class="v">${activeDays}</div><div class="l">Días entrenados</div></div>
    </div>
    <div class="card"><h3>Evolución por ejercicio</h3><div style="margin-top:10px">${drillBlock}</div></div>
    <div class="card">
      <h3>Rendimiento por área</h3>
      <p class="small muted">% del objetivo alcanzado en los últimos 30 días (100% = justo en el objetivo) y cambio frente a los 30 días anteriores.</p>
      <table class="tbl"><tbody>${catRows}</tbody></table>
    </div>
    <div class="card"><h3>Vueltas</h3>
      ${roundCharts || '<p class="small muted">Registra al menos dos vueltas para ver tendencias.</p>'}</div>
  </div>`;
}

// ── Perfil ──
function renderProfile() {
  const st = getState();
  const p = st.profile || { name: '', handicap: '', days: [1, 3, 5], minutes: 45, weaknesses: [], clubs: DEFAULT_CLUBS };
  const first = !st.profile;
  const check = (name, value, label, checked) =>
    `<label class="chip-check"><input type="checkbox" name="${name}" value="${value}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;

  return `<div class="stack">
    ${first ? `<div class="card highlight"><h2>Bienvenido</h2>
      <p class="small">Cuéntame cómo juegas y cuánto tiempo tienes. Con esto preparo tu plan semanal. Podrás cambiarlo cuando quieras.</p></div>` : ''}
    <form class="card stack" data-form="profile">
      <div class="grid2">
        <label class="field">Nombre<input name="name" value="${esc(p.name)}" autocomplete="given-name"></label>
        <label class="field">Hándicap<input type="number" name="handicap" value="${esc(p.handicap)}" step="0.1" min="-5" max="36" inputmode="decimal" required></label>
      </div>
      <fieldset><legend>Días de entrenamiento</legend>
        <div class="chips">${DOW_SHORT.map((l, i) => check('days', i, l, p.days.includes(i))).join('')}</div></fieldset>
      <label class="field">Tiempo por sesión<select name="minutes">
        ${[30, 45, 60, 90, 120].map((m) => `<option value="${m}" ${Number(p.minutes) === m ? 'selected' : ''}>${m} minutos</option>`).join('')}</select></label>
      <fieldset><legend>Puntos débiles</legend>
        <div class="chips">${Object.entries(CATEGORIES).map(([k, v]) => check('weaknesses', k, v.short, p.weaknesses.includes(k))).join('')}</div></fieldset>
      <fieldset><legend>Palos en tu bolsa</legend>
        <div class="chips">${CLUBS.map((c) => check('clubs', c.id, c.id, p.clubs.includes(c.id))).join('')}</div></fieldset>
      <button class="btn btn-primary btn-block">${first ? 'Crear mi plan' : 'Guardar cambios'}</button>
    </form>
    ${first ? '' : `<div class="card stack">
      <h3>Copia de seguridad</h3>
      <p class="small muted">Tus datos se guardan solo en este dispositivo. Exporta una copia de vez en cuando o para pasarlos a otro móvil.</p>
      <div class="grid2">
        <button class="btn" data-action="export">Exportar</button>
        <label class="btn">Importar<input type="file" accept="application/json,.json" data-change="import" hidden></label>
      </div>
      <button class="btn btn-danger btn-block" data-action="reset">Borrar todos los datos</button>
    </div>`}
  </div>`;
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
  $('#title').textContent = TITLES[r];
  document.body.classList.toggle('onboarding', !getState().profile);
  const tab = r === 'ejercicio' ? 'entrenar' : r;
  document.querySelectorAll('.tabbar [data-nav]').forEach((b) => b.classList.toggle('active', b.dataset.nav === tab));
  view.innerHTML = routes[r](arg);
  window.scrollTo(0, keepScroll ? y : 0);
}

const go = (path) => {
  if (location.hash === '#/' + path) render();
  else location.hash = '#/' + path;
};

// ── Acciones ──
const actions = {
  'close-sheet': closeSheet,
  step(el) {
    const input = el.closest('form').elements[el.dataset.name];
    input.value = Math.max(Number(el.dataset.min), (Number(input.value) || 0) + Number(el.dataset.delta));
  },
  log(el) { openLogSheet(el.dataset.drill, el.dataset.day, el.dataset.idx); },
  filter(el) { drillFilter = el.dataset.cat; render({ keepScroll: true }); },
  'regen-plan'() {
    if (!confirm('¿Generar un plan distinto para esta semana? Las marcas de completado se quitan, pero tus registros se conservan.')) return;
    update((s) => { s.plan = generatePlan(s.profile, s.rounds, s.sessions, (Math.random() * 2 ** 32) >>> 0); });
    render();
    toast('Plan nuevo generado');
  },
  'del-session'(el) {
    if (!confirm('¿Borrar este registro?')) return;
    update((s) => { s.sessions = s.sessions.filter((x) => x.id !== el.dataset.id); });
    render({ keepScroll: true });
  },
  'new-round'() { openRoundSheet(); },
  'edit-round'(el) { openRoundSheet(el.dataset.id); },
  'del-round'(el) {
    if (!confirm('¿Borrar esta vuelta?')) return;
    update((s) => { s.rounds = s.rounds.filter((x) => x.id !== el.dataset.id); });
    closeSheet();
    render({ keepScroll: true });
  },
  'add-shots'(el) { openShotsSheet(el.dataset.club); },
  'club-detail'(el) { openClubDetail(el.dataset.club); },
  'del-shot'(el) {
    update((s) => { s.shots = s.shots.filter((x) => x.id !== el.dataset.id); });
    openClubDetail(el.dataset.club);
    render({ keepScroll: true });
  },
  export() {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `golf-plan-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  reset() {
    if (!confirm('Se borrarán tu perfil, registros, vueltas y distancias de este dispositivo. ¿Continuar?')) return;
    if (!confirm('Esta acción no se puede deshacer. ¿Seguro?')) return;
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
      if (day !== '' && s.plan?.days[day]?.items[idx]?.drillId === drill) s.plan.days[day].items[idx].sessionId = session.id;
    });
    closeSheet();
    render({ keepScroll: true });
    const d = drillById(drill);
    const p = pct(successes, attempts);
    toast(p >= d.target ? `${p}% — ¡objetivo cumplido!` : `${p}% guardado (objetivo ${d.target}%)`);
  },
  round(f) {
    const fields = ['holes', 'par', 'score', 'fairways', 'fwPossible', 'gir', 'putts', 'udAtt', 'udMade', 'penalties'];
    const r = { id: f.dataset.id || uid(), date: f.date.value, course: f.course.value.trim(), notes: f.notes.value.trim() };
    for (const k of fields) r[k] = num(f[k].value);
    if (r.udMade != null && r.udAtt != null && r.udMade > r.udAtt) return toast('Up & down: conseguidos no puede superar intentos');
    if (r.fairways != null && r.fwPossible != null && r.fairways > r.fwPossible) return toast('Calles cogidas no puede superar las posibles');
    if (r.gir != null && r.gir > r.holes) return toast('GIR no puede superar el número de hoyos');
    update((s) => {
      const i = s.rounds.findIndex((x) => x.id === r.id);
      if (i >= 0) s.rounds[i] = r; else s.rounds.push(r);
    });
    closeSheet();
    render({ keepScroll: true });
    toast('Vuelta guardada');
  },
  shots(f) {
    const values = f.values.value.split(/[\s,;]+/).map((x) => Number(x.replace(',', '.'))).filter((x) => x > 0 && x < 400);
    if (!values.length) return toast('Introduce al menos una distancia');
    update((s) => {
      for (const carry of values) s.shots.push({ id: uid(), date: f.date.value, club: f.club.value, carry: Math.round(carry) });
    });
    closeSheet();
    render({ keepScroll: true });
    toast(`${values.length} ${values.length === 1 ? 'golpe guardado' : 'golpes guardados'}`);
  },
  profile(f) {
    const data = new FormData(f);
    const profile = {
      name: String(data.get('name') || '').trim(),
      handicap: Number(data.get('handicap')),
      days: data.getAll('days').map(Number),
      minutes: Number(f.minutes.value),
      weaknesses: data.getAll('weaknesses'),
      clubs: data.getAll('clubs'),
    };
    if (!profile.days.length) return toast('Elige al menos un día de entrenamiento');
    if (!profile.clubs.length) return toast('Elige al menos un palo');
    const old = getState().profile;
    const planChanged = !old || ['handicap', 'days', 'minutes', 'weaknesses'].some((k) => JSON.stringify(old[k]) !== JSON.stringify(profile[k]));
    update((s) => {
      s.profile = profile;
      if (planChanged) s.plan = generatePlan(profile, s.rounds, s.sessions, hashStr(weekKey() + Date.now()));
    });
    toast(old ? (planChanged ? 'Perfil guardado y plan actualizado' : 'Perfil guardado') : 'Tu plan está listo');
    go('plan');
  },
};

const changes = {
  'progress-drill'(el) { progressDrill = el.value; render({ keepScroll: true }); },
  async import(el) {
    const file = el.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'golfplan' || !Array.isArray(data.sessions)) throw new Error('formato');
      if (!confirm('Se reemplazarán todos tus datos actuales por los de la copia. ¿Continuar?')) return;
      const { app, version, exportedAt, ...rest } = data;
      replaceState(rest);
      toast('Datos importados');
      go('plan');
    } catch {
      toast('El archivo no es una copia válida de Golf Plan');
    } finally {
      el.value = '';
    }
  },
};

document.addEventListener('click', (e) => {
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
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });
window.addEventListener('hashchange', () => render());

// Si la app se queda abierta y cambia la semana, se regenera el plan al volver.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && getState().profile && getState().plan?.week !== weekKey()) render();
});

render();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
