(function () {
  var API_CHAT = (window.SiriusConfig && window.SiriusConfig.apiBase) || 'https://siriusfx.6611zzrru.workers.dev';

  function lang() { return typeof currentLang !== 'undefined' ? currentLang : 'ar'; }

  function requestAI(message) {
    return fetch(API_CHAT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, lang: lang() })
    }).then(function (res) {
      if (!res.ok) throw new Error('API error');
      return res.json();
    }).then(function (data) {
      return data.reply || '⚠️ لم أستطع الإجابة حالياً.';
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
        addMessage(box, '⚠️ عذراً، المساعد غير متاح. تواصل معنا على https://t.me/srfx0', 'bot');
      })
      .finally(function () {
        input.disabled = false;
        input.focus();
      });
  }

  function initChat() {
    var form = document.getElementById('chatForm');
    var input = document.getElementById('chatInput');
    var box = document.getElementById('chatMessages');
    var toggle = document.getElementById('chatFab');

    if (!form || !box) return;

    if (!box.dataset.welcome) {
      box.dataset.welcome = '1';
      addMessage(box, lang() === 'ar' ? 'مرحباً! أنا Sirius AI — اسألني عن أي سوق أو زوج عملات.' : 'Hi! I am Sirius AI — ask me about any market.', 'bot');
    }

    form.addEventListener('submit', function (e) { e.preventDefault(); sendMessage(); });

    document.querySelectorAll('.chat-quick').forEach(function (btn) {
      btn.addEventListener('click', function () { input.value = btn.getAttribute('data-q'); sendMessage(); });
    });

    if (toggle) {
      toggle.addEventListener('click', function () {
        var chat = document.getElementById('chat'); if (chat) chat.scrollIntoView({ behavior: 'smooth' });
        var win = document.querySelector('.chat-window'); if (win) { win.classList.add('chat-window--pulse'); setTimeout(function () { win.classList.remove('chat-window--pulse'); }, 1200); }
        if (input) input.focus();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initChat);
})();
