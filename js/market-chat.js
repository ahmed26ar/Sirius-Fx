(function () {
  var TELEGRAM = 'https://t.me/srfx0';
  var cfg = window.SiriusConfig || {};
  var API_CHAT = (cfg.apiBase || 'https://siriusfx.6611zzrru.workers.dev') + (cfg.chatEndpoint || '/chat');

  function lang() {
    return typeof currentLang !== 'undefined' ? currentLang : 'ar';
  }

  function L(ar, en) {
    return lang() === 'ar' ? ar : en;
  }

  function getRatesText() {
    if (!window.SiriusRates || !Object.keys(window.SiriusRates).length) {
      return L('الأسعار المباشرة غير متوفرة حالياً — حدّث الصفحة.', 'Live rates unavailable — refresh the page.');
    }
    var lines = [];
    Object.keys(window.SiriusRates).forEach(function (pair) {
      lines.push(pair + ': ' + window.SiriusRates[pair]);
    });
    return lines.join('\n');
  }

  function normalize(text) {
    return text.toLowerCase().replace(/[؟?!.,]/g, '').trim();
  }

  function replyFor(message) {
    var q = normalize(message);

    if (!q) return L('اكتب سؤالك عن السوق أو زوج عملة.', 'Type your market question.');

    if (/مرحب|اهلا|hello|hi|السلام/.test(q)) {
      return L(
        'أهلاً بك في Sirius Fx ★\nأسألني عن: EUR/USD، الذهب، الجلسات، المخاطرة، أو الإشارات.\nللإشارات: ' + TELEGRAM,
        'Welcome to Sirius Fx ★\nAsk about pairs, gold, sessions, risk, or signals.\nSignals: ' + TELEGRAM
      );
    }

    if (/سعر|اسعار|price|rate/.test(q)) {
      return L('📊 أسعار مباشرة:\n', '📊 Live rates:\n') + getRatesText();
    }

    if (/اشار|signal|توصية/.test(q)) {
      return L('📡 الإشارات: ' + TELEGRAM, '📡 Signals: ' + TELEGRAM);
    }

    return L(
      'جاري الاتصال بالخادم… إن استمر الخطأ جرّب لاحقاً أو ' + TELEGRAM,
      'Connecting to server… If this persists, try later or ' + TELEGRAM
    );
  }

  function fetchFromAPI(message) {
    return fetch(API_CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        lang: lang(),
        rates: window.SiriusRates || {}
      })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(data.error || 'API error');
        return data;
      });
    });
  }

  function extractReply(data) {
    if (!data) return null;
    if (typeof data === 'string') return data;
    return data.reply || data.response || data.answer || data.message || data.text || null;
  }

  function isHelloWorld(text) {
    return text && /^hello\s*world!?\s*$/i.test(String(text).trim());
  }

  function requestAI(message) {
    return fetchFromAPI(message).then(function (data) {
      var reply = extractReply(data);
      if (!reply || isHelloWorld(reply)) {
        throw new Error('API not ready');
      }
      return reply;
    });
  }

  function addMessage(container, text, role) {
    var el = document.createElement('div');
    el.className = 'chat-msg chat-msg--' + role;
    el.textContent = text;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping(container) {
    var el = document.createElement('div');
    el.className = 'chat-msg chat-msg--bot chat-typing';
    el.id = 'chatTyping';
    el.textContent = lang() === 'ar' ? 'Sirius AI يفكر...' : 'Sirius AI thinking...';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

  function sendMessage() {
    var input = document.getElementById('chatInput');
    var box = document.getElementById('chatMessages');
    if (!input || !box) return;
    var text = input.value.trim();
    if (!text) return;

    addMessage(box, text, 'user');
    input.value = '';
    input.disabled = true;

    var typing = showTyping(box);

    requestAI(text)
      .then(function (reply) {
        if (typing.parentNode) typing.remove();
        addMessage(box, reply, 'bot');
      })
      .catch(function () {
        if (typing.parentNode) typing.remove();
        addMessage(box, replyFor(text), 'bot');
        addMessage(
          box,
          L(
            '⚠️ API غير جاهز بعد (يرجع Hello World). انشر worker/index.js على Cloudflare ثم أعد المحاولة.',
            '⚠️ API not ready yet (returns Hello World). Deploy worker/index.js to Cloudflare then retry.'
          ),
          'bot'
        );
      })
      .finally(function () {
        input.disabled = false;
        input.focus();
      });
  }

  function initChat() {
    var form = document.getElementById('chatForm');
    var input = document.getElementById('chatInput');
    var toggle = document.getElementById('chatFab');
    var box = document.getElementById('chatMessages');

    if (!form || !box) return;

    if (!box.dataset.welcome) {
      box.dataset.welcome = '1';
      var welcome = L(
        'مرحباً! أنا Sirius AI — متصل بخادمك.\nاسأل عن أي زوج أو سوق.',
        'Hi! I am Sirius AI — connected to your API.\nAsk about any pair or market.'
      );
      addMessage(box, welcome, 'bot');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sendMessage();
    });

    document.querySelectorAll('.chat-quick').forEach(function (btn) {
      btn.addEventListener('click', function () {
        input.value = btn.getAttribute('data-q');
        sendMessage();
      });
    });

    if (toggle) {
      toggle.addEventListener('click', function () {
        var chat = document.getElementById('chat');
        if (chat) chat.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var win = document.querySelector('.chat-window');
        if (win) {
          win.classList.add('chat-window--pulse');
          setTimeout(function () { win.classList.remove('chat-window--pulse'); }, 1200);
        }
        if (input) input.focus();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initChat);
  document.addEventListener('langchange', function () {
    var input = document.getElementById('chatInput');
    if (input && typeof t === 'function') {
      input.placeholder = t('chat.placeholder');
    }
  });
})();
