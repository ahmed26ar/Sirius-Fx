// =====================================================
// SIRIUS FX — TradingView Chart Integration
// =====================================================

(function () {
  var currentSymbol = 'FX:EURUSD';
  var currentInterval = '60';
  var tvWidget = null;
  var scriptLoaded = false;

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'Light' : 'Dark';
  }

  function loadTVScript(callback) {
    if (scriptLoaded) { callback(); return; }
    var s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/tv.js';
    s.async = true;
    s.onload = function () { scriptLoaded = true; callback(); };
    s.onerror = function () { loadEmbedFallback(); };
    document.head.appendChild(s);
  }

  function buildWidget(sym, interval) {
    var container = document.getElementById('tradingview_chart');
    if (!container) return;
    container.innerHTML = '';

    loadTVScript(function () {
      if (typeof TradingView === 'undefined') { loadEmbedFallback(); return; }

      tvWidget = new TradingView.widget({
        container_id: 'tradingview_chart',
        symbol: sym,
        interval: interval,
        timezone: 'Asia/Dubai',
        theme: getTheme(),
        style: '1',
        locale: document.documentElement.lang === 'ar' ? 'ar' : 'en',
        toolbar_bg: getTheme() === 'Dark' ? '#0a0a0f' : '#f5f7fa',
        enable_publishing: false,
        withdateranges: true,
        hide_side_toolbar: false,
        allow_symbol_change: true,
        save_image: false,
        height: 520,
        width: '100%',
        studies: ['MACD@tv-basicstudies', 'RSI@tv-basicstudies'],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650',
        backgroundColor: getTheme() === 'Dark' ? '#0a0a0f' : '#ffffff',
        gridColor: getTheme() === 'Dark' ? 'rgba(0,212,255,0.05)' : 'rgba(0,0,0,0.05)',
      });
    });
  }

  // Fallback: embed iframe widget
  function loadEmbedFallback() {
    var container = document.getElementById('tradingview_chart');
    if (!container) return;
    var theme = getTheme().toLowerCase();
    var sym = currentSymbol.replace('FX:', '').replace('OANDA:', '').replace('BINANCE:', '');
    container.innerHTML =
      '<iframe src="https://www.tradingview.com/widgetembed/?frameElementId=tradingview_chart' +
      '&symbol=' + encodeURIComponent(currentSymbol) +
      '&interval=' + currentInterval +
      '&hidesidetoolbar=0&hidetoptoolbar=0&symboledit=1&saveimage=0&toolbarbg=' +
      (theme === 'dark' ? '0a0a0f' : 'f5f7fa') +
      '&studies=MACD%40tv-basicstudies%1FRSI%40tv-basicstudies&theme=' + theme +
      '&style=1&timezone=Asia%2FDubai&studies_overrides=%7B%7D&overrides=%7B%7D' +
      '&enabled_features=%5B%5D&disabled_features=%5B%5D&locale=' +
      (document.documentElement.lang === 'ar' ? 'ar' : 'en') +
      '" style="width:100%;height:520px;border:none;border-radius:12px;" allowtransparency="true" frameborder="0"></iframe>';
  }

  function initMiniStrip() {
    var strip = document.getElementById('tvMiniStrip');
    if (!strip) return;
    var pairs = [
      { sym: 'FX:EURUSD', label: 'EUR/USD' },
      { sym: 'FX:GBPUSD', label: 'GBP/USD' },
      { sym: 'OANDA:XAUUSD', label: 'XAU/USD' },
      { sym: 'BINANCE:BTCUSDT', label: 'BTC/USD' },
    ];
    strip.innerHTML = pairs.map(function (p) {
      return '<div class="tv-mini-item" id="mini-' + p.label.replace('/', '') + '">' +
        '<span class="tv-mini-sym">' + p.label + '</span>' +
        '<span class="tv-mini-price">--</span>' +
        '</div>';
    }).join('');
    // Populate from SiriusRates when available
    function fillMini() {
      if (!window.SiriusRates) return;
      pairs.forEach(function (p) {
        var key = p.label;
        var el = document.getElementById('mini-' + key.replace('/', ''));
        if (el && window.SiriusRates[key]) {
          el.querySelector('.tv-mini-price').textContent = window.SiriusRates[key];
        }
      });
    }
    setTimeout(fillMini, 3000);
    setInterval(fillMini, 30000);
  }

  function bindChartControls() {
    // Symbol buttons
    document.querySelectorAll('.sym-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.sym-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentSymbol = btn.getAttribute('data-sym');
        buildWidget(currentSymbol, currentInterval);
      });
    });

    // Interval buttons
    document.querySelectorAll('.iv-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.iv-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentInterval = btn.getAttribute('data-iv');
        buildWidget(currentSymbol, currentInterval);
      });
    });

    // Set default active interval H1
    var h1 = document.querySelector('.iv-btn[data-iv="60"]');
    if (h1) {
      document.querySelectorAll('.iv-btn').forEach(function (b) { b.classList.remove('active'); });
      h1.classList.add('active');
    }
  }

  // Re-render on theme change
  document.addEventListener('themechange', function () {
    if (tvWidget) buildWidget(currentSymbol, currentInterval);
  });

  document.addEventListener('DOMContentLoaded', function () {
    bindChartControls();
    buildWidget(currentSymbol, currentInterval);
    initMiniStrip();
  });
})();
