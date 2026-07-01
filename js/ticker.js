window.SiriusRates = {};

(function() {
  var pairs = [
    { sym: 'EUR/USD', from: 'EUR', to: 'USD' },
    { sym: 'GBP/USD', from: 'GBP', to: 'USD' },
    { sym: 'USD/JPY', from: 'USD', to: 'JPY' },
    { sym: 'USD/CHF', from: 'USD', to: 'CHF' },
    { sym: 'AUD/USD', from: 'AUD', to: 'USD' },
    { sym: 'USD/CAD', from: 'USD', to: 'CAD' },
    { sym: 'NZD/USD', from: 'NZD', to: 'USD' },
    { sym: 'XAU/USD', from: 'XAU', to: 'USD' },
    { sym: 'BTC/USD', from: 'BTC', to: 'USD' }
  ];

  function setRate(sym, price) {
    if (price !== null && !isNaN(price) && price > 0) {
      window.SiriusRates[sym] = price.toFixed(sym.indexOf('JPY') > -1 ? 3 : sym.indexOf('XAU') > -1 ? 2 : sym.indexOf('BTC') > -1 ? 0 : 5);
    }
  }

  function fetchAll() {
    var url = 'https://api.frankfurter.app/latest?from=USD';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 8000;
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && data.rates) {
            var r = data.rates;
            if (r.EUR) setRate('EUR/USD', 1 / r.EUR);
            if (r.GBP) setRate('GBP/USD', 1 / r.GBP);
            if (r.JPY) setRate('USD/JPY', r.JPY);
            if (r.CHF) setRate('USD/CHF', r.CHF);
            if (r.AUD) setRate('AUD/USD', 1 / r.AUD);
            if (r.CAD) setRate('USD/CAD', r.CAD);
            if (r.NZD) setRate('NZD/USD', 1 / r.NZD);
          }
        } catch(e) {}
      }
    };
    xhr.send();
  }

  fetchAll();
  setInterval(fetchAll, 30000);
})();
