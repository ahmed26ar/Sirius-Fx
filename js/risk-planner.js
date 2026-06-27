/* ===== Sirius Fx Risk Planner v2 ===== */
(function() {
  'use strict';

  var STORAGE_KEY = 'sirius_risk_plans';
  var planIdCounter = 1;

  /* ---------- Storage ---------- */
  function loadStore() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) try { return JSON.parse(raw); } catch(e) {}
    var def = { active: 'plan_1', plans: {} };
    def.plans['plan_1'] = createDefaultPlan('plan_1', 'Default Plan');
    return def;
  }

  function saveStore(store) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function createDefaultPlan(id, name) {
    return {
      id: id, name: name,
      balance: 10000, dailyRisk: 2, maxDrawdown: 6,
      targetProfit: 500, period: 30,
      consEnabled: false, consPct: 30,
      dailyLossLimit: 200, dailyTarget: 16.67,
      remainingCapital: 10000,
      days: []
    };
  }

  function getActivePlan(store) {
    return store.plans[store.active];
  }

  /* ---------- Init ---------- */
  function init() {
    var card = document.getElementById('risk-planner');
    if (!card) return;

    var store = loadStore();

    /* Sync planIdCounter from existing keys */
    Object.keys(store.plans).forEach(function(k) {
      var m = k.match(/plan_(\d+)/);
      if (m) { var n = parseInt(m[1]); if (n >= planIdCounter) planIdCounter = n + 1; }
    });

    rebuildPlanSelector(store);
    attachListeners();
    renderActivePlan();
  }

  function attachListeners() {
    document.getElementById('rp-btn-config').addEventListener('click', onGenerate);
    document.getElementById('rp-btn-reset').addEventListener('click', function() {
      if (!confirm('Reset current plan? All day data will be lost.')) return;
      var store = loadStore();
      var plan = getActivePlan(store);
      plan.days = [];
      plan.remainingCapital = plan.balance;
      saveStore(store);
      renderActivePlan();
    });
    document.getElementById('rp-btn-save').addEventListener('click', onSaveDay);
    document.getElementById('rp-btn-csv').addEventListener('click', onExportCSV);
    document.getElementById('rp-btn-new').addEventListener('click', onNewPlan);
    document.getElementById('rp-btn-del').addEventListener('click', onDeletePlan);
    document.getElementById('rp-btn-rename').addEventListener('click', onRenamePlan);
    document.getElementById('rp-plan-select').addEventListener('change', function() {
      var store = loadStore();
      store.active = this.value;
      saveStore(store);
      rebuildPlanSelector(store);
      renderActivePlan();
    });
  }

  /* ---------- Plan Management ---------- */
  function rebuildPlanSelector(store) {
    var sel = document.getElementById('rp-plan-select');
    if (!sel) return;
    sel.innerHTML = '';
    var keys = Object.keys(store.plans);
    keys.forEach(function(k) {
      var opt = document.createElement('option');
      opt.value = k;
      opt.textContent = store.plans[k].name;
      if (k === store.active) opt.selected = true;
      sel.appendChild(opt);
    });
  }

  function onNewPlan() {
    var name = prompt('New plan name:');
    if (!name || !name.trim()) return;
    var store = loadStore();
    var id = 'plan_' + (++planIdCounter);
    store.plans[id] = createDefaultPlan(id, name.trim());
    store.active = id;
    saveStore(store);
    rebuildPlanSelector(store);
    renderActivePlan();
  }

  function onDeletePlan() {
    var store = loadStore();
    var keys = Object.keys(store.plans);
    if (keys.length <= 1) { alert('Cannot delete the only plan.'); return; }
    var active = getActivePlan(store);
    if (!confirm('Delete "' + active.name + '"?')) return;
    delete store.plans[store.active];
    store.active = keys.filter(function(k) { return k !== store.active; })[0];
    saveStore(store);
    rebuildPlanSelector(store);
    renderActivePlan();
  }

  function onRenamePlan() {
    var store = loadStore();
    var plan = getActivePlan(store);
    var name = prompt('Rename plan:', plan.name);
    if (!name || !name.trim()) return;
    plan.name = name.trim();
    saveStore(store);
    rebuildPlanSelector(store);
    renderActivePlan();
  }

  /* ---------- Generate Plan ---------- */
  function onGenerate() {
    var store = loadStore();
    var plan = getActivePlan(store);

    plan.balance = parseFloat(document.getElementById('rp-balance').value) || 10000;
    plan.dailyRisk = parseFloat(document.getElementById('rp-daily-risk').value) || 2;
    plan.maxDrawdown = parseFloat(document.getElementById('rp-max-dd').value) || 6;
    plan.targetProfit = parseFloat(document.getElementById('rp-target').value) || 500;
    plan.period = parseInt(document.getElementById('rp-period').value) || 30;
    plan.consEnabled = document.getElementById('rp-cons-enable').checked;
    plan.consPct = parseFloat(document.getElementById('rp-cons-pct').value) || 30;

    if (plan.balance <= 0 || plan.dailyRisk <= 0 || plan.maxDrawdown <= 0 || plan.targetProfit <= 0 || plan.period <= 0) {
      alert('All values must be positive.');
      return;
    }

    plan.dailyLossLimit = plan.balance * plan.dailyRisk / 100;
    plan.dailyTarget = plan.targetProfit / plan.period;
    plan.remainingCapital = plan.balance;
    plan.days = [];

    for (var i = 0; i < plan.period; i++) {
      var d = new Date();
      d.setDate(d.getDate() + i);
      plan.days.push({
        day: i + 1,
        date: d.toISOString().slice(0, 10),
        pnl: null,
        notes: '',
        status: ''
      });
    }

    saveStore(store);
    renderActivePlan();
  }

  /* ---------- Save Day ---------- */
  function onSaveDay() {
    var idx = parseInt(document.getElementById('rp-day-idx').value);
    var pnl = parseFloat(document.getElementById('rp-day-pnl').value);
    var notes = document.getElementById('rp-day-notes').value || '';
    if (isNaN(pnl)) return;

    var store = loadStore();
    var plan = getActivePlan(store);
    if (!plan || idx < 0 || idx >= plan.days.length) return;

    plan.days[idx].pnl = pnl;
    plan.days[idx].notes = notes;
    plan.days[idx].status = pnl >= plan.dailyTarget ? 'win' : (pnl <= -plan.dailyLossLimit ? 'loss' : 'partial');

    plan.remainingCapital = plan.balance + plan.days.reduce(function(s, d) { return s + (d.pnl || 0); }, 0);

    saveStore(store);
    renderActivePlan();

    document.getElementById('rp-day-pnl').value = '';
    document.getElementById('rp-day-notes').value = '';
  }

  /* ---------- Render ---------- */
  function renderActivePlan() {
    var store = loadStore();
    var plan = getActivePlan(store);
    if (!plan) return;

    /* Fill input fields from plan data */
    document.getElementById('rp-balance').value = plan.balance;
    document.getElementById('rp-daily-risk').value = plan.dailyRisk;
    document.getElementById('rp-max-dd').value = plan.maxDrawdown;
    document.getElementById('rp-target').value = plan.targetProfit;
    document.getElementById('rp-period').value = plan.period;
    document.getElementById('rp-cons-enable').checked = plan.consEnabled;
    document.getElementById('rp-cons-pct').value = plan.consPct;

    renderStats(plan);
    renderTable(plan);
    renderChart(plan);
  }

  function renderStats(plan) {
    var el = document.getElementById('rp-stats');
    if (!el) return;

    var cumulativePnl = 0, totalWins = 0, totalLosses = 0, maxDayPnl = 0, dailyPnls = [];
    plan.days.forEach(function(day) {
      if (day.pnl === null) return;
      cumulativePnl += day.pnl;
      var absVal = Math.abs(day.pnl);
      dailyPnls.push(absVal);
      if (day.pnl > maxDayPnl) maxDayPnl = day.pnl;
      if (day.status === 'win') totalWins++;
      else if (day.pnl < 0) totalLosses++;
      else if (day.status === 'partial' && day.pnl < 0) totalLosses++;
    });

    var remainingDD = plan.balance * plan.maxDrawdown / 100 - Math.max(0, -cumulativePnl);
    var daysCoded = plan.days.filter(function(d) { return d.pnl !== null; }).length;

    var consistencyMsg = '—';
    if (plan.consEnabled && dailyPnls.length > 0) {
      var totalAbs = dailyPnls.reduce(function(a, b) { return a + b; }, 0);
      var maxPct = totalAbs > 0 ? (maxDayPnl / totalAbs) * 100 : 0;
      consistencyMsg = maxPct.toFixed(1) + '% (' + (maxPct <= plan.consPct ? '✅' : '❌') + ')';
    }

    el.innerHTML =
      '<div class="rp-stats-grid">' +
        '<div class="rp-stat' + (cumulativePnl >= 0 ? ' rp-stat--good' : ' rp-stat--bad') + '">' +
          '<div class="rp-stat-val">$' + cumulativePnl.toFixed(0) + '</div>' +
          '<div class="rp-stat-label">P&L</div></div>' +
        '<div class="rp-stat' + (remainingDD > 0 ? ' rp-stat--good' : ' rp-stat--bad') + '">' +
          '<div class="rp-stat-val">$' + Math.max(0, remainingDD).toFixed(0) + '</div>' +
          '<div class="rp-stat-label">DD Left</div></div>' +
        '<div class="rp-stat">' +
          '<div class="rp-stat-val">' + daysCoded + '/' + plan.days.length + '</div>' +
          '<div class="rp-stat-label">Days Done</div></div>' +
        '<div class="rp-stat">' +
          '<div class="rp-stat-val">' + totalWins + 'W/' + totalLosses + 'L</div>' +
          '<div class="rp-stat-label">W/L</div></div>' +
        (plan.consEnabled ?
        '<div class="rp-stat' + (remainingDD > 0 ? '' : ' rp-stat--bad') + '" style="grid-column:span 2">' +
          '<div class="rp-stat-val">' + consistencyMsg + '</div>' +
          '<div class="rp-stat-label">Consistency (max ' + plan.consPct + '%)</div></div>' : '') +
      '</div>';
  }

  function renderTable(plan) {
    var container = document.getElementById('rp-table-wrap');
    if (!container) return;

    if (!plan.days || plan.days.length === 0) {
      container.innerHTML = '<div class="rp-empty">⚙️ Configure your plan above to begin</div>';
      document.getElementById('rp-day-form').style.display = 'none';
      return;
    }

    var html = '<div class="rp-table-scroll"><table class="rp-table"><thead><tr>' +
      '<th>#</th><th>Date</th><th>Loss Limit</th><th>Target</th><th>P&L</th><th>Status</th><th>Notes</th>' +
      '</tr></thead><tbody>';

    plan.days.forEach(function(day) {
      var limit = plan.dailyLossLimit.toFixed(0);
      var tgt = plan.dailyTarget.toFixed(0);
      var pnlStr = day.pnl !== null ? '$' + day.pnl.toFixed(0) : '—';
      var badge = day.status === 'win' ? '<span class="rp-badge rp-badge--win">✅</span>'
        : day.status === 'loss' ? '<span class="rp-badge rp-badge--loss">❌</span>'
        : (day.status === 'partial' && day.pnl !== null && day.pnl >= 0) ? '<span class="rp-badge rp-badge--partial">⚠️</span>'
        : day.status === 'partial' ? '<span class="rp-badge rp-badge--loss">❌</span>'
        : '—';

      html += '<tr>' +
        '<td>' + day.day + '</td>' +
        '<td>' + day.date + '</td>' +
        '<td class="rp-cell--muted">$' + limit + '</td>' +
        '<td class="rp-cell--muted">$' + tgt + '</td>' +
        '<td class="' + (day.pnl !== null ? (day.pnl >= 0 ? 'rp-cell--pos' : 'rp-cell--neg') : '') + '">' + pnlStr + '</td>' +
        '<td>' + badge + '</td>' +
        '<td><button class="rp-edit-btn" data-idx="' + day.day + '">' + (day.notes ? '📝' : '➕') + '</button></td>' +
      '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;

    document.getElementById('rp-day-form').style.display = 'flex';

    container.querySelectorAll('.rp-edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx')) - 1;
        var store = loadStore();
        var plan = getActivePlan(store);
        if (plan && plan.days[idx]) {
          document.getElementById('rp-day-idx').value = idx;
          document.getElementById('rp-day-pnl').value = plan.days[idx].pnl !== null ? plan.days[idx].pnl : '';
          document.getElementById('rp-day-notes').value = plan.days[idx].notes || '';
        }
      });
    });
  }

  /* ---------- Equity Curve Chart ---------- */
  function renderChart(plan) {
    var canvas = document.getElementById('rp-chart');
    if (!canvas) return;

    var codedDays = plan.days.filter(function(d) { return d.pnl !== null; });
    if (codedDays.length < 2) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(128,128,128,0.4)';
      ctx.font = '13px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Add at least 2 days to see equity curve', canvas.width / 2, canvas.height / 2);
      return;
    }

    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    var W = rect.width, H = rect.height;

    var pad = { top: 20, right: 20, bottom: 30, left: 50 };
    var chartW = W - pad.left - pad.right;
    var chartH = H - pad.top - pad.bottom;

    var cumulative = 0;
    var points = [];
    plan.days.forEach(function(day) {
      if (day.pnl === null) { points.push(null); return; }
      cumulative += day.pnl;
      points.push(cumulative);
    });

    var valid = points.filter(function(p) { return p !== null; });
    var min = Math.min.apply(null, valid);
    var max = Math.max.apply(null, valid);
    var range = max - min || 1;
    var padding = range * 0.1;
    min -= padding;
    max += padding;

    ctx.clearRect(0, 0, W, H);

    /* Grid lines */
    ctx.strokeStyle = 'rgba(128,128,128,0.12)';
    ctx.lineWidth = 1;
    var gridLines = 5;
    for (var i = 0; i <= gridLines; i++) {
      var y = pad.top + chartH - (chartH * i / gridLines);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
      ctx.stroke();

      var val = min + (range * i / gridLines);
      ctx.fillStyle = 'rgba(128,128,128,0.5)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('$' + val.toFixed(0), pad.left - 6, y + 3);
    }

    /* Plot line */
    var xStep = chartW / (points.length - 1 || 1);
    var firstValid = -1, lastValid = -1;
    for (i = 0; i < points.length; i++) {
      if (points[i] !== null) {
        if (firstValid === -1) firstValid = i;
        lastValid = i;
      }
    }

    ctx.beginPath();
    ctx.strokeStyle = cumulative >= 0 ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    var started = false;
    for (i = 0; i < points.length; i++) {
      if (points[i] === null) { started = false; continue; }
      var x = pad.left + i * xStep;
      var y = pad.top + chartH - ((points[i] - min) / range * chartH);
      if (!started) { ctx.moveTo(x, y); started = true; }
      else { ctx.lineTo(x, y); }
    }
    ctx.stroke();

    /* Fill under the curve */
    ctx.lineTo(pad.left + lastValid * xStep, pad.top + chartH);
    ctx.lineTo(pad.left + firstValid * xStep, pad.top + chartH);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    if (cumulative >= 0) {
      grad.addColorStop(0, 'rgba(34,197,94,0.15)');
      grad.addColorStop(1, 'rgba(34,197,94,0.01)');
    } else {
      grad.addColorStop(0, 'rgba(239,68,68,0.15)');
      grad.addColorStop(1, 'rgba(239,68,68,0.01)');
    }
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* ---------- CSV Export ---------- */
  function onExportCSV() {
    var store = loadStore();
    var plan = getActivePlan(store);
    if (!plan || !plan.days || plan.days.length === 0) {
      alert('Generate a plan first.');
      return;
    }

    var rows = [['Day', 'Date', 'LossLimit', 'Target', 'P&L', 'Status', 'Notes'].join(',')];
    plan.days.forEach(function(day) {
      var pnl = day.pnl !== null ? day.pnl : '';
      var status = day.status || '';
      var notes = (day.notes || '').replace(/"/g, '""');
      rows.push([day.day, day.date, plan.dailyLossLimit.toFixed(0), plan.dailyTarget.toFixed(0), pnl, status, '"' + notes + '"'].join(','));
    });

    var csv = rows.join('\r\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = plan.name.replace(/\s+/g, '_') + '_risk_plan.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /* ---------- Start ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Redraw chart on resize */
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      var store = loadStore();
      var plan = getActivePlan(store);
      if (plan) renderChart(plan);
    }, 300);
  });
})();
