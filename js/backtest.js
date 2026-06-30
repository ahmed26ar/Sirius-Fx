// =====================================================
// SIRIUS FX — Chart-Based Strategy Backtester (Bar Replay)
// =====================================================
(function () {
  'use strict';

  /* ===== STATE ===== */
  var trades = [];
  var barData = [];
  var currentIndex = -1;
  var nextTradeId = 1;
  var isPlaying = false;
  var playTimer = null;
  var chart = null;
  var candlestickSeries = null;
  var equityLine = null;
  var replayLine = null;

  /* ===== CONSTANTS ===== */
  var PIP_VALUES = {
    'EUR/USD': 10, 'GBP/USD': 10, 'AUD/USD': 10, 'NZD/USD': 10,
    'USD/JPY': 9.5, 'EUR/JPY': 9.5, 'GBP/JPY': 9.5,
    'USD/CAD': 10, 'USD/CHF': 10,
    'XAU/USD': 100, 'XAG/USD': 50,
    'BTC/USD': 50, 'ETH/USD': 50,
  };
  var DEFAULT_PAIR = 'EUR/USD';
  var DEFAULT_LOTS = 0.1;
  var NUM_BARS = 500;

  /* ===== DOM REFS ===== */
  var $ = function (id) { return document.getElementById(id); };

  /* ===== INIT ===== */
  function init() {
    generateDemoData();
    initChart();
    bindControls();
    // Replay starts at first bar
    setCurrentBar(0);
    renderSummary();
  }

  /* ===== DEMO OHLC DATA ===== */
  function generateDemoData() {
    var data = [];
    var price = 1.0500;
    var dt = new Date('2024-01-01T00:00:00Z');
    var vol = 1000;
    for (var i = 0; i < NUM_BARS; i++) {
      var drift = 0.00002;
      var noise = (Math.random() - 0.5) * 0.002;
      var change = drift + noise;
      var open = price;
      var close = price + change;
      var hi = Math.max(open, close) + Math.random() * 0.001;
      var lo = Math.min(open, close) - Math.random() * 0.001;
      // Add occasional trends & volatility clusters
      if (i > 100 && i < 150) { close += 0.0005; hi += 0.0005; }
      if (i > 200 && i < 230) { close -= 0.0008; lo -= 0.0008; }
      if (i > 300 && i < 340) { close += 0.0012; hi += 0.0012; }
      if (i > 400 && i < 420) { close -= 0.0010; lo -= 0.0010; }
      price = close;
      if (i % 5 === 0) vol = 800 + Math.random() * 1200;
      else vol = vol * (0.8 + Math.random() * 0.4);
      var ts = Math.floor(dt.getTime() / 1000);
      data.push({ time: ts, open: open, high: hi, low: lo, close: close, volume: Math.round(vol) });
      dt.setHours(dt.getHours() + 1);
    }
    barData = data;
  }

  /* ===== LIGHTWEIGHT CHART ===== */
  function initChart() {
    var container = $('testerChart');
    if (!container) return;
    container.innerHTML = '';
    chart = LightweightCharts.createChart(container, {
      layout: {
        background: { color: 'transparent' },
        textColor: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: { color: 'rgba(0,212,255,0.4)', width: 1, style: LightweightCharts.LineStyle.Dashed },
        horzLine: { color: 'rgba(0,212,255,0.4)', width: 1, style: LightweightCharts.LineStyle.Dashed },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.08)' },
      timeScale: { borderColor: 'rgba(255,255,255,0.08)', timeVisible: false, fixLeftEdge: true, fixRightEdge: true },
      autoSize: true,
    });

    candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceFormat: { type: 'price', precision: 5, minMove: 0.00001 },
    });

    // Bar replay position line
    replayLine = chart.addLineSeries({
      color: 'rgba(0,212,255,0.7)',
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      lastValueVisible: false,
      priceLineVisible: false,
    });

    // Set data (all bars visible, replay line marks position)
    candlestickSeries.setData(barData);
    candlestickSeries.applyOptions({ baseLineVisible: false });

    // Click to add trade
    chart.subscribeCrosshairMove(function (param) {
      if (!param.time || !param.point) return;
      // Find nearest bar index
      var idx = findBarIndex(param.time);
      if (idx >= 0) $('btReplayBar').textContent = '#' + idx;
    });

    // Double-click to add trade at current replay position
    chart.subscribeClick(function (param) {
      if (!param.time || !param.point) return;
      var idx = findBarIndex(param.time);
      if (idx >= 0) {
        setCurrentBar(idx);
      }
    });

    // Theme changes
    document.addEventListener('themechange', function () {
      if (chart) {
        chart.applyOptions({
          layout: {
            textColor: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#94a3b8',
          },
        });
      }
    });
  }

  function findBarIndex(time) {
    for (var i = 0; i < barData.length; i++) {
      if (barData[i].time === time || (typeof time === 'number' && barData[i].time === Math.floor(time))) return i;
    }
    return -1;
  }

  /* ===== BAR REPLAY ===== */
  function setCurrentBar(idx) {
    if (idx < 0) idx = 0;
    if (idx >= barData.length) idx = barData.length - 1;
    currentIndex = idx;
    // Update replay vertical line
    var bar = barData[idx];
    replayLine.setData([
      { time: bar.time, value: bar.low - (bar.high - bar.low) * 0.2 },
      { time: bar.time, value: bar.high + (bar.high - bar.low) * 0.2 },
    ]);
    // Update slider
    var slider = $('btSlider');
    if (slider) { slider.value = idx; }
    // Update labels
    var lblBar = $('btReplayBar');
    var lblDate = $('btReplayDate');
    if (lblBar) lblBar.textContent = '#' + idx + ' / ' + (barData.length - 1);
    if (lblDate) {
      var d = new Date(bar.time * 1000);
      lblDate.textContent = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
    // Re-evaluate trades
    evaluateTrades();
    renderAll();
  }

  function stepForward() {
    if (currentIndex < barData.length - 1) setCurrentBar(currentIndex + 1);
    else pause();
  }

  function stepBack() {
    if (currentIndex > 0) setCurrentBar(currentIndex - 1);
  }

  function play() {
    if (isPlaying) return;
    if (currentIndex >= barData.length - 1) setCurrentBar(0);
    isPlaying = true;
    var btn = $('btPlayBtn');
    if (btn) btn.textContent = '⏸';
    var speedEl = $('btSpeed');
    var interval = speedEl ? parseInt(speedEl.value) : 200;
    playTimer = setInterval(function () {
      if (currentIndex < barData.length - 1) { stepForward(); }
      else { pause(); }
    }, interval);
  }

  function pause() {
    isPlaying = false;
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    var btn = $('btPlayBtn');
    if (btn) btn.textContent = '▶';
  }

  function togglePlay() { if (isPlaying) pause(); else play(); }

  function goStart_() { setCurrentBar(0); }
  function goEnd_() { setCurrentBar(barData.length - 1); }

  /* ===== TRADE MANAGEMENT ===== */
  function addTrade() {
    var direction = $('btDir').value;
    var lots = parseFloat($('btLots').value) || DEFAULT_LOTS;
    var slPips = parseFloat($('btSl').value) || 0;
    var tpPips = parseFloat($('btTp').value) || 0;
    var pair = DEFAULT_PAIR;

    if (currentIndex < 0 || currentIndex >= barData.length) return;
    var bar = barData[currentIndex];
    var entryPrice = bar.close;
    var pipVal = (PIP_VALUES[pair] || 10) * lots;
    var pipSize = pair.indexOf('JPY') > 0 ? 0.01 : pair.indexOf('XAU') > 0 || pair.indexOf('XAG') > 0 ? 0.1 : 0.0001;

    var slPrice = null;
    var tpPrice = null;
    if (slPips > 0) {
      slPrice = direction === 'Long' ? entryPrice - slPips * pipSize : entryPrice + slPips * pipSize;
    }
    if (tpPips > 0) {
      tpPrice = direction === 'Long' ? entryPrice + tpPips * pipSize : entryPrice - tpPips * pipSize;
    }

    trades.push({
      id: nextTradeId++,
      pair: pair,
      direction: direction,
      lots: lots,
      entryBar: currentIndex,
      entryTime: bar.time,
      entryPrice: entryPrice,
      slPrice: slPrice,
      tpPrice: tpPrice,
      exitBar: null,
      exitTime: null,
      exitPrice: null,
      pnl: null,
      status: 'open',
    });

    renderAll();
    renderFormFeedback('✅ Trade added at bar #' + currentIndex + ' (' + entryPrice.toFixed(5) + ')', 'pos');
  }

  function evaluateTrades() {
    for (var i = 0; i < trades.length; i++) {
      var t = trades[i];
      if (t.status !== 'open') continue;
      if (t.entryBar >= currentIndex) continue; // not yet entered
      var pipVal = (PIP_VALUES[t.pair] || 10) * t.lots;

      // Check if SL/TP hit between entryBar+1 and currentIndex
      var hit = false;
      for (var b = t.entryBar + 1; b <= currentIndex && b < barData.length; b++) {
        var bar = barData[b];
        if (t.direction === 'Long') {
          if (t.slPrice !== null && bar.low <= t.slPrice) {
            // SL hit
            t.exitBar = b;
            t.exitTime = bar.time;
            t.exitPrice = t.slPrice;
            t.status = 'closed';
            t.pnl = (t.exitPrice - t.entryPrice) / 0.0001 * pipVal;
            hit = true;
            break;
          }
          if (t.tpPrice !== null && bar.high >= t.tpPrice) {
            t.exitBar = b;
            t.exitTime = bar.time;
            t.exitPrice = t.tpPrice;
            t.status = 'closed';
            t.pnl = (t.exitPrice - t.entryPrice) / 0.0001 * pipVal;
            hit = true;
            break;
          }
        } else {
          if (t.slPrice !== null && bar.high >= t.slPrice) {
            t.exitBar = b;
            t.exitTime = bar.time;
            t.exitPrice = t.slPrice;
            t.status = 'closed';
            t.pnl = (t.entryPrice - t.exitPrice) / 0.0001 * pipVal;
            hit = true;
            break;
          }
          if (t.tpPrice !== null && bar.low <= t.tpPrice) {
            t.exitBar = b;
            t.exitTime = bar.time;
            t.exitPrice = t.tpPrice;
            t.status = 'closed';
            t.pnl = (t.entryPrice - t.exitPrice) / 0.0001 * pipVal;
            hit = true;
            break;
          }
        }
      }
      if (!hit && currentIndex > t.entryBar) {
        // Not closed yet — mark as open at current price
        t.exitBar = null;
        t.exitTime = null;
        t.exitPrice = null;
        t.pnl = null;
      }
    }
  }

  function deleteTrade(id) {
    trades = trades.filter(function (t) { return t.id !== id; });
    renderAll();
  }

  function clearAllTrades() {
    if (trades.length === 0) return;
    if (!confirm('مسح جميع الصفقات؟')) return;
    trades = [];
    renderAll();
  }

  /* ===== RENDER ===== */
  function renderAll() {
    renderMetrics();
    renderTradeTable();
    renderEquityCurve();
    updateChartMarkers();
    renderSummary();
  }

  function renderMetrics() {
    var el = $('btMetrics');
    if (!el) return;
    var stats = calcStats();
    if (!stats) {
      el.innerHTML = '<div class="bt-metric" style="grid-column:1/-1;padding:32px"><div class="bt-metric-label">حرك الشريط أو أضف صفقة لبدء التحليل</div></div>';
      return;
    }
    el.innerHTML =
      '<div class="bt-metric"><div class="bt-metric-label">Net P&L</div><div class="bt-metric-val ' + (stats.netPnl >= 0 ? 'pos' : 'neg') + '">' + (stats.netPnl >= 0 ? '+' : '') + '$' + stats.netPnl.toFixed(0) + '</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-label">Win Rate</div><div class="bt-metric-val pos">' + stats.winRate.toFixed(1) + '%</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-label">Profit Factor</div><div class="bt-metric-val ' + (stats.profitFactor >= 1.5 ? 'pos' : 'neg') + '">' + (stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)) + '</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-label">Total Trades</div><div class="bt-metric-val">' + stats.total + '</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-label">Avg RR</div><div class="bt-metric-val">' + stats.avgRR.toFixed(2) + '</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-label">Max DD</div><div class="bt-metric-val neg">' + stats.maxDDpct.toFixed(1) + '%</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-label">Sharpe</div><div class="bt-metric-val ' + (stats.sharpe >= 1 ? 'pos' : 'neg') + '">' + stats.sharpe.toFixed(2) + '</div></div>' +
      '<div class="bt-metric"><div class="bt-metric-label">Expectancy</div><div class="bt-metric-val ' + (stats.expectancy >= 0 ? 'pos' : 'neg') + '">$' + stats.expectancy.toFixed(2) + '</div></div>';
  }

  function calcStats() {
    var closedTrades = trades.filter(function (t) { return t.status === 'closed' || (t.status === 'open' && currentIndex > t.entryBar); });
    // For open trades past entry, compute unrealized P&L
    var allForPnl = trades.filter(function (t) { return t.entryBar < currentIndex; });
    if (allForPnl.length === 0) return null;

    var wins = 0, losses = 0;
    var grossProfit = 0, grossLoss = 0;
    var totalPnl = 0;
    var returns = [];
    var tradeR = [];

    for (var i = 0; i < allForPnl.length; i++) {
      var t = allForPnl[i];
      var pnl;
      if (t.status === 'closed' && t.pnl !== null) {
        pnl = t.pnl;
      } else if (t.status === 'open' && currentIndex > t.entryBar) {
        // Unrealized P&L at current bar close
        var curBar = barData[currentIndex];
        var direction = t.direction;
        pnl = direction === 'Long'
          ? (curBar.close - t.entryPrice) / 0.0001 * (PIP_VALUES[t.pair] || 10) * t.lots
          : (t.entryPrice - curBar.close) / 0.0001 * (PIP_VALUES[t.pair] || 10) * t.lots;
      } else { continue; }

      totalPnl += pnl;
      if (pnl > 0) { wins++; grossProfit += pnl; }
      else { losses++; grossLoss += Math.abs(pnl); }
      if (t.entryPrice) {
        var rMultiple = pnl / ((PIP_VALUES[t.pair] || 10) * t.lots * 10);
        tradeR.push(rMultiple);
        returns.push(pnl);
      }
    }

    var total = wins + losses;
    if (total === 0) return null;

    var winRate = total > 0 ? (wins / total) * 100 : 0;
    var profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    var avgWin = wins > 0 ? grossProfit / wins : 0;
    var avgLoss = losses > 0 ? grossLoss / losses : 0;
    var avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Max drawdown (equity curve)
    var equity = 0;
    var peak = 0;
    var maxDD = 0;
    var maxDDpct = 0;
    for (var j = 0; j < allForPnl.length; j++) {
      var tp = allForPnl[j];
      var p;
      if (tp.status === 'closed' && tp.pnl !== null) { p = tp.pnl; }
      else if (tp.status === 'open' && currentIndex > tp.entryBar) {
        var cb = barData[currentIndex];
        p = tp.direction === 'Long'
          ? (cb.close - tp.entryPrice) / 0.0001 * (PIP_VALUES[tp.pair] || 10) * tp.lots
          : (tp.entryPrice - cb.close) / 0.0001 * (PIP_VALUES[tp.pair] || 10) * tp.lots;
      } else { continue; }
      equity += p;
      if (equity > peak) peak = equity;
      var dd = peak - equity;
      var ddpct = peak > 0 ? (dd / peak) * 100 : 0;
      if (dd > maxDD) maxDD = dd;
      if (ddpct > maxDDpct) maxDDpct = ddpct;
    }

    // Sharpe ratio (based on trade returns)
    var avgReturn = returns.length > 0 ? returns.reduce(function (a, b) { return a + b; }, 0) / returns.length : 0;
    var variance = returns.length > 1 ? returns.reduce(function (sum, r) { return sum + (r - avgReturn) * (r - avgReturn); }, 0) / (returns.length - 1) : 0;
    var stdDev = Math.sqrt(variance);
    var sharpe = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    var expectancy = total > 0 ? totalPnl / total : 0;

    return {
      total: total, wins: wins, losses: losses, winRate: winRate,
      grossProfit: grossProfit, grossLoss: grossLoss,
      profitFactor: profitFactor, avgWin: avgWin, avgLoss: avgLoss,
      avgRR: avgRR, netPnl: totalPnl,
      maxDD: maxDD, maxDDpct: maxDDpct,
      sharpe: sharpe, expectancy: expectancy,
    };
  }

  function renderTradeTable() {
    var tbody = $('btTradeBody');
    if (!tbody) return;
    if (trades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="bt-empty">لا توجد صفقات — أضف صفقة باستخدام النموذج على اليمين</td></tr>';
      return;
    }
    var html = '';
    for (var i = trades.length - 1; i >= 0; i--) {
      var t = trades[i];
      var bar = barData[t.entryBar];
      var entryDate = bar ? new Date(bar.time * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';
      var pnlStr = t.pnl !== null ? (t.pnl >= 0 ? '+' : '') + '$' + t.pnl.toFixed(0) : (t.status === 'open' && currentIndex > t.entryBar ? '🔄' : '⏳');
      var pnlClass = t.pnl !== null ? (t.pnl >= 0 ? 'pos' : 'neg') : '';
      html += '<tr>' +
        '<td>' + t.pair + '</td>' +
        '<td class="' + t.direction.toLowerCase() + '">' + t.direction + '</td>' +
        '<td>' + t.entryPrice.toFixed(5) + '</td>' +
        '<td>' + (t.exitPrice !== null ? t.exitPrice.toFixed(5) : '—') + '</td>' +
        '<td>' + t.lots + '</td>' +
        '<td class="' + pnlClass + '">' + pnlStr + '</td>' +
        '<td>' + entryDate + '</td>' +
        '<td><button class="btn-icon" onclick="window._btDeleteTrade(' + t.id + ')" title="حذف">✕</button></td>' +
        '</tr>';
    }
    tbody.innerHTML = html;
  }

  function updateChartMarkers() {
    if (!candlestickSeries) return;
    var markers = [];
    for (var i = 0; i < trades.length; i++) {
      var t = trades[i];
      if (t.entryBar > currentIndex) continue;
      var bar = barData[t.entryBar];
      if (!bar) continue;
      markers.push({
        time: bar.time,
        position: t.direction === 'Long' ? 'belowBar' : 'aboveBar',
        color: t.direction === 'Long' ? '#22c55e' : '#ef4444',
        shape: t.direction === 'Long' ? 'arrowUp' : 'arrowDown',
        text: (t.direction === 'Long' ? 'B' : 'S') + t.id,
        size: 1.5,
      });
      if (t.exitBar !== null && t.exitTime !== null && t.exitBar <= currentIndex) {
        markers.push({
          time: t.exitTime,
          position: 'inBar',
          color: '#f59e0b',
          shape: 'circle',
          text: 'X' + t.id,
          size: 1,
        });
      }
    }
    candlestickSeries.setMarkers(markers);
  }

  /* ===== EQUITY CURVE (Canvas) ===== */
  function renderEquityCurve() {
    var canvas = $('btEquityCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var DPR = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * DPR;
    canvas.height = rect.height * DPR;
    ctx.scale(DPR, DPR);
    var W = rect.width, H = rect.height;

    var activeTrades = trades.filter(function (t) { return t.entryBar < currentIndex; });
    if (activeTrades.length < 2) {
      ctx.fillStyle = 'rgba(148,163,184,0.3)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('أضف صفقتين على الأقل لرسم منحنى رأس المال', W / 2, H / 2);
      return;
    }

    var eq = [];
    var running = 0;
    var maxEq = -Infinity, minEq = Infinity;
    for (var i = 0; i < activeTrades.length; i++) {
      var t = activeTrades[i];
      var pnl;
      if (t.status === 'closed' && t.pnl !== null) { pnl = t.pnl; }
      else if (t.status === 'open' && currentIndex > t.entryBar) {
        var cb = barData[currentIndex];
        pnl = t.direction === 'Long'
          ? (cb.close - t.entryPrice) / 0.0001 * (PIP_VALUES[t.pair] || 10) * t.lots
          : (t.entryPrice - cb.close) / 0.0001 * (PIP_VALUES[t.pair] || 10) * t.lots;
      } else { continue; }
      running += pnl;
      eq.push(running);
      if (running > maxEq) maxEq = running;
      if (running < minEq) minEq = running;
    }

    if (eq.length < 2) return;
    var range = maxEq - minEq || 1;
    var pad = 20;
    var plotH = H - pad * 2;
    var plotW = W - pad * 2;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (var g = 0; g < 4; g++) {
      var gy = pad + (plotH / 4) * g;
      ctx.beginPath(); ctx.moveTo(pad, gy); ctx.lineTo(W - pad, gy); ctx.stroke();
    }

    // Fill gradient
    var grad = ctx.createLinearGradient(0, pad, 0, H - pad);
    grad.addColorStop(0, eq[eq.length - 1] >= eq[0] ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)');
    grad.addColorStop(1, 'rgba(34,197,94,0.01)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(pad, H - pad);
    for (var p = 0; p < eq.length; p++) {
      var x = pad + (p / (eq.length - 1)) * plotW;
      var y = pad + plotH - ((eq[p] - minEq) / range) * plotH;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(pad + plotW, H - pad);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = eq[eq.length - 1] >= eq[0] ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (var q = 0; q < eq.length; q++) {
      var xq = pad + (q / (eq.length - 1)) * plotW;
      var yq = pad + plotH - ((eq[q] - minEq) / range) * plotH;
      if (q === 0) ctx.moveTo(xq, yq); else ctx.lineTo(xq, yq);
    }
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + maxEq.toFixed(0), W - pad, pad + 10);
    ctx.fillText('$' + minEq.toFixed(0), W - pad, H - pad);
  }

  function renderSummary() {
    var el = $('btTradeSummary');
    if (!el) return;
    var stats = calcStats();
    var count = trades.length;
    var pnl = stats ? stats.netPnl : 0;
    el.textContent = count + ' trades · ' + (pnl >= 0 ? '+' : '') + '$' + (pnl ? pnl.toFixed(0) : '0') + ' net P&L';
  }

  function renderFormFeedback(msg, cls) {
    var el = $('btFormFeedback');
    if (!el) return;
    el.textContent = msg;
    el.className = 'bt-form-feedback ' + (cls || '');
    el.style.display = 'block';
    setTimeout(function () { el.style.display = 'none'; }, 3000);
  }

  /* ===== BINDINGS ===== */
  function bindControls() {
    var slider = $('btSlider');
    if (slider) {
      slider.max = barData.length - 1;
      slider.addEventListener('input', function () { setCurrentBar(parseInt(this.value)); });
    }

    var playBtn = $('btPlayBtn');
    if (playBtn) playBtn.addEventListener('click', togglePlay);

    var elFwd = $('btStepFwd');
    if (elFwd) elFwd.addEventListener('click', stepForward);

    var elBack = $('btStepBack');
    if (elBack) elBack.addEventListener('click', stepBack);

    var elStart = $('btGoStart');
    if (elStart) elStart.addEventListener('click', goStart_);

    var elEnd = $('btGoEnd');
    if (elEnd) elEnd.addEventListener('click', goEnd_);

    var speedSel = $('btSpeed');
    if (speedSel) {
      speedSel.addEventListener('change', function () {
        if (isPlaying) { pause(); play(); }
      });
    }

    var clearBtn = $('btClear');
    if (clearBtn) clearBtn.addEventListener('click', clearAllTrades);

    var addBtn = $('btAddBtn');
    if (addBtn) addBtn.addEventListener('click', function (e) {
      e.preventDefault();
      addTrade();
    });
  }

  /* ===== EXPOSE FOR INLINE HTML ===== */
  window._btDeleteTrade = function (id) { deleteTrade(id); };

  /* ===== BOOT ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
