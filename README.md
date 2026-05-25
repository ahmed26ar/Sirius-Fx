# Sirius Fx — موقع الشركة

موقع احترافي لشركة **Sirius Fx** (فوركس): إشارات تداول، كورسات، وأدوات ذكاء اصطناعي.

## المميزات

- عربي / إنجليزي مع دعم RTL
- الوضع الداكن والفاتح
- شريط أسعار مباشر (EUR/USD, GBP/USD, …)
- أدوات تداول: حجم الصفقة، قيمة النقطة، R:R، فيبوناتشي، الهامش
- أدوات AI: محلل الصفقة، كاشف الشموع، تحليل اليوميات، محلل الزخم
- رابط تيليجرام: https://t.me/srfx0

## النشر على GitHub Pages

1. أنشئ مستودعاً جديداً على GitHub (مثلاً `sirius-fx`)
2. ارفع محتويات هذا المجلد
3. من **Settings → Pages**:
   - Source: **Deploy from a branch**
   - Branch: `main` / folder: **/ (root)**
4. بعد دقائق يكون الموقع على: `https://YOUR_USERNAME.github.io/srfx0/`

> إذا كان اسم المستودع `username.github.io` يُنشر من الجذر مباشرة.

## التشغيل محلياً

افتح `index.html` في المتصفح، أو:

```bash
npx serve .
```

## هيكل المشروع

```
sirius-fx/
├── index.html
├── css/main.css
├── js/
│   ├── i18n.js
│   ├── theme.js
│   ├── ticker.js
│   ├── trading-tools.js
│   ├── ai-tools.js
│   └── app.js
├── .nojekyll
└── README.md
```

## الألوان

- أسود `#000000`
- أبيض `#ffffff`
- سماوي `#00d4ff`

---

© 2026 Sirius Fx
