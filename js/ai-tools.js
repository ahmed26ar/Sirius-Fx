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

  document.getElementById('form-pattern').addEventListener('submit', function(e) {
    e.preventDefault();
    var patterns = detectPattern(
      parseFloat(document.getElementById('pat-o').value),
      parseFloat(document.getElementById('pat-h').value),
      parseFloat(document.getElementById('pat-l').value),
      parseFloat(document.getElementById('pat-c').value)
    );
    document.getElementById('result-pattern').innerHTML = patterns.map(function(p) {
      return '<div class="result-good">' + p + '</div>';
    }).join('');
  });

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
}

document.addEventListener('DOMContentLoaded', initAITools);
