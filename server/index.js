const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8899;
const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'web')));

function ensureDb() {
  if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      profile: { vibe: 'energetic', emoji_level: 'high', directness: 'balanced', name: 'SakuraAni' },
      sessions: {}
    }, null, 2));
  }
}
function readDb(){ ensureDb(); return JSON.parse(fs.readFileSync(DB_FILE,'utf8')); }
function writeDb(db){ fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

function styleText(profile){
  const vibe = profile.vibe || 'energetic';
  const emoji = profile.emoji_level || 'medium';
  const direct = profile.directness || 'balanced';
  return { vibe, emoji, direct };
}

function decorateReply(base, profile){
  const { vibe, emoji, direct } = styleText(profile);
  let text = base;
  if (vibe === 'energetic') text = `Yoo~ ${text}`;
  if (vibe === 'mentor') text = `Let's do this step-by-step. ${text}`;
  if (direct === 'blunt') text = text.replace('Maybe', 'Do this');
  if (emoji === 'high') text += ' 🌸✨';
  if (emoji === 'low') text = text.replace(/\s*🌸✨/g, '');
  return text;
}

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'sakura-ani-core' }));

app.get('/api/profile', (_req, res) => {
  const db = readDb();
  res.json(db.profile);
});

app.post('/api/profile', (req, res) => {
  const db = readDb();
  const { vibe, emoji_level, directness, name } = req.body || {};
  db.profile = {
    ...db.profile,
    ...(vibe ? { vibe } : {}),
    ...(emoji_level ? { emoji_level } : {}),
    ...(directness ? { directness } : {}),
    ...(name ? { name } : {})
  };
  writeDb(db);
  res.json(db.profile);
});

app.post('/api/chat', (req, res) => {
  const db = readDb();
  const { sessionId, message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  const sid = sessionId || uuidv4();
  if (!db.sessions[sid]) db.sessions[sid] = [];

  db.sessions[sid].push({ role: 'user', text: message, at: new Date().toISOString() });

  const memHint = db.sessions[sid].length > 1
    ? `I remember we were talking about: "${db.sessions[sid][db.sessions[sid].length - 2].text}". `
    : '';

  let base = `${memHint}You said: "${message}". I can help plan this into next actions.`;
  const reply = decorateReply(base, db.profile);

  db.sessions[sid].push({ role: 'assistant', text: reply, at: new Date().toISOString() });
  writeDb(db);

  res.json({ sessionId: sid, reply, profile: db.profile });
});

app.get('/api/session/:id', (req, res) => {
  const db = readDb();
  res.json({ sessionId: req.params.id, messages: db.sessions[req.params.id] || [] });
});

app.listen(PORT, () => {
  ensureDb();
  console.log(`sakura-ani-core running at http://localhost:${PORT}`);
});
