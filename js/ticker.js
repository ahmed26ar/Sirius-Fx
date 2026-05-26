// =====================================================
// SIRIUS FX — LIVE TICKER (Real Prices via APIs)
// =====================================================

const PAIRS = [
  { sym: 'EUR/USD', from: 'EUR', to: 'USD' },
  { sym: 'GBP/USD', from: 'GBP', to: 'USD' },
  { sym: 'USD/JPY', from: 'USD', to: 'JPY' },
  { sym: 'USD/CHF', from: 'USD', to: 'CHF' },
  { sym: 'AUD/USD', from: 'AUD', to: 'USD' },
  { sym: 'USD/CAD', from: 'USD', to: 'CAD' },
  { sym: 'NZD/USD', from: 'NZD', to: 'USD' },
  { sym: 'EUR/GBP', from: 'EUR', to: 'GBP' },
  { sym: 'XAU/USD', from: 'XAU', to: 'USD' },
  { sym: 'BTC/USD', from: 'BTC', to: 'USD' },
];

const CRYPTO_IDS = { 'BTC/USD': 'bitcoin', 'ETH/USD': 'ethereum' };
let prevRates = {};
let prevTickerRates = {};
window.SiriusRates = {};

// --- Fetch Forex via open.er-api.com ---
async function fetchForex() {
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.rates;
  } catch {
    try {
      const r = await fetch('https://api.frankfurter.app/latest?from=USD');
      const d = await r.json();
      return d.rates;
    } catch { return null; }
  }
}

// --- Fetch Gold via metals API (free tier) ---
async function fetchGold(forexRates) {
  // Gold price relative to USD from forex rates (XAU)
  // We'll use a fallback gold price from a free source
  try {
    const r = await fetch('https://open.er-api.com/v6/latest/XAU');
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.rates ? d.rates.USD : null;
  } catch {
    // Fallback: estimate from forex (rough)
    return null;
  }
}

// --- Fetch BTC via CoinGecko free API ---
async function fetchBTC() {
  try {
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error();
    const d = await r.json();
    return d.bitcoin ? d.bitcoin.usd : null;
  } catch { return null; }
}

function getPairRate(forexRates, goldUsd, btcUsd, pair) {
  if (!forexRates) return null;
  if (pair.sym === 'XAU/USD') return goldUsd;
  if (pair.sym === 'BTC/USD') return btcUsd;
  if (pair.from === 'USD') return forexRates[pair.to] || null;
  if (pair.to === 'USD') return forexRates[pair.from] ? 1 / forexRates[pair.from] : null;
  if (forexRates[pair.to] && forexRates[pair.from]) return forexRates[pair.to] / forexRates[pair.from];
  return null;
}

function fmtRate(rate, pair) {
  if (!rate) return '—';
  if (pair.sym === 'BTC/USD') return rate.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (pair.sym === 'XAU/USD') return rate.toFixed(2);
  if (pair.to === 'JPY' || pair.from === 'JPY') return rate.toFixed(3);
  return rate.toFixed(5);
}

// ---- Render TOP ticker bar ----
function renderTicker(forexRates, goldUsd, btcUsd) {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  const html = PAIRS.map(pair => {
    const rate = getPairRate(forexRates, goldUsd, btcUsd, pair);
    const key = pair.sym;
    let chgHtml = '';
    if (rate && prevTickerRates[key]) {
      const diff = rate - prevTickerRates[key];
      const pct = (diff / prevTickerRates[key]) * 100;
      if (Math.abs(pct) > 0.00001) {
        const cls = diff >= 0 ? 'up' : 'down';
        const arrow = diff >= 0 ? '▲' : '▼';
        chgHtml = ` <span class="${cls}">${arrow} ${Math.abs(pct).toFixed(3)}%</span>`;
      }
    }
    if (rate) prevTickerRates[key] = rate;
    if (rate) window.SiriusRates[key] = fmtRate(rate, pair);
    return `<span class="ticker-item"><span class="pair">${pair.sym}</span><span class="price">${fmtRate(rate, pair)}</span>${chgHtml}</span>`;
  }).join('');

  track.innerHTML = html + html; // duplicate for seamless loop
}

// ---- Render MARKET CARDS section ----
function renderMarketCards(forexRates, goldUsd, btcUsd) {
  const grid = document.getElementById('marketCardsGrid');
  if (!grid) return;

  const display = [
    { sym: 'EUR/USD', from: 'EUR', to: 'USD', icon: '🇪🇺', label: 'Euro / US Dollar' },
    { sym: 'GBP/USD', from: 'GBP', to: 'USD', icon: '🇬🇧', label: 'British Pound / USD' },
    { sym: 'USD/JPY', from: 'USD', to: 'JPY', icon: '🇯🇵', label: 'US Dollar / Yen' },
    { sym: 'XAU/USD', from: 'XAU', to: 'USD', icon: '🥇', label: 'Gold / US Dollar' },
    { sym: 'BTC/USD', from: 'BTC', to: 'USD', icon: '₿', label: 'Bitcoin / USD' },
    { sym: 'USD/CAD', from: 'USD', to: 'CAD', icon: '🇨🇦', label: 'US Dollar / CAD' },
    { sym: 'AUD/USD', from: 'AUD', to: 'USD', icon: '🇦🇺', label: 'Australian / USD' },
    { sym: 'USD/CHF', from: 'USD', to: 'CHF', icon: '🇨🇭', label: 'US Dollar / Franc' },
  ];

  grid.innerHTML = display.map(pair => {
    const rate = getPairRate(forexRates, goldUsd, btcUsd, pair);
    const key = pair.sym;
    let diff = 0, pct = 0, trend = 'neutral';
    if (rate && prevRates[key]) {
      diff = rate - prevRates[key];
      pct = (diff / prevRates[key]) * 100;
      trend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
    }
    if (rate) prevRates[key] = rate;

    const trendIcon = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—';
    const trendCls = trend === 'up' ? 'market-up' : trend === 'down' ? 'market-down' : '';
    const pctStr = pct !== 0 ? ` ${Math.abs(pct).toFixed(3)}%` : '';

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

async function updateAll() {
  const [forexRates, goldUsd, btcUsd] = await Promise.all([
    fetchForex(),
    fetchGold(),
    fetchBTC()
  ]);
  renderTicker(forexRates, goldUsd, btcUsd);
  renderMarketCards(forexRates, goldUsd, btcUsd);
}

document.addEventListener('DOMContentLoaded', () => {
  updateAll();
  setInterval(updateAll, 30000); // refresh every 30s
});

document.addEventListener('langchange', () => {});
