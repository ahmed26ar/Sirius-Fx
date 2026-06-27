function analyzeSetup(trend, rr, risk, session) {
  let score = 50;
  const notes = [];

  if (trend === 'with') { score += 20; notes.push('✓ With-trend setup (+20)'); }
  else if (trend === 'range') { score += 5; notes.push('~ Range-bound market (+5)'); }
  else { score -= 15; notes.push('✗ Counter-trend trade (-15)'); }

  if (rr >= 3) { score += 20; notes.push('✓ Excellent R:R ≥ 3 (+20)'); }
  else if (rr >= 2) { score += 15; notes.push('✓ Good R:R ≥ 2 (+15)'); }
  else if (rr >= 1.5) { score += 5; notes.push('~ Acceptable R:R (+5)'); }
  else { score -= 20; notes.push('✗ Poor R:R < 1.5 (-20)'); }

  if (risk <= 1) { score += 10; notes.push('✓ Conservative risk ≤ 1% (+10)'); }
  else if (risk <= 2) { score += 0; notes.push('~ Moderate risk 1-2%'); }
  else { score -= 15; notes.push('✗ High risk > 2% (-15)'); }

  const sessionScores = { london: 10, ny: 10, overlap: 15, asia: -5 };
  score += sessionScores[session] || 0;
  notes.push('Session: ' + session + ' (' + (sessionScores[session] >= 0 ? '+' : '') + sessionScores[session] + ')');

  score = Math.max(0, Math.min(100, score));
  let grade, cls;
  if (score >= 80) { grade = 'A+ Excellent'; cls = 'result-good'; }
  else if (score >= 65) { grade = 'B Good'; cls = 'result-good'; }
  else if (score >= 50) { grade = 'C Average'; cls = 'result-warn'; }
  else { grade = 'D Weak'; cls = 'result-bad'; }

  return { score, grade, cls, notes };
}

function detectPattern(o, h, l, c) {
  const body = Math.abs(c - o);
  const range = h - l;
  const upperWick = h - Math.max(o, c);
  const lowerWick = Math.min(o, c) - l;
  const patterns = [];

  if (range === 0) return ['Invalid candle data'];

  if (body / range < 0.1) patterns.push('Doji — market indecision, potential reversal');
  if (lowerWick > body * 2 && upperWick < body * 0.5 && c > o)
    patterns.push('Hammer — bullish reversal signal');
  if (upperWick > body * 2 && lowerWick < body * 0.5 && c < o)
    patterns.push('Shooting Star — bearish reversal signal');
  if (body / range > 0.7 && c > o) patterns.push('Strong Bullish Marubozu');
  if (body / range > 0.7 && c < o) patterns.push('Strong Bearish Marubozu');
  if (lowerWick > range * 0.6) patterns.push('Long lower shadow — buying pressure');
  if (upperWick > range * 0.6) patterns.push('Long upper shadow — selling pressure');

  return patterns.length ? patterns : ['No significant pattern detected'];
}

function analyzeJournal(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (!lines.length) return null;

  const trades = lines.map(function(line) {
    const parts = line.split(/[,\s]+/);
    return { profit: parseFloat(parts[0]), pips: parseFloat(parts[1] || 0) };
  });

  const wins = trades.filter(function(t) { return t.profit > 0; });
  const losses = trades.filter(function(t) { return t.profit <= 0; });
  const winRate = (wins.length / trades.length * 100).toFixed(1);
  const totalProfit = trades.reduce(function(s, t) { return s + t.profit; }, 0);
  const avgWin = wins.length ? wins.reduce(function(s, t) { return s + t.profit; }, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce(function(s, t) { return s + t.profit; }, 0) / losses.length) : 0;
  const expectancy = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss);
  const profitFactor = avgLoss > 0 ? (wins.reduce(function(s, t) { return s + t.profit; }, 0) / Math.abs(losses.reduce(function(s, t) { return s + t.profit; }, 0))).toFixed(2) : '∞';

  let insight;
  if (expectancy > 0 && parseFloat(winRate) >= 50) insight = 'Strong edge — maintain discipline';
  else if (expectancy > 0) insight = 'Positive expectancy despite low win rate — let winners run';
  else if (parseFloat(winRate) >= 60) insight = 'High win rate but negative expectancy — cut losses faster';
  else insight = 'Negative expectancy — review strategy and risk management';

  return { trades: trades.length, winRate, totalProfit: totalProfit.toFixed(2), avgWin: avgWin.toFixed(2), avgLoss: avgLoss.toFixed(2), expectancy: expectancy.toFixed(2), profitFactor, insight };
}

/* ===== AI MARKET SUMMARY ===== */
function getMarketSummary() {
  var rates = window.SiriusRates || {};
  var pairs = Object.keys(rates).filter(function (k) { return k !== 'timestamp' && rates[k] && rates[k] !== '—'; });
  if (!pairs.length) return Promise.reject('No live rates available');

  var snapshot = pairs.map(function (p) { return p + ': ' + rates[p]; }).join(', ');
  var lang = typeof currentLang !== 'undefined' ? currentLang : 'ar';
  var prompt = lang === 'ar'
    ? 'أنت محلل أسواق مالية خبير. حلل الأسواق التالية بناءً على هذه الأسعار الحية:\n' + snapshot + '\n\nقدم تحليلاً شاملاً يحتوي:\n1. نظرة عامة على السوق\n2. أهم مستويات الدعم والمقاومة لكل زوج\n3. تحليل الاتجاه العام\n4. فرص تداول محتملة\n5. توقعات قصيرة المدى\n\nاجعل الرد منسقاً ومنظماً.'
    : 'You are a financial market expert. Analyze these markets based on live rates:\n' + snapshot + '\n\nProvide a comprehensive analysis including:\n1. Market overview\n2. Key support/resistance levels\n3. Overall trend analysis\n4. Potential trading opportunities\n5. Short-term outlook\n\nFormat the response clearly.';

  var apiUrl = (window.SiriusConfig && window.SiriusConfig.apiBase) || 'https://siriusfx.6611zzrru.workers.dev';
  return fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, lang: lang })
  }).then(function (res) {
    if (!res.ok) throw new Error('API error');
    return res.json();
  }).then(function (data) {
    return data.reply || (lang === 'ar' ? '⚠️ لم أستطع تحليل السوق حالياً.' : '⚠️ Could not analyze the market right now.');
  });
}

/* ===== SHARED AI HELPER ===== */
function callAI(prompt, lang) {
  var apiUrl = (window.SiriusConfig && window.SiriusConfig.apiBase) || 'https://siriusfx.6611zzrru.workers.dev';
  return fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, lang: lang || 'ar' })
  }).then(function (res) {
    if (!res.ok) throw new Error('API error');
    return res.json();
  }).then(function (data) {
    return data.reply || (lang === 'ar' ? '⚠️ لم أستطع الإجابة حالياً.' : '⚠️ Could not respond right now.');
  });
}

/* ===== AI TRADE ASSISTANT ===== */
function getTradePlan(data) {
  var lang = typeof currentLang !== 'undefined' ? currentLang : 'ar';
  var prompt = lang === 'ar'
    ? 'أنت مستشار تداول خبير في الأسواق المالية. بناءً على المعلومات التالية، قدم خطة تداول كاملة ومفصلة:\n\n'
    + 'الزوج: ' + data.pair + '\n'
    + 'الاتجاه: ' + data.direction + '\n'
    + 'سعر الدخول: ' + data.entry + '\n'
    + 'وقف الخسارة: ' + data.sl + '\n'
    + (data.tp ? 'جني الأرباح: ' + data.tp + '\n' : '')
    + 'المخاطرة: ' + data.risk + '%\n'
    + (data.notes ? 'ملاحظات إضافية: ' + data.notes + '\n' : '')
    + '\nقدم تحليلك بالشكل التالي:\n'
    + '📊 تحليل الصفقة — تقييم الفرصة\n'
    + '🎯 نسبة المخاطرة للعائد — حساب دقيق\n'
    + '🛡 إدارة المخاطرة — جودة الإعداد\n'
    + '💡 التوصية — قرار واضح (يدخل / ينتظر / يلغي)'
    : 'You are an expert trading advisor in financial markets. Based on this information, provide a complete and detailed trade plan:\n\n'
    + 'Pair: ' + data.pair + '\n'
    + 'Direction: ' + data.direction + '\n'
    + 'Entry Price: ' + data.entry + '\n'
    + 'Stop Loss: ' + data.sl + '\n'
    + (data.tp ? 'Take Profit: ' + data.tp + '\n' : '')
    + 'Risk: ' + data.risk + '%\n'
    + (data.notes ? 'Additional Notes: ' + data.notes + '\n' : '')
    + '\nFormat your analysis as:\n'
    + '📊 Trade Analysis — opportunity assessment\n'
    + '🎯 Risk:Reward Ratio — precise calculation\n'
    + '🛡 Risk Management — setup quality\n'
    + '💡 Recommendation — clear decision (enter / wait / skip)';

  return callAI(prompt, lang);
}

/* ===== AI NEWS SENTIMENT ===== */
function analyzeSentiment(text) {
  var lang = typeof currentLang !== 'undefined' ? currentLang : 'ar';
  var prompt = lang === 'ar'
    ? 'أنت محلل أخبار أسواق مالية خبير. حلل المشاعر (Sentiment) للنص التالي بدقة:\n\n'
    + text + '\n\n'
    + 'قدم تحليلك بالشكل التالي:\n'
    + '📰 المشاعر العامة: (إيجابي / سلبي / محايد)\n'
    + '📊 درجة التأثير: /10\n'
    + '🎯 الأزواج والأسواق المتأثرة:\n'
    + '💡 نصيحة للمتداول:\n'
    + '📌 ملخص سريع'
    : 'You are a financial news sentiment analyst. Analyze the sentiment of this text:\n\n'
    + text + '\n\n'
    + 'Format your analysis as:\n'
    + '📰 Overall Sentiment: (Positive / Negative / Neutral)\n'
    + '📊 Impact Score: /10\n'
    + '🎯 Affected Pairs & Markets:\n'
    + '💡 Trading Advice:\n'
    + '📌 Quick Summary';

  return callAI(prompt, lang);
}

/* ===== PORTFOLIO RISK ANALYZER ===== */
function analyzePortfolio(data) {
  var lang = typeof currentLang !== 'undefined' ? currentLang : 'ar';
  var lines = data.trades.trim().split('\n').filter(Boolean);
  var trades = lines.map(function (l) {
    var p = l.split(/[,\s]+/).filter(Boolean);
    return { pair: p[0] || '?', lots: parseFloat(p[1]) || 0, side: p[2] || '?', entry: parseFloat(p[3]) || 0, exit: parseFloat(p[4]) || 0, profit: parseFloat(p[5]) || 0 };
  });
  var balance = parseFloat(data.balance) || 10000;

  var winTrades = trades.filter(function (t) { return t.profit > 0; });
  var lossTrades = trades.filter(function (t) { return t.profit <= 0; });
  var totalPL = trades.reduce(function (s, t) { return s + t.profit; }, 0);
  var winRate = trades.length ? (winTrades.length / trades.length * 100).toFixed(1) : 0;
  var avgWin = winTrades.length ? winTrades.reduce(function (s, t) { return s + t.profit; }, 0) / winTrades.length : 0;
  var avgLoss = lossTrades.length ? Math.abs(lossTrades.reduce(function (s, t) { return s + t.profit; }, 0) / lossTrades.length) : 0;
  var profitFactor = avgLoss > 0 ? (winTrades.reduce(function (s, t) { return s + t.profit; }, 0) / Math.abs(lossTrades.reduce(function (s, t) { return s + t.profit; }, 0))).toFixed(2) : '∞';
  var maxDrawdown = 0, runningPL = 0;
  trades.forEach(function (t) { runningPL += t.profit; if (runningPL < maxDrawdown) maxDrawdown = runningPL; });
  var riskRatio = balance > 0 ? (Math.abs(totalPL) / balance * 100).toFixed(1) : 0;

  var stats = 'Trades: ' + trades.length + ' | Win Rate: ' + winRate + '% | Total P&L: $' + totalPL.toFixed(2) + '\n'
    + 'Avg Win: $' + avgWin.toFixed(2) + ' | Avg Loss: $' + avgLoss.toFixed(2) + ' | PF: ' + profitFactor + '\n'
    + 'Max Drawdown: $' + maxDrawdown.toFixed(2) + ' | Risk Ratio: ' + riskRatio + '% of balance';

  var prompt = lang === 'ar'
    ? 'أنت محلل مخاطر مالية خبير. حلل بيانات المحفظة التالية وقدم تقييماً شاملاً:\n\n'
    + stats + '\n\n'
    + 'قدم:\n'
    + '📊 تقييم المخاطر العام\n'
    + '✅ نقاط القوة\n'
    + '⚠️ نقاط الضعف\n'
    + '💡 توصيات قابلة للتنفيذ لتحسين الأداء'
    : 'You are a financial risk analyst. Analyze this portfolio data and provide a comprehensive assessment:\n\n'
    + stats + '\n\n'
    + 'Provide:\n'
    + '📊 Overall Risk Assessment\n'
    + '✅ Strengths\n'
    + '⚠️ Weaknesses\n'
    + '💡 Actionable Recommendations';

  return callAI(prompt, lang).then(function (reply) {
    return { html: '<div class="portfolio-stats">' + stats.replace(/\n/g, '<br>') + '</div><div class="summary-response" style="margin-top:12px">' + reply.replace(/\n/g, '<br>') + '</div>' };
  });
}

/* ===== MULTI-CANDLE PATTERN DETECTION ===== */
function detectMultiCandle(data) {
  var lines = data.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { patterns: ['Enter at least 2 candles'], strength: 0 };

  var candles = lines.map(function (line, i) {
    var parts = line.split(/[,\s]+/).map(parseFloat).filter(function (n) { return !isNaN(n); });
    if (parts.length < 4) return null;
    return { o: parts[0], h: parts[1], l: parts[2], c: parts[3], idx: i };
  }).filter(Boolean);

  if (candles.length < 2) return { patterns: ['Invalid candle data — each line needs O,H,L,C'], strength: 0 };

  var patterns = [];
  var maxStrength = 0;

  for (var i = 1; i < candles.length; i++) {
    var prev = candles[i - 1], curr = candles[i];
    var prevBull = prev.c > prev.o;
    var currBull = curr.c > curr.o;
    var prevBody = Math.abs(prev.c - prev.o);
    var currBody = Math.abs(curr.c - curr.o);

    // Bullish Engulfing
    if (!prevBull && currBull && curr.o < prev.c && curr.c > prev.o) {
      patterns.push('Candle ' + (i + 1) + ': ⬆ Bullish Engulfing — strong reversal signal');
      maxStrength = Math.max(maxStrength, 85);
    }
    // Bearish Engulfing
    if (prevBull && !currBull && curr.o > prev.c && curr.c < prev.o) {
      patterns.push('Candle ' + (i + 1) + ': ⬇ Bearish Engulfing — strong reversal signal');
      maxStrength = Math.max(maxStrength, 85);
    }
    // Bullish Harami
    if (!prevBull && currBull && curr.o > prev.c && curr.c < prev.o) {
      patterns.push('Candle ' + (i + 1) + ': Bullish Harami — potential trend reversal');
      maxStrength = Math.max(maxStrength, 60);
    }
    // Bearish Harami
    if (prevBull && !currBull && curr.o < prev.c && curr.c > prev.o) {
      patterns.push('Candle ' + (i + 1) + ': Bearish Harami — potential trend reversal');
      maxStrength = Math.max(maxStrength, 60);
    }
    // Piercing Line
    if (!prevBull && currBull && curr.o < prev.o && curr.c > (prev.o + prev.c) / 2 && curr.c < prev.o) {
      patterns.push('Candle ' + (i + 1) + ': Piercing Line — bullish reversal signal');
      maxStrength = Math.max(maxStrength, 70);
    }
    // Dark Cloud Cover
    if (prevBull && !currBull && curr.o > prev.o && curr.c < (prev.o + prev.c) / 2 && curr.c > prev.o) {
      patterns.push('Candle ' + (i + 1) + ': Dark Cloud Cover — bearish reversal signal');
      maxStrength = Math.max(maxStrength, 70);
    }
    // Tweezer Top
    if (Math.abs(prev.h - curr.h) / ((prev.h + curr.h) / 2) < 0.001 && prevBull && !currBull) {
      patterns.push('Candle ' + (i + 1) + ': Tweezer Top — bearish reversal at resistance');
      maxStrength = Math.max(maxStrength, 75);
    }
    // Tweezer Bottom
    if (Math.abs(prev.l - curr.l) / ((prev.l + curr.l) / 2) < 0.001 && !prevBull && currBull) {
      patterns.push('Candle ' + (i + 1) + ': Tweezer Bottom — bullish reversal at support');
      maxStrength = Math.max(maxStrength, 75);
    }
  }

  // Three-candle patterns
  if (candles.length >= 3) {
    for (var i = 2; i < candles.length; i++) {
      var c1 = candles[i - 2], c2 = candles[i - 1], c3 = candles[i];
      var b1 = c1.c > c1.o, b2 = c2.c > c2.o, b3 = c3.c > c3.o;

      // Morning Star
      if (!b1 && Math.abs(c1.c - c1.o) / (c1.h - c1.l || 0.001) > 0.5 &&
          Math.abs(c2.c - c2.o) / (c2.h - c2.l || 0.001) < 0.2 &&
          b3 && Math.abs(c3.c - c3.o) / (c3.h - c3.l || 0.001) > 0.5) {
        patterns.push('Candles ' + (i - 1) + '-' + (i + 1) + ': ⭐ Morning Star — strong bullish reversal');
        maxStrength = Math.max(maxStrength, 90);
      }
      // Evening Star
      if (b1 && Math.abs(c1.c - c1.o) / (c1.h - c1.l || 0.001) > 0.5 &&
          Math.abs(c2.c - c2.o) / (c2.h - c2.l || 0.001) < 0.2 &&
          !b3 && Math.abs(c3.c - c3.o) / (c3.h - c3.l || 0.001) > 0.5) {
        patterns.push('Candles ' + (i - 1) + '-' + (i + 1) + ': ⭐ Evening Star — strong bearish reversal');
        maxStrength = Math.max(maxStrength, 90);
      }
      // Three White Soldiers
      if (b1 && b2 && b3 &&
          c2.c > c1.c && c3.c > c2.c &&
          c2.o > c1.o && c3.o > c2.o &&
          Math.abs(c1.c - c1.o) / (c1.h - c1.l || 0.001) > 0.4 &&
          Math.abs(c2.c - c2.o) / (c2.h - c2.l || 0.001) > 0.4 &&
          Math.abs(c3.c - c3.o) / (c3.h - c3.l || 0.001) > 0.4) {
        patterns.push('Candles ' + (i - 1) + '-' + (i + 1) + ': ⚔ Three White Soldiers — strong bullish momentum');
        maxStrength = Math.max(maxStrength, 90);
      }
      // Three Black Crows
      if (!b1 && !b2 && !b3 &&
          c2.c < c1.c && c3.c < c2.c &&
          c2.o < c1.o && c3.o < c2.o &&
          Math.abs(c1.c - c1.o) / (c1.h - c1.l || 0.001) > 0.4 &&
          Math.abs(c2.c - c2.o) / (c2.h - c2.l || 0.001) > 0.4 &&
          Math.abs(c3.c - c3.o) / (c3.h - c3.l || 0.001) > 0.4) {
        patterns.push('Candles ' + (i - 1) + '-' + (i + 1) + ': ⚔ Three Black Crows — strong bearish momentum');
        maxStrength = Math.max(maxStrength, 90);
      }
    }
  }

  if (!patterns.length) patterns.push('No significant multi-candle pattern detected');

  var strengthLabel = maxStrength >= 80 ? '🟢 Strong' : maxStrength >= 60 ? '🟡 Moderate' : '⚪ Weak';
  return { patterns: patterns, strength: maxStrength, strengthLabel: strengthLabel };
}

function analyzeMomentum(text) {
  const prices = text.split(/[,\s]+/).map(parseFloat).filter(function(n) { return !isNaN(n); });
  if (prices.length < 3) return null;

  const returns = [];
  for (var i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1] * 100);
  }

  const avgReturn = returns.reduce(function(a, b) { return a + b; }, 0) / returns.length;
  const variance = returns.reduce(function(s, r) { return s + Math.pow(r - avgReturn, 2); }, 0) / returns.length;
  const volatility = Math.sqrt(variance);
  const momentum = avgReturn > 0 ? 'Bullish' : avgReturn < 0 ? 'Bearish' : 'Neutral';
  const strength = Math.abs(avgReturn) > volatility ? 'Strong' : 'Weak';
  const regime = volatility > 0.05 ? 'High Volatility' : volatility > 0.02 ? 'Normal Volatility' : 'Low Volatility';

  var rsi = 50 + avgReturn * 10;
  rsi = Math.max(0, Math.min(100, rsi));

  return { momentum, strength, regime, avgReturn: avgReturn.toFixed(4), volatility: volatility.toFixed(4), rsi: rsi.toFixed(1) };
}

function initAITools() {
  document.getElementById('form-setup').addEventListener('submit', function(e) {
    e.preventDefault();
    var r = analyzeSetup(
      document.getElementById('setup-trend').value,
      parseFloat(document.getElementById('setup-rr').value),
      parseFloat(document.getElementById('setup-risk').value),
      document.getElementById('setup-session').value
    );
    document.getElementById('result-setup').innerHTML =
      '<div class="result-highlight ' + r.cls + '">' + r.score + '/100 — ' + r.grade + '</div>' +
      r.notes.map(function(n) { return '<div>' + n + '</div>'; }).join('');
  });

  /* ===== PATTERN DETECTOR (Single Candle) ===== */
  document.getElementById('form-pattern').addEventListener('submit', function(e) {
    e.preventDefault();
    var mode = document.getElementById('pattern-mode');
    if (mode && mode.value === 'multi') {
      var r = detectMultiCandle(document.getElementById('pat-multi').value);
      var html = r.patterns.map(function(p) { return '<div class="' + (p.indexOf('No') === 0 ? 'result-warn' : 'result-good') + '">' + p + '</div>'; }).join('');
      html += '<div style="margin-top:10px;font-size:13px;color:var(--text-muted)">قوة النمط: ' + r.strengthLabel + ' (' + r.strength + '/100)</div>';
      document.getElementById('result-pattern').innerHTML = html;
    } else {
      var patterns = detectPattern(
        parseFloat(document.getElementById('pat-o').value),
        parseFloat(document.getElementById('pat-h').value),
        parseFloat(document.getElementById('pat-l').value),
        parseFloat(document.getElementById('pat-c').value)
      );
      document.getElementById('result-pattern').innerHTML = patterns.map(function(p) {
        return '<div class="' + (p.indexOf('No') === 0 ? 'result-warn' : 'result-good') + '">' + p + '</div>';
      }).join('');
    }
  });

  /* ===== PATTERN MODE TOGGLE ===== */
  var modeSel = document.getElementById('pattern-mode');
  if (modeSel) {
    modeSel.addEventListener('change', function() {
      var single = document.getElementById('pat-single-inputs');
      var multi = document.getElementById('pat-multi-inputs');
      if (single && multi) {
        single.style.display = this.value === 'single' ? '' : 'none';
        multi.style.display = this.value === 'multi' ? '' : 'none';
      }
    });
  }

  document.getElementById('btn-journal').addEventListener('click', function() {
    var r = analyzeJournal(document.getElementById('journal-input').value);
    if (!r) return;
    document.getElementById('result-journal').innerHTML =
      '<div>Trades: <strong>' + r.trades + '</strong> | Win Rate: <strong class="result-good">' + r.winRate + '%</strong></div>' +
      '<div>Total P/L: <strong>$' + r.totalProfit + '</strong> | Expectancy: <strong>$' + r.expectancy + '</strong></div>' +
      '<div>Avg Win: $' + r.avgWin + ' | Avg Loss: $' + r.avgLoss + ' | PF: ' + r.profitFactor + '</div>' +
      '<div class="result-warn" style="margin-top:8px">' + r.insight + '</div>';
  });

  document.getElementById('btn-momentum').addEventListener('click', function() {
    var r = analyzeMomentum(document.getElementById('momentum-input').value);
    if (!r) {
      document.getElementById('result-momentum').innerHTML = '<span class="result-bad">Enter at least 3 prices</span>';
      return;
    }
    var rsiCls = r.rsi > 70 ? 'result-bad' : r.rsi < 30 ? 'result-good' : 'result-warn';
    document.getElementById('result-momentum').innerHTML =
      '<div>Sentiment: <strong class="' + (r.momentum === 'Bullish' ? 'result-good' : r.momentum === 'Bearish' ? 'result-bad' : 'result-warn') + '">' + r.momentum + ' (' + r.strength + ')</strong></div>' +
      '<div>Regime: <strong>' + r.regime + '</strong></div>' +
      '<div>Avg Return: ' + r.avgReturn + '% | Volatility: ' + r.volatility + '%</div>' +
      '<div>RSI Estimate: <strong class="' + rsiCls + '">' + r.rsi + '</strong></div>';
  });

  /* ===== AI MARKET SUMMARY ===== */
  var summaryBtn = document.getElementById('btn-summary');
  var summaryResult = document.getElementById('result-summary');
  if (summaryBtn && summaryResult) {
    summaryBtn.addEventListener('click', function() {
      summaryResult.innerHTML = '<div class="result-warn">' + t('ai.summary.loading') + '</div>';
      summaryBtn.disabled = true;
      getMarketSummary().then(function(reply) {
        summaryResult.innerHTML = '<div class="summary-response">' + reply.replace(/\n/g, '<br>') + '</div>';
      }).catch(function(err) {
        summaryResult.innerHTML = '<div class="result-bad">' + t('ai.summary.error') + '</div>';
      }).finally(function() {
        summaryBtn.disabled = false;
      });
    });
  }

  /* ===== AI TRADE ASSISTANT ===== */
  var tradeForm = document.getElementById('form-trade');
  var tradeResult = document.getElementById('result-trade');
  if (tradeForm && tradeResult) {
    tradeForm.addEventListener('submit', function(e) {
      e.preventDefault();
      tradeResult.innerHTML = '<div class="result-warn">' + t('ai.trade.loading') + '</div>';
      getTradePlan({
        pair: document.getElementById('trade-pair').value,
        direction: document.getElementById('trade-direction').value,
        entry: document.getElementById('trade-entry').value,
        sl: document.getElementById('trade-sl').value,
        tp: document.getElementById('trade-tp').value,
        risk: document.getElementById('trade-risk').value,
        notes: document.getElementById('trade-notes').value
      }).then(function(reply) {
        tradeResult.innerHTML = '<div class="summary-response">' + reply.replace(/\n/g, '<br>') + '</div>';
      }).catch(function() {
        tradeResult.innerHTML = '<div class="result-bad">' + t('ai.summary.error') + '</div>';
      });
    });
  }

  /* ===== AI NEWS SENTIMENT ===== */
  var sentimentBtn = document.getElementById('btn-sentiment');
  var sentimentResult = document.getElementById('result-sentiment');
  if (sentimentBtn && sentimentResult) {
    sentimentBtn.addEventListener('click', function() {
      var text = document.getElementById('sentiment-input').value.trim();
      var l = typeof currentLang !== 'undefined' ? currentLang : 'ar';
      if (!text) { sentimentResult.innerHTML = '<div class="result-warn">' + (l === 'ar' ? 'أدخل نصاً للتحليل' : 'Enter text to analyze') + '</div>'; return; }
      sentimentResult.innerHTML = '<div class="result-warn">' + t('ai.sentiment.loading') + '</div>';
      sentimentBtn.disabled = true;
      analyzeSentiment(text).then(function(reply) {
        sentimentResult.innerHTML = '<div class="summary-response">' + reply.replace(/\n/g, '<br>') + '</div>';
      }).catch(function() {
        sentimentResult.innerHTML = '<div class="result-bad">' + t('ai.summary.error') + '</div>';
      }).finally(function() {
        sentimentBtn.disabled = false;
      });
    });
  }

  /* ===== PORTFOLIO RISK ANALYZER ===== */
  var portfolioBtn = document.getElementById('btn-portfolio');
  var portfolioResult = document.getElementById('result-portfolio');
  if (portfolioBtn && portfolioResult) {
    portfolioBtn.addEventListener('click', function() {
      var balance = document.getElementById('portfolio-balance').value;
      var trades = document.getElementById('portfolio-trades').value;
      portfolioResult.innerHTML = '<div class="result-warn">' + t('ai.portfolio.loading') + '</div>';
      portfolioBtn.disabled = true;
      analyzePortfolio({ balance: balance, trades: trades }).then(function(result) {
        portfolioResult.innerHTML = result.html;
      }).catch(function() {
        portfolioResult.innerHTML = '<div class="result-bad">' + t('ai.summary.error') + '</div>';
      }).finally(function() {
        portfolioBtn.disabled = false;
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', initAITools);
