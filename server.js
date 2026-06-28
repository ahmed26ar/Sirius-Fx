const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const GEMINI_KEY = process.env.GEMINI_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'sirius-fx-jwt-secret-2026';
const USERS_FILE = path.join(__dirname, 'users.json');

const SYSTEM_AR = `أنت Sirius AI — مستشار أسواق مالية لشركة Sirius Fx.
تخصصك: فوركس، معادن (ذهب)، إدارة مخاطر، جلسات التداول، تحليل فني مبسط.
قواعد: رد بالعربية، مختصر وعملي، لا تعد بأرباح مضمونة، ذكّر أنها ليست نصيحة استثمارية.
للإشارات والكورسات: https://t.me/srfx0`;

const SYSTEM_EN = `You are Sirius AI — market assistant for Sirius Fx.
Focus: forex, gold, risk management, sessions, simple technical view.
Rules: concise, practical, no guaranteed profits, not financial advice.
Signals & courses: https://t.me/srfx0`;

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── ROOT ───
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'Sirius Fx AI API — Powered by Gemini',
    endpoints: { chat: 'POST /chat', register: 'POST /api/register', login: 'POST /api/login', profile: 'GET /api/profile' }
  });
});

// ─── REGISTER ───
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const users = loadUsers();
    if (users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name, email, password: hashed,
      avatar: '',
      createdAt: new Date().toISOString(),
      watchlist: ['EUR/USD', 'GBP/USD', 'XAU/USD', 'BTC/USD'],
      preferences: { theme: 'dark', lang: 'ar', notifications: true }
    };
    users.push(user);
    saveUsers(users);
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── LOGIN ───
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email, password required' });
    }
    const users = loadUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── PROFILE ───
app.get('/api/profile', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password, ...safe } = user;
  res.json(safe);
});

// ─── UPDATE PROFILE ───
app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const { name, avatar, preferences } = req.body;
    if (name) users[idx].name = name;
    if (avatar !== undefined) users[idx].avatar = avatar;
    if (preferences) users[idx].preferences = { ...users[idx].preferences, ...preferences };
    saveUsers(users);
    const { password, ...safe } = users[idx];
    res.json(safe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── CHANGE PASSWORD ───
app.put('/api/profile/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const users = loadUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'User not found' });
    const match = await bcrypt.compare(currentPassword, users[idx].password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    users[idx].password = await bcrypt.hash(newPassword, 10);
    saveUsers(users);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── WATCHLIST ───
app.get('/api/watchlist', authMiddleware, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ watchlist: user.watchlist || [] });
});

app.put('/api/watchlist', authMiddleware, (req, res) => {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx].watchlist = req.body.watchlist || [];
  saveUsers(users);
  res.json({ watchlist: users[idx].watchlist });
});

// ─── CHAT ───
app.post('/chat', async (req, res) => {
  try {
    const { message = '', lang = 'ar', rates = {} } = req.body;
    if (!message.trim()) {
      return res.status(400).json({ error: 'message required' });
    }
    if (!GEMINI_KEY) {
      return res.status(500).json({ error: 'GEMINI_KEY غير مضبوط في متغيرات البيئة' });
    }
    let ratesBlock = '';
    if (Object.keys(rates).length) {
      ratesBlock = lang === 'ar'
        ? '\nأسعار حية:\n' + JSON.stringify(rates)
        : '\nLive rates:\n' + JSON.stringify(rates);
    }
    const systemPrompt = (lang === 'ar' ? SYSTEM_AR : SYSTEM_EN) + ratesBlock;
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
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
  console.log(`Sirius AI Server running on port ${PORT}`);
});
