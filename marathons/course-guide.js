/* Marathon course guides: units toggle, elevation chart, sortable course table.
 * Used by marathons/*.html and marathon-courses.html. */
(function () {
  var M_MI = 1609.344, M_FT = 0.3048;
  var root = document.documentElement;
  function units() { return root.classList.contains('units-km') ? 'km' : 'mi'; }

  /* ----- units toggle ----- */
  var buttons = document.querySelectorAll('.unit-toggle button');
  function syncButtons() {
    buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-units') === units())); });
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var u = b.getAttribute('data-units');
      root.classList.remove('units-mi', 'units-km');
      root.classList.add('units-' + u);
      try { localStorage.setItem('courseUnits', u); } catch (e) {}
      syncButtons();
      drawChart();
    });
  });
  syncButtons();

  /* ----- elevation chart ----- */
  var wrap = document.getElementById('elevChart');
  var dataEl = document.getElementById('courseData');
  var data = null;
  try { data = dataEl ? JSON.parse(dataEl.textContent) : null; } catch (e) { data = null; }
  var geom = null;

  function niceStep(span, target) {
    var steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    for (var i = 0; i < steps.length; i++) if (span / steps[i] <= target) return steps[i];
    return 2000;
  }

  function drawChart() {
    if (!wrap || !data) return;
    var u = units(), toE = u === 'mi' ? function (m) { return m / M_FT; } : function (m) { return m; };
    var dU = u === 'mi' ? M_MI : 1000;
    var W = Math.max(280, wrap.clientWidth), narrow = W < 520;
    var H = narrow ? 190 : 230, L = 46, R = 10, T = 14, B = 24, PW = W - L - R, PH = H - T - B;
    var e = data.e, n = e.length;
    var xs = e.map(function (_, i) { return Math.min(i * data.step, data.total); });
    var lo = Infinity, hi = -Infinity;
    e.forEach(function (v) { lo = Math.min(lo, v); hi = Math.max(hi, v); });
    var minSpan = 40;   // meters: keeps flat courses looking flat
    var mid = (lo + hi) / 2, span = Math.max(hi - lo, minSpan) * 1.15;
    var yLo = toE(mid - span / 2), yHi = toE(mid + span / 2);
    var step = niceStep(yHi - yLo, narrow ? 4 : 5);
    var y0 = Math.floor(yLo / step) * step, y1 = Math.ceil(yHi / step) * step;
    if (y0 < 0 && lo >= 0) y0 = 0;
    function X(d) { return L + d / data.total * PW; }
    function Y(v) { return T + (1 - (v - y0) / (y1 - y0)) * PH; }
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-hidden="true">';
    for (var v = y0; v <= y1 + 1e-9; v += step) {
      var yy = Y(v).toFixed(1);
      s += '<line class="ec-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/>';
      s += '<text x="' + (L - 6) + '" y="' + yy + '" text-anchor="end" dominant-baseline="middle">' + Math.round(v).toLocaleString() + '</text>';
    }
    var tick = u === 'mi' ? (narrow ? 5 : 2) : (narrow ? 10 : 5);
    var maxD = data.total / dU;
    for (var d = 0; d <= maxD + 1e-9; d += tick) {
      s += '<text x="' + X(d * dU).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + d + '</text>';
    }
    (data.climbs || []).forEach(function (c, i) {
      var x0 = X(c[0]), x1 = X(c[1]);
      s += '<rect class="ec-band" x="' + x0.toFixed(1) + '" y="' + T + '" width="' + Math.max(2, x1 - x0).toFixed(1) + '" height="' + PH + '"/>';
      s += '<text class="ec-num" x="' + ((x0 + x1) / 2).toFixed(1) + '" y="' + (T + 11) + '" text-anchor="middle">' + (i + 1) + '</text>';
    });
    var line = '';
    for (var i = 0; i < n; i++) line += (i ? 'L' : 'M') + X(xs[i]).toFixed(1) + ',' + Y(toE(e[i])).toFixed(1);
    s += '<path class="ec-area" d="' + line + 'L' + X(data.total).toFixed(1) + ',' + (T + PH) + 'L' + L + ',' + (T + PH) + 'Z"/>';
    s += '<path class="ec-line" d="' + line + '"/>';
    s += '<line id="ecCross" x1="0" x2="0" y1="' + T + '" y2="' + (T + PH) + '" stroke="var(--text-muted)" stroke-width="1" style="display:none"/>';
    s += '<circle id="ecDot" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2" style="display:none"/>';
    s += '</svg>';
    wrap.innerHTML = s;
    geom = { W: W, L: L, R: R, PW: PW, X: X, Y: Y, toE: toE, dU: dU, xs: xs };
  }

  function hover(ev) {
    if (!geom) return;
    var rect = wrap.getBoundingClientRect(), px = ev.clientX - rect.left;
    if (px < geom.L || px > geom.W - geom.R) { leave(); return; }
    var dist = (px - geom.L) / geom.PW * data.total;
    var i = Math.max(0, Math.min(data.e.length - 2, Math.floor(dist / data.step)));
    var x0 = geom.xs[i], x1 = geom.xs[i + 1], f = x1 > x0 ? Math.max(0, Math.min(1, (dist - x0) / (x1 - x0))) : 0;
    var elev = data.e[i] + f * (data.e[i + 1] - data.e[i]);
    var cx = geom.X(dist), cy = geom.Y(geom.toE(elev));
    var cross = document.getElementById('ecCross'), dot = document.getElementById('ecDot');
    cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.style.display = '';
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.style.display = '';
    var tip = document.getElementById('elevTip'), u = units();
    tip.innerHTML = (u === 'mi' ? 'Mile ' : 'Km ') + (dist / geom.dU).toFixed(1) + ' &middot; <b>' + Math.round(geom.toE(elev)).toLocaleString() + (u === 'mi' ? ' ft' : ' m') + '</b>';
    tip.hidden = false;
    var card = wrap.parentElement, left = wrap.offsetLeft + cx + 12;
    if (left + tip.offsetWidth > card.clientWidth - 6) left = wrap.offsetLeft + cx - tip.offsetWidth - 12;
    tip.style.left = Math.max(4, left) + 'px';
  }
  function leave() {
    var cross = document.getElementById('ecCross'), dot = document.getElementById('ecDot'), tip = document.getElementById('elevTip');
    if (cross) cross.style.display = 'none';
    if (dot) dot.style.display = 'none';
    if (tip) tip.hidden = true;
  }
  if (wrap && data) {
    drawChart();
    wrap.addEventListener('pointermove', hover);
    wrap.addEventListener('pointerdown', hover);
    wrap.addEventListener('pointerleave', leave);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(drawChart, 120); });
  }

  /* ----- sortable table ----- */
  document.querySelectorAll('table.sortable').forEach(function (table) {
    var ths = table.querySelectorAll('thead th');
    ths.forEach(function (th, col) {
      th.querySelector('button').addEventListener('click', function () {
        var asc = th.getAttribute('aria-sort') !== 'ascending';
        ths.forEach(function (o) { o.removeAttribute('aria-sort'); });
        th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');
        var body = table.tBodies[0], rows = Array.prototype.slice.call(body.rows);
        rows.sort(function (a, b) {
          var x = a.cells[col].getAttribute('data-v'), y = b.cells[col].getAttribute('data-v');
          var nx = parseFloat(x), ny = parseFloat(y);
          var r = (!isNaN(nx) && !isNaN(ny)) ? nx - ny : x.localeCompare(y);
          return asc ? r : -r;
        });
        rows.forEach(function (r) { body.appendChild(r); });
      });
    });
  });
})();
