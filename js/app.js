document.addEventListener('DOMContentLoaded', function() {
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  var navbar = document.getElementById('navbar');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('open');
      });
    });
  }

  document.getElementById('langToggle').addEventListener('click', function() {
    setLanguage(currentLang === 'ar' ? 'en' : 'ar');
  });

  window.addEventListener('scroll', function() {
    if (!navbar) return;
    navbar.style.boxShadow = window.scrollY > 50 ? '0 4px 24px rgba(0,212,255,0.1)' : 'none';
  });

  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== تفاعل الخلفية مع حركة الماوس =====
  document.addEventListener('mousemove', function(e) {
    var x = e.clientX / window.innerWidth;
    var y = e.clientY / window.innerHeight;
    
    // تحريك الخلفية بناءً على الماوس
    document.body.style.backgroundPosition = (x * 20) + 'px ' + (y * 20) + 'px';
    
    // تحريك النجوم الكبيرة (إن وجدت)
    var stars = document.querySelectorAll('.star-field');
    if (stars.length) {
      stars.forEach(function(star) {
        star.style.transform = 'translate(' + (x * 30) + 'px, ' + (y * 30) + 'px)';
      });
    }
  });

  // ===== تأثيرات النقر الفضائية =====
  document.addEventListener('click', function(e) {
    var particle = document.createElement('div');
    particle.className = 'space-particle';
    particle.style.cssText = 
      'position: fixed;' +
      'width: 4px;' +
      'height: 4px;' +
      'background: #00d4ff;' +
      'border-radius: 50%;' +
      'left: ' + e.clientX + 'px;' +
      'top: ' + e.clientY + 'px;' +
      'pointer-events: none;' +
      'z-index: 9999;' +
      'animation: particleBurst 0.8s ease-out forwards;';
    document.body.appendChild(particle);
    setTimeout(function() { particle.remove(); }, 800);
  });
});
