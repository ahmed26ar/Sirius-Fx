(function () {
  'use strict';

  var currentTab = 'overview';
  var journalTrades = [];
  var notifCount = 0;

  function getLang() { return (typeof currentLang !== 'undefined') ? currentLang : 'ar'; }
  function tr(a, e) { return getLang() === 'ar' ? a : e; }

  /* ===== INIT ===== */
  function init() {
    if (!SiriusAuth.isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }
    loadUserData();
    bindUI();
    switchTab('overview');
    document.getElementById('dashLoading').style.display = 'none';
    populateSignals();
    populateWatchlist();
    populateOverviewSignals();
    startPriceUpdates();
    loadJournal();
    setupAIListeners();
  }

  /* ===== LOAD USER ===== */
  function loadUserData() {
    var user = SiriusAuth.getUser();
    if (!user) return;
    var name = user.name || 'User';
    var initial = name.charAt(0).toUpperCase();
    document.getElementById('sidebarUserName').textContent = name;
    document.getElementById('sidebarAvatar').textContent = initial;
    document.getElementById('topbarUserName').textContent = name;
    document.getElementById('topbarAvatar').textContent = initial;
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileEmail').textContent = user.email || '';
    document.getElementById('profileAvatar').textContent = initial;
    document.getElementById('editName').value = name;
    document.getElementById('editEmail').value = user.email || '';
    document.getElementById('welcomeMsg').textContent = tr('مرحباً بعودتك', 'Welcome back') + ', ' + name.split(' ')[0] + ' 👋';
  }

  /* ===== BIND UI ===== */
  function bindUI() {
    document.querySelectorAll('.sidebar-link[data-tab]').forEach(function (el) {
      el.addEventListener('click', function () {
        switchTab(this.dataset.tab);
        var sidebar = document.getElementById('dashSidebar');
        if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
      });
    });

    document.getElementById('sidebarToggle').addEventListener('click', function () {
      document.getElementById('dashSidebar').classList.toggle('open');
    });
    document.getElementById('sidebarClose').addEventListener('click', function () {
      document.getElementById('dashSidebar').classList.remove('open');
    });
    document.getElementById('sidebarLogout').addEventListener('click', function () {
      if (confirm(tr('تسجيل الخروج؟', 'Logout?'))) SiriusAuth.logout();
    });
    document.getElementById('dashThemeToggle').addEventListener('click', function () {
      if (typeof toggleTheme === 'function') toggleTheme();
    });
    document.getElementById('dashNotifBtn').addEventListener('click', function () {
      document.getElementById('notifPanel').classList.add('open');
    });

    /* Profile */
    document.getElementById('dashBtnSaveProfile').addEventListener('click', saveProfile);
    document.getElementById('dashBtnChangePwd').addEventListener('click', changePassword);
    document.getElementById('dashBtnSavePrefs').addEventListener('click', savePrefs);

    /* Journal */
    document.getElementById('dashBtnJournal').addEventListener('click', addJournalEntry);
    document.getElementById('dashBtnJournalAnalyze').addEventListener('click', analyzeJournal);
    document.getElementById('dashBtnJournalClear').addEventListener('click', clearJournal);

    /* Watchlist add */
    document.addEventListener('click', function (e) {
      if (e.target.classList.contains('wl-remove')) {
        var sym = e.target.dataset.sym;
        removeFromWatchlist(sym);
      }
    });
  }

  /* ===== TAB SWITCHING ===== */
  window.switchTab = function (tab) {
    currentTab = tab;
    document.querySelectorAll('.sidebar-link[data-tab]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('.dash-tab').forEach(function (el) {
      el.classList.toggle('active', el.id === 'tab-' + tab);
    });
    if (tab === 'planner') loadRiskPlanner();
    if (tab === 'journal') renderJournalAnalytics();
  };

  /* ===== OVERVIEW SIGNALS ===== */
  function populateOverviewSignals() {
    var container = document.getElementById('overviewSignals');
    var mockSignals = [
      { icon: '📈', title: 'EUR/USD Buy Signal', desc: 'Entry: 1.0850, SL: 1.0820, TP: 1.0910', tag: 'Active', time: '2m ago' },
      { icon: '📉', title: 'XAU/USD Sell Signal', desc: 'Entry: 2330, SL: 2345, TP: 2300', tag: 'Active', time: '15m ago' },
      { icon: '📈', title: 'GBP/USD Buy Signal', desc: 'Entry: 1.2650, SL: 1.2620, TP: 1.2710', tag: 'Active', time: '32m ago' },
    ];
    container.innerHTML = mockSignals.map(function (s) {
      return '<div class="signal-item">' +
        '<div class="signal-item-icon" style="background:rgba(0,212,255,0.08)">' + s.icon + '</div>' +
        '<div class="signal-item-content">' +
          '<div class="signal-item-title">' + s.title + '</div>' +
          '<div class="signal-item-desc">' + s.desc + '</div>' +
        '</div>' +
        '<span class="signal-item-tag">' + s.tag + '</span>' +
        '<span class="signal-item-time">' + s.time + '</span>' +
      '</div>';
    }).join('');
    document.getElementById('signalCount').textContent = mockSignals.length;
  }

  /* ===== SIGNALS TABLE ===== */
  function populateSignals() {
    var tbody = document.getElementById('signalsTableBody');
    var signals = [
      { pair: 'EUR/USD', dir: 'Buy', entry: '1.0850', sl: '1.0820', tp: '1.0910', result: 'pending', date: '2026-06-28' },
      { pair: 'XAU/USD', dir: 'Sell', entry: '2330.00', sl: '2345.00', tp: '2300.00', result: 'pending', date: '2026-06-28' },
      { pair: 'GBP/USD', dir: 'Buy', entry: '1.2650', sl: '1.2620', tp: '1.2710', result: 'win', date: '2026-06-27' },
      { pair: 'USD/JPY', dir: 'Sell', entry: '149.50', sl: '149.80', tp: '148.90', result: 'win', date: '2026-06-27' },
      { pair: 'BTC/USD', dir: 'Buy', entry: '61200', sl: '60500', tp: '62500', result: 'loss', date: '2026-06-26' },
      { pair: 'AUD/USD', dir: 'Buy', entry: '0.6620', sl: '0.6590', tp: '0.6670', result: 'win', date: '2026-06-26' },
      { pair: 'USD/CAD', dir: 'Sell', entry: '1.3640', sl: '1.3670', tp: '1.3590', result: 'pending', date: '2026-06-25' },
    ];
    var resultLabels = { win: '✅ Win', loss: '❌ Loss', pending: '⏳ Pending' };
    tbody.innerHTML = signals.map(function (s) {
      return '<tr>' +
        '<td class="signal-pair">' + s.pair + '</td>' +
        '<td><span class="signal-direction ' + s.dir.toLowerCase() + '">' + s.dir + '</span></td>' +
        '<td style="font-family:var(--font-en);font-size:12px">' + s.entry + '</td>' +
        '<td style="font-family:var(--font-en);font-size:12px">' + s.sl + '</td>' +
        '<td style="font-family:var(--font-en);font-size:12px">' + s.tp + '</td>' +
        '<td class="signal-result ' + s.result + '">' + resultLabels[s.result] + '</td>' +
        '<td style="font-size:12px;color:var(--text-muted)">' + s.date + '</td>' +
      '</tr>';
    }).join('');
    document.getElementById('signalCount').textContent = signals.length;
  }

  window.refreshSignals = function () {
    populateSignals();
  };

  /* ===== WATCHLIST ===== */
  function populateWatchlist() {
    var container = document.getElementById('watchlistBody');
    var pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'BTC/USD', 'AUD/USD'];
    var prices = { 'EUR/USD': 1.0850, 'GBP/USD': 1.2650, 'USD/JPY': 149.50, 'XAU/USD': 2330.00, 'BTC/USD': 61200, 'AUD/USD': 0.6620 };
    var changes = { 'EUR/USD': 0.0015, 'GBP/USD': -0.0008, 'USD/JPY': -0.25, 'XAU/USD': 8.5, 'BTC/USD': -350, 'AUD/USD': 0.0005 };

    var html = pairs.map(function (sym) {
      var price = prices[sym];
      var change = changes[sym];
      var trend = change >= 0 ? 'up' : 'down';
      var pct = ((change / (price - change)) * 100).toFixed(2);
      var fmtPrice = sym === 'BTC/USD' ? price.toLocaleString() : sym === 'XAU/USD' ? price.toFixed(2) : price.toFixed(5);
      return '<div class="watchlist-item">' +
        '<span class="wl-sym">' + sym + '</span>' +
        '<span class="wl-price">$' + fmtPrice + '</span>' +
        '<span class="wl-change ' + trend + '">' + (change >= 0 ? '+' : '') + change + ' (' + (change >= 0 ? '+' : '') + pct + '%)</span>' +
        '<button class="wl-remove" data-sym="' + sym + '">&times;</button>' +
      '</div>';
    }).join('');

    html += '<div class="wl-add-form">' +
      '<select id="wlAddSelect">' +
        '<option value="">-- ' + tr('اختر زوج', 'Select pair') + ' --</option>' +
        '<option value="NZD/USD">NZD/USD</option>' +
        '<option value="EUR/GBP">EUR/GBP</option>' +
        '<option value="USD/CHF">USD/CHF</option>' +
        '<option value="EUR/JPY">EUR/JPY</option>' +
      '</select>' +
      '<button class="btn btn-primary btn-sm" id="wlAddBtn">+ ' + tr('إضافة', 'Add') + '</button>' +
    '</div>';

    container.innerHTML = html;
    document.getElementById('wlAddBtn').addEventListener('click', function () {
      var sel = document.getElementById('wlAddSelect');
      if (sel.value) addToWatchlist(sel.value);
    });
  }

  window.refreshWatchlist = function () { populateWatchlist(); };

  function addToWatchlist(sym) {
    var container = document.getElementById('watchlistBody');
    var msg = document.createElement('div');
    msg.style.cssText = 'padding:10px;color:var(--sky);font-size:13px;text-align:center';
    msg.textContent = '✅ Added ' + sym;
    container.insertBefore(msg, container.firstChild);
    setTimeout(function () { msg.remove(); }, 2000);
  }

  function removeFromWatchlist(sym) {
    var items = document.querySelectorAll('.watchlist-item');
    items.forEach(function (item) {
      if (item.querySelector('.wl-sym').textContent === sym) {
        item.style.transition = 'all 0.3s';
        item.style.opacity = '0';
        item.style.transform = 'translateX(30px)';
        setTimeout(function () { item.remove(); }, 300);
      }
    });
  }

  /* ===== PRICE UPDATES ===== */
  function startPriceUpdates() {
    if (typeof updateAll === 'function') {
      updateAll();
      setInterval(updateAll, 30000);
    }
  }

  /* ===== JOURNAL ===== */
  function loadJournal() {
    try {
      var data = JSON.parse(localStorage.getItem('sirius-journal')) || [];
      journalTrades = data;
    } catch (e) { journalTrades = []; }
  }

  function saveJournal() {
    localStorage.setItem('sirius-journal', JSON.stringify(journalTrades));
  }

  function addJournalEntry() {
    var pair = document.getElementById('journalPair').value.trim();
    var profit = parseFloat(document.getElementById('journalProfit').value);
    var dir = document.getElementById('journalDirection').value;
    if (!pair || isNaN(profit)) return;
    journalTrades.push({ pair: pair, profit: profit, direction: dir, date: new Date().toISOString() });
    saveJournal();
    document.getElementById('journalPair').value = '';
    document.getElementById('journalProfit').value = '';
    renderJournalAnalytics();
    showNotif(tr('تمت إضافة الصفقة', 'Trade added'));
  }

  function renderJournalAnalytics() {
    var container = document.getElementById('journalResult');
    if (!journalTrades.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📓</div><p>' + tr('أضف صفقات لرؤية التحليل', 'Add trades to see analytics') + '</p></div>';
      return;
    }
    var wins = journalTrades.filter(function (t) { return t.profit > 0; });
    var losses = journalTrades.filter(function (t) { return t.profit <= 0; });
    var total = journalTrades.reduce(function (s, t) { return s + t.profit; }, 0);
    var winRate = (wins.length / journalTrades.length * 100).toFixed(1);
    var avgWin = wins.length ? (wins.reduce(function (s, t) { return s + t.profit; }, 0) / wins.length).toFixed(2) : 0;
    var avgLoss = losses.length ? Math.abs(losses.reduce(function (s, t) { return s + t.profit; }, 0) / losses.length).toFixed(2) : 0;

    container.innerHTML =
      '<div class="jm-hero" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">' +
        '<div class="jm-hero-item" style="text-align:center;background:var(--bg);border-radius:10px;padding:12px 6px;border:1px solid var(--border)">' +
          '<div class="jm-hero-num" style="font-size:1.3rem;font-weight:800;font-family:var(--font-en)">' + journalTrades.length + '</div>' +
          '<div class="jm-hero-label" style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Trades</div></div>' +
        '<div class="jm-hero-item" style="text-align:center;background:var(--bg);border-radius:10px;padding:12px 6px;border:1px solid var(--border)">' +
          '<div class="jm-hero-num" style="font-size:1.3rem;font-weight:800;font-family:var(--font-en);color:#22c55e">' + winRate + '%</div>' +
          '<div class="jm-hero-label" style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Win Rate</div></div>' +
        '<div class="jm-hero-item" style="text-align:center;background:var(--bg);border-radius:10px;padding:12px 6px;border:1px solid var(--border)">' +
          '<div class="jm-hero-num" style="font-size:1.3rem;font-weight:800;font-family:var(--font-en);color:' + (total >= 0 ? '#22c55e' : '#ef4444') + '">$' + total.toFixed(0) + '</div>' +
          '<div class="jm-hero-label" style="font-size:10px;color:var(--text-muted);text-transform:uppercase">P&L</div></div>' +
        '<div class="jm-hero-item" style="text-align:center;background:var(--bg);border-radius:10px;padding:12px 6px;border:1px solid var(--border)">' +
          '<div class="jm-hero-num" style="font-size:1.3rem;font-weight:800;font-family:var(--font-en);color:var(--sky)">' + wins.length + 'W/' + losses.length + 'L</div>' +
          '<div class="jm-hero-label" style="font-size:10px;color:var(--text-muted);text-transform:uppercase">W/L</div></div>' +
      '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<span style="font-size:12px;color:var(--text-muted)">Avg Win: <strong style="color:#22c55e;font-family:var(--font-en)">$' + avgWin + '</strong></span>' +
        '<span style="font-size:12px;color:var(--text-muted)">Avg Loss: <strong style="color:#ef4444;font-family:var(--font-en)">$' + avgLoss + '</strong></span>' +
      '</div>';
  }

  function analyzeJournal() {
    var text = document.getElementById('journalInput').value;
    if (!text.trim()) return;
    var lines = text.trim().split('\n').filter(Boolean);
    lines.forEach(function (line) {
      var parts = line.split(/[,\s]+/);
      if (parts.length >= 2) {
        var pair = parts[0];
        var profit = parseFloat(parts[parts.length - 1]);
        if (pair && !isNaN(profit)) {
          journalTrades.push({ pair: pair, profit: profit, direction: parts[2] || 'Buy', date: new Date().toISOString() });
        }
      }
    });
    saveJournal();
    renderJournalAnalytics();
    document.getElementById('journalInput').value = '';
    showNotif(tr('تم تحليل ' + lines.length + ' صفقة', 'Analyzed ' + lines.length + ' trades'));
  }

  function clearJournal() {
    if (!confirm(tr('مسح كل الصفقات؟', 'Clear all trades?'))) return;
    journalTrades = [];
    saveJournal();
    renderJournalAnalytics();
  }

  /* ===== RISK PLANNER ===== */
  function loadRiskPlanner() {
    var container = document.getElementById('dashRPContent');
    var store;
    try { store = JSON.parse(localStorage.getItem('sirius_risk_plans')); } catch (e) { store = null; }
    if (store && store.plans && store.plans[store.active]) {
      container.innerHTML = '<div class="rp-empty">✅ ' + tr('لديك خطة مخاطرة نشطة', 'You have an active risk plan') + '</div>' +
        '<button class="btn btn-outline btn-sm" onclick="window.location.href=\'index.html#tools\'">' + tr('فتح المخطط الكامل', 'Open Full Planner') + '</button>';
    } else {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><p>' + tr('لم يتم إنشاء خطة بعد', 'No plan created yet') + '</p>' +
        '<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="window.location.href=\'index.html#tools\'">' + tr('إنشاء خطة', 'Create Plan') + '</button></div>';
    }
  }

  /* ===== AI TOOLS ===== */
  function setupAIListeners() {
    var summaryBtn = document.getElementById('dashBtnSummary');
    if (summaryBtn) {
      summaryBtn.addEventListener('click', function () {
        quickAISummary();
      });
    }

    var setupForm = document.getElementById('dashFormSetup');
    if (setupForm) {
      setupForm.addEventListener('submit', function (e) {
        e.preventDefault();
        analyzeDashSetup();
      });
    }

    var sentBtn = document.getElementById('dashBtnSentiment');
    if (sentBtn) {
      sentBtn.addEventListener('click', function () {
        analyzeDashSentiment();
      });
    }
  }

  function callAI(prompt, lang) {
    var apiUrl = (window.SiriusConfig && window.SiriusConfig.apiBase) || 'https://siriusfx.6611zzrru.workers.dev';
    return fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt, lang: lang || 'ar' })
    }).then(function (res) {
      if (!res.ok) throw new Error('API error');
      return res.json();
    }).then(function (data) {
      return data.reply || '⚠️ No response';
    });
  }

  window.quickAISummary = function () {
    var result = document.getElementById('quickAIResult');
    if (!result) return;
    result.innerHTML = '<div style="color:var(--sky)">⏳ ' + tr('جاري التحليل...', 'Analyzing...') + '</div>';
    var lang = getLang();
    var prompt = lang === 'ar'
      ? 'قدم تحليلاً سريعاً للأسواق المالية اليوم في 3 جمل قصيرة.'
      : 'Give a quick market overview today in 3 short sentences.';
    callAI(prompt, lang).then(function (reply) {
      result.innerHTML = '<div style="font-size:13px;line-height:1.7;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px">' + reply.replace(/\n/g, '<br>') + '</div>';
    }).catch(function () {
      result.innerHTML = '<div style="color:var(--error);font-size:13px">⚠️ ' + tr('تعذر الاتصال', 'Connection failed') + '</div>';
    });
  };

  function analyzeDashSetup() {
    var trend = document.getElementById('dashSetupTrend').value;
    var rr = parseFloat(document.getElementById('dashSetupRR').value);
    var risk = parseFloat(document.getElementById('dashSetupRisk').value);
    var session = document.getElementById('dashSetupSession').value;
    var result = document.getElementById('dashResultSetup');
    if (!result) return;

    var score = 50;
    if (trend === 'with') score += 20;
    else if (trend === 'range') score += 5;
    else score -= 15;
    if (rr >= 3) score += 20;
    else if (rr >= 2) score += 15;
    else if (rr >= 1.5) score += 5;
    else score -= 20;
    if (risk <= 1) score += 10;
    else if (risk > 2) score -= 15;
    if (session === 'overlap') score += 15;
    else if (session === 'asia') score -= 5;
    score = Math.max(0, Math.min(100, score));
    var cls = score >= 65 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
    result.innerHTML =
      '<div style="text-align:center;padding:12px">' +
        '<div style="font-size:2rem;font-weight:800;font-family:var(--font-en);color:' + cls + '">' + score + '<span style="font-size:1rem;color:var(--text-muted)">/100</span></div>' +
        '<div style="font-size:13px;color:var(--text-muted);margin-top:4px">' +
          (score >= 65 ? '✅ ' + tr('إعداد قوي', 'Strong Setup') : score >= 40 ? '⚠️ ' + tr('إعداد متوسط', 'Average Setup') : '❌ ' + tr('إعداد ضعيف', 'Weak Setup')) +
        '</div>' +
      '</div>';
  }

  function analyzeDashSentiment() {
    var input = document.getElementById('dashSentimentInput');
    var result = document.getElementById('dashResultSentiment');
    if (!input || !result) return;
    var text = input.value.trim();
    if (!text) { result.innerHTML = '<div style="color:var(--error);font-size:13px">⚠️ ' + tr('أدخل نصاً', 'Enter text') + '</div>'; return; }
    result.innerHTML = '<div style="color:var(--sky)">⏳ ' + tr('جاري التحليل...', 'Analyzing...') + '</div>';
    var lang = getLang();
    callAI(tr('حلل مشاعر النص التالي في سطر واحد:\n', 'Analyze sentiment of this text in one line:\n') + text, lang).then(function (reply) {
      result.innerHTML = '<div style="font-size:13px;line-height:1.7;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:8px">' + reply.replace(/\n/g, '<br>') + '</div>';
    }).catch(function () {
      result.innerHTML = '<div style="color:var(--error);font-size:13px">⚠️ ' + tr('تعذر الاتصال', 'Connection failed') + '</div>';
    });
  }

  /* ===== PROFILE ===== */
  function saveProfile() {
    var name = document.getElementById('editName').value.trim();
    if (!name) return;
    var errEl = document.getElementById('profileError');
    var successEl = document.getElementById('profileSuccess');
    errEl.textContent = '';
    successEl.style.display = 'none';
    SiriusAuth.updateProfile({ name: name }).then(function (data) {
      document.getElementById('sidebarUserName').textContent = data.name;
      document.getElementById('topbarUserName').textContent = data.name;
      document.getElementById('profileName').textContent = data.name;
      document.getElementById('profileAvatar').textContent = data.name.charAt(0).toUpperCase();
      successEl.style.display = 'block';
      setTimeout(function () { successEl.style.display = 'none'; }, 3000);
    }).catch(function (err) {
      errEl.textContent = err.message;
    });
  }

  function changePassword() {
    var cur = document.getElementById('editCurPwd').value;
    var newPwd = document.getElementById('editNewPwd').value;
    var errEl = document.getElementById('pwdError');
    var successEl = document.getElementById('pwdSuccess');
    errEl.textContent = '';
    successEl.style.display = 'none';
    if (!cur || !newPwd) { errEl.textContent = tr('املأ جميع الحقول', 'Fill all fields'); return; }
    if (newPwd.length < 6) { errEl.textContent = tr('كلمة المرور 6 أحرف على الأقل', 'Password must be 6+ characters'); return; }
    SiriusAuth.changePassword(cur, newPwd).then(function () {
      successEl.style.display = 'block';
      document.getElementById('editCurPwd').value = '';
      document.getElementById('editNewPwd').value = '';
      setTimeout(function () { successEl.style.display = 'none'; }, 3000);
    }).catch(function (err) {
      errEl.textContent = err.message;
    });
  }

  function savePrefs() {
    var notif = document.getElementById('prefNotifications').checked;
    var dark = document.getElementById('prefDarkMode').checked;
    var theme = dark ? 'dark' : 'light';
    if (typeof setTheme === 'function') setTheme(theme);
    SiriusAuth.updateProfile({ preferences: { notifications: notif, theme: theme } }).then(function () {
      showNotif(tr('تم حفظ التفضيلات', 'Preferences saved'));
    }).catch(function () {});
  }

  /* ===== NOTIFICATIONS ===== */
  function showNotif(msg) {
    if (!document.getElementById('notifDot')) return;
    document.getElementById('notifDot').style.display = 'block';
    notifCount++;
    var list = document.getElementById('notifList');
    if (list) {
      var item = document.createElement('div');
      item.style.cssText = 'padding:10px 0;border-bottom:1px solid var(--border);font-size:13px';
      item.textContent = '• ' + msg;
      list.insertBefore(item, list.firstChild);
      if (list.children.length > 10) list.lastChild.remove();
      var empty = list.querySelector('.empty-state');
      if (empty) empty.remove();
    }
  }

  window.closeNotif = function () {
    document.getElementById('notifPanel').classList.remove('open');
    document.getElementById('notifDot').style.display = 'none';
    notifCount = 0;
  };

  /* ===== START ===== */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
