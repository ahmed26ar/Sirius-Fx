/* ===== Sirius — Behavioral Flag System ===== */

(function () {
  const STORAGE_KEY = 'sirius-behavior';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { trades: [] };
    } catch { return { trades: [] }; }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getDefaultSettings() {
    return {
      revengeMinutes: 60,
      overconfidenceStreak: 3,
      driftLookback: 20,
      maxDailyTrades: 5
    };
  }

  /* ---------- Flag Detection ---------- */

  function detectFlags(data) {
    var trades = data.trades || [];
    var flags = [];
    if (trades.length < 2) return flags;

    var sorted = trades.slice().sort(function (a, b) { return b.id - a.id; });
    var last = sorted[0];

    /* --- 1. Revenge Trading --- */
    for (var i = 1; i < Math.min(sorted.length, 10); i++) {
      if (sorted[i].profit < 0) {
        var gap = (last.id - sorted[i].id) / 60000;
        if (gap <= 60) {
          var severity = gap <= 15 ? 'critical' : gap <= 30 ? 'high' : 'medium';
          flags.push({
            type: 'revenge',
            severity: severity,
            label: window.SiriusIcon('flag') + ' Revenge Trade',
            detail: 'Trade entered ' + Math.round(gap) + ' min after a -$' + Math.abs(sorted[i].profit) + ' loss',
            tip: window.SiriusIcon('lightbulb') + ' Walk away after a loss — your edge disappears when emotions run high.'
          });
          break;
        }
      }
    }

    /* --- 2. Overconfidence --- */
    var streak = 0;
    for (var j = 0; j < sorted.length; j++) {
      if (sorted[j].profit > 0) { streak++; }
      else { streak = 0; }
      if (streak >= 3 && j > 0 && sorted[j].size > sorted[j - 1].size * 1.3) {
        flags.push({
          type: 'overconfidence',
          severity: 'high',
          label: window.SiriusIcon('flag') + ' Overconfidence',
          detail: 'Increased position size by ' + Math.round((sorted[j].size / sorted[j - 1].size - 1) * 100) + '% after ' + streak + ' consecutive wins',
          tip: window.SiriusIcon('lightbulb') + ' Winning streaks inflate ego — stick to your standard size no matter what.'
        });
        break;
      }
    }

    /* --- 3. Chasing Losses --- */
    for (var k = 1; k < Math.min(sorted.length, 10); k++) {
      if (sorted[k - 1].profit < 0 && sorted[k].size > sorted[k - 1].size * 1.2) {
        flags.push({
          type: 'chase',
          severity: 'critical',
          label: window.SiriusIcon('flag') + ' Chasing Losses',
          detail: 'Increased size by ' + Math.round((sorted[k].size / sorted[k - 1].size - 1) * 100) + '% right after a -$' + Math.abs(sorted[k - 1].profit) + ' loss',
          tip: window.SiriusIcon('lightbulb') + ' Doubling down after a loss is the fastest path to blowing your account.'
        });
        break;
      }
    }

    /* --- 4. Strategy Drift --- */
    var pairCounts = {};
    var sessionCounts = {};
    var lookback = sorted.slice(0, 20);
    for (var m = 0; m < lookback.length; m++) {
      pairCounts[lookback[m].pair] = (pairCounts[lookback[m].pair] || 0) + 1;
      sessionCounts[lookback[m].session] = (sessionCounts[lookback[m].session] || 0) + 1;
    }
    var lastPair = last.pair;
    var lastSession = last.session;
    var pairRatio = pairCounts[lastPair] / lookback.length || 0;
    var sessionRatio = sessionCounts[lastSession] / lookback.length || 0;
    if (lookback.length >= 5 && (pairRatio < 0.15 || sessionRatio < 0.15)) {
      flags.push({
        type: 'drift',
        severity: 'medium',
        label: window.SiriusIcon('flag') + ' Strategy Drift',
        detail: (pairRatio < 0.15 ? ('Trading ' + lastPair + ' — unusual pair') : '') +
                (pairRatio < 0.15 && sessionRatio < 0.15 ? ' | ' : '') +
                (sessionRatio < 0.15 ? ('Trading ' + lastSession + ' — unusual session') : ''),
        tip: window.SiriusIcon('lightbulb') + ' Stick to what works. Your edge comes from specific pairs and sessions.'
      });
    }

    /* --- 5. Fatigue / Overtrading --- */
    var today = new Date().toDateString();
    var todayCount = 0;
    for (var n = 0; n < sorted.length; n++) {
      if (new Date(sorted[n].id).toDateString() === today) todayCount++;
    }
    if (todayCount >= 5) {
      flags.push({
        type: 'fatigue',
        severity: todayCount >= 8 ? 'critical' : 'high',
        label: window.SiriusIcon('flag') + ' Overtrading',
        detail: todayCount + ' trades today — quality drops after the 3rd trade',
        tip: window.SiriusIcon('lightbulb') + ' Your best trades are the first 2-3. After that, probability turns against you.'
      });
    }

    return flags;
  }

  function calcDisciplineScore(flags) {
    if (!flags.length) return { score: 100, cls: 'good' };
    var deductions = 0;
    for (var i = 0; i < flags.length; i++) {
      var f = flags[i];
      if (f.severity === 'critical') deductions += 25;
      else if (f.severity === 'high') deductions += 15;
      else deductions += 8;
    }
    var score = Math.max(0, 100 - deductions);
    var cls = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';
    return { score: score, cls: cls };
  }

  /* ---------- Render ---------- */

  function render() {
    var data = load();
    var trades = data.trades || [];
    var flags = detectFlags(data);
    var score = calcDisciplineScore(flags);

    var elScore = document.getElementById('bf-discipline');
    var elFlagCount = document.getElementById('bf-flag-count');
    var elClean = document.getElementById('bf-clean');
    var elFlags = document.getElementById('bf-flags-list');

    if (elScore) { elScore.textContent = score.score + '%'; elScore.className = 'bf-score-num bf-score--' + score.cls; }
    if (elFlagCount) elFlagCount.textContent = flags.length;
    if (elClean) {
      var clean = 0;
      for (var i = trades.length - 1; i >= 0; i--) {
        if (trades[i].profit > 0) clean++; else break;
      }
      elClean.textContent = clean;
    }

    if (elFlags) {
      if (!flags.length) {
        elFlags.innerHTML = '<div class="bf-empty">' + window.SiriusIcon('check') + ' No behavioral flags — good discipline</div>';
      } else {
        elFlags.innerHTML = flags.map(function (f) {
          var sevCls = f.severity === 'critical' ? 'bf-flag--critical' : f.severity === 'high' ? 'bf-flag--high' : 'bf-flag--medium';
          return '<div class="bf-flag ' + sevCls + '">' +
            '<div class="bf-flag-head">' +
              '<span class="bf-flag-label">' + f.label + '</span>' +
              '<span class="bf-flag-sev">' + f.severity + '</span>' +
            '</div>' +
            '<div class="bf-flag-detail">' + f.detail + '</div>' +
            '<div class="bf-flag-tip">' + window.SiriusIcon('lightbulb') + ' ' + f.tip + '</div>' +
          '</div>';
        }).join('');
      }
    }
  }

  /* ---------- Add Trade ---------- */

  function addTrade() {
    var pair = document.getElementById('bf-pair').value.trim().toUpperCase();
    var direction = document.getElementById('bf-direction').value;
    var session = document.getElementById('bf-session').value;
    var profit = parseFloat(document.getElementById('bf-profit').value);
    var size = parseFloat(document.getElementById('bf-size').value);

    if (!pair || isNaN(profit) || isNaN(size) || size <= 0) return;

    var data = load();
    data.trades.push({
      id: Date.now(),
      date: new Date().toISOString(),
      pair: pair,
      direction: direction,
      session: session,
      profit: profit,
      size: size
    });
    save(data);

    document.getElementById('bf-pair').value = '';
    document.getElementById('bf-profit').value = '';
    document.getElementById('bf-size').value = '0.1';
    toggleForm(false);
    render();
  }

  /* ---------- History Modal ---------- */

  function showHistory() {
    var data = load();
    var trades = (data.trades || []).slice().reverse();
    var html = trades.length
      ? trades.map(function (t) {
          var d = new Date(t.id);
          var time = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          var cls = t.profit >= 0 ? 'color:#22c55e' : 'color:#ef4444';
          return '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;font-family:var(--font-en)">' +
            '<span>' + time + '</span>' +
            '<span>' + t.pair + ' ' + t.direction + '</span>' +
            '<span>' + t.session + '</span>' +
            '<span style="font-weight:700;' + cls + '">' + (t.profit >= 0 ? '+' : '') + t.profit + '</span>' +
          '</div>';
        }).join('')
      : '<div style="text-align:center;padding:20px;color:var(--text-muted)">' + window.SiriusIcon('clipboard') + ' No trades yet</div>';

    var existing = document.getElementById('bf-history-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'bf-history-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center';
    modal.innerHTML =
      '<div style="background:var(--bg-alt);border:1px solid var(--border);border-radius:14px;padding:24px;max-width:600px;width:90%;max-height:80vh;overflow-y:auto">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">' +
          '<h3 style="font-size:1.3rem">Trade History</h3>' +
          '<button id="bf-close-modal" style="background:none;border:none;color:var(--text-muted);font-size:1.5rem;cursor:pointer">' + window.SiriusIcon('cross') + '</button>' +
        '</div>' +
        html +
      '</div>';
    document.body.appendChild(modal);
    document.getElementById('bf-close-modal').addEventListener('click', function () { modal.remove(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
  }

  function toggleForm(show) {
    var el = document.getElementById('bf-inputs');
    if (el) el.style.display = show ? 'block' : 'none';
  }

  function reset() {
    if (confirm('Delete all trade data?')) {
      localStorage.removeItem(STORAGE_KEY);
      render();
    }
  }

  /* ---------- Init ---------- */

  function init() {
    var addBtn = document.getElementById('bf-btn-add');
    var saveBtn = document.getElementById('bf-btn-save');
    var cancelBtn = document.getElementById('bf-btn-cancel');
    var histBtn = document.getElementById('bf-btn-history');
    var resetBtn = document.getElementById('bf-btn-reset');

    if (addBtn) addBtn.addEventListener('click', function () { toggleForm(true); });
    if (cancelBtn) cancelBtn.addEventListener('click', function () { toggleForm(false); });
    if (saveBtn) saveBtn.addEventListener('click', addTrade);
    if (histBtn) histBtn.addEventListener('click', showHistory);
    if (resetBtn) resetBtn.addEventListener('click', reset);

    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
