/* ===== Sirius Fx Risk Planner ===== */

(function() {
  'use strict';

  var STORAGE_KEY = 'sirius_risk_plan';

  function getPlan() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; }
    catch(e) { return null; }
  }

  function savePlan(p) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }

  function clearPlan() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function init() {
    var card = document.getElementById('risk-planner');
    if (!card) return;

    var saved = getPlan();
    if (saved && saved.days && saved.days.length > 0) {
      renderTable(saved);
    }

    var btnConfig = document.getElementById('rp-btn-config');
    var btnReset = document.getElementById('rp-btn-reset');
    var btnSaveDay = document.getElementById('rp-btn-save');

    if (btnConfig) btnConfig.addEventListener('click', onConfigure);
    if (btnReset) btnReset.addEventListener('click', function() {
      if (confirm('Reset all risk plan data?')) {
        clearPlan();
        renderEmpty();
      }
    });
    if (btnSaveDay) btnSaveDay.addEventListener('click', onSaveDay);
  }

  function onConfigure() {
    var balance = parseFloat(document.getElementById('rp-balance').value) || 10000;
    var dailyRisk = parseFloat(document.getElementById('rp-daily-risk').value) || 2;
    var maxDrawdown = parseFloat(document.getElementById('rp-max-dd').value) || 6;
    var target = parseFloat(document.getElementById('rp-target').value) || 500;
    var period = parseInt(document.getElementById('rp-period').value) || 30;
    var consEnabled = document.getElementById('rp-cons-enable').checked;
    var consPct = parseFloat(document.getElementById('rp-cons-pct').value) || 30;

    if (balance <= 0 || dailyRisk <= 0 || maxDrawdown <= 0 || target <= 0 || period <= 0) {
      alert('All values must be positive.');
      return;
    }

    var plan = {
      balance: balance,
      dailyRisk: dailyRisk,
      maxDrawdown: maxDrawdown,
      targetProfit: target,
      period: period,
      consEnabled: consEnabled,
      consPct: consPct,
      dailyLossLimit: balance * dailyRisk / 100,
      dailyTarget: target / period,
      remainingCapital: balance,
      days: []
    };

    for (var i = 0; i < period; i++) {
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

    savePlan(plan);
    renderTable(plan);
  }

  function onSaveDay() {
    var idx = parseInt(document.getElementById('rp-day-idx').value);
    var pnl = parseFloat(document.getElementById('rp-day-pnl').value);
    var notes = document.getElementById('rp-day-notes').value || '';

    if (isNaN(pnl)) return;

    var plan = getPlan();
    if (!plan) return;

    if (idx >= 0 && idx < plan.days.length) {
      plan.days[idx].pnl = pnl;
      plan.days[idx].notes = notes;

      if (pnl >= plan.dailyTarget) {
        plan.days[idx].status = 'win';
      } else if (pnl <= -plan.dailyLossLimit) {
        plan.days[idx].status = 'loss';
      } else {
        plan.days[idx].status = 'partial';
      }

      savePlan(plan);
      renderTable(plan);
    }

    document.getElementById('rp-day-pnl').value = '';
    document.getElementById('rp-day-notes').value = '';
  }

  function renderTable(plan) {
    var container = document.getElementById('rp-table-wrap');
    var statsEl = document.getElementById('rp-stats');
    if (!container) return;

    var cumulativePnl = 0;
    var totalWins = 0, totalLosses = 0;
    var maxDayPnl = 0;
    var dailyPnls = [];

    for (var i = 0; i < plan.days.length; i++) {
      var day = plan.days[i];
      if (day.pnl !== null) {
        cumulativePnl += day.pnl;
        dailyPnls.push(Math.abs(day.pnl));
        if (day.pnl > maxDayPnl) maxDayPnl = day.pnl;
        if (day.status === 'win') totalWins++;
        else if (day.pnl < 0) totalLosses++;
        else if (day.status === 'partial' && day.pnl < 0) totalLosses++;
      }
    }

    var remainingDD = plan.balance * plan.maxDrawdown / 100 - Math.max(0, -cumulativePnl);
    var consistencyOk = true;
    var consistencyMsg = '—';
    if (plan.consEnabled && dailyPnls.length > 0) {
      var totalAbsolute = dailyPnls.reduce(function(a, b) { return a + b; }, 0);
      var maxPct = totalAbsolute > 0 ? (maxDayPnl / totalAbsolute) * 100 : 0;
      consistencyOk = maxPct <= plan.consPct;
      consistencyMsg = maxPct.toFixed(1) + '%' + (consistencyOk ? ' ✅' : ' ❌');
    }

    var daysCoded = plan.days.filter(function(d) { return d.pnl !== null; }).length;

    /* Stats bar */
    var statsHtml =
      '<div class="rp-stats-grid">' +
        '<div class="rp-stat' + (cumulativePnl >= 0 ? ' rp-stat--good' : ' rp-stat--bad') + '">' +
          '<div class="rp-stat-val">$' + cumulativePnl.toFixed(0) + '</div>' +
          '<div class="rp-stat-label">P&L</div>' +
        '</div>' +
        '<div class="rp-stat' + (remainingDD > 0 ? ' rp-stat--good' : ' rp-stat--bad') + '">' +
          '<div class="rp-stat-val">$' + Math.max(0, remainingDD).toFixed(0) + '</div>' +
          '<div class="rp-stat-label">Drawdown Left</div>' +
        '</div>' +
        '<div class="rp-stat">' +
          '<div class="rp-stat-val">' + daysCoded + ' / ' + plan.days.length + '</div>' +
          '<div class="rp-stat-label">Days Done</div>' +
        '</div>' +
        '<div class="rp-stat">' +
          '<div class="rp-stat-val">' + totalWins + 'W / ' + totalLosses + 'L</div>' +
          '<div class="rp-stat-label">Win/Loss</div>' +
        '</div>' +
        (plan.consEnabled ?
        '<div class="rp-stat' + (consistencyOk ? ' rp-stat--good' : ' rp-stat--bad') + '" style="grid-column:span 2">' +
          '<div class="rp-stat-val">' + consistencyMsg + '</div>' +
          '<div class="rp-stat-label">Consistency (max ' + plan.consPct + '%)</div>' +
        '</div>' : '') +
      '</div>';

    statsEl.innerHTML = statsHtml;

    /* Table */
    var html = '<div class="rp-table-scroll"><table class="rp-table">' +
      '<thead><tr>' +
        '<th>#</th>' +
        '<th>Date</th>' +
        '<th>Loss Limit</th>' +
        '<th>Target</th>' +
        '<th>P&L</th>' +
        '<th>Status</th>' +
        '<th>Notes</th>' +
      '</tr></thead><tbody>';

    for (i = 0; i < plan.days.length; i++) {
      day = plan.days[i];
      var limit = plan.dailyLossLimit.toFixed(0);
      var tgt = plan.dailyTarget.toFixed(0);
      var pnlStr = day.pnl !== null ? '$' + day.pnl.toFixed(0) : '—';
      var statusBadge = '';
      if (day.status === 'win') statusBadge = '<span class="rp-badge rp-badge--win">✅ Target</span>';
      else if (day.status === 'loss') statusBadge = '<span class="rp-badge rp-badge--loss">❌ Loss</span>';
      else if (day.status === 'partial' && day.pnl !== null && day.pnl > 0) statusBadge = '<span class="rp-badge rp-badge--partial">⚠️ Partial</span>';
      else if (day.status === 'partial') statusBadge = '<span class="rp-badge rp-badge--loss">❌ Loss</span>';

      html += '<tr>' +
        '<td>' + day.day + '</td>' +
        '<td>' + day.date + '</td>' +
        '<td class="rp-cell--muted">$' + limit + '</td>' +
        '<td class="rp-cell--muted">$' + tgt + '</td>' +
        '<td class="' + (day.pnl !== null ? (day.pnl >= 0 ? 'rp-cell--pos' : 'rp-cell--neg') : '') + '">' + pnlStr + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td><button class="rp-edit-btn" data-idx="' + i + '" title="' + (day.notes || 'Add notes') + '">' +
          (day.notes ? '📝' : '➕') +
        '</button></td>' +
      '</tr>';
    }

      html += '</tbody></table></div>';
    container.innerHTML = html;

    /* Show day form */
    var dayForm = document.getElementById('rp-day-form');
    if (dayForm) dayForm.style.display = 'flex';

    /* Attach edit buttons */
    var editBtns = container.querySelectorAll('.rp-edit-btn');
    for (var j = 0; j < editBtns.length; j++) {
      editBtns[j].addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-idx'));
        var plan = getPlan();
        if (plan && plan.days[idx]) {
          document.getElementById('rp-day-idx').value = idx;
          document.getElementById('rp-day-pnl').value = plan.days[idx].pnl !== null ? plan.days[idx].pnl : '';
          document.getElementById('rp-day-notes').value = plan.days[idx].notes || '';
        }
      });
    }
  }

  function renderEmpty() {
    var container = document.getElementById('rp-table-wrap');
    var statsEl = document.getElementById('rp-stats');
    if (container) container.innerHTML = '<div class="rp-empty">⚙️ Configure your plan above to begin</div>';
    if (statsEl) statsEl.innerHTML = '';
  }

  /* Init on load */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
