// =====================================================
// SIRIUS FX — LIVE TICKER (محسّن - مصادر مجانية)
// =====================================================

const PAIRS = [
  { sym: 'EUR/USD', from: 'EUR', to: 'USD', icon: '🇪🇺', label: 'Euro / US Dollar' },
  { sym: 'GBP/USD', from: 'GBP', to: 'USD', icon: '🇬🇧', label: 'British Pound / USD' },
  { sym: 'USD/JPY', from: 'USD', to: 'JPY', icon: '🇯🇵', label: 'US Dollar / Yen' },
  { sym: 'USD/CHF', from: 'USD', to: 'CHF', icon: '🇨🇭', label: 'US Dollar / Franc' },
  { sym: 'AUD/USD', from: 'AUD', to: 'USD', icon: '🇦🇺', label: 'Australian / USD' },
  { sym: 'USD/CAD', from: 'USD', to: 'CAD', icon: '🇨🇦', label: 'US Dollar / CAD' },
  { sym: 'NZD/USD', from: 'NZD', to: 'USD', icon: '🇳🇿', label: 'New Zealand / USD' },
  { sym: 'EUR/GBP', from: 'EUR', to: 'GBP', icon: '🇪🇺', label: 'Euro / British Pound' },
  { sym: 'XAU/USD', from: 'XAU', to: 'USD', icon: 'XU', label: 'Gold / US Dollar' },
  { sym: 'BTC/USD', from: 'BTC', to: 'USD', icon: '₿', label: 'Bitcoin / USD' },
];

let prevRates = {};
window.SiriusRates = {};

// ===== Fetch Forex via Frankfurter (مجاني - لا يحتاج مفتاح) =====
async function fetchForex() {
  try {
    const r = await fetch('https://api.frankfurter.app/latest?from=USD');
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.rates;
  } catch {
    // Fallback إلى open.er-api.com
    try {
      const r = await fetch('https://open.er-api.com/v6/latest/USD');
      const d = await r.json();
      return d.rates;
    } catch { return null; }
  }
}

// ===== Fetch Gold via api.metals.live (مجاني - لا يحتاج مفتاح) =====
async function fetchGold() {
  try {
    const r = await fetch('https://api.metals.live/v1/spot/gold');
    if (!r.ok) throw new Error();
    const d = await r.json();
    const price = parseFloat(d.gold);
    return !isNaN(price) ? price : null;
  } catch {
    return null;
  }
}

// ===== Fetch BTC via CoinGecko (مجاني - لا يحتاج مفتاح) =====
async function fetchBTC() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', {
      signal: AbortSignal.timeout(5000)
    });
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.bitcoin?.usd || null;
  } catch { return null; }
}

// ===== Get rate for a specific pair =====
function getPairRate(forexRates, goldPrice, btcPrice, pair) {
  if (pair.sym === 'XAU/USD') return goldPrice;
  if (pair.sym === 'BTC/USD') return btcPrice;
  if (!forexRates) return null;
  if (pair.from === 'USD') return forexRates[pair.to] || null;
  if (pair.to === 'USD') return forexRates[pair.from] ? 1 / forexRates[pair.from] : null;
  if (forexRates[pair.to] && forexRates[pair.from]) return forexRates[pair.to] / forexRates[pair.from];
  return null;
}

// ===== Format rate =====
function fmtRate(rate, pair) {
  if (!rate) return '—';
  if (pair.sym === 'BTC/USD') return rate.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (pair.sym === 'XAU/USD') return rate.toFixed(2);
  if (pair.to === 'JPY' || pair.from === 'JPY') return rate.toFixed(3);
  return rate.toFixed(5);
}

// ===== Render Market Cards =====
function renderMarketCards(forexRates, goldPrice, btcPrice) {
  const grid = document.getElementById('marketCardsGrid');
  if (!grid) return;

  grid.innerHTML = PAIRS.map(pair => {
    const rate = getPairRate(forexRates, goldPrice, btcPrice, pair);
    const key = pair.sym;
    
    let diff = 0, pct = 0, trend = 'neutral';
    if (rate && prevRates[key]) {
      diff = rate - prevRates[key];
      pct = (diff / prevRates[key]) * 100;
      trend = diff > 0.00001 ? 'up' : diff < -0.00001 ? 'down' : 'neutral';
    }
    if (rate) prevRates[key] = rate;
    if (rate) window.SiriusRates[key] = fmtRate(rate, pair);

    const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
    const trendCls = trend === 'up' ? 'market-up' : trend === 'down' ? 'market-down' : '';
    const pctStr = Math.abs(pct) > 0.00001 ? ` ${Math.abs(pct).toFixed(3)}%` : '';

    return `
      <div class="market-card ${trendCls ? 'market-card--' + trend : ''}">
        <div class="mc-top">
          <span class="mc-icon">${pair.icon}</span>
          <span class="mc-sym">${pair.sym}</span>
          <span class="mc-badge ${trendCls}">${trendIcon}${pctStr}</span>
        </div>
        <div class="mc-price">${fmtRate(rate, pair)}</div>
        <div class="mc-label">${pair.label}</div>
        <div class="mc-bar">
          <div class="mc-bar-fill ${trendCls}" style="width:${Math.min(100, 50 + pct * 100)}%"></div>
        </div>
      </div>`;
  }).join('');

  // Update timestamp
  const ts = document.getElementById('marketTimestamp');
  if (ts) {
    const now = new Date();
    ts.textContent = now.toLocaleTimeString('en-US', { hour12: false });
  }
}

// ===== Main update function =====
async function updateAll() {
  const [forexRates, goldPrice, btcPrice] = await Promise.all([
    fetchForex(),
    fetchGold(),
    fetchBTC()
  ]);
  renderMarketCards(forexRates, goldPrice, btcPrice);
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  updateAll();
  setInterval(updateAll, 30000); // تحديث كل 30 ثانية
});
