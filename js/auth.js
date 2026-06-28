const SiriusAuth = (function () {
  var API = (window.SiriusConfig && window.SiriusConfig.apiBase) || 'https://siriusfx.6611zzrru.workers.dev';
  var TOKEN_KEY = 'sirius-token';
  var USER_KEY = 'sirius-user';

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); }
    catch (e) { return null; }
  }
  function isLoggedIn() { return !!getToken(); }

  function saveSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getLang() { return (typeof currentLang !== 'undefined') ? currentLang : 'ar'; }

  function tr(a, e) { return getLang() === 'ar' ? a : e; }

  async function register(name, email, password) {
    var res = await fetch(API + '/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, email: email, password: password })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    saveSession(data.token, data.user);
    return data;
  }

  async function login(email, password) {
    var res = await fetch(API + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    saveSession(data.token, data.user);
    return data;
  }

  function logout() {
    clearSession();
    window.location.href = 'index.html';
  }

  async function fetchProfile() {
    var token = getToken();
    if (!token) throw new Error('Not authenticated');
    var res = await fetch(API + '/api/profile', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch profile');
    localStorage.setItem(USER_KEY, JSON.stringify({ id: data.id, name: data.name, email: data.email, avatar: data.avatar }));
    return data;
  }

  async function updateProfile(data) {
    var token = getToken();
    var res = await fetch(API + '/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify(data)
    });
    var json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Update failed');
    return json;
  }

  async function changePassword(currentPassword, newPassword) {
    var token = getToken();
    var res = await fetch(API + '/api/profile/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword })
    });
    var data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password change failed');
    return data;
  }

  function initAuthUI() {
    var loggedIn = isLoggedIn();
    var user = getUser();
    var loginBtn = document.getElementById('loginBtn');
    var registerBtn = document.getElementById('registerBtn');
    var userMenu = document.getElementById('userMenu');
    var userName = document.getElementById('userName');
    var logoutBtn = document.getElementById('logoutBtn');

    if (loggedIn && user) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (registerBtn) registerBtn.style.display = 'none';
      if (userMenu) { userMenu.style.display = 'inline-flex'; }
      if (userName) userName.textContent = user.name;
    } else {
      if (loginBtn) loginBtn.style.display = '';
      if (registerBtn) registerBtn.style.display = '';
      if (userMenu) userMenu.style.display = 'none';
    }
    if (logoutBtn) logoutBtn.addEventListener('click', function (e) { e.preventDefault(); logout(); });
  }

  function showAuthModal(tab) {
    var existing = document.getElementById('authModal');
    if (existing) existing.remove();
    var lang = getLang();

    var modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML =
      '<div class="auth-modal-overlay"></div>' +
      '<div class="auth-modal-box">' +
        '<button class="auth-modal-close" id="authClose">&times;</button>' +
        '<div class="auth-logo">' +
          '<img src="assets/logo_new_png.png" alt="" width="52" height="52">' +
          '<span>Sirius <span class="accent">Fx</span></span>' +
        '</div>' +
        '<div class="auth-tabs">' +
          '<button class="auth-tab ' + (tab === 'login' ? 'active' : '') + '" data-tab="login">' + tr('تسجيل الدخول', 'Login') + '</button>' +
          '<button class="auth-tab ' + (tab === 'register' ? 'active' : '') + '" data-tab="register">' + tr('إنشاء حساب', 'Register') + '</button>' +
        '</div>' +
        '<div id="authForms">' +
          '<div class="auth-form-wrap ' + (tab !== 'register' ? 'active' : '') + '" id="form-login">' +
            '<form id="authLoginForm">' +
              '<div class="auth-field">' +
                '<label>' + tr('البريد الإلكتروني', 'Email') + '</label>' +
                '<input type="email" id="loginEmail" placeholder="email@example.com" required>' +
              '</div>' +
              '<div class="auth-field">' +
                '<label>' + tr('كلمة المرور', 'Password') + '</label>' +
                '<input type="password" id="loginPassword" placeholder="••••••" required>' +
              '</div>' +
              '<div class="auth-error" id="loginError"></div>' +
              '<button type="submit" class="btn btn-primary btn-lg auth-submit" id="loginSubmitBtn">' +
                tr('تسجيل الدخول', 'Login') +
              '</button>' +
            '</form>' +
          '</div>' +
          '<div class="auth-form-wrap ' + (tab === 'register' ? 'active' : '') + '" id="form-register">' +
            '<form id="authRegisterForm">' +
              '<div class="auth-field">' +
                '<label>' + tr('الاسم', 'Full Name') + '</label>' +
                '<input type="text" id="regName" placeholder="' + tr('اسم المستخدم', 'Your name') + '" required>' +
              '</div>' +
              '<div class="auth-field">' +
                '<label>' + tr('البريد الإلكتروني', 'Email') + '</label>' +
                '<input type="email" id="regEmail" placeholder="email@example.com" required>' +
              '</div>' +
              '<div class="auth-field">' +
                '<label>' + tr('كلمة المرور', 'Password') + '</label>' +
                '<input type="password" id="regPassword" placeholder="••••••" required minlength="6">' +
              '</div>' +
              '<div class="auth-error" id="registerError"></div>' +
              '<button type="submit" class="btn btn-primary btn-lg auth-submit" id="registerSubmitBtn">' +
                tr('إنشاء حساب', 'Create Account') +
              '</button>' +
            '</form>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    setTimeout(function () { modal.classList.add('open'); }, 10);

    document.getElementById('authClose').onclick = closeAuthModal;
    modal.querySelector('.auth-modal-overlay').onclick = closeAuthModal;

    document.querySelectorAll('.auth-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.auth-tab').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.auth-form-wrap').forEach(function (f) { f.classList.remove('active'); });
        document.getElementById('form-' + this.dataset.tab).classList.add('active');
      });
    });

    bindAuthForms();
  }

  function closeAuthModal() {
    var modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () { modal.remove(); }, 300);
    }
  }

  function bindAuthForms() {
    var loginForm = document.getElementById('authLoginForm');
    var registerForm = document.getElementById('authRegisterForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var btn = document.getElementById('loginSubmitBtn');
        var errEl = document.getElementById('loginError');
        btn.disabled = true;
        btn.textContent = tr('جاري تسجيل الدخول...', 'Logging in...');
        errEl.textContent = '';
        try {
          await login(
            document.getElementById('loginEmail').value,
            document.getElementById('loginPassword').value
          );
          closeAuthModal();
          window.location.href = 'dashboard.html';
        } catch (err) {
          errEl.textContent = err.message;
        } finally {
          btn.disabled = false;
          btn.textContent = tr('تسجيل الدخول', 'Login');
        }
      });
    }
    if (registerForm) {
      registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var btn = document.getElementById('registerSubmitBtn');
        var errEl = document.getElementById('registerError');
        btn.disabled = true;
        btn.textContent = tr('جاري إنشاء الحساب...', 'Creating...');
        errEl.textContent = '';
        try {
          await register(
            document.getElementById('regName').value,
            document.getElementById('regEmail').value,
            document.getElementById('regPassword').value
          );
          closeAuthModal();
          window.location.href = 'dashboard.html';
        } catch (err) {
          errEl.textContent = err.message;
        } finally {
          btn.disabled = false;
          btn.textContent = tr('إنشاء حساب', 'Create Account');
        }
      });
    }
  }

  return {
    getToken: getToken, getUser: getUser, isLoggedIn: isLoggedIn,
    register: register, login: login, logout: logout,
    fetchProfile: fetchProfile, updateProfile: updateProfile, changePassword: changePassword,
    initAuthUI: initAuthUI, showAuthModal: showAuthModal, closeAuthModal: closeAuthModal
  };
})();

document.addEventListener('DOMContentLoaded', SiriusAuth.initAuthUI);
