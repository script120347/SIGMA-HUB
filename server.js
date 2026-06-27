const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File paths
const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// ---- Helpers ----
function readUsers() {
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); }
    catch { return {}; }
}
function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function readMessages() {
    try { return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8')); }
    catch { return []; }
}
function writeMessages(msgs) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(msgs, null, 2));
}

// ---- Routes ----
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    if (username.length < 2 || password.length < 4) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    const users = readUsers();
    if (users[username]) {
        return res.status(409).json({ error: 'Username already taken' });
    }
    users[username] = password;
    writeUsers(users);
    console.log('✅ Registered:', username);
    res.json({ message: 'Registration successful' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    const users = readUsers();
    if (!users[username]) {
        return res.status(401).json({ error: 'User not found' });
    }
    if (users[username] !== password) {
        return res.status(401).json({ error: 'Incorrect password' });
    }
    console.log('✅ Logged in:', username);
    res.json({ message: 'Login successful', username });
});

app.post('/api/messages', (req, res) => {
    const { username, text, to } = req.body;
    if (!username || !text) {
        return res.status(400).json({ error: 'Username and text required' });
    }
    const msgs = readMessages();
    msgs.push({
        user: username,
        text: text,
        time: new Date().toLocaleTimeString(),
        to: to || 'public'
    });
    if (msgs.length > 500) msgs.splice(0, msgs.length - 500);
    writeMessages(msgs);
    res.json({ message: 'Message sent' });
});

app.get('/api/messages', (req, res) => {
    res.json(readMessages());
});

app.get('/api/users', (req, res) => {
    const users = readUsers();
    res.json(Object.keys(users));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
