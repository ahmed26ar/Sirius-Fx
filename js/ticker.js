const PAIRS = [
  { sym: 'EUR/USD', from: 'EUR', to: 'USD', invert: false },
  { sym: 'GBP/USD', from: 'GBP', to: 'USD', invert: false },
  { sym: 'USD/JPY', from: 'USD', to: 'JPY', invert: false },
  { sym: 'USD/CHF', from: 'USD', to: 'CHF', invert: false },
  { sym: 'AUD/USD', from: 'AUD', to: 'USD', invert: false },
  { sym: 'USD/CAD', from: 'USD', to: 'CAD', invert: false },
  { sym: 'NZD/USD', from: 'NZD', to: 'USD', invert: false },
  { sym: 'EUR/GBP', from: 'EUR', to: 'GBP', invert: false }
];

let prevRates = {};

async function fetchRates() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return { rates: data.rates, ok: true };
  } catch {
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD');
      const data = await res.json();
      return { rates: data.rates, ok: true };
    } catch {
      return { rates: null, ok: false };
    }
  }
}

function getPairRate(rates, pair) {
  if (!rates) return null;
  if (pair.from === 'USD') return rates[pair.to];
  if (pair.to === 'USD') return 1 / rates[pair.from];
  return rates[pair.to] / rates[pair.from];
}

function formatRate(rate, pair) {
  if (!rate) return '—';
  if (pair.to === 'JPY' || pair.from === 'JPY') return rate.toFixed(3);
  return rate.toFixed(5);
}

function renderTicker(rates) {
  const track = document.getElementById('tickerTrack');
  if (!track) return;

  if (!rates) {
    track.innerHTML = `<span class="ticker-loading">${typeof t === 'function' ? t('ticker.loading') : 'Loading...'}</span>`;
    return;
  }

  const items = PAIRS.map(pair => {
    const rate = getPairRate(rates, pair);
    const key = pair.sym;
    let changeClass = '';
    let changeText = '';
    if (rate && prevRates[key]) {
      const diff = rate - prevRates[key];
      const pct = (diff / prevRates[key]) * 100;
      if (Math.abs(pct) > 0.0001) {
        changeClass = diff >= 0 ? 'up' : 'down';
        changeText = ` ${diff >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(3)}%`;
      }
    }
    if (rate) prevRates[key] = rate;
    return `<span class="ticker-item"><span class="pair">${pair.sym}</span>${formatRate(rate, pair)}<span class="${changeClass}">${changeText}</span></span>`;
  }).join('');

  track.innerHTML = items + items;

  window.SiriusRates = {};
  PAIRS.forEach(function (pair) {
    var rate = getPairRate(rates, pair);
    if (rate) window.SiriusRates[pair.sym] = formatRate(rate, pair);
  });
}

async function updateTicker() {
  const { rates } = await fetchRates();
  renderTicker(rates);
}

document.addEventListener('DOMContentLoaded', () => {
  updateTicker();
  setInterval(updateTicker, 60000);
});

document.addEventListener('langchange', () => {
  if (!prevRates || Object.keys(prevRates).length === 0) return;
  const rates = {};
  PAIRS.forEach(p => { if (prevRates[p.sym]) rates[p.from === 'USD' ? p.to : p.from] = prevRates[p.sym]; });
});
