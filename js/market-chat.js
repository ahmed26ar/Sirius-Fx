(function () {
  var TELEGRAM = 'https://t.me/srfx0';

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
    var ar = lang() === 'ar';

    if (!q) return L('اكتب سؤالك عن السوق أو زوج عملة.', 'Type your market question.');

    if (/مرحب|اهلا|hello|hi|السلام/.test(q)) {
      return L(
        'أهلاً بك في Sirius Fx ★\nأسألني عن: EUR/USD، الذهب، الجلسات، المخاطرة، أو الإشارات.\nللإشارات المباشرة: ' + TELEGRAM,
        'Welcome to Sirius Fx ★\nAsk about pairs, gold, sessions, risk, or signals.\nLive signals: ' + TELEGRAM
      );
    }

    if (/سعر|اسعار|price|rate|eur|usd|gbp|jpy|ذهب|gold|xau|نفط|oil/.test(q)) {
      return L('📊 أسعار مباشرة (تقريبية):\n', '📊 Live rates (approx):\n') + getRatesText();
    }

    if (/eur.*usd|يورو/.test(q)) {
      var e = window.SiriusRates && window.SiriusRates['EUR/USD'];
      return L(
        'EUR/USD ' + (e ? 'عند ' + e : '—') + '\nتحليل عام: راقب دعم 1.0800 ومقاومة 1.0900. تداول مع الاتجاه في جلسة لندن/نيويورك.\n⚠️ ليس نصيحة استثمارية.',
        'EUR/USD ' + (e ? 'at ' + e : '—') + '\nWatch 1.0800 support / 1.0900 resistance. Trade with trend in London/NY.\n⚠️ Not financial advice.'
      );
    }

    if (/gbp|باوند|sterling/.test(q)) {
      var g = window.SiriusRates && window.SiriusRates['GBP/USD'];
      return L(
        'GBP/USD ' + (g ? 'عند ' + g : '—') + '\nالجنيه متقلب — خفّض حجم اللوت وزِد وقف الخسارة في الأخبار.',
        'GBP/USD ' + (g ? 'at ' + g : '—') + '\nSterling is volatile — reduce lot size around news.'
      );
    }

    if (/ذهب|gold|xau/.test(q)) {
      return L(
        'الذهب (XAU/USD) يتحرك مع الدولار والعوائد.\nنصيحة: استخدم وقف خسارة أوسع (15–30 نقطة) وحجم مخاطرة 0.5–1%.\nإشارات الذهب على قناتنا: ' + TELEGRAM,
        'Gold moves with USD and yields.\nTip: wider SL (15–30 pips), risk 0.5–1%.\nGold signals: ' + TELEGRAM
      );
    }

    if (/جلس|session|لندن|london|نيويورك|new york|asia|آسيا/.test(q)) {
      return L(
        '🕐 أفضل السيولة:\n• لندن 10:00–14:00 GMT\n• تداخل لندن+نيويورك 13:00–17:00 GMT\n• آسيا: حركة أهدأ على الين والأسترالي',
        '🕐 Best liquidity:\n• London 10:00–14:00 GMT\n• London+NY overlap 13:00–17:00 GMT\n• Asia: quieter on JPY/AUD'
      );
    }

    if (/مخاطر|risk|ادارة|management|نسبة/.test(q)) {
      return L(
        'إدارة مخاطر Sirius Fx:\n• 1% لكل صفقة كحد أقصى\n• R:R لا يقل عن 1:2\n• لا تضاعف اللوت بعد خسارة\nاستخدم حاسبة حجم الصفقة في قسم الأدوات.',
        'Sirius Fx risk rules:\n• Max 1% per trade\n• Min R:R 1:2\n• No revenge trading\nUse our position size calculator in Tools.'
      );
    }

    if (/اشار|signal|صفق|trade idea|توصية/.test(q)) {
      return L(
        '📡 إشارات التداول اليومية على تيليجرام:\n' + TELEGRAM + '\nنقاط دخول، SL، وأهداف واضحة.',
        '📡 Daily trading signals on Telegram:\n' + TELEGRAM + '\nClear entry, SL, and targets.'
      );
    }

    if (/كورس|course|تعلم|learn|تدريب/.test(q)) {
      return L(
        '🎓 الكورسات: أساسيات، تحليل فني، وAI للتداول.\nالتسجيل عبر تيليجرام: ' + TELEGRAM,
        '🎓 Courses: basics, technical analysis, AI trading.\nEnroll via Telegram: ' + TELEGRAM
      );
    }

    if (/شراء|buy|long|صعود/.test(q)) {
      return L(
        'قبل الشراء: تأكد من اتجاه أعلى فريم (H4/D1)، R:R ≥ 2، ووقف خسارة محدد.\nلا تتداول قبل الأخبار الكبرى (NFP, FOMC).',
        'Before buying: confirm higher timeframe trend, R:R ≥ 2, fixed stop loss.\nAvoid trading major news (NFP, FOMC).'
      );
    }

    if (/بيع|sell|short|هبوط/.test(q)) {
      return L(
        'قبل البيع: resistance واضحة + رفض سعري أو نمط هبوطي.\nاستخدم حاسبة R:R في الموقع.',
        'Before selling: clear resistance + rejection or bearish pattern.\nUse the R:R calculator on site.'
      );
    }

    if (/تحليل|analysis|رأي|forecast|توقع/.test(q)) {
      return L(
        'تحليل عام: راقب شريط الأسعار أعلى الصفحة + أدوات الزخم.\nلتحليل مخصص وإشارات: انضم ' + TELEGRAM,
        'General view: watch the live ticker + momentum tool.\nFor custom analysis & signals: ' + TELEGRAM
      );
    }

    if (/مساعد|help|ماذا|what can/.test(q)) {
      return L(
        'أستطيع مساعدتك في:\n• أسعار الأزواج\n• جلسات التداول\n• إدارة المخاطر\n• الإشارات والكورسات\nجرب: "سعر EUR/USD" أو "أفضل جلسة"',
        'I can help with:\n• Pair prices\n• Trading sessions\n• Risk management\n• Signals & courses\nTry: "EUR/USD price" or "best session"'
      );
    }

    return L(
      'لم أفهم السؤال بدقة. جرّب:\n• "سعر EUR/USD"\n• "إدارة المخاطر"\n• "إشارات"\nأو تواصل مع الفريق: ' + TELEGRAM,
      'I did not fully understand. Try:\n• "EUR/USD price"\n• "risk management"\n• "signals"\nOr contact us: ' + TELEGRAM
    );
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
    el.textContent = lang() === 'ar' ? 'يكتب...' : 'Typing...';
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
    return el;
  }

 async function askAI(message) {

    const response = await fetch(
       "https://sirius-fx-production.up.railway.app/chat",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message
            })
        }
    );

    const data = await response.json();

    return data.reply;
} 
async function sendMessage() {
    var input = document.getElementById('chatInput');
    var box = document.getElementById('chatMessages');
    if (!input || !box) return;
    var text = input.value.trim();
    if (!text) return;

    // 1. عرض رسالة المستخدم فوراً وتفريغ الحقل
    addMessage(box, text, 'user');
    input.value = '';

    // 2. إظهار رسالة جاري الكتابة...
    var typing = showTyping(box);

    try {
        // 3. استدعاء السيرفر الخاص بك على ريلوي وجلب الرد
        const aiReply = await askAI(text);
        
        // إزالة مؤشر الكتابة بعد الاستجابة
        if (typing.parentNode) typing.remove();
        
        // 4. عرض رد البوت الحقيقي داخل الشات
        addMessage(box, aiReply, "bot");

    } catch (error) {
        if (typing.parentNode) typing.remove();
        addMessage(box, "عذراً، حدث خطأ في الاتصال بالخادم.", "bot");
        console.error("Error:", error);
    }
}
  function initChat() {
    var form = document.getElementById('chatForm');
    var input = document.getElementById('chatInput');
    var toggle = document.getElementById('chatFab');
    var box = document.getElementById('chatMessages');

    if (!form || !box) return;

    if (!box.dataset.welcome) {
      box.dataset.welcome = '1';
      addMessage(box, replyFor('hello'), 'bot');
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
        var input = document.getElementById('chatInput');
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
