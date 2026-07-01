(function () {
  var SPRITE_URL = 'assets/icons/sprite.svg';

  var ICON_MAP = {
    signals: { w: 24, h: 24 },
    courses: { w: 24, h: 24 },
    ai: { w: 24, h: 24 },
    tools: { w: 24, h: 24 },
    chart: { w: 24, h: 24 },
    calendar: { w: 24, h: 24 },
    chat: { w: 24, h: 24 },
    alerts: { w: 24, h: 24 },
    home: { w: 24, h: 24 },
    forex: { w: 24, h: 24 },
    gold: { w: 24, h: 24 },
    candlestick: { w: 24, h: 24 },
    journal: { w: 24, h: 24 },
    momentum: { w: 24, h: 24 },
    telegram: { w: 24, h: 24 },
    admin: { w: 24, h: 24 },
    search: { w: 24, h: 24 },
    news: { w: 24, h: 24 },
    lightning: { w: 24, h: 24 },
    lock: { w: 24, h: 24 },
    logout: { w: 24, h: 24 },
    publish: { w: 24, h: 24 },
    delete: { w: 24, h: 24 },
    warning: { w: 24, h: 24 },
    moon: { w: 24, h: 24 },
    sun: { w: 24, h: 24 },
    refresh: { w: 24, h: 24 },
    flag: { w: 24, h: 24 },
    check: { w: 24, h: 24 },
    cross: { w: 24, h: 24 },
    gear: { w: 24, h: 24 },
    plus: { w: 24, h: 24 },
    edit: { w: 24, h: 24 },
    download: { w: 24, h: 24 },
    target: { w: 24, h: 24 },
    shield: { w: 24, h: 24 },
    clock: { w: 24, h: 24 },
    flame: { w: 24, h: 24 },
    'trending-up': { w: 24, h: 24 },
    'trending-down': { w: 24, h: 24 },
    star: { w: 24, h: 24 },
    lightbulb: { w: 24, h: 24 },
    clipboard: { w: 24, h: 24 },
    brain: { w: 24, h: 24 }
  };

  window.SiriusIcon = function (name, cls) {
    var info = ICON_MAP[name];
    if (!info) return '';
    cls = cls || 'sirius-icon';
    return '<svg class="' + cls + '" width="' + info.w + '" height="' + info.h + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      window.SiriusIconPaths[name]() +
      '</svg>';
  };

  window.SiriusIconPaths = {
    signals: function () {
      return '<path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-6"/><circle cx="18" cy="6" r="1" fill="currentColor" stroke="none"/>';
    },
    courses: function () {
      return '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M8 7h8M8 11h6"/>';
    },
    ai: function () {
      return '<path d="M12 2a4 4 0 014 4c0 2-2 3-4 5-2-2-4-3-4-5a4 4 0 014-4z"/><path d="M6 17a3 3 0 013-3h6a3 3 0 013 3v1H6v-1z"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>';
    },
    tools: function () {
      return '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>';
    },
    chart: function () {
      return '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 3v18"/><path d="M7 15l2.5-3 2.5 2 3-4"/>';
    },
    calendar: function () {
      return '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="14" r="1" fill="currentColor" stroke="none"/>';
    },
    chat: function () {
      return '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/><circle cx="9" cy="10" r=".5" fill="currentColor" stroke="none"/><circle cx="12" cy="10" r=".5" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".5" fill="currentColor" stroke="none"/>';
    },
    alerts: function () {
      return '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>';
    },
    home: function () {
      return '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>';
    },
    forex: function () {
      return '<circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/><circle cx="12" cy="12" r="4" stroke-dasharray="2 2"/>';
    },
    gold: function () {
      return '<circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/><path d="M8 16l2-8h4l2 8"/><path d="M7 14h10"/>';
    },
    candlestick: function () {
      return '<rect x="4" y="9" width="4" height="8" rx="1"/><rect x="4" y="6" width="4" height="2"/><rect x="4" y="17" width="4" height="2"/><rect x="10" y="5" width="4" height="12" rx="1"/><rect x="10" y="17" width="4" height="2"/><rect x="16" y="7" width="4" height="10" rx="1"/><rect x="16" y="7" width="4" height="2"/><rect x="16" y="17" width="4" height="2"/>';
    },
    journal: function () {
      return '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>';
    },
    momentum: function () {
      return '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>';
    },
    telegram: function () {
      return '<path d="M21.5 4.5L2.5 11.5l7 2.5 3 7 9-16.5z"/><path d="M12 14l3.5-7.5"/>';
    },
    admin: function () {
      return '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>';
    },
    search: function () {
      return '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>';
    },
    news: function () {
      return '<path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-4 0v-9"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/>';
    },
    lightning: function () {
      return '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>';
    },
    lock: function () {
      return '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>';
    },
    logout: function () {
      return '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>';
    },
    publish: function () {
      return '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>';
    },
    delete: function () {
      return '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>';
    },
    warning: function () {
      return '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>';
    },
    moon: function () {
      return '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    },
    sun: function () {
      return '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    },
    refresh: function () {
      return '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>';
    },
    flag: function () {
      return '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>';
    },
    check: function () {
      return '<polyline points="20 6 9 17 4 12"/>';
    },
    cross: function () {
      return '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    },
    gear: function () {
      return '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>';
    },
    plus: function () {
      return '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>';
    },
    edit: function () {
      return '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>';
    },
    download: function () {
      return '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>';
    },
    target: function () {
      return '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>';
    },
    shield: function () {
      return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>';
    },
    clock: function () {
      return '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>';
    },
    flame: function () {
      return '<path d="M12 2l1.5 3.5L17 7l-3.5 1.5L12 12l-1.5-3.5L7 7l3.5-1.5L12 2z"/><path d="M12 12l1.5 3.5L17 17l-3.5 1.5L12 22l-1.5-3.5L7 17l3.5-1.5L12 12z"/>';
    },
    'trending-up': function () {
      return '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>';
    },
    'trending-down': function () {
      return '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>';
    },
    star: function () {
      return '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>';
    },
    lightbulb: function () {
      return '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 008.91 14"/>';
    },
    clipboard: function () {
      return '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>';
    },
    brain: function () {
      return '<path d="M12 4a4 4 0 014 4c0 2-2 3-4 5-2-2-4-3-4-5a4 4 0 014-4z"/><path d="M6 17a3 3 0 013-3h6a3 3 0 013 3v1H6v-1z"/><circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none"/><path d="M9 20h6"/>';
    }
  };

  function replaceEmojis() {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      var name = el.getAttribute('data-icon');
      var cls = el.getAttribute('data-icon-class') || '';
      var svg = window.SiriusIcon(name, 'sirius-icon ' + cls);
      if (svg) {
        var wrapper = document.createElement('span');
        wrapper.className = 'sirius-icon-wrap';
        wrapper.innerHTML = svg;
        el.parentNode.replaceChild(wrapper, el);
      }
    });

    // Also replace elements with class sirius-icon-{name}
    document.querySelectorAll('[class*="sirius-icon-"]').forEach(function (el) {
      var classes = el.className.split(' ');
      for (var i = 0; i < classes.length; i++) {
        if (classes[i].indexOf('sirius-icon-') === 0) {
          var name = classes[i].replace('sirius-icon-', '');
          var svg = window.SiriusIcon(name, 'sirius-icon ' + classes.join(' '));
          if (svg) {
            el.outerHTML = '<span class="sirius-icon-wrap">' + svg + '</span>';
          }
          break;
        }
      }
    });
  }

  // Add global CSS for icons
  var style = document.createElement('style');
  style.textContent = '.sirius-icon{display:inline-block;vertical-align:middle;width:1.2em;height:1.2em}.sirius-icon-wrap{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle}.card-icon .sirius-icon{width:2.5rem;height:2.5rem}.tool-icon .sirius-icon{width:2.8rem;height:2.8rem}.card-icon,.tool-icon{display:inline-flex;align-items:center;justify-content:center}.ctrl-btn .sirius-icon{width:1.1em;height:1.1em}.chat-quick .sirius-icon{width:1em;height:1em;margin-left:0.3em}[dir="rtl"] .chat-quick .sirius-icon{margin-left:0;margin-right:0.3em}';
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', replaceEmojis);
  } else {
    replaceEmojis();
  }
})();
