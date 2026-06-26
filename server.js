const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password || username.length < 3 || password.length < 6) {
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
    const users = readUsers();
    if (!users[username] || users[username] !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ message: 'Logged in!', username });
});

app.listen(PORT, () => console.log('Server running'));