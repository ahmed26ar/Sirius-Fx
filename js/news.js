// =====================================================
// SIRIUS FX — Forex News + Economic Calendar
// =====================================================

(function () {

  // News sources via RSS-to-JSON proxies (free, no key needed)
  var NEWS_SOURCES = [
    {
      name: 'ForexLive',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.forexlive.com%2Ffeed%2F&api_key=public&count=8',
      logo: ''
    },
    {
      name: 'Investing.com',
      url: 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.investing.com%2Frss%2Fnews_25.rss&api_key=public&count=6',
      logo: ''
    }
  ];

  // Fallback hardcoded news if API fails
  var FALLBACK_NEWS = [
    { title: 'الدولار يتراجع مع ترقب بيانات التضخم الأمريكية', source: 'Sirius Fx', time: 'منذ ساعة', tag: 'USD', impact: 'high', url: 'https://t.me/srfx0' },
    { title: 'الذهب يرتفع وسط مخاوف الركود الاقتصادي العالمي', source: 'Sirius Fx', time: 'منذ 2 ساعة', tag: 'XAU', impact: 'medium', url: 'https://t.me/srfx0' },
    { title: 'اليورو يستقر قبيل قرار الفائدة الأوروبية', source: 'Sirius Fx', time: 'منذ 3 ساعات', tag: 'EUR', impact: 'high', url: 'https://t.me/srfx0' },
    { title: 'الجنيه الإسترليني يواجه ضغطاً بعد بيانات التوظيف البريطانية', source: 'Sirius Fx', time: 'منذ 4 ساعات', tag: 'GBP', impact: 'medium', url: 'https://t.me/srfx0' },
    { title: 'Bitcoin يتخطى مستوى مقاومة مهم عند 70,000 دولار', source: 'Sirius Fx', time: 'منذ 5 ساعات', tag: 'BTC', impact: 'low', url: 'https://t.me/srfx0' },
    { title: 'الين الياباني يضعف مع تصريحات بنك اليابان', source: 'Sirius Fx', time: 'منذ 6 ساعات', tag: 'JPY', impact: 'high', url: 'https://t.me/srfx0' },
  ];

  function impactLabel(impact) {
    if (impact === 'high') return '<span class="imp-dot imp-high" title="High Impact" style="color:#ef4444">●</span>';
    if (impact === 'medium') return '<span class="imp-dot imp-med" title="Medium Impact" style="color:#f59e0b">●</span>';
    return '<span class="imp-dot imp-low" title="Low Impact" style="color:#22c55e">●</span>';
  }

  function timeAgo(dateStr) {
    try {
      var then = new Date(dateStr);
      var diff = Math.floor((Date.now() - then.getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
      if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
      return Math.floor(diff / 86400) + 'd ago';
    } catch (e) { return ''; }
  }

  function detectTag(title) {
    var t = (title || '').toUpperCase();
    if (/EUR|EURO/.test(t)) return 'EUR';
    if (/GBP|POUND|STERLING/.test(t)) return 'GBP';
    if (/JPY|YEN|JAPAN/.test(t)) return 'JPY';
    if (/GOLD|XAU/.test(t)) return 'XAU';
    if (/BTC|BITCOIN/.test(t)) return 'BTC';
    if (/OIL|CRUDE|WTI/.test(t)) return 'OIL';
    if (/USD|DOLLAR|FED|FOMC/.test(t)) return 'USD';
    if (/CHF|SWISS/.test(t)) return 'CHF';
    return 'FX';
  }

  function detectImpact(title) {
    var h = ['FED', 'FOMC', 'NFP', 'CPI', 'GDP', 'RATE', 'DECISION', 'INFLATION', 'EMERGENCY'];
    var t = (title || '').toUpperCase();
    for (var i = 0; i < h.length; i++) { if (t.indexOf(h[i]) > -1) return 'high'; }
    var m = ['BANK', 'PMI', 'TRADE', 'RETAIL', 'EMPLOYMENT', 'JOBLESS'];
    for (var j = 0; j < m.length; j++) { if (t.indexOf(m[j]) > -1) return 'medium'; }
    return 'low';
  }

  function renderNews(articles) {
    var feed = document.getElementById('newsFeed');
    if (!feed) return;

    if (!articles || articles.length === 0) {
      renderFallback(); return;
    }

    var html = articles.slice(0, 10).map(function (a) {
      var tag = detectTag(a.title);
      var impact = detectImpact(a.title);
      var time = a.pubDate ? timeAgo(a.pubDate) : '';
      var src = a.feed_name || 'Forex News';
      return '<a class="news-item" href="' + (a.link || '#') + '" target="_blank" rel="noopener">' +
        '<div class="news-item-top">' +
          '<span class="news-tag news-tag--' + tag.toLowerCase() + '">' + tag + '</span>' +
          impactLabel(impact) +
          '<span class="news-time">' + time + '</span>' +
        '</div>' +
        '<div class="news-title">' + a.title + '</div>' +
        '<div class="news-meta">' + src + '</div>' +
        '</a>';
    }).join('');

    feed.innerHTML = '<div class="news-items">' + html + '</div>' +
      '<div class="news-footer"><a href="https://t.me/srfx0" target="_blank" class="news-more-btn" data-i18n="news.more">المزيد من الأخبار على تيليجرام ←</a></div>';
  }

  function renderFallback() {
    var feed = document.getElementById('newsFeed');
    if (!feed) return;
    var html = FALLBACK_NEWS.map(function (a) {
      return '<a class="news-item" href="' + a.url + '" target="_blank" rel="noopener">' +
        '<div class="news-item-top">' +
          '<span class="news-tag news-tag--' + a.tag.toLowerCase() + '">' + a.tag + '</span>' +
          impactLabel(a.impact) +
          '<span class="news-time">' + a.time + '</span>' +
        '</div>' +
        '<div class="news-title">' + a.title + '</div>' +
        '<div class="news-meta">' + a.source + '</div>' +
        '</a>';
    }).join('');
    feed.innerHTML = '<div class="news-items">' + html + '</div>' +
      '<div class="news-footer"><a href="https://t.me/srfx0" target="_blank" class="news-more-btn">المزيد من الأخبار على تيليجرام ←</a></div>';
  }

  async function fetchNews() {
    var feed = document.getElementById('newsFeed');
    if (!feed) return;

    // Show loading skeletons
    feed.innerHTML = '<div class="news-loading"><div class="news-skeleton"></div><div class="news-skeleton"></div><div class="news-skeleton"></div></div>';

    var allArticles = [];

    for (var i = 0; i < NEWS_SOURCES.length; i++) {
      try {
        var res = await fetch(NEWS_SOURCES[i].url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error();
        var data = await res.json();
        if (data.items && data.items.length) {
          var items = data.items.map(function (item) {
            item.feed_name = NEWS_SOURCES[i].name;
            return item;
          });
          allArticles = allArticles.concat(items);
        }
      } catch (e) { /* continue */ }
    }

    // Sort by date
    allArticles.sort(function (a, b) {
      return new Date(b.pubDate || 0) - new Date(a.pubDate || 0);
    });

    if (allArticles.length > 0) {
      renderNews(allArticles);
    } else {
      renderFallback();
    }
  }

  function loadEconomicCalendar() {
    var container = document.getElementById('tvCalendarWidget');
    if (!container) return;

    var theme = 'dark';
    var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

    // TradingView Economic Calendar Widget
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "colorTheme": theme,
      "isTransparent": true,
      "width": "100%",
      "height": "400",
      "locale": lang,
      "importanceFilter": "0,1",
      "countryFilter": "us,eu,gb,jp,au,ca,ch,cn"
    });

    // Inject as proper widget
    container.innerHTML = '<div class="tradingview-widget-container__widget"></div>';
    container.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetchNews();
    loadEconomicCalendar();
    setInterval(fetchNews, 5 * 60 * 1000); // Refresh every 5 min

    // Manual refresh button
    var refreshBtn = document.getElementById('marketRefresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        refreshBtn.style.animation = 'spin 0.6s linear';
        setTimeout(function () { refreshBtn.style.animation = ''; }, 700);
        if (typeof updateAll === 'function') updateAll();
      });
    }
  });

  // Re-render calendar on theme toggle
  document.addEventListener('themechange', function () {
    loadEconomicCalendar();
  });

})();
