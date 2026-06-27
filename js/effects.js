(function () {

  /* ===== 1. MOUSE PARALLAX GLOW ===== */
  function initMouseGlow() {
    var glow = document.createElement('div');
    glow.className = 'mouse-glow';
    document.body.appendChild(glow);

    var x = 0, y = 0, targetX = 0, targetY = 0;
    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function animateGlow() {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      glow.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      requestAnimationFrame(animateGlow);
    }
    animateGlow();
  }

  /* ===== 2. MAGNETIC BUTTONS ===== */
  function initMagneticButtons() {
    document.querySelectorAll('.btn, .ctrl-btn, .chat-fab').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = e.clientX - rect.left - rect.width / 2;
        var dy = e.clientY - rect.top - rect.height / 2;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var maxDist = 150;
        if (dist > maxDist) return;
        var strength = 8;
        var moveX = (dx / dist) * strength * (1 - dist / maxDist);
        var moveY = (dy / dist) * strength * (1 - dist / maxDist);
        btn.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px) scale(1.03)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ===== 3. 3D CARD TILT ===== */
  function initCardTilt() {
    document.querySelectorAll('.card, .ai-card, .course-card, .market-card, .ai-tool-card, .analyzer-card, .signal-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var tiltX = y * -10;
        var tiltY = x * 10;
        card.style.transform = 'perspective(1000px) rotateX(' + tiltX + 'deg) rotateY(' + tiltY + 'deg) translateY(-5px) scale(1.02)';
        card.style.transition = 'transform 0.05s ease';
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s ease';
      });
    });
  }

  /* ===== 4. SMOOTH SCROLL REVEAL ===== */
  function initRevealAnimations() {
    if (typeof IntersectionObserver === 'undefined') return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
          // Add particle burst on reveal
          if (entry.target.classList.contains('section-header')) {
            burstParticles(entry.target);
          }
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ===== 5. PARTICLE BURST ON REVEAL ===== */
  function burstParticles(container) {
    var rect = container.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    for (var i = 0; i < 12; i++) {
      var p = document.createElement('div');
      p.className = 'burst-particle';
      var angle = (i / 12) * Math.PI * 2;
      var dist = 60 + Math.random() * 80;
      var dx = Math.cos(angle) * dist;
      var dy = Math.sin(angle) * dist;
      p.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;--dx:' + dx + 'px;--dy:' + dy + 'px;animation-delay:' + (i * 0.05) + 's';
      document.body.appendChild(p);
      setTimeout(function () { p.remove(); }, 1200);
    }
  }

  /* ===== 6. SMOOTH SCROLL PROGRESS ===== */
  function initScrollProgress() {
    var bar = document.getElementById('navProgress');
    if (!bar) return;
    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
      bar.style.opacity = progress > 2 ? '1' : '0';
    });
  }

  /* ===== 7. COUNT-UP ANIMATION ===== */
  function initCountUp() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count')) || 0;
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          observer.unobserve(el);
          var current = 0;
          var step = Math.ceil(target / 40);
          var timer = setInterval(function () {
            current += step;
            if (current >= target) {
              current = target;
              clearInterval(timer);
            }
            el.textContent = current;
          }, 30);
        }
      }, { threshold: 0.5 });
      observer.observe(el);
    });
  }

  /* ===== 8. RIPPLE EFFECT ON CLICK ===== */
  function initRipple() {
    document.querySelectorAll('.btn, .ctrl-btn, .sym-btn, .iv-btn, .cal-fbtn, .tab').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var ripple = document.createElement('span');
        ripple.className = 'ripple-effect';
        var rect = el.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 1.5;
        var x = e.clientX - rect.left - size / 2;
        var y = e.clientY - rect.top - size / 2;
        ripple.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + 'px;top:' + y + 'px';
        el.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 800);
      });
    });
  }

  /* ===== 9. ANIMATED LOADING SCREEN ===== */
  function initLoader() {
    var loader = document.getElementById('loader');
    if (!loader) return;
    window.addEventListener('load', function () {
      setTimeout(function () {
        loader.classList.add('hide');
        document.body.style.overflow = '';
      }, 800);
    });
    // Fallback: hide after 4s max
    setTimeout(function () {
      if (loader && !loader.classList.contains('hide')) {
        loader.classList.add('hide');
        document.body.style.overflow = '';
      }
    }, 4000);
  }

  /* ===== 10. TEXT ENTRANCE ANIMATION (CSS-only) ===== */
  function initTextEffects() {
    var el = document.querySelector('.hero-title');
    if (!el) return;
    el.style.opacity = '1';
  }

  /* ===== 11. LIVE TICKER ENHANCEMENT ===== */
  function enhanceTicker() {
    var ticker = document.querySelector('.market-update-row');
    if (!ticker) return;
    // Add a live pulse circle if not present
    if (!ticker.querySelector('.live-pulse')) {
      var pulse = document.createElement('span');
      pulse.className = 'live-pulse';
      pulse.innerHTML = '<span class="pulse-ring"></span><span class="pulse-dot"></span>';
      ticker.insertBefore(pulse, ticker.firstChild);
    }
  }

  /* ===== 12. PARALLAX ON SCROLL ===== */
  function initParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY;
      if (scrollY > 600) return;
      var bg = hero.querySelector('.hero-bg');
      var content = hero.querySelector('.hero-content');
      if (bg) bg.style.transform = 'translateY(' + (scrollY * 0.4) + 'px)';
      if (content) content.style.transform = 'translateY(' + (scrollY * -0.15) + 'px)';
    });
  }

  /* ===== 13. FLOATING ORBS ===== */
  function createFloatingOrbs() {
    var container = document.querySelector('.floating-orbs-container');
    if (!container) return;
    var colors = ['rgba(0,212,255,0.12)', 'rgba(138,43,226,0.08)', 'rgba(255,107,107,0.06)'];
    var sizes = [150, 200, 120, 180, 100];
    for (var i = 0; i < 5; i++) {
      var orb = document.createElement('div');
      orb.className = 'floating-orb';
      var size = sizes[i % sizes.length];
      var x = Math.random() * 100;
      var y = 20 + Math.random() * 60;
      var dur = 12 + Math.random() * 18;
      var delay = Math.random() * 10;
      orb.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + x + '%;top:' + y + '%;background:radial-gradient(circle,' + colors[i % colors.length] + ',transparent 70%);animation:orbFloat ' + dur + 's ease-in-out ' + delay + 's infinite;';
      container.appendChild(orb);
    }
  }

  /* ===== MOBILE DETECTION ===== */
  function isMobile() {
    return window.innerWidth < 768 || 'ontouchstart' in window;
  }

  /* ===== INIT ALL ===== */
  function init() {
    var mobile = isMobile();
    function run() {
      if (!mobile) {
        initMouseGlow();
        initMagneticButtons();
        initCardTilt();
      }
      initRevealAnimations();
      initScrollProgress();
      initCountUp();
      initRipple();
      initLoader();
      initTextEffects();
      enhanceTicker();
      initParallax();
      if (!mobile) createFloatingOrbs();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  init();

})();
