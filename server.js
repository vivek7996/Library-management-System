// server.js
// Library Management System — Pure Node.js backend
// All core logic ported from library.cpp — no C++ dependency
// Data persisted in JSON files: books.json, users.json, issues.json

const express    = require('express');
const bodyParser = require('body-parser');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Data file paths ───────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, 'data');
const BOOKS_FILE = path.join(DATA_DIR, 'books.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ISSUES_FILE= path.join(DATA_DIR, 'issues.json');

// Ensure data directory and files exist on first run
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(BOOKS_FILE))  fs.writeFileSync(BOOKS_FILE,  '[]');
if (!fs.existsSync(USERS_FILE))  fs.writeFileSync(USERS_FILE,  '[]');
if (!fs.existsSync(ISSUES_FILE)) fs.writeFileSync(ISSUES_FILE, '[]');

// ── Middleware ────────────────────────────────────────────────
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Persistence helpers ───────────────────────────────────────
function loadJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return []; }
}
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function loadBooks()  { return loadJSON(BOOKS_FILE);  }
function loadUsers()  { return loadJSON(USERS_FILE);  }
function loadIssues() { return loadJSON(ISSUES_FILE); }
function saveBooks(d)  { saveJSON(BOOKS_FILE,  d); }
function saveUsers(d)  { saveJSON(USERS_FILE,  d); }
function saveIssues(d) { saveJSON(ISSUES_FILE, d); }

// Days since Unix epoch (mirrors C++ currentDate())
function currentDay() {
  return Math.floor(Date.now() / 86400000);
}

// ── Core library logic (ported 1-to-1 from library.cpp) ───────

function addBook(title, author, quantity) {
  const books = loadBooks();
  const newId = books.length ? books[books.length - 1].id + 1 : 1;
  books.push({ id: newId, title, author, quantity: parseInt(quantity) });
  saveBooks(books);
  return `Book added: ${title} (ID: ${newId})`;
}

function searchBook(keyword) {
  const books = loadBooks();
  const kw = keyword.toLowerCase();
  const found = books.filter(b =>
    b.title.toLowerCase().includes(kw) ||
    b.author.toLowerCase().includes(kw)
  );
  if (!found.length) return `No books found for: ${keyword}`;
  return found.map(b =>
    `ID: ${b.id}, Title: ${b.title}, Author: ${b.author}, Qty: ${b.quantity}`
  ).join('\n');
}

function addUser(username, password) {
  const users = loadUsers();
  if (users.find(u => u.username === username))
    return `Username "${username}" already exists.`;
  const newId = users.length ? users[users.length - 1].id + 1 : 1;
  users.push({ id: newId, username, password });
  saveUsers(users);
  return `User added: ${username} (ID: ${newId})`;
}

function issueBook(userId, bookId) {
  userId  = parseInt(userId);
  bookId  = parseInt(bookId);
  const users  = loadUsers();
  const books  = loadBooks();
  const issues = loadIssues();

  const user = users.find(u => u.id === userId);
  const book = books.find(b => b.id === bookId);
  if (!user) return 'User not found.';
  if (!book) return 'Book not found.';
  if (issues.find(r => r.userId === userId && r.bookId === bookId))
    return 'Book already issued to this user.';
  if (issues.filter(r => r.userId === userId).length >= 3)
    return 'Cannot issue more than 3 books.';
  if (book.quantity <= 0)
    return 'Book not available.';

  issues.push({ userId, bookId, issueDate: currentDay() });
  book.quantity--;
  saveIssues(issues);
  saveBooks(books);
  return 'Book issued successfully.';
}

function returnBook(userId, bookId, returnDate) {
  userId     = parseInt(userId);
  bookId     = parseInt(bookId);
  returnDate = parseInt(returnDate);
  const issues = loadIssues();
  const idx    = issues.findIndex(r => r.userId === userId && r.bookId === bookId);
  if (idx === -1) return 'No such issued book for this user.';

  const days = returnDate - issues[idx].issueDate;
  const fine = days > 7 ? (days - 7) * 2 : 0;

  issues.splice(idx, 1);
  saveIssues(issues);

  const books = loadBooks();
  const book  = books.find(b => b.id === bookId);
  if (book) book.quantity++;
  saveBooks(books);

  return `Book returned. Days: ${days}, Fine: Rs. ${fine}`;
}

function listIssuedBooks(userId) {
  userId = parseInt(userId);
  const issues = loadIssues();
  const books  = loadBooks();
  const userIssues = issues.filter(r => r.userId === userId);
  if (!userIssues.length) return 'No books currently issued.';
  return userIssues.map(r => {
    const book = books.find(b => b.id === r.bookId);
    if (!book) return null;
    return `Book ID: ${book.id}, Title: ${book.title}, Issued on: ${r.issueDate}`;
  }).filter(Boolean).join('\n') || 'No books currently issued.';
}

function login(username, password) {
  if (username === 'admin' && password === 'admin123')
    return 'Login successful\nID: 0\nRole: admin';
  const users = loadUsers();
  const user  = users.find(u => u.username === username && u.password === password);
  if (user) return `Login successful\nID: ${user.id}\nRole: student`;
  return 'Login failed';
}

function viewUsers() {
  const users = loadUsers();
  if (!users.length) return 'No users found.';
  return users.map(u => `ID: ${u.id}, Username: ${u.username}`).join('\n');
}

function viewBooks() {
  const books = loadBooks();
  if (!books.length) return 'No books found.';
  return books.map(b =>
    `ID: ${b.id}, Title: ${b.title}, Author: ${b.author}, Qty: ${b.quantity}`
  ).join('\n');
}

// ── API Routes ────────────────────────────────────────────────

app.post('/add-book', (req, res) => {
  const { title, author, quantity } = req.body;
  if (!title || !author || !quantity) return res.status(400).send('Missing fields.');
  res.send(addBook(title, author, quantity));
});

app.get('/search-book', (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).send('Missing keyword.');
  res.send(searchBook(keyword));
});

app.post('/add-user', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing fields.');
  res.send(addUser(username, password));
});

app.post('/issue-book', (req, res) => {
  const { userId, bookId } = req.body;
  if (!userId || !bookId) return res.status(400).send('Missing fields.');
  res.send(issueBook(userId, bookId));
});

app.post('/return-book', (req, res) => {
  const { userId, bookId, returnDate } = req.body;
  if (!userId || !bookId || !returnDate) return res.status(400).send('Missing fields.');
  res.send(returnBook(userId, bookId, returnDate));
});

app.get('/list-issued', (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).send('Missing userId.');
  res.send(listIssuedBooks(userId));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send('Missing fields.');
  res.send(login(username, password));
});

app.get('/view-users', (req, res) => {
  res.send(viewUsers());
});

app.get('/view-books', (req, res) => {
  res.send(viewBooks());
});

// ── Fallback — serve frontend ─────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Library server running on http://localhost:${PORT}`);
});
