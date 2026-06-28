const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

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

// ---- Auth ----
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.length < 2 || password.length < 4) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    const users = readUsers();
    if (users[username]) {
        return res.status(409).json({ error: 'Username taken' });
    }
    users[username] = password;
    writeUsers(users);
    res.json({ message: 'Registered!' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    const users = readUsers();
    if (!users[username]) {
        return res.status(401).json({ error: 'User not found' });
    }
    if (users[username] !== password) {
        return res.status(401).json({ error: 'Wrong password' });
    }
    res.json({ message: 'Logged in!', username });
});

// ---- Messages ----
app.post('/api/messages', (req, res) => {
    const { username, text, to } = req.body;
    if (!username || !text) {
        return res.status(400).json({ error: 'Missing data' });
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
    res.json({ message: 'Sent!' });
});

app.get('/api/messages', (req, res) => {
    res.json(readMessages());
});

app.get('/api/users', (req, res) => {
    const users = readUsers();
    res.json(Object.keys(users));
});

// ---- Admin: Get users with passwords ----
app.get('/api/admin/users-with-passwords', (req, res) => {
    const users = readUsers();
    const result = Object.keys(users).map(username => ({
        username: username,
        password: users[username]
    }));
    res.json(result);
});

// ---- Admin: Delete ----
app.delete('/api/admin/users/:username', (req, res) => {
    const { username } = req.params;
    if (username === 'admin') {
        return res.status(403).json({ error: 'Cannot delete admin' });
    }
    let users = readUsers();
    if (!users[username]) {
        return res.status(404).json({ error: 'User not found' });
    }
    delete users[username];
    writeUsers(users);
    let msgs = readMessages();
    msgs = msgs.filter(m => m.user !== username);
    writeMessages(msgs);
    res.json({ message: 'User deleted' });
});

// ---- Admin: Kick ----
app.delete('/api/admin/kick/:username', (req, res) => {
    const { username } = req.params;
    if (username === 'admin') {
        return res.status(403).json({ error: 'Cannot kick admin' });
    }
    let msgs = readMessages();
    msgs = msgs.filter(m => m.user !== username);
    writeMessages(msgs);
    res.json({ message: 'User kicked' });
});

// ---- Admin: Clear chat ----
app.delete('/api/admin/clear', (req, res) => {
    writeMessages([]);
    res.json({ message: 'Chat cleared' });
});

// ---- Admin: Jumpscare ----
app.post('/api/admin/jumpscare/:username', (req, res) => {
    const { username } = req.params;
    if (username === 'admin') {
        return res.status(403).json({ error: 'Cannot jumpscare admin' });
    }
    // Store jumpscare flag for the user (will be checked on next poll)
    // For simplicity, we just log it. In a real app, you'd use a shared store.
    res.json({ message: 'Jumpscare sent to ' + username });
});

// ---- Admin: Redirect ----
app.post('/api/admin/redirect/:username', (req, res) => {
    const { username } = req.params;
    const { url } = req.body;
    if (username === 'admin') {
        return res.status(403).json({ error: 'Cannot redirect admin' });
    }
    if (!url) {
        return res.status(400).json({ error: 'URL required' });
    }
    // Store redirect URL for the user
    res.json({ message: 'Redirect sent to ' + username });
});

// ---- Serve frontend ----
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {});
