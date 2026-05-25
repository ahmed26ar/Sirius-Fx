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
});
