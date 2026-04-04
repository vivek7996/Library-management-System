# 📚 Library Management System

A full-stack Library Management System with a Node.js/Express backend and an editorial-themed HTML/CSS/JS frontend. No C++ or external database required — data is stored in local JSON files.

---

## Project Structure

```
library-management-system/
├── server.js          ← Express backend + all library logic
├── package.json
├── .gitignore
├── data/              ← Auto-created on first run (gitignored)
│   ├── books.json
│   ├── users.json
│   └── issues.json
└── public/            ← Frontend (served as static files)
    ├── index.html
    ├── style.css
    ├── login.html
    ├── admin.html
    ├── student.html
    ├── add_book.html
    ├── add_user.html
    ├── search_book.html
    ├── view_books.html
    ├── view_users.html
    ├── issue_book.html
    ├── return_book.html
    └── view_fines.html
```

---

## Running Locally

```bash
npm install
npm start
# Open http://localhost:3000
```

For development with auto-reload:
```bash
npm run dev
```

---

## Deploying to Render

1. Push this project to a GitHub repository.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo.
4. Set the following:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
5. Click **Deploy**.

> **Note:** Render's free tier uses an ephemeral filesystem — data in `data/` will reset on redeploy. For persistent data, connect a database (PostgreSQL via Render, or use a JSON store like [jsonbin.io](https://jsonbin.io)).

---

## Default Credentials

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | admin123  |

Student accounts are created via Admin → Add User.

---

## API Reference

| Method | Endpoint        | Description                  |
|--------|-----------------|------------------------------|
| POST   | /add-book       | Add a book                   |
| GET    | /search-book    | Search books by keyword      |
| GET    | /view-books     | List all books               |
| POST   | /add-user       | Register a student user      |
| GET    | /view-users     | List all users               |
| POST   | /login          | Authenticate a user          |
| POST   | /issue-book     | Issue a book to a user       |
| POST   | /return-book    | Return a book + compute fine |
| GET    | /list-issued    | List books issued to a user  |

---

## Fine Policy

- Books must be returned within **7 days**.
- Fine: **₹2 per day** after the due date.
- Maximum **3 books** per student at a time.
