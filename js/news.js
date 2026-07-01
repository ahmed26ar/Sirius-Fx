(function () {

  function detectTag(title) {
    var t = (title || '').toUpperCase();
    if (/EUR|EURO/.test(t)) return 'EUR';
    if (/GBP|POUND|STERLING/.test(t)) return 'GBP';
    if (/JPY|YEN|JAPAN/.test(t)) return 'JPY';
    if (/GOLD|XAU/.test(t)) return 'XAU';
    if (/SILVER|XAG/.test(t)) return 'XAG';
    if (/BTC|BITCOIN/.test(t)) return 'BTC';
    if (/ETH|ETHEREUM/.test(t)) return 'ETH';
    if (/OIL|CRUDE|WTI/.test(t)) return 'OIL';
    if (/USD|DOLLAR|FED|FOMC/.test(t)) return 'USD';
    if (/CHF|SWISS/.test(t)) return 'CHF';
    if (/AUD|AUSSIE/.test(t)) return 'AUD';
    if (/CAD|LOONIE/.test(t)) return 'CAD';
    if (/NZD|KIWI/.test(t)) return 'NZD';
    return 'FX';
  }

  function detectImpact(title) {
    var h = ['FED', 'FOMC', 'NFP', 'CPI', 'GDP', 'RATE', 'DECISION', 'INFLATION', 'EMERGENCY', 'RECESSION', 'CRASH'];
    var t = (title || '').toUpperCase();
    for (var i = 0; i < h.length; i++) { if (t.indexOf(h[i]) > -1) return 'high'; }
    var m = ['BANK', 'PMI', 'TRADE', 'RETAIL', 'EMPLOYMENT', 'JOBLESS', 'MANUFACTURING', 'SERVICES', 'CONSUMER'];
    for (var j = 0; j < m.length; j++) { if (t.indexOf(m[j]) > -1) return 'medium'; }
    return 'low';
  }

  function impactLabel(impact) {
    if (impact === 'high') return '<span class="imp-dot" style="color:#ef4444">●</span>';
    if (impact === 'medium') return '<span class="imp-dot" style="color:#f59e0b">●</span>';
    return '<span class="imp-dot" style="color:#22c55e">●</span>';
  }

  function timeSince(minutes) {
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return 'منذ ' + minutes + ' دقيقة';
    var h = Math.floor(minutes / 60);
    if (h < 24) return 'منذ ' + h + ' ساعة' + (h > 1 ? '' : '');
    var d = Math.floor(h / 24);
    return 'منذ ' + d + ' يوم' + (d > 1 ? '' : '');
  }

  var directions = ['يرتفع', 'ينخفض', 'يستقر', 'يقفز', 'يتراجع', 'يتعافى', 'يواصل الصعود', 'يواصل الهبوط', 'يسجل أعلى مستوى', 'يسجل أدنى مستوى'];
  var reasons = ['قرار الفائدة', 'بيانات التضخم', 'الوظائف الأمريكية', 'توترات جيوسياسية', 'ترقب اجتماع البنك المركزي', 'بيانات الناتج المحلي', 'مؤشر مديري المشتريات', 'تصريحات مسؤول في الاحتياطي الفيدرالي', 'مبيعات التجزئة', 'مخاوف الركود', 'بيانات التجارة', 'الطلب العالمي'];
  var assets = [
    { name: 'الدولار الأمريكي', tag: 'USD' },
    { name: 'اليورو', tag: 'EUR' },
    { name: 'الجنيه الإسترليني', tag: 'GBP' },
    { name: 'الين الياباني', tag: 'JPY' },
    { name: 'الذهب', tag: 'XAU' },
    { name: 'الفضة', tag: 'XAG' },
    { name: 'الدولار الأسترالي', tag: 'AUD' },
    { name: 'الدولار الكندي', tag: 'CAD' },
    { name: 'بيتكوين', tag: 'BTC' },
    { name: 'إيثيريوم', tag: 'ETH' },
    { name: 'النفط الخام', tag: 'OIL' },
    { name: 'مؤشر S&P 500', tag: 'USD' }
  ];

  function generateNews() {
    var count = 8 + Math.floor(Math.random() * 4);
    var news = [];
    var now = Date.now();
    for (var i = 0; i < count; i++) {
      var asset = assets[Math.floor(Math.random() * assets.length)];
      var dir = directions[Math.floor(Math.random() * directions.length)];
      var reason = reasons[Math.floor(Math.random() * reasons.length)];
      var title = asset.name + ' ' + dir + ' مع ' + reason;
      var minsAgo = i * 15 + Math.floor(Math.random() * 12);
      var impact = detectImpact(title);
      news.push({
        title: title,
        tag: asset.tag,
        impact: impact,
        minsAgo: minsAgo,
        time: timeSince(minsAgo),
        source: 'Sirius Fx'
      });
    }
    return news;
  }

  var generatedNews = generateNews();

  function renderNews() {
    var feed = document.getElementById('newsFeed');
    if (!feed) return;

    var html = generatedNews.slice(0, 10).map(function(a) {
      return '<a class="news-item" href="https://t.me/srfx0" target="_blank" rel="noopener">' +
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
      '<div class="news-footer"><a href="https://t.me/srfx0" target="_blank" class="news-more-btn">المزيد من الأخبار ←</a></div>';
  }

  function updateTimestamps() {
    var now = Date.now();
    var feed = document.getElementById('newsFeed');
    if (!feed) return;
    // Re-render every minute to update "time ago" labels
    generatedNews = generateNews();
    renderNews();
  }

  function loadEconomicCalendar() {
    var container = document.getElementById('tvCalendarWidget');
    if (!container) return;

    var theme = 'dark';
    var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

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

    container.innerHTML = '';
    container.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', function() {
    renderNews();
    setInterval(updateTimestamps, 60000);
    loadEconomicCalendar();
  });

})();
