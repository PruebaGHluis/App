// Gráfica de línea en SVG sin dependencias. Los colores vienen del CSS (.chart …).
// Si todos los puntos traen fecha (t, YYYY-MM-DD), el eje X respeta el tiempo transcurrido entre ellos.
export function lineChart(points, { target = null, min = null, max = null, suffix = '', label = 'Gráfica' } = {}) {
  const W = 320, H = 150, P = { l: 32, r: 12, t: 12, b: 22 };
  const ys = points.map((p) => p.y);
  const extra = target != null ? [target] : [];
  let lo = min ?? Math.min(...ys, ...extra);
  let hi = max ?? Math.max(...ys, ...extra);
  if (min == null || max == null) {
    const pad = Math.max((hi - lo) * 0.15, 1);
    if (min == null) lo = Math.floor(lo - pad);
    if (max == null) hi = Math.ceil(hi + pad);
  }
  if (hi === lo) hi = lo + 1;

  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const times = points.every((p) => p.t) ? points.map((p) => new Date(p.t + 'T00:00:00').getTime()) : null;
  const t0 = times ? Math.min(...times) : 0, t1 = times ? Math.max(...times) : 0;
  const x = (i) => {
    if (points.length === 1) return P.l + iw / 2;
    if (times && t1 > t0) return P.l + ((times[i] - t0) / (t1 - t0)) * iw;
    return P.l + (i * iw) / (points.length - 1);
  };
  const y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * ih;
  const fmt = (v) => (Math.abs(v) >= 10 || Number.isInteger(v) ? Math.round(v) : v.toFixed(1));

  const ticks = [0, 1, 2, 3, 4].map((i) => lo + ((hi - lo) * i) / 4);
  const grid = ticks
    .map((t) => `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(t)}" y2="${y(t)}"/>
      <text class="axis" x="${P.l - 6}" y="${y(t) + 3}" text-anchor="end">${fmt(t)}${suffix}</text>`)
    .join('');

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const dots = points.length <= 40
    ? points.map((p, i) => `<circle class="pt" cx="${x(i)}" cy="${y(p.y)}" r="3.5"><title>${p.label}: ${fmt(p.y)}${suffix}</title></circle>`).join('')
    : '';
  const tgt = target != null
    ? `<line class="target" x1="${P.l}" x2="${W - P.r}" y1="${y(target)}" y2="${y(target)}"/>
       <text class="target-label" x="${W - P.r}" y="${y(target) - 4}" text-anchor="end">objetivo ${fmt(target)}${suffix}</text>`
    : '';
  const xLabels = points.length
    ? `<text class="axis" x="${x(0)}" y="${H - 6}" text-anchor="${points.length === 1 ? 'middle' : 'start'}">${points[0].label}</text>` +
      (points.length > 1 ? `<text class="axis" x="${x(points.length - 1)}" y="${H - 6}" text-anchor="end">${points[points.length - 1].label}</text>` : '')
    : '';

  // Los mismos datos en tabla, para lectores de pantalla y para consultar valores exactos en el móvil.
  const rows = [...points].reverse()
    .map((p) => `<tr><td>${p.label}</td><td class="right">${fmt(p.y)}${suffix}</td></tr>`).join('');

  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
    ${grid}${tgt}<path class="line" d="${path}"/>${dots}${xLabels}
  </svg>
  <details class="chart-data"><summary>Ver datos</summary>
    <table class="tbl"><thead><tr><th>Fecha</th><th class="right">Valor</th></tr></thead><tbody>${rows}</tbody></table>
  </details>`;
}
