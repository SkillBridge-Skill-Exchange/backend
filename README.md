# SkillBridge Backend 🔗

A student skill-exchange and freelance mini-platform backend built with Node.js, Express, Sequelize, and MySQL.

> **Team-friendly:** Each developer runs their own local MySQL database. Tables are auto-created by Sequelize — no manual SQL needed beyond `CREATE DATABASE`.

---

## 📁 Project Structure

```
/src
  /config        → Database connection (Sequelize + MySQL)
  /models        → User, Skill, Request, Match, Review
  /controllers   → Route handlers (MVC pattern)
  /routes        → Express routes + input validation
  /middlewares   → Auth (JWT), error handler, validation
  /services      → Business logic (auth, AI match placeholder)
  /utils         → Helpers, seed script
  app.js         → Express app setup
server.js        → Entry point (DB sync + server start)
.env.example     → Environment template
```

---

## 🚀 Developer Setup (For Each Team Member)

### Prerequisites
- **Node.js** 18+
- **MySQL** 8+ (MySQL Workbench, XAMPP, etc.)
- **Git**

### Step 1: Clone & Switch to `dev` Branch

```bash
git clone https://github.com/SkillBridge-Skill-Exchange/backend.git
cd backend
git checkout dev
```

> ⚠️ **Always work on `dev` or feature branches. Never commit to `main` directly.**

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Your Local Database

Open **MySQL Workbench** and run:

```sql
CREATE DATABASE skillbridge;
```

> This is the ONLY manual SQL you need. All tables are auto-created on startup.

### Step 4: Create Your `.env` File

```bash
cp .env.example .env
```

Edit `.env` with **your** MySQL credentials:

```
DB_NAME=skillbridge
DB_USER=root
DB_PASS=your_mysql_password
DB_HOST=localhost
JWT_SECRET=secret
```

> Each developer has their own `.env`. It is **git-ignored** and never committed.

### Step 5: Run the Backend

```bash
npm run dev       # with auto-restart (nodemon)
# or
npm start         # plain node
```

You should see:
```
✅ Database connection established successfully.
✅ Database models synced successfully.
🚀 SkillBridge server running on http://localhost:5000
```

### Step 6: Seed Sample Data (Optional)

```bash
npm run seed
```

| Email               | Password      | Role    |
|---------------------|---------------|---------|
| alice@example.com   | password123   | student |
| bob@example.com     | password123   | student |
| charlie@example.com | password123   | student |
| diana@example.com   | password123   | admin   |

---

## 🌿 Git Branching Strategy

```
main              ← Stable, production-ready (DO NOT commit directly)
 └── dev          ← Active development branch
      └── feature/*  ← Individual feature branches
```

### Rules
- ❌ **Do NOT** commit directly to `main`
- ✅ Always work in `dev` or `feature/*` branches
- ✅ `main` is only updated via **Pull Request merge** from `dev`

---

## 🧑‍🤝‍🧑 Team Workflow

### Working on a New Feature

```bash
# 1. Make sure you're on latest dev
git checkout dev
git pull origin dev

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Work, commit regularly
git add .
git commit -m "feature: add user profile endpoint"

# 4. Push your feature branch
git push origin feature/your-feature-name

# 5. Go to GitHub → Create Pull Request → base: dev
```

### After PR is Merged

```bash
git checkout dev
git pull origin dev
# Your feature is now in dev. Delete local feature branch:
git branch -d feature/your-feature-name
```

### Releasing to Main

```bash
# Only when dev is stable and tested:
# Create a Pull Request on GitHub: dev → main
# Review and merge
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint             | Body                                         | Auth |
|--------|----------------------|----------------------------------------------|------|
| POST   | `/api/auth/register` | `{ name, email, password, role?, college? }`  | ❌   |
| POST   | `/api/auth/login`    | `{ email, password }`                         | ❌   |

### Users
| Method | Endpoint             | Body                   | Auth |
|--------|----------------------|------------------------|------|
| GET    | `/api/users/profile` | —                      | ✅   |
| PUT    | `/api/users/profile` | `{ name?, college? }`  | ✅   |

### Skills
| Method | Endpoint          | Body                                                         | Auth |
|--------|-------------------|--------------------------------------------------------------|------|
| GET    | `/api/skills`     | Query: `?category=X&proficiency_level=Y`                      | ❌   |
| GET    | `/api/skills/:id` | —                                                            | ❌   |
| POST   | `/api/skills`     | `{ skill_name, category?, proficiency_level?, description? }` | ✅   |
| DELETE | `/api/skills/:id` | —                                                            | ✅   |

### Requests
| Method | Endpoint                   | Body                      | Auth |
|--------|----------------------------|---------------------------|------|
| POST   | `/api/requests`            | `{ skill_id, message? }`  | ✅   |
| GET    | `/api/requests`            | —                         | ✅   |
| PATCH  | `/api/requests/:id/status` | `{ status }`               | ✅   |

### Matches
| Method | Endpoint       | Auth |
|--------|----------------|------|
| GET    | `/api/matches` | ✅   |

### Reviews
| Method | Endpoint               | Body                                    | Auth |
|--------|------------------------|-----------------------------------------|------|
| POST   | `/api/reviews`         | `{ reviewed_user_id, rating, comment? }` | ✅   |
| GET    | `/api/reviews/:userId` | —                                       | ❌   |

**Auth header:** `Authorization: Bearer <JWT_TOKEN>`

---

## ☁️ Migrating Local DB to Cloud

### Export Local Database

```bash
mysqldump -u root -p skillbridge > skillbridge_backup.sql
```

> In MySQL Workbench: Server → Data Export → Select `skillbridge` → Export

### Import to Cloud

```bash
mysql -h <cloud-host> -u <cloud-user> -p skillbridge < skillbridge_backup.sql
```

### Update `.env`

```
DB_HOST=your-cloud-host.amazonaws.com
DB_USER=cloud_username
DB_PASS=cloud_password
```

This works because Sequelize models define consistent schema — `sync({ alter: true })` only adds missing columns, never drops data.

---

## 🧠 AI Match Service

`services/matchService.js` uses Jaccard similarity as a placeholder. Replace `calculateMatchScore()` with an HTTP call to a Python ML microservice when ready.

---

## ⚙️ Tech Stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Runtime    | Node.js, Express.js              |
| Database   | MySQL                            |
| ORM        | Sequelize                        |
| Auth       | JWT + bcrypt                     |
| Validation | express-validator                |
| Logging    | Morgan                           |

---

## 📝 License

ISC
