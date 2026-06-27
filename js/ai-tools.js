/* ===== Sirius Fx AI Tools — Professional Edition ===== */

/* ---------- Setup Analyzer ---------- */

function analyzeSetup(trend, rr, risk, session) {
  var factors = [];
  var score = 50;

  function add(label, val, max, icon, detail) {
    var pct = Math.min(100, Math.max(0, val / max * 100));
    var cls = pct >= 70 ? 'good' : pct >= 40 ? 'warn' : 'bad';
    factors.push({ label: label, pct: pct, cls: cls, icon: icon, detail: detail });
  }

  if (trend === 'with') { score += 20; add('Trend', 100, 100, '📈', 'With trend — bullish bias'); }
  else if (trend === 'range') { score += 5; add('Trend', 40, 100, '📊', 'Range-bound — neutral'); }
  else { score -= 15; add('Trend', 15, 100, '📉', 'Counter-trend — risky'); }

  if (rr >= 3) { score += 20; add('R:R', 100, 100, '🎯', rr + ':1 — excellent'); }
  else if (rr >= 2) { score += 15; add('R:R', 75, 100, '🎯', rr + ':1 — good'); }
  else if (rr >= 1.5) { score += 5; add('R:R', 45, 100, '🎯', rr + ':1 — acceptable'); }
  else { score -= 20; add('R:R', 10, 100, '🎯', rr + ':1 — poor'); }

  if (risk <= 1) { score += 10; add('Risk', 90, 100, '🛡️', risk + '% — conservative'); }
  else if (risk <= 2) { score += 0; add('Risk', 55, 100, '🛡️', risk + '% — moderate'); }
  else { score -= 15; add('Risk', 10, 100, '🛡️', risk + '% — high risk'); }

  var sessionLabels = { london: 'London', ny: 'New York', asia: 'Asia', overlap: 'London–NY Overlap' };
  var sessionScores = { london: 10, ny: 10, overlap: 15, asia: -5 };
  var sVal = sessionScores[session] || 0;
  var sPct = 50 + sVal * 3;
  sPct = Math.max(5, Math.min(100, sPct));
  score += sVal;
  add('Session', sPct, 100, '🕐', sessionLabels[session] + (sVal >= 0 ? ' — optimal' : ' — suboptimal'));

  score = Math.max(0, Math.min(100, score));

  var grade, verdict, advice;
  if (score >= 85) { grade = 'A+'; verdict = 'Exceptional Setup'; advice = 'High-confidence trade — manage position size and let it run.'; }
  else if (score >= 75) { grade = 'A'; verdict = 'Strong Setup'; advice = 'Good alignment of factors — consider taking the trade with standard risk.'; }
  else if (score >= 65) { grade = 'B'; verdict = 'Good Setup'; advice = 'Decent setup — tighten stop-loss and watch for confirmation.'; }
  else if (score >= 50) { grade = 'C'; verdict = 'Average Setup'; advice = 'Mixed signals — reduce position size or wait for better conditions.'; }
  else if (score >= 35) { grade = 'D'; verdict = 'Weak Setup'; advice = 'Multiple red flags — avoid or use very tight stop.'; }
  else { grade = 'F'; verdict = 'Poor Setup'; advice = 'High-risk trade — strongly recommended to skip.'; }

  return { score: score, grade: grade, verdict: verdict, advice: advice, factors: factors };
}

function renderSetupResult(r) {
  var scoreCls = r.score >= 65 ? 'good' : r.score >= 40 ? 'warn' : 'bad';
  var html =
    '<div class="sg-container">' +
      '<div class="sg-label">Setup Score</div>' +
      '<div class="sg-bar"><div class="sg-fill sg-fill--' + scoreCls + '" style="width:' + r.score + '%"></div></div>' +
      '<div class="sg-score sg-score--' + scoreCls + '">' + r.score + '<span class="sg-total">/100</span></div>' +
    '</div>' +
    '<div class="sf-grid">';
  r.factors.forEach(function(f) {
    html +=
      '<div class="sf-card sf-card--' + f.cls + '">' +
        '<div class="sf-icon">' + f.icon + '</div>' +
        '<div class="sf-label">' + f.label + '</div>' +
        '<div class="sf-bar"><div class="sf-fill sf-fill--' + f.cls + '" style="width:' + f.pct + '%"></div></div>' +
        '<div class="sf-detail">' + f.detail + '</div>' +
      '</div>';
  });
  html += '</div>' +
    '<div class="sv-box sv-box--' + scoreCls + '">' +
      '<div class="sv-grade">' + r.grade + ' — ' + r.verdict + '</div>' +
      '<div class="sv-advice">' + r.advice + '</div>' +
    '</div>';
  return html;
}

/* ---------- Journal Analytics ---------- */

function analyzeJournal(text) {
  var lines = text.trim().split('\n').filter(Boolean);
  if (!lines.length) return null;

  var trades = [];
  var profits = [];
  for (var i = 0; i < lines.length; i++) {
    var parts = lines[i].split(/[,\s]+/);
    var p = parseFloat(parts[0]);
    trades.push(p);
    if (!isNaN(p)) profits.push(p);
  }
  if (!profits.length) return null;

  var total = profits.reduce(function(a, b) { return a + b; }, 0);
  var wins = profits.filter(function(p) { return p > 0; });
  var losses = profits.filter(function(p) { return p <= 0; });
  var winRate = (wins.length / profits.length * 100);
  var avgWin = wins.length ? wins.reduce(function(a, b) { return a + b; }, 0) / wins.length : 0;
  var avgLoss = losses.length ? Math.abs(losses.reduce(function(a, b) { return a + b; }, 0) / losses.length) : 0;
  var expectancy = (winRate / 100 * avgWin) - ((100 - winRate) / 100 * avgLoss);
  var pf = avgLoss > 0 ? (wins.reduce(function(a, b) { return a + b; }, 0) / Math.abs(losses.reduce(function(a, b) { return a + b; }, 0))) : (wins.length > 0 ? Infinity : 0);

  var consecWins = 0, consecLosses = 0, bestStreak = 0, worstStreak = 0;
  var cur = 0;
  for (var j = 0; j < profits.length; j++) {
    if (profits[j] > 0) { cur = cur > 0 ? cur + 1 : 1; bestStreak = Math.max(bestStreak, cur); }
    else { cur = cur < 0 ? cur - 1 : -1; worstStreak = Math.min(worstStreak, cur); }
  }
  consecWins = bestStreak;
  consecLosses = Math.abs(worstStreak);

  var returns = [];
  for (var k = 0; k < profits.length; k++) {
    var base = k > 0 ? Math.abs(profits[k-1]) : 100;
    returns.push(profits[k] / base);
  }
  var avgRet = returns.length ? returns.reduce(function(a, b) { return a + b; }, 0) / returns.length : 0;
  var variance = returns.length ? returns.reduce(function(s, r) { return s + Math.pow(r - avgRet, 2); }, 0) / returns.length : 0;
  var sharpe = variance > 0 ? avgRet / Math.sqrt(variance) * Math.sqrt(profits.length) : 0;

  var insight, insightCls;
  if (expectancy > 0 && winRate >= 45 && pf >= 1.5) {
    insight = '🔥 Profitable strategy — consistent edge with strong risk management. Keep executing!';
    insightCls = 'good';
  } else if (expectancy > 0 && winRate >= 45) {
    insight = '✅ Positive expectancy — your strategy works. Focus on cutting losses to improve further.';
    insightCls = 'good';
  } else if (expectancy > 0) {
    insight = '📈 Slightly profitable — your winners outpace losers. Work on increasing win rate.';
    insightCls = 'warn';
  } else if (winRate >= 60) {
    insight = '⚠️ High win rate but negative expectancy — your losses are too large. Cut losers faster!';
    insightCls = 'warn';
  } else {
    insight = '❌ Negative expectancy — review your strategy, risk per trade, and exit rules.';
    insightCls = 'bad';
  }

  var score = Math.round((winRate * 0.3 + Math.min(100, expectancy * 20) * 0.35 + Math.min(100, pf * 25) * 0.35));
  score = Math.max(0, Math.min(100, score));
  var scoreCls = score >= 65 ? 'good' : score >= 40 ? 'warn' : 'bad';

  return {
    trades: profits.length, winRate: winRate.toFixed(1), total: total.toFixed(2),
    avgWin: avgWin.toFixed(2), avgLoss: avgLoss.toFixed(2),
    expectancy: expectancy.toFixed(2), pf: pf === Infinity ? '∞' : pf.toFixed(2),
    consecWins: consecWins, consecLosses: consecLosses,
    sharpe: sharpe.toFixed(2),
    insight: insight, insightCls: insightCls,
    score: score, scoreCls: scoreCls,
    winCount: wins.length, lossCount: losses.length
  };
}

function renderJournalResult(r) {
  var winPct = parseFloat(r.winRate);
  var wCls = winPct >= 55 ? 'good' : winPct >= 40 ? 'warn' : 'bad';
  var eCls = parseFloat(r.expectancy) > 0 ? 'good' : 'bad';
  var pfCls = r.pf === '∞' || parseFloat(r.pf) >= 1.5 ? 'good' : parseFloat(r.pf) >= 1 ? 'warn' : 'bad';

  return '' +
    '<div class="sg-container">' +
      '<div class="sg-label">Performance Score</div>' +
      '<div class="sg-bar"><div class="sg-fill sg-fill--' + r.scoreCls + '" style="width:' + r.score + '%"></div></div>' +
      '<div class="sg-score sg-score--' + r.scoreCls + '">' + r.score + '<span class="sg-total">/100</span></div>' +
    '</div>' +
    '<div class="jm-hero">' +
      '<div class="jm-hero-item">' +
        '<div class="jm-hero-num">' + r.trades + '</div>' +
        '<div class="jm-hero-label">Trades</div>' +
      '</div>' +
      '<div class="jm-hero-item">' +
        '<div class="jm-hero-num jm-hero-num--' + wCls + '">' + r.winRate + '%</div>' +
        '<div class="jm-hero-label">Win Rate</div>' +
      '</div>' +
      '<div class="jm-hero-item">' +
        '<div class="jm-hero-num jm-hero-num--' + (parseFloat(r.total) >= 0 ? 'good' : 'bad') + '">$' + r.total + '</div>' +
        '<div class="jm-hero-label">Total P/L</div>' +
      '</div>' +
      '<div class="jm-hero-item">' +
        '<div class="jm-hero-num jm-hero-num--' + eCls + '">$' + r.expectancy + '</div>' +
        '<div class="jm-hero-label">Expectancy</div>' +
      '</div>' +
    '</div>' +
    '<div class="jm-winbar">' +
      '<div class="jm-winbar-label">' + r.winCount + ' Wins / ' + r.lossCount + ' Losses</div>' +
      '<div class="jm-winbar-track">' +
        '<div class="jm-winbar-fill jm-winbar-fill--win" style="width:' + winPct + '%"></div>' +
        '<div class="jm-winbar-fill jm-winbar-fill--loss" style="width:' + (100 - winPct) + '%"></div>' +
      '</div>' +
    '</div>' +
    '<div class="jm-metrics">' +
      '<div class="jm-metric">' +
        '<div class="jm-metric-val jm-metric-val--good">$' + r.avgWin + '</div>' +
        '<div class="jm-metric-label">Avg Win</div>' +
      '</div>' +
      '<div class="jm-metric">' +
        '<div class="jm-metric-val jm-metric-val--bad">$' + r.avgLoss + '</div>' +
        '<div class="jm-metric-label">Avg Loss</div>' +
      '</div>' +
      '<div class="jm-metric">' +
        '<div class="jm-metric-val jm-metric-val--' + pfCls + '">' + r.pf + '</div>' +
        '<div class="jm-metric-label">Profit Factor</div>' +
      '</div>' +
      '<div class="jm-metric">' +
        '<div class="jm-metric-val">' + r.sharpe + '</div>' +
        '<div class="jm-metric-label">Sharpe Ratio</div>' +
      '</div>' +
      '<div class="jm-metric">' +
        '<div class="jm-metric-val jm-metric-val--good">' + r.consecWins + '</div>' +
        '<div class="jm-metric-label">Best Streak</div>' +
      '</div>' +
      '<div class="jm-metric">' +
        '<div class="jm-metric-val jm-metric-val--bad">' + r.consecLosses + '</div>' +
        '<div class="jm-metric-label">Worst Streak</div>' +
      '</div>' +
    '</div>' +
    '<div class="sv-box sv-box--' + r.insightCls + '">' +
      '<div class="sv-advice">' + r.insight + '</div>' +
    '</div>';
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

function initAITools() {
  /* ===== SETUP ANALYZER ===== */
  document.getElementById('form-setup').addEventListener('submit', function(e) {
    e.preventDefault();
    var r = analyzeSetup(
      document.getElementById('setup-trend').value,
      parseFloat(document.getElementById('setup-rr').value),
      parseFloat(document.getElementById('setup-risk').value),
      document.getElementById('setup-session').value
    );
    document.getElementById('result-setup').innerHTML = renderSetupResult(r);
  });

  /* ===== JOURNAL ANALYTICS ===== */
  document.getElementById('btn-journal').addEventListener('click', function() {
    var r = analyzeJournal(document.getElementById('journal-input').value);
    if (!r) return;
    document.getElementById('result-journal').innerHTML = renderJournalResult(r);
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
}

document.addEventListener('DOMContentLoaded', initAITools);
