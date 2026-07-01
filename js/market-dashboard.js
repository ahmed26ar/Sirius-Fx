window.SiriusMarket = (function() {
  var pairs = [
    { sym: 'EUR/USD', base: 'EUR', quote: 'USD', category: 'major', digits: 5, basePrice: 1.0850 },
    { sym: 'GBP/USD', base: 'GBP', quote: 'USD', category: 'major', digits: 5, basePrice: 1.2700 },
    { sym: 'USD/JPY', base: 'USD', quote: 'JPY', category: 'major', digits: 3, basePrice: 150.50 },
    { sym: 'USD/CHF', base: 'USD', quote: 'CHF', category: 'major', digits: 5, basePrice: 0.8900 },
    { sym: 'AUD/USD', base: 'AUD', quote: 'USD', category: 'major', digits: 5, basePrice: 0.6500 },
    { sym: 'USD/CAD', base: 'USD', quote: 'CAD', category: 'major', digits: 5, basePrice: 1.3600 },
    { sym: 'NZD/USD', base: 'NZD', quote: 'USD', category: 'major', digits: 5, basePrice: 0.6000 },
    { sym: 'XAU/USD', base: 'XAU', quote: 'USD', category: 'commodity', digits: 2, basePrice: 2350.00 },
    { sym: 'XAG/USD', base: 'XAG', quote: 'USD', category: 'commodity', digits: 3, basePrice: 28.50 },
    { sym: 'BTC/USD', base: 'BTC', quote: 'USD', category: 'crypto', digits: 2, basePrice: 65000 },
    { sym: 'ETH/USD', base: 'ETH', quote: 'USD', category: 'crypto', digits: 2, basePrice: 3500 }
  ];

  var rates = {};
  var change = {};
  var subscribers = [];
  var tick = 0;

  function digits(sym) {
    var p = pairs.find(function(x) { return x.sym === sym; });
    return p ? p.digits : 5;
  }

  function formatPrice(sym, price) {
    return price.toFixed(digits(sym));
  }

  function generateRealisticPrice(sym, basePrice) {
    var volatility = sym.indexOf('JPY') > -1 ? 0.08 : sym.indexOf('XAU') > -1 ? 2 : sym.indexOf('BTC') > -1 ? 200 : sym.indexOf('ETH') > -1 ? 15 : sym.indexOf('XAG') > -1 ? 0.3 : 0.002;
    return basePrice + (Math.random() - 0.5) * volatility;
  }

  function fetchLiveRates() {
    tick++;
    var url = 'https://api.frankfurter.app/latest?from=USD';
    var self = this;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 8000;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.rates) {
            var usdBase = data.rates;
            pairs.forEach(function(p) {
              var price = null;
              if (p.sym === 'EUR/USD' && usdBase.EUR) price = 1 / usdBase.EUR;
              else if (p.sym === 'GBP/USD' && usdBase.GBP) price = 1 / usdBase.GBP;
              else if (p.sym === 'USD/JPY' && usdBase.JPY) price = usdBase.JPY;
              else if (p.sym === 'USD/CHF' && usdBase.CHF) price = usdBase.CHF;
              else if (p.sym === 'AUD/USD' && usdBase.AUD) price = 1 / usdBase.AUD;
              else if (p.sym === 'USD/CAD' && usdBase.CAD) price = usdBase.CAD;
              else if (p.sym === 'NZD/USD' && usdBase.NZD) price = 1 / usdBase.NZD;
              if (price !== null && !isNaN(price) && price > 0) {
                var old = rates[p.sym] || price;
                rates[p.sym] = price;
                change[p.sym] = ((price - old) / old) * 100;
              }
            });
          }
        } catch(e) {}
      }
      fillMissingWithMock();
      notify();
    };
    xhr.onerror = function() { fillMissingWithMock(); notify(); };
    xhr.ontimeout = function() { fillMissingWithMock(); notify(); };
    xhr.send();
  }

  function fillMissingWithMock() {
    pairs.forEach(function(p) {
      if (rates[p.sym] === undefined) {
        var variation = (Math.random() - 0.5) * 0.002;
        rates[p.sym] = generateRealisticPrice(p.sym, p.basePrice * (1 + variation));
        change[p.sym] = (Math.random() - 0.5) * 0.4;
      }
    });
  }

  function notify() {
    subscribers.forEach(function(fn) { try { fn(rates, change); } catch(e) {} });
  }

  function subscribe(fn) {
    subscribers.push(fn);
    if (Object.keys(rates).length > 0) fn(rates, change);
  }

  function getRates() { return rates; }
  function getChange() { return change; }
  function getPairs() { return pairs; }

  function start(interval) {
    interval = interval || 15000;
    fetchLiveRates();
    setInterval(fetchLiveRates, interval);
  }

  function calculateStrength() {
    var currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'];
    var strength = {};
    currencies.forEach(function(c) { strength[c] = 0; });

    var count = 0;
    pairs.forEach(function(p) {
      if (change[p.sym] !== undefined && !isNaN(change[p.sym])) {
        if (p.sym.indexOf('/') > -1) {
          var parts = p.sym.split('/');
          var base = parts[0], quote = parts[1];
          if (currencies.indexOf(base) > -1) {
            strength[base] = (strength[base] || 0) + change[p.sym];
            count++;
          }
          if (currencies.indexOf(quote) > -1) {
            strength[quote] = (strength[quote] || 0) - change[p.sym];
          }
        }
      }
    });

    var max = 0;
    currencies.forEach(function(c) { if (Math.abs(strength[c]) > max) max = Math.abs(strength[c]); });
    if (max > 0) {
      currencies.forEach(function(c) { strength[c] = (strength[c] / max) * 100; });
    }
    return strength;
  }

  return {
    start: start,
    subscribe: subscribe,
    getRates: getRates,
    getChange: getChange,
    getPairs: getPairs,
    formatPrice: formatPrice,
    calculateStrength: calculateStrength
  };
})();
