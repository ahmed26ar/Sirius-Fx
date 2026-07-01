window.SiriusSessions = (function() {
  var sessions = [
    { name: 'Sydney', nameAr: 'سيدني', open: 22, close: 7, emoji: '🇦🇺' },
    { name: 'Tokyo', nameAr: 'طوكيو', open: 0, close: 9, emoji: '🇯🇵' },
    { name: 'London', nameAr: 'لندن', open: 8, close: 17, emoji: '🇬🇧' },
    { name: 'New York', nameAr: 'نيويورك', open: 13, close: 22, emoji: '🇺🇸' }
  ];

  function getCurrentSession() {
    var now = new Date();
    var utcHour = now.getUTCHours() + now.getUTCMinutes() / 60;
    var current = null;
    var next = null;
    var minNext = Infinity;

    sessions.forEach(function(s) {
      var openH = s.open;
      var closeH = s.close;
      var isOpen = false;
      if (closeH > openH) {
        isOpen = utcHour >= openH && utcHour < closeH;
      } else {
        isOpen = utcHour >= openH || utcHour < closeH;
      }
      if (isOpen) current = s;

      var nextOpen = openH;
      if (nextOpen <= utcHour) nextOpen += 24;
      var diff = nextOpen - utcHour;
      if (diff < minNext && !isOpen) {
        minNext = diff;
        next = { session: s, hoursUntil: diff };
      }
    });

    if (!current) {
      sessions.forEach(function(s) {
        var openH = s.open;
        var nextOpen = openH;
        if (nextOpen <= utcHour) nextOpen += 24;
        var diff = nextOpen - utcHour;
        if (diff < minNext) {
          minNext = diff;
          next = { session: s, hoursUntil: diff };
        }
      });
    }

    if (!current && next) current = next.session;

    return {
      current: current,
      next: next,
      utcHour: utcHour,
      sessions: sessions
    };
  }

  function renderSessionsBar(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    function update() {
      var info = getCurrentSession();
      var html = '<div class="sessions-bar">';

      info.sessions.forEach(function(s) {
        var openH = s.open;
        var closeH = s.close;
        var utcHour = info.utcHour;
        var isOpen = false;
        if (closeH > openH) {
          isOpen = utcHour >= openH && utcHour < closeH;
        } else {
          isOpen = utcHour >= openH || utcHour < closeH;
        }

        var closeDisplay = closeH > 24 ? (closeH - 24) + ':00' : closeH + ':00';
        var openDisplay = openH + ':00';

        html += '<div class="session-item' + (isOpen ? ' session--open' : '') + '">' +
          (s.emoji ? '<span class="session-flag">' + s.emoji + '</span>' : '') +
          '<span class="session-name">' + s.name + '</span>' +
          '<span class="session-time">' + openDisplay + '–' + closeDisplay + ' UTC</span>' +
          (isOpen ? '<span class="session-badge session-badge--live">مفتوح الآن</span>' : '') +
        '</div>';
      });

      html += '</div>';
      container.innerHTML = html;
    }

    update();
    setInterval(update, 60000);
  }

  return {
    getCurrentSession: getCurrentSession,
    renderSessionsBar: renderSessionsBar
  };
})();
