const express = require('express');
const cors = require('cors');
 
const app = express();
app.use(cors());
app.use(express.json());
 
const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_KEY;
 
const SYSTEM_AR = `أنت Sirius AI — مستشار أسواق مالية لشركة Sirius Fx.
تخصصك: فوركس، معادن (ذهب)، إدارة مخاطر، جلسات التداول، تحليل فني مبسط.
قواعد: رد بالعربية، مختصر وعملي، لا تعد بأرباح مضمونة، ذكّر أنها ليست نصيحة استثمارية.
للإشارات والكورسات: https://t.me/srfx0`;
 
const SYSTEM_EN = `You are Sirius AI — market assistant for Sirius Fx.
Focus: forex, gold, risk management, sessions, simple technical view.
Rules: concise, practical, no guaranteed profits, not financial advice.
Signals & courses: https://t.me/srfx0`;
 
// ─── الصفحة الرئيسية (للتأكد أن السيرفر شغّال) ─────────────────────────────
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'Sirius Fx AI API — Powered by Gemini',
    endpoints: { chat: 'POST /chat' }
  });
});
 
// ─── نقطة المحادثة ───────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  try {
    const { message = '', lang = 'ar', rates = {} } = req.body;
 
    if (!message.trim()) {
      return res.status(400).json({ error: 'message required' });
    }
 
    if (!GEMINI_KEY) {
      return res.status(500).json({
        error: 'GEMINI_KEY غير مضبوط في متغيرات البيئة'
      });
    }
 
    // أضف الأسعار المباشرة للسياق
    let ratesBlock = '';
    if (Object.keys(rates).length) {
      ratesBlock = lang === 'ar'
        ? '\nأسعار حية:\n' + JSON.stringify(rates)
        : '\nLive rates:\n' + JSON.stringify(rates);
    }
 
    const systemPrompt = (lang === 'ar' ? SYSTEM_AR : SYSTEM_EN) + ratesBlock;
 
    // استدعاء Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: message }] }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
        })
      }
    );
 
    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini error: ${errText}`);
    }
 
    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
 
    if (!reply) {
      return res.status(502).json({ error: 'empty response from Gemini' });
    }
 
    res.json({ reply: reply.trim(), lang });
 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'server error' });
  }
});
 
app.listen(PORT, () => {
  console.log(`✅ Sirius AI Server running on port ${PORT}`);
});
 
