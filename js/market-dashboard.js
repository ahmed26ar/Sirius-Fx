window.SiriusMarket = (function() {
  var pairs = [
    { sym: 'EUR/USD', base: 'EUR', quote: 'USD', cat: 'major', digits: 5, vol: 0.00012, basePrice: 1.0850 },
    { sym: 'GBP/USD', base: 'GBP', quote: 'USD', cat: 'major', digits: 5, vol: 0.00015, basePrice: 1.2700 },
    { sym: 'USD/JPY', base: 'USD', quote: 'JPY', cat: 'major', digits: 3, vol: 0.012,   basePrice: 150.50 },
    { sym: 'USD/CHF', base: 'USD', quote: 'CHF', cat: 'major', digits: 5, vol: 0.00012, basePrice: 0.8900 },
    { sym: 'AUD/USD', base: 'AUD', quote: 'USD', cat: 'major', digits: 5, vol: 0.00014, basePrice: 0.6500 },
    { sym: 'USD/CAD', base: 'USD', quote: 'CAD', cat: 'major', digits: 5, vol: 0.00012, basePrice: 1.3600 },
    { sym: 'NZD/USD', base: 'NZD', quote: 'USD', cat: 'major', digits: 5, vol: 0.00015, basePrice: 0.6000 },
    { sym: 'EUR/JPY', base: 'EUR', quote: 'JPY', cat: 'cross', digits: 3, vol: 0.015,   basePrice: 163.20 },
    { sym: 'GBP/JPY', base: 'GBP', quote: 'JPY', cat: 'cross', digits: 3, vol: 0.018,   basePrice: 191.00 },
    { sym: 'EUR/GBP', base: 'EUR', quote: 'GBP', cat: 'cross', digits: 5, vol: 0.00010, basePrice: 0.8540 },
    { sym: 'XAU/USD', base: 'XAU', quote: 'USD', cat: 'commodity', digits: 2, vol: 0.50, basePrice: 2350.00 },
    { sym: 'XAG/USD', base: 'XAG', quote: 'USD', cat: 'commodity', digits: 3, vol: 0.05, basePrice: 28.50 },
    { sym: 'BTC/USD', base: 'BTC', quote: 'USD', cat: 'crypto', digits: 0, vol: 150,     basePrice: 65000 },
    { sym: 'ETH/USD', base: 'ETH', quote: 'USD', cat: 'crypto', digits: 0, vol: 25,      basePrice: 3500 }
  ];

  var rates = {};
  var prevRates = {};
  var change = {};
  var flashState = {};
  var subscribers = [];
  var initialized = false;
  var apiTimestamp = 0;

  function digits(sym) { var p = pairs.find(function(x) { return x.sym === sym; }); return p ? p.digits : 5; }

  function formatPrice(sym, price) {
    var d = digits(sym);
    if (d === 0) return price.toFixed(0);
    if (d === 2) return price.toFixed(2);
    if (d === 3) return price.toFixed(3);
    return price.toFixed(5);
  }

  function gaussianRandom() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  function simulateTick() {
    var changed = false;
    pairs.forEach(function(p) {
      if (rates[p.sym] === undefined) {
        rates[p.sym] = p.basePrice + (Math.random() - 0.5) * p.vol * 10;
        prevRates[p.sym] = rates[p.sym];
        change[p.sym] = 0;
        return;
      }
      var drift = 0;
      if (p.sym === 'XAU/USD') drift = (Math.random() - 0.48) * 0.02;
      else if (p.sym.indexOf('JPY') > -1) drift = (Math.random() - 0.49) * 0.005;
      else drift = (Math.random() - 0.48) * 0.00001;

      var tick = gaussianRandom() * p.vol * 0.7 + drift;
      var newPrice = rates[p.sym] + tick;
      if (newPrice <= 0) newPrice = rates[p.sym] + Math.abs(tick);
      var old = rates[p.sym];
      rates[p.sym] = newPrice;
      change[p.sym] = ((newPrice - p.basePrice) / p.basePrice) * 100;
      var diff = Math.abs(newPrice - old);
      if (diff > 0.000001) {
        flashState[p.sym] = newPrice > old ? 'up' : 'down';
        changed = true;
      }
    });
    if (changed) notify();
  }

  function fetchFromBiquote() {
    var syms = ['EURUSD','GBPUSD','USDJPY','USDCHF','AUDUSD','USDCAD','NZDUSD','XAUUSD','BTCUSD','ETHUSD'];
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://biquote.io/api/latest?symbols=' + syms.join(','), true);
    xhr.timeout = 5000;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && typeof data === 'object') {
            syms.forEach(function(s) {
              if (data[s] && data[s].last) {
                var sym = s.substring(0,3) + '/' + s.substring(3);
                var p = parseFloat(data[s].last);
                if (!isNaN(p) && p > 0) {
                  var old = rates[sym] || p;
                  rates[sym] = p;
                  var base = pairs.find(function(x) { return x.sym === sym; });
                  if (base) base.basePrice = p;
                  change[sym] = ((p - old) / old) * 100;
                  apiTimestamp = Date.now();
                }
              }
            });
            notify();
          }
        } catch(e) {}
      }
    };
    xhr.onerror = function() {};
    xhr.ontimeout = function() {};
    xhr.send();
  }

  function fetchFromFxapi() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://fxapi.app/api/USD.json', true);
    xhr.timeout = 6000;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.rates) {
            var r = data.rates;
            var usdRates = {};
            Object.keys(r).forEach(function(k) { usdRates[k.toUpperCase()] = r[k]; });
            var mapping = { 'EUR/USD': 'EUR', 'GBP/USD': 'GBP', 'USD/JPY': 'JPY', 'USD/CHF': 'CHF', 'AUD/USD': 'AUD', 'USD/CAD': 'CAD', 'NZD/USD': 'NZD' };
            Object.keys(mapping).forEach(function(sym) {
              var code = mapping[sym];
              if (usdRates[code] !== undefined) {
                var price = sym.startsWith('USD/') ? usdRates[code] : (1 / usdRates[code]);
                if (!isNaN(price) && price > 0) {
                  rates[sym] = price;
                  var base = pairs.find(function(x) { return x.sym === sym; });
                  if (base) base.basePrice = price;
                  change[sym] = 0;
                }
              }
            });
            notify();
          }
        } catch(e) {}
      }
    };
    xhr.send();
  }

  function start(interval) {
    if (initialized) return;
    initialized = true;

    pairs.forEach(function(p) {
      rates[p.sym] = p.basePrice + (Math.random() - 0.5) * p.vol * 5;
      prevRates[p.sym] = rates[p.sym];
      change[p.sym] = (Math.random() - 0.5) * 0.2;
    });

    notify();
    fetchFromBiquote();
    setInterval(function() { fetchFromBiquote(); }, 30000);

    simulateTick();
    setInterval(simulateTick, 1500);

    setInterval(function() {
      notify();
      var now = Date.now();
      Object.keys(flashState).forEach(function(sym) {
        flashState[sym] = '';
      });
    }, 1000);
  }

  function notify() {
    var flashCopy = {};
    Object.keys(flashState).forEach(function(k) { if (flashState[k]) flashCopy[k] = flashState[k]; });
    subscribers.forEach(function(fn) { try { fn(rates, change, flashCopy); } catch(e) {} });
  }

  function subscribe(fn) {
    subscribers.push(fn);
    if (Object.keys(rates).length > 0) fn(rates, change, flashState);
  }

  function getRates() { return rates; }
  function getChange() { return change; }
  function getFlash() { return flashState; }
  function getPairs() { return pairs; }

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
          if (currencies.indexOf(base) > -1) { strength[base] = (strength[base] || 0) + change[p.sym] * 2; count++; }
          if (currencies.indexOf(quote) > -1) { strength[quote] = (strength[quote] || 0) - change[p.sym] * 2; }
        }
      }
    });
    return strength;
  }

  return {
    start: start,
    subscribe: subscribe,
    getRates: getRates,
    getChange: getChange,
    getFlash: getFlash,
    getPairs: getPairs,
    formatPrice: formatPrice,
    calculateStrength: calculateStrength
  };
})();
