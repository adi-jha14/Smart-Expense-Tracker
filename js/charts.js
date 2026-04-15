/* js/charts.js — Pure Canvas Charts with click-to-filter */

var Charts = (function () {

  var CAT_COLORS = {
    Food:     '#f97070',
    Travel:   '#38bdf8',
    Bills:    '#facc15',
    Shopping: '#a78bfa',
    Health:   '#f472b6',
    Other:    '#94a3b8'
  };

  function hi(canvas, logicalW, logicalH) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width  = logicalW * dpr;
    canvas.height = logicalH * dpr;
    canvas.style.width  = logicalW + 'px';
    canvas.style.height = logicalH + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
  }

  /* ══════════════════════════════════════
     DONUT CHART  (180×180)
     ══════════════════════════════════════ */
  var dc, donutCtx, donutSegs = [], donutHovIdx = -1, donutSelIdx = -1, donutRafId, donutTip = null;
  var DONUT_DUR = 900;

  function initDonut() {
    dc = document.getElementById('donutCanvas');
    donutCtx = hi(dc, 180, 180);
    dc.style.cursor = 'pointer';
    dc.addEventListener('mousemove', donutHover);
    dc.addEventListener('mouseleave', function () {
      donutHovIdx = -1;
      removeTip();
      drawDonut(1);
    });
    dc.addEventListener('click', donutClick);
  }

  function getDonutIdx(e) {
    var r = dc.getBoundingClientRect();
    var scaleX = 180 / r.width;
    var scaleY = 180 / r.height;
    var mx = (e.clientX - r.left) * scaleX;
    var my = (e.clientY - r.top)  * scaleY;
    var cx = 90, cy = 90;
    var dx = mx - cx, dy = my - cy;
    var dist  = Math.sqrt(dx * dx + dy * dy);
    var angle = Math.atan2(dy, dx);
    var idx   = -1;
    if (dist >= 40 && dist <= 76) {
      var cum = -Math.PI / 2;
      for (var i = 0; i < donutSegs.length; i++) {
        var end = cum + donutSegs[i].sweep;
        var a   = angle < cum ? angle + 2 * Math.PI : angle;
        if (a >= cum && a <= end) { idx = i; break; }
        cum = end;
      }
    }
    return idx;
  }

  function donutHover(e) {
    var hov = getDonutIdx(e);
    if (hov !== donutHovIdx) { donutHovIdx = hov; drawDonut(1); }
    removeTip();
    if (hov >= 0) {
      var s  = donutSegs[hov];
      var tt = document.createElement('div');
      tt.style.cssText = 'position:fixed;z-index:999;pointer-events:none;background:#1c1c26;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:7px 12px;font:500 12px Inter,sans-serif;color:#f0f0f8;box-shadow:0 8px 24px rgba(0,0,0,0.5)';
      tt.innerHTML = '<strong style="color:' + s.color + '">' + s.name + '</strong><br>₹' + s.amount.toLocaleString('en-IN') + ' <span style="color:rgba(240,240,248,0.4)">(' + s.pct + '%)</span><br><span style="font-size:10px;color:rgba(240,240,248,0.35)">Click to filter</span>';
      document.body.appendChild(tt);
      tt.style.left = (e.clientX + 14) + 'px';
      tt.style.top  = (e.clientY - 10) + 'px';
      donutTip = tt;
    }
  }

  function donutClick(e) {
    var idx = getDonutIdx(e);
    if (idx < 0) return;
    // Toggle: click same segment again to clear
    if (donutSelIdx === idx) {
      donutSelIdx = -1;
      if (window.clearChartFilter) window.clearChartFilter();
    } else {
      donutSelIdx = idx;
      var seg = donutSegs[idx];
      if (window.filterByCategory) window.filterByCategory(seg.name, seg.color);
    }
    drawDonut(1);
    removeTip();
  }

  function removeTip() {
    if (donutTip) { donutTip.remove(); donutTip = null; }
  }

  function drawDonut(progress) {
    var ctx = donutCtx;
    ctx.clearRect(0, 0, 180, 180);
    var cx = 90, cy = 90, outerR = 72, innerR = 48;

    if (!donutSegs.length) {
      ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, Math.PI * 2); ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill('evenodd'); return;
    }

    var cum = -Math.PI / 2;
    for (var i = 0; i < donutSegs.length; i++) {
      var s     = donutSegs[i];
      var sw    = s.sweep * progress;
      var isHov = (i === donutHovIdx);
      var isSel = (donutSelIdx >= 0 && i === donutSelIdx);
      var isDim = (donutSelIdx >= 0 && i !== donutSelIdx);
      var or    = (isHov || isSel) ? outerR + 6 : outerR;
      var ir    = (isHov || isSel) ? innerR - 1 : innerR;
      var gap   = 0.022;
      ctx.save();
      ctx.globalAlpha = isDim ? 0.3 : 1;
      ctx.beginPath();
      ctx.arc(cx, cy, or, cum + gap, cum + sw - gap);
      ctx.arc(cx, cy, ir, cum + sw - gap, cum + gap, true);
      ctx.closePath();
      ctx.fillStyle = s.color;
      if (isHov || isSel) { ctx.shadowBlur = 16; ctx.shadowColor = s.color; }
      ctx.fill();
      ctx.restore();
      cum += sw;
    }
  }

  function animateDonut() {
    cancelAnimationFrame(donutRafId);
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / DONUT_DUR, 1);
      drawDonut(1 - Math.pow(1 - p, 3));
      if (p < 1) donutRafId = requestAnimationFrame(step);
    }
    donutRafId = requestAnimationFrame(step);
  }

  function updateDonut(expenses) {
    var catMap = {}, total = 0;
    expenses.forEach(function (e) { catMap[e.category] = (catMap[e.category] || 0) + e.amount; total += e.amount; });
    donutSegs = Object.keys(catMap).sort(function (a, b) { return catMap[b] - catMap[a]; }).map(function (cat) {
      var amt = catMap[cat];
      return { name: cat, amount: amt, pct: total ? Math.round(amt / total * 100) : 0, sweep: total ? (amt / total) * Math.PI * 2 : 0, color: CAT_COLORS[cat] || '#94a3b8' };
    });
    donutSelIdx = -1; // reset selection on data update
    document.getElementById('donutTotal').textContent = total ? '₹' + total.toLocaleString('en-IN') : '₹0';
    animateDonut();
    renderLegend();
  }

  function renderLegend() {
    var el = document.getElementById('donutLegend');
    el.innerHTML = donutSegs.map(function (s, i) {
      return '<div class="legend-item" onclick="filterByCategory(\'' + s.name + '\',\'' + s.color + '\')" style="cursor:pointer">' +
             '<div class="legend-dot" style="background:' + s.color + '"></div><span>' + s.name + '</span></div>';
    }).join('');
  }

  /* Reset donut visual selection from outside */
  function resetDonutSel() { donutSelIdx = -1; drawDonut(1); }

  /* ══════════════════════════════════════
     BAR CHART  (320×140 logical px)
     ══════════════════════════════════════ */
  var bc, barCtx, barData = [], barRafId, barTip = null, barSelIdx = -1;
  var BAR_DUR = 800;

  function initBar() {
    bc = document.getElementById('barCanvas');
    barCtx = hi(bc, 320, 140);
    bc.style.cursor = 'pointer';
    bc.addEventListener('mousemove', barHover);
    bc.addEventListener('mouseleave', function () {
      if (barTip) { barTip.remove(); barTip = null; }
    });
    bc.addEventListener('click', barClick);
  }

  function getBarCol(e) {
    var rect  = bc.getBoundingClientRect();
    var scaleX = 320 / rect.width;
    var mx    = (e.clientX - rect.left) * scaleX;
    var pad   = 20;
    var barW  = (320 - pad * 2) / barData.length;
    var col   = Math.floor((mx - pad) / barW);
    return (col >= 0 && col < barData.length) ? col : -1;
  }

  function barHover(e) {
    if (!barData.length) return;
    var col = getBarCol(e);
    if (barTip) { barTip.remove(); barTip = null; }
    if (col >= 0) {
      var d  = barData[col];
      var tt = document.createElement('div');
      tt.style.cssText = 'position:fixed;z-index:999;pointer-events:none;background:#1c1c26;border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:7px 12px;font:500 12px Inter,sans-serif;color:#f0f0f8;box-shadow:0 8px 24px rgba(0,0,0,0.5)';
      tt.innerHTML = '<strong style="color:#6d56fa">' + d.label + '</strong><br>₹' + d.amount.toLocaleString('en-IN') +
                     (d.amount ? '<br><span style="font-size:10px;color:rgba(240,240,248,0.35)">Click to filter</span>' : '');
      document.body.appendChild(tt);
      tt.style.left = (e.clientX + 14) + 'px';
      tt.style.top  = (e.clientY - 10) + 'px';
      barTip = tt;
    }
  }

  function barClick(e) {
    if (!barData.length) return;
    if (barTip) { barTip.remove(); barTip = null; }
    var col = getBarCol(e);
    if (col < 0) return;
    var d = barData[col];
    if (!d.amount) return; // nothing to filter on empty bar
    // Toggle: same bar again clears
    if (barSelIdx === col) {
      barSelIdx = -1;
      if (window.clearChartFilter) window.clearChartFilter();
    } else {
      barSelIdx = col;
      if (window.filterByDate) window.filterByDate(d.key, d.label);
    }
    drawBar(1);
  }

  function drawBar(progress) {
    var ctx = barCtx;
    var W = 320, H = 140;
    ctx.clearRect(0, 0, W, H);
    if (!barData.length) return;

    var pad    = 20;
    var maxV   = Math.max.apply(null, barData.map(function (d) { return d.amount; })) || 1;
    var chartH = H - pad - 18;
    var barW   = (W - pad * 2) / barData.length;
    var inner  = barW * 0.55;

    for (var g = 0; g <= 3; g++) {
      var gy = pad + chartH - (chartH * g / 3);
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy);
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1; ctx.stroke();
    }

    for (var i = 0; i < barData.length; i++) {
      var d    = barData[i];
      var bx   = pad + i * barW + (barW - inner) / 2;
      var bh   = Math.max((d.amount / maxV) * chartH * progress, d.amount > 0 ? 2 : 0);
      var by   = pad + chartH - bh;
      var isSel = (barSelIdx >= 0 && i === barSelIdx);
      var isDim = (barSelIdx >= 0 && i !== barSelIdx);

      var grad = ctx.createLinearGradient(bx, by, bx, by + bh);
      if (isSel) {
        grad.addColorStop(0, '#a78bfa');
        grad.addColorStop(1, 'rgba(167,139,250,0.4)');
      } else {
        grad.addColorStop(0, '#6d56fa');
        grad.addColorStop(1, 'rgba(109,86,250,0.25)');
      }

      ctx.save();
      ctx.globalAlpha = isDim ? 0.25 : 1;
      ctx.beginPath();
      if (d.amount > 0) {
        if (ctx.roundRect) ctx.roundRect(bx, by, inner, bh, [4, 4, 0, 0]);
        else { ctx.moveTo(bx+4,by); ctx.lineTo(bx+inner-4,by); ctx.lineTo(bx+inner,by+4); ctx.lineTo(bx+inner,by+bh); ctx.lineTo(bx,by+bh); ctx.lineTo(bx,by+4); ctx.closePath(); }
        ctx.fillStyle = grad;
        if (isSel) { ctx.shadowBlur = 14; ctx.shadowColor = '#a78bfa'; }
        ctx.fill();
      }
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = isDim ? 0.25 : 1;
      ctx.fillStyle = isSel ? '#f0f0f8' : 'rgba(240,240,248,0.3)';
      ctx.font = (isSel ? '600' : '400') + ' 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, bx + inner / 2, H - 4);
      ctx.restore();
    }
  }

  function animateBar() {
    cancelAnimationFrame(barRafId);
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / BAR_DUR, 1);
      drawBar(1 - Math.pow(1 - p, 3));
      if (p < 1) barRafId = requestAnimationFrame(step);
    }
    barRafId = requestAnimationFrame(step);
  }

  function updateBar(allExpenses) {
    var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var now  = new Date();
    barData  = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now); d.setDate(d.getDate() - i);
      var key = d.toISOString().split('T')[0];
      var amt = allExpenses.filter(function (e) { return e.date === key; }).reduce(function (s, e) { return s + e.amount; }, 0);
      barData.push({ label: i === 0 ? 'Today' : DAYS[d.getDay()], amount: amt, key: key });
    }
    barSelIdx = -1; // reset on data update
    animateBar();
  }

  function resetBarSel() { barSelIdx = -1; drawBar(1); }

  /* INIT */
  window.addEventListener('DOMContentLoaded', function () {
    initDonut();
    initBar();
  });

  return {
    updateDonut:   updateDonut,
    updateBar:     updateBar,
    resetDonutSel: resetDonutSel,
    resetBarSel:   resetBarSel
  };

})();
