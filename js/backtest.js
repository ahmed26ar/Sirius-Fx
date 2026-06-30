(function () {
  'use strict';

  var STORAGE_KEY = 'sirius-backtest';

  /* ===== PAIRS ===== */
  var PAIRS = [
    'EUR/USD','GBP/USD','USD/JPY','USD/CHF','AUD/USD','USD/CAD',
    'NZD/USD','EUR/GBP','EUR/JPY','GBP/JPY','XAU/USD','BTC/USD',
    'ETH/USD','US30','XAG/USD','OIL/USD'
  ];

  /* ===== STORAGE ===== */
  function loadTrades() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveTrades(trades) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
  }

  function generateId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  }

  /* ===== CALCULATIONS ===== */
  function calcStats(trades) {
    if (!trades.length) return null;

    var total = trades.length;
    var profits = trades.map(function (t) { return t.profit; });
    var wins = profits.filter(function (p) { return p > 0; });
    var losses = profits.filter(function (p) { return p <= 0; });
    var winCount = wins.length;
    var lossCount = losses.length;
    var winRate = total ? (winCount / total * 100) : 0;
    var netProfit = profits.reduce(function (a, b) { return a + b; }, 0);
    var grossProfit = wins.length ? wins.reduce(function (a, b) { return a + b; }, 0) : 0;
    var grossLoss = losses.length ? Math.abs(losses.reduce(function (a, b) { return a + b; }, 0)) : 0;
    var profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);
    var avgWin = winCount ? grossProfit / winCount : 0;
    var avgLoss = lossCount ? grossLoss / lossCount : 0;
    var expectancy = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss);
    var bestTrade = profits.length ? Math.max.apply(null, profits) : 0;
    var worstTrade = profits.length ? Math.min.apply(null, profits) : 0;
    var avgProfit = total ? netProfit / total : 0;

    /* Drawdown */
    var peak = 0;
    var maxDrawdown = 0;
    var maxDrawdownPct = 0;
    var equity = 0;
    var ddStart = 0;
    for (var i = 0; i < trades.length; i++) {
      equity += trades[i].profit;
      if (equity > peak) { peak = equity; ddStart = 0; }
      else {
        var dd = peak - equity;
        if (dd > maxDrawdown) maxDrawdown = dd;
        var ddPct = peak > 0 ? (dd / peak * 100) : 0;
        if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
      }
    }
    var finalEquity = netProfit;
    var recoveryFactor = maxDrawdown > 0 ? netProfit / maxDrawdown : (netProfit > 0 ? Infinity : 0);

    /* Consecutive wins/losses */
    var curW = 0, curL = 0, maxW = 0, maxL = 0;
    for (var j = 0; j < trades.length; j++) {
      if (trades[j].profit > 0) { curW++; curL = 0; if (curW > maxW) maxW = curW; }
      else { curL++; curW = 0; if (curL > maxL) maxL = curL; }
    }

    /* Sharpe & Sortino (using daily returns approximation) */
    var returns = [];
    for (var k = 0; k < trades.length; k++) {
      var base = k > 0 ? Math.max(1, Math.abs(trades[k-1].profit)) : 10000;
      returns.push(trades[k].profit / base);
    }
    var avgRet = returns.length ? returns.reduce(function (a, b) { return a + b; }, 0) / returns.length : 0;
    var variance = returns.length ? returns.reduce(function (s, r) { return s + Math.pow(r - avgRet, 2); }, 0) / returns.length : 0;
    var stdDev = Math.sqrt(variance);
    var sharpe = stdDev > 0 ? (avgRet / stdDev) * Math.sqrt(252) : 0;

    /* Sortino: only negative deviations */
    var negReturns = returns.filter(function (r) { return r < 0; });
    var downVariance = negReturns.length ? negReturns.reduce(function (s, r) { return s + Math.pow(r - avgRet, 2); }, 0) / negReturns.length : 0;
    var downDev = Math.sqrt(downVariance);
    var sortino = downDev > 0 ? (avgRet / downDev) * Math.sqrt(252) : (avgRet > 0 ? Infinity : 0);

    /* Calmar ratio */
    var calmar = maxDrawdownPct > 0 ? (netProfit / (peak || 1)) / (maxDrawdownPct/100) : (netProfit > 0 ? Infinity : 0);

    /* Monthly breakdown */
    var monthly = {};
    trades.forEach(function (t) {
      if (!t.date) return;
      var m = t.date.slice(0, 7);
      if (!monthly[m]) monthly[m] = 0;
      monthly[m] += t.profit;
    });
    var monthlyArr = Object.keys(monthly).sort().map(function (m) {
      return { month: m, pnl: monthly[m] };
    });
    var bestMonth = monthlyArr.length ? Math.max.apply(null, monthlyArr.map(function (m) { return m.pnl; })) : 0;
    var worstMonth = monthlyArr.length ? Math.min.apply(null, monthlyArr.map(function (m) { return m.pnl; })) : 0;
    var avgMonth = monthlyArr.length ? monthlyArr.reduce(function (s, m) { return s + m.pnl; }, 0) / monthlyArr.length : 0;
    var winMonths = monthlyArr.filter(function (m) { return m.pnl > 0; }).length;
    var lossMonths = monthlyArr.filter(function (m) { return m.pnl <= 0; }).length;

    /* Pair breakdown */
    var pairStats = {};
    trades.forEach(function (t) {
      if (!pairStats[t.pair]) pairStats[t.pair] = { total: 0, wins: 0, losses: 0, netPnl: 0 };
      pairStats[t.pair].total++;
      pairStats[t.pair].netPnl += t.profit;
      if (t.profit > 0) pairStats[t.pair].wins++;
      else pairStats[t.pair].losses++;
    });

    return {
      total: total, winCount: winCount, lossCount: lossCount,
      winRate: winRate, netProfit: netProfit,
      grossProfit: grossProfit, grossLoss: grossLoss,
      profitFactor: profitFactor,
      avgWin: avgWin, avgLoss: avgLoss,
      expectancy: expectancy,
      bestTrade: bestTrade, worstTrade: worstTrade,
      avgProfit: avgProfit, maxDrawdown: maxDrawdown,
      maxDrawdownPct: maxDrawdownPct,
      recoveryFactor: recoveryFactor,
      maxConsecWins: maxW, maxConsecLosses: maxL,
      sharpe: sharpe, sortino: sortino, calmar: calmar,
      monthly: monthlyArr,
      bestMonth: bestMonth, worstMonth: worstMonth,
      avgMonth: avgMonth,
      winMonths: winMonths, lossMonths: lossMonths,
      finalEquity: finalEquity,
      pairStats: pairStats
    };
  }

  /* ===== RENDER METRICS ===== */
  function renderMetrics(stats) {
    var el = document.getElementById('btMetrics');
    if (!el) return;
    if (!stats) {
      el.innerHTML = '<div class="bt-metric" style="grid-column:1/-1;padding:32px"><div class="bt-metric-label">أضف صفقاتك لبدء التحليل</div></div>';
      return;
    }

    var pfStr = stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2);
    var sharpeStr = stats.sharpe === Infinity ? '∞' : stats.sharpe.toFixed(2);
    var sortinoStr = stats.sortino === Infinity ? '∞' : stats.sortino.toFixed(2);
    var calmarStr = stats.calmar === Infinity ? '∞' : stats.calmar.toFixed(2);

    function valCls(v, good, bad) {
      if (v > 0) return good;
      if (v < 0) return bad;
      return '';
    }

    el.innerHTML =
      '<div class="bt-metric"><div class="bt-metric-val">' + stats.total + '</div><div class="bt-metric-label">Total Trades</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + valCls(stats.winRate - 40, 'good', 'warn') + '">' + stats.winRate.toFixed(1) + '%</div><div class="bt-metric-label">Win Rate</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + valCls(stats.netProfit, 'good', 'bad') + '">$' + stats.netProfit.toFixed(0) + '</div><div class="bt-metric-label">Net Profit</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + (stats.profitFactor >= 1.5 ? 'good' : stats.profitFactor >= 1 ? 'warn' : 'bad') + '">' + pfStr + '</div><div class="bt-metric-label">Profit Factor</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + valCls(stats.expectancy, 'good', 'bad') + '">$' + stats.expectancy.toFixed(2) + '</div><div class="bt-metric-label">Expectancy</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + (stats.sharpe >= 1 ? 'good' : stats.sharpe >= 0.5 ? 'warn' : 'bad') + '">' + sharpeStr + '</div><div class="bt-metric-label">Sharpe Ratio</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + (stats.sortino >= 1.5 ? 'good' : stats.sortino >= 0.8 ? 'warn' : 'bad') + '">' + sortinoStr + '</div><div class="bt-metric-label">Sortino Ratio</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + (stats.maxDrawdownPct <= 15 ? 'good' : stats.maxDrawdownPct <= 30 ? 'warn' : 'bad') + '">' + stats.maxDrawdownPct.toFixed(1) + '%</div><div class="bt-metric-label">Max DD</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + valCls(stats.recoveryFactor, 'good', 'bad') + '">' + (stats.recoveryFactor === Infinity ? '∞' : stats.recoveryFactor.toFixed(2)) + '</div><div class="bt-metric-label">Recovery Factor</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--good">' + stats.maxConsecWins + '</div><div class="bt-metric-label">Consec Wins</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--bad">' + stats.maxConsecLosses + '</div><div class="bt-metric-label">Consec Losses</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-val bt-metric-val--' + valCls(stats.avgProfit, 'good', 'bad') + '">$' + stats.avgProfit.toFixed(2) + '</div><div class="bt-metric-label">Avg Trade</div></div>';
  }

  /* ===== RENDER DETAILED STATS ===== */
  function renderDetailed(stats) {
    var el = document.getElementById('btStatsDetail');
    if (!el || !stats) { if (el) el.innerHTML = ''; return; }
    var calmar = stats.calmar === Infinity ? '∞' : stats.calmar.toFixed(2);
    var sharpe = stats.sharpe === Infinity ? '∞' : stats.sharpe.toFixed(2);
    var sortino = stats.sortino === Infinity ? '∞' : stats.sortino.toFixed(2);
    el.innerHTML =
      '<div class="bt-dstat"><span class="bt-dstat-label">Gross Profit</span><span class="bt-dstat-val pos">$' + stats.grossProfit.toFixed(0) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Gross Loss</span><span class="bt-dstat-val neg">$' + stats.grossLoss.toFixed(0) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Avg Win</span><span class="bt-dstat-val pos">$' + stats.avgWin.toFixed(2) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Avg Loss</span><span class="bt-dstat-val neg">$' + stats.avgLoss.toFixed(2) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Best Trade</span><span class="bt-dstat-val pos">$' + stats.bestTrade.toFixed(0) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Worst Trade</span><span class="bt-dstat-val neg">$' + stats.worstTrade.toFixed(0) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Max Drawdown ($)</span><span class="bt-dstat-val neg">$' + stats.maxDrawdown.toFixed(0) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Max Drawdown %</span><span class="bt-dstat-val neg">' + stats.maxDrawdownPct.toFixed(1) + '%</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Sharpe Ratio</span><span class="bt-dstat-val ' + (stats.sharpe >= 1 ? 'pos' : 'neg') + '">' + sharpe + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Sortino Ratio</span><span class="bt-dstat-val ' + (stats.sortino >= 1 ? 'pos' : 'neg') + '">' + sortino + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Calmar Ratio</span><span class="bt-dstat-val ' + (stats.calmar >= 1 ? 'pos' : 'neg') + '">' + calmar + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Recovery Factor</span><span class="bt-dstat-val ' + (stats.recoveryFactor >= 1 ? 'pos' : 'neg') + '">' + (stats.recoveryFactor === Infinity ? '∞' : stats.recoveryFactor.toFixed(2)) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Win Months</span><span class="bt-dstat-val pos">' + stats.winMonths + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Loss Months</span><span class="bt-dstat-val neg">' + stats.lossMonths + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Best Month</span><span class="bt-dstat-val pos">$' + stats.bestMonth.toFixed(0) + '</span></div>' +
      '<div class="bt-dstat"><span class="bt-dstat-label">Worst Month</span><span class="bt-dstat-val neg">$' + stats.worstMonth.toFixed(0) + '</span></div>';
  }

  /* ===== RENDER PAIR DISTRIBUTION ===== */
  function renderPairDist(stats) {
    var el = document.getElementById('btPairDist');
    if (!el || !stats) { if (el) el.innerHTML = ''; return; }
    var keys = Object.keys(stats.pairStats);
    if (!keys.length) { el.innerHTML = ''; return; }
    el.innerHTML = keys.map(function (p) {
      var ps = stats.pairStats[p];
      return '<span class="bt-pair-tag"><strong>' + p + '</strong> <span class="bt-pt-wins">' + ps.wins + 'W</span> <span class="bt-pt-losses">' + ps.losses + 'L</span> <span class="bt-pt-total">$' + ps.netPnl.toFixed(0) + '</span></span>';
    }).join('');
  }

  /* ===== RENDER MONTHLY ===== */
  function renderMonthly(stats) {
    var el = document.getElementById('btMonthlyGrid');
    if (!el || !stats || !stats.monthly.length) { if (el) el.innerHTML = '<div class="bt-empty">No monthly data</div>'; return; }
    el.innerHTML = stats.monthly.map(function (m) {
      var cls = m.pnl >= 0 ? 'pos' : 'neg';
      return '<div class="bt-month-card"><div class="bt-month-label">' + m.month + '</div><div class="bt-month-val ' + cls + '">$' + m.pnl.toFixed(0) + '</div></div>';
    }).join('');
  }

  /* ===== RENDER TRADE TABLE ===== */
  function renderTable(trades) {
    var el = document.getElementById('btTradeBody');
    if (!el) return;
    if (!trades.length) {
      el.innerHTML = '<tr><td colspan="9" class="bt-empty"><div class="bt-empty-icon">📊</div>No trades yet — add your first trade to begin backtesting</td></tr>';
      return;
    }
    el.innerHTML = trades.map(function (t, i) {
      var profitCls = t.profit >= 0 ? 'pos' : 'neg';
      var dirCls = t.direction === 'Buy' ? 'buy' : 'sell';
      var dateStr = t.date ? t.date.slice(0, 10) : '—';
      return '<tr>' +
        '<td class="bt-td-pair">' + t.pair + '</td>' +
        '<td><span class="bt-td-dir ' + dirCls + '">' + t.direction + '</span></td>' +
        '<td>' + (t.entry !== undefined ? parseFloat(t.entry).toFixed(5) : '—') + '</td>' +
        '<td>' + (t.exit !== undefined ? parseFloat(t.exit).toFixed(5) : '—') + '</td>' +
        '<td>' + (t.lotSize || '—') + '</td>' +
        '<td class="bt-td-profit ' + profitCls + '">' + (t.profit >= 0 ? '+' : '') + t.profit.toFixed(0) + '</td>' +
        '<td style="color:var(--text-muted);font-size:12px">' + dateStr + '</td>' +
        '<td style="font-size:12px;color:var(--text-muted);max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (t.notes || '—') + '</td>' +
        '<td class="bt-td-actions">' +
          '<button onclick="window.__btEdit(' + i + ')" title="Edit">✏️</button>' +
          '<button class="bt-del" onclick="window.__btDelete(' + i + ')" title="Delete">🗑️</button>' +
        '</td>' +
      '</tr>';
    }).join('');
  }

  /* ===== EQUITY CURVE ===== */
  function drawEquityCurve(trades) {
    var canvas = document.getElementById('btEquityChart');
    if (!canvas) return;
    if (trades.length < 2) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(128,128,128,0.4)';
      ctx.font = '13px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Need at least 2 trades for equity curve', canvas.width / 2, canvas.height / 2);
      return;
    }

    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    var W = rect.width, H = rect.height;
    var pad = { top: 20, right: 20, bottom: 30, left: 55 };
    var chartW = W - pad.left - pad.right;
    var chartH = H - pad.top - pad.bottom;

    var equity = 0;
    var points = [];
    for (var i = 0; i < trades.length; i++) {
      equity += trades[i].profit;
      points.push(equity);
    }
    var min = Math.min.apply(null, points);
    var max = Math.max.apply(null, points);
    var range = max - min || 1;
    var padding = range * 0.1;
    min -= padding; max += padding;

    ctx.clearRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = 'rgba(128,128,128,0.1)';
    ctx.lineWidth = 1;
    var gridLines = 5;
    for (var g = 0; g <= gridLines; g++) {
      var y = pad.top + chartH - (chartH * g / gridLines);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      var val = min + (range * g / gridLines);
      ctx.fillStyle = 'rgba(128,128,128,0.5)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('$' + val.toFixed(0), pad.left - 6, y + 3);
    }

    /* Line */
    var xStep = chartW / (points.length - 1 || 1);
    ctx.beginPath();
    var isPositive = points[points.length - 1] >= 0;
    ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    for (var p = 0; p < points.length; p++) {
      var x = pad.left + p * xStep;
      var y = pad.top + chartH - ((points[p] - min) / range * chartH);
      if (p === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    /* Fill */
    ctx.lineTo(pad.left + (points.length - 1) * xStep, pad.top + chartH);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    if (isPositive) {
      grad.addColorStop(0, 'rgba(34,197,94,0.15)');
      grad.addColorStop(1, 'rgba(34,197,94,0.01)');
    } else {
      grad.addColorStop(0, 'rgba(239,68,68,0.15)');
      grad.addColorStop(1, 'rgba(239,68,68,0.01)');
    }
    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* ===== DRAWDOWN CURVE ===== */
  function drawDrawdownCurve(trades) {
    var canvas = document.getElementById('btDDChart');
    if (!canvas) return;
    if (trades.length < 2) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    var W = rect.width, H = rect.height;
    var pad = { top: 20, right: 20, bottom: 30, left: 55 };
    var chartW = W - pad.left - pad.right;
    var chartH = H - pad.top - pad.bottom;

    var peak = 0;
    var equity = 0;
    var ddPoints = [];
    for (var i = 0; i < trades.length; i++) {
      equity += trades[i].profit;
      if (equity > peak) peak = equity;
      var dd = peak > 0 ? ((peak - equity) / peak * 100) : 0;
      ddPoints.push(Math.max(0, dd));
    }
    var maxDD = Math.max.apply(null, ddPoints) || 0.1;
    var minDD = 0;
    var range = maxDD - minDD || 0.1;
    var padding = range * 0.1;
    maxDD += padding;

    ctx.clearRect(0, 0, W, H);

    /* Grid */
    ctx.strokeStyle = 'rgba(128,128,128,0.1)';
    ctx.lineWidth = 1;
    var gridLines = 4;
    for (var g = 0; g <= gridLines; g++) {
      var y = pad.top + chartH - (chartH * g / gridLines);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      var val = minDD + (maxDD * g / gridLines);
      ctx.fillStyle = 'rgba(128,128,128,0.5)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(1) + '%', pad.left - 6, y + 3);
    }

    /* Fill area under DD curve */
    var xStep = chartW / (ddPoints.length - 1 || 1);
    ctx.beginPath();
    for (var p = 0; p < ddPoints.length; p++) {
      var x = pad.left + p * xStep;
      var y = pad.top + chartH - ((ddPoints[p] - minDD) / range * chartH);
      if (p === 0) ctx.moveTo(x, pad.top + chartH);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(pad.left + (ddPoints.length - 1) * xStep, pad.top + chartH);
    ctx.closePath();
    var grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, 'rgba(239,68,68,0.25)');
    grad.addColorStop(0.5, 'rgba(245,158,11,0.12)');
    grad.addColorStop(1, 'rgba(239,68,68,0.01)');
    ctx.fillStyle = grad;
    ctx.fill();

    /* Line on top */
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    for (var q = 0; q < ddPoints.length; q++) {
      var x2 = pad.left + q * xStep;
      var y2 = pad.top + chartH - ((ddPoints[q] - minDD) / range * chartH);
      if (q === 0) ctx.moveTo(x2, y2);
      else ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }

  /* ===== MONTHLY BAR CHART ===== */
  function drawMonthlyChart(stats) {
    var canvas = document.getElementById('btMonthlyChart');
    if (!canvas || !stats || !stats.monthly || stats.monthly.length < 2) {
      if (canvas) { var c = canvas.getContext('2d'); c.clearRect(0, 0, canvas.width, canvas.height); }
      return;
    }
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    var W = rect.width, H = rect.height;
    var pad = { top: 20, right: 15, bottom: 40, left: 50 };
    var chartW = W - pad.left - pad.right;
    var chartH = H - pad.top - pad.bottom;

    var data = stats.monthly;
    var vals = data.map(function (m) { return m.pnl; });
    var posMax = 0, negMin = 0;
    vals.forEach(function (v) { if (v > posMax) posMax = v; if (v < negMin) negMin = v; });
    var maxAbs = Math.max(posMax, Math.abs(negMin), 1);
    var range = maxAbs * 2.2;
    var zeroY = pad.top + chartH * (maxAbs * 1.1 / range);

    ctx.clearRect(0, 0, W, H);
    var barW = Math.min(30, chartW / data.length * 0.6);
    var gap = chartW / data.length;
    for (var i = 0; i < data.length; i++) {
      var x = pad.left + i * gap + (gap - barW) / 2;
      var barH = (data[i].pnl / range) * chartH;
      var y = data[i].pnl >= 0 ? zeroY - barH : zeroY;
      ctx.fillStyle = data[i].pnl >= 0 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)';
      ctx.fillRect(x, y, barW, Math.max(1, Math.abs(barH)));
      ctx.fillStyle = 'rgba(128,128,128,0.6)';
      ctx.font = '8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(data[i].month.slice(5), x + barW / 2, pad.top + chartH + 16);
    }
    /* Zero line */
    ctx.strokeStyle = 'rgba(128,128,128,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, zeroY);
    ctx.lineTo(W - pad.right, zeroY);
    ctx.stroke();
  }

  /* ===== FULL RENDER ===== */
  function renderAll() {
    var trades = loadTrades();
    trades.sort(function (a, b) { return (a.date || '') > (b.date || '') ? 1 : -1; });
    var stats = calcStats(trades);

    renderMetrics(stats);
    renderDetailed(stats);
    renderPairDist(stats);
    renderMonthly(stats);
    renderTable(trades);

    setTimeout(function () {
      drawEquityCurve(trades);
      drawDrawdownCurve(trades);
      drawMonthlyChart(stats);
    }, 100);

    /* Summary */
    var el = document.getElementById('btTradeSummary');
    if (el) el.innerHTML = '<strong>' + trades.length + '</strong> trades · <strong>$' + (stats ? stats.netProfit.toFixed(0) : '0') + '</strong> net P&L';
  }

  /* ===== ADD TRADE ===== */
  function addTrade(data) {
    var trades = loadTrades();
    var trade = {
      id: generateId(),
      date: data.date || new Date().toISOString().slice(0, 10),
      pair: data.pair,
      direction: data.direction,
      entry: parseFloat(data.entry),
      exit: parseFloat(data.exit),
      lotSize: parseFloat(data.lotSize) || 0.1,
      profit: 0,
      notes: data.notes || ''
    };
    /* Auto-calculate profit */
    if (!isNaN(trade.entry) && !isNaN(trade.exit)) {
      var multiplier = trade.direction === 'Buy' ? 1 : -1;
      var pipMultiplier = 1;
      if (trade.pair.indexOf('JPY') > -1) pipMultiplier = 100;
      else if (trade.pair.indexOf('XAU') > -1 || trade.pair.indexOf('XAG') > -1) pipMultiplier = 10;
      else pipMultiplier = 10000;
      var priceDiff = (trade.exit - trade.entry) * multiplier;
      var pipValue = trade.lotSize * 10;
      trade.profit = Math.round(priceDiff * pipMultiplier * pipValue * 100) / 100;
    }
    trades.push(trade);
    saveTrades(trades);
    renderAll();
  }

  /* ===== DELETE TRADE ===== */
  window.__btDelete = function (index) {
    var trades = loadTrades();
    trades.sort(function (a, b) { return (a.date || '') > (b.date || '') ? 1 : -1; });
    if (index >= 0 && index < trades.length) {
      trades.splice(index, 1);
      saveTrades(trades);
      renderAll();
    }
  };

  /* ===== EDIT TRADE ===== */
  window.__btEdit = function (index) {
    var trades = loadTrades();
    trades.sort(function (a, b) { return (a.date || '') > (b.date || '') ? 1 : -1; });
    var t = trades[index];
    if (!t) return;
    document.getElementById('bt-pair').value = t.pair;
    document.getElementById('bt-direction').value = t.direction;
    document.getElementById('bt-entry').value = t.entry;
    document.getElementById('bt-exit').value = t.exit;
    document.getElementById('bt-lots').value = t.lotSize;
    document.getElementById('bt-notes').value = t.notes || '';
    document.getElementById('bt-date').value = t.date || '';
    document.getElementById('bt-form-title').textContent = '✏️ Edit Trade';
    document.getElementById('bt-form').dataset.editId = t.id;

    /* Remove old trade */
    trades.splice(index, 1);
    saveTrades(trades);
    renderAll();
    document.getElementById('bt-form').scrollIntoView({ behavior: 'smooth' });
  };

  /* ===== CLEAR ALL ===== */
  function clearAll() {
    if (!confirm('Delete all backtest data?')) return;
    saveTrades([]);
    renderAll();
  }

  /* ===== CSV EXPORT ===== */
  function exportCSV() {
    var trades = loadTrades();
    if (!trades.length) { alert('No trades to export.'); return; }
    var rows = [['Date','Pair','Direction','Entry','Exit','LotSize','Profit','Notes'].join(',')];
    trades.forEach(function (t) {
      var notes = (t.notes || '').replace(/"/g, '""');
      rows.push([t.date || '', t.pair, t.direction, t.entry, t.exit, t.lotSize, t.profit, '"' + notes + '"'].join(','));
    });
    var csv = rows.join('\r\n');
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sirius_backtest_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /* ===== CSV IMPORT ===== */
  function importCSV() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        var text = ev.target.result;
        var lines = text.split('\n').filter(Boolean);
        if (lines.length < 2) { alert('CSV must have header + data rows.'); return; }
        var trades = loadTrades();
        var added = 0;
        for (var i = 1; i < lines.length; i++) {
          var parts = lines[i].split(',');
          if (parts.length < 7) continue;
          var profit = parseFloat(parts[6].trim());
          if (isNaN(profit)) continue;
          trades.push({
            id: generateId(),
            date: (parts[0] || '').trim(),
            pair: (parts[1] || '').trim(),
            direction: (parts[2] || 'Buy').trim(),
            entry: parseFloat(parts[3]) || 0,
            exit: parseFloat(parts[4]) || 0,
            lotSize: parseFloat(parts[5]) || 0.1,
            profit: profit,
            notes: (parts[7] || '').replace(/"/g, '').trim()
          });
          added++;
        }
        saveTrades(trades);
        renderAll();
        alert('Imported ' + added + ' trades successfully.');
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /* ===== QUICK FILL DEMO ===== */
  function fillDemoData() {
    var demo = [
      { date: '2026-01-05', pair: 'EUR/USD', direction: 'Buy',  entry: 1.0450, exit: 1.0520, lotSize: 0.1 },
      { date: '2026-01-08', pair: 'GBP/USD', direction: 'Buy',  entry: 1.2450, exit: 1.2530, lotSize: 0.2 },
      { date: '2026-01-12', pair: 'USD/JPY', direction: 'Sell', entry: 157.80, exit: 156.50, lotSize: 0.15 },
      { date: '2026-01-15', pair: 'XAU/USD', direction: 'Buy',  entry: 2670, exit: 2712, lotSize: 0.05 },
      { date: '2026-01-19', pair: 'EUR/USD', direction: 'Sell', entry: 1.0480, exit: 1.0440, lotSize: 0.2 },
      { date: '2026-01-22', pair: 'USD/CAD', direction: 'Buy',  entry: 1.4350, exit: 1.4410, lotSize: 0.1 },
      { date: '2026-01-26', pair: 'GBP/USD', direction: 'Sell', entry: 1.2500, exit: 1.2460, lotSize: 0.15 },
      { date: '2026-01-29', pair: 'EUR/USD', direction: 'Buy',  entry: 1.0420, exit: 1.0470, lotSize: 0.25 },
      { date: '2026-02-02', pair: 'XAU/USD', direction: 'Sell', entry: 2700, exit: 2682, lotSize: 0.08 },
      { date: '2026-02-05', pair: 'AUD/USD', direction: 'Buy',  entry: 0.6500, exit: 0.6580, lotSize: 0.2 },
      { date: '2026-02-09', pair: 'USD/JPY', direction: 'Buy',  entry: 158.20, exit: 159.10, lotSize: 0.1 },
      { date: '2026-02-12', pair: 'GBP/USD', direction: 'Buy',  entry: 1.2480, exit: 1.2550, lotSize: 0.15 },
      { date: '2026-02-16', pair: 'EUR/USD', direction: 'Sell', entry: 1.0500, exit: 1.0475, lotSize: 0.3 },
      { date: '2026-02-19', pair: 'USD/CAD', direction: 'Sell', entry: 1.4400, exit: 1.4340, lotSize: 0.12 },
      { date: '2026-02-23', pair: 'XAU/USD', direction: 'Buy',  entry: 2680, exit: 2725, lotSize: 0.06 },
      { date: '2026-02-26', pair: 'NZD/USD', direction: 'Buy',  entry: 0.6080, exit: 0.6150, lotSize: 0.15 },
      { date: '2026-03-02', pair: 'EUR/USD', direction: 'Buy',  entry: 1.0460, exit: 1.0510, lotSize: 0.2 },
      { date: '2026-03-05', pair: 'GBP/JPY', direction: 'Sell', entry: 197.50, exit: 195.80, lotSize: 0.1 },
      { date: '2026-03-09', pair: 'USD/JPY', direction: 'Sell', entry: 159.00, exit: 158.20, lotSize: 0.18 },
      { date: '2026-03-12', pair: 'XAU/USD', direction: 'Sell', entry: 2710, exit: 2685, lotSize: 0.07 },
      { date: '2026-03-16', pair: 'EUR/USD', direction: 'Buy',  entry: 1.0430, exit: 1.0495, lotSize: 0.22 },
      { date: '2026-03-19', pair: 'AUD/USD', direction: 'Sell', entry: 0.6550, exit: 0.6510, lotSize: 0.15 },
      { date: '2026-03-23', pair: 'GBP/USD', direction: 'Buy',  entry: 1.2520, exit: 1.2580, lotSize: 0.12 },
      { date: '2026-03-26', pair: 'USD/CAD', direction: 'Buy',  entry: 1.4380, exit: 1.4440, lotSize: 0.15 },
      { date: '2026-03-30', pair: 'EUR/USD', direction: 'Sell', entry: 1.0510, exit: 1.0470, lotSize: 0.2 },
      { date: '2026-04-02', pair: 'XAU/USD', direction: 'Buy',  entry: 2690, exit: 2730, lotSize: 0.1 },
      { date: '2026-04-06', pair: 'USD/JPY', direction: 'Buy',  entry: 157.50, exit: 158.30, lotSize: 0.15 },
      { date: '2026-04-09', pair: 'EUR/GBP', direction: 'Buy',  entry: 0.8350, exit: 0.8410, lotSize: 0.2 },
      { date: '2026-04-13', pair: 'GBP/USD', direction: 'Sell', entry: 1.2550, exit: 1.2505, lotSize: 0.18 },
      { date: '2026-04-16', pair: 'XAU/USD', direction: 'Sell', entry: 2720, exit: 2698, lotSize: 0.08 },
    ];
    var trades = loadTrades();
    demo.forEach(function (d) {
      var multiplier = d.direction === 'Buy' ? 1 : -1;
      var pipMultiplier = 1;
      if (d.pair.indexOf('JPY') > -1) pipMultiplier = 100;
      else if (d.pair.indexOf('XAU') > -1 || d.pair.indexOf('XAG') > -1) pipMultiplier = 10;
      else pipMultiplier = 10000;
      var priceDiff = (d.exit - d.entry) * multiplier;
      var pipValue = d.lotSize * 10;
      var profit = Math.round(priceDiff * pipMultiplier * pipValue * 100) / 100;
      trades.push({
        id: generateId(),
        date: d.date,
        pair: d.pair,
        direction: d.direction,
        entry: d.entry,
        exit: d.exit,
        lotSize: d.lotSize,
        profit: profit,
        notes: ''
      });
    });
    saveTrades(trades);
    renderAll();
  }

  /* ===== INIT ===== */
  function init() {
    var form = document.getElementById('bt-form');
    if (!form) return;

    /* Populate pair dropdown */
    var pairSel = document.getElementById('bt-pair');
    if (pairSel) {
      pairSel.innerHTML = PAIRS.map(function (p) {
        return '<option value="' + p + '">' + p + '</option>';
      }).join('');
    }

    /* Set default date */
    var dateInput = document.getElementById('bt-date');
    if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().slice(0, 10);

    /* Form submit */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        date: document.getElementById('bt-date').value,
        pair: document.getElementById('bt-pair').value,
        direction: document.getElementById('bt-direction').value,
        entry: document.getElementById('bt-entry').value,
        exit: document.getElementById('bt-exit').value,
        lotSize: document.getElementById('bt-lots').value,
        notes: document.getElementById('bt-notes').value
      };
      addTrade(data);
      form.reset();
      document.getElementById('bt-form-title').textContent = '➕ Add Trade';
      delete form.dataset.editId;
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
    });

    /* Buttons */
    document.getElementById('bt-clear')?.addEventListener('click', clearAll);
    document.getElementById('bt-export')?.addEventListener('click', exportCSV);
    document.getElementById('bt-import')?.addEventListener('click', importCSV);
    document.getElementById('bt-demo')?.addEventListener('click', fillDemoData);

    /* Initial render */
    renderAll();
  }

  /* Redraw charts on resize */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var trades = loadTrades();
      trades.sort(function (a, b) { return (a.date || '') > (b.date || '') ? 1 : -1; });
      var stats = calcStats(trades);
      drawEquityCurve(trades);
      drawDrawdownCurve(trades);
      drawMonthlyChart(stats);
    }, 300);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
