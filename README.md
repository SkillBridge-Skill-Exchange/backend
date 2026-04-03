# SkillBridge Backend 🔗

A student skill-exchange and freelance mini-platform backend built with Node.js, Express, Sequelize (MySQL), and Mongoose (MongoDB).

> **Hybrid Database Architecture:** Uses **MySQL (Sequelize)** for structured data like Users, Skills, and Reviews, and **MongoDB (Mongoose)** for flexible, high-traffic messaging data including group chats and audio metadata.

---

## 📁 Project Structure

```
/src
  /config        → Database connections (MySQL + MongoDB)
  /models        → Sequelize: User, Skill, Request, Match, Review | Mongoose: Messenger
  /controllers   → Route handlers (MVC pattern)
  /routes        → Express routes + input validation
  /middlewares   → Auth (JWT), error handler, validation, Multer (uploads)
  /services      → Business logic (auth, AI match fallback)
  /socket        → Socket.io handlers for real-time messaging
  /utils         → Helpers, seed script
  app.js         → Express app setup
server.js        → Entry point (DB syncs + server start)
.env.example     → Environment template
```

---

## 🚀 Developer Setup

### Prerequisites
- **Node.js** 18+
- **MySQL** 8+
- **MongoDB** 6+ (Local or Atlas)
- **Git**

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/SkillBridge-Skill-Exchange/backend.git
cd backend
npm install
```

### Step 2: Configure Databases

1. **MySQL**: Create a local database named `skillbridge`.
2. **MongoDB**: Ensure your MongoDB service is running (locally or on Atlas).

### Step 3: Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Required Variables**:
- `PORT`: 5000
- `DB_NAME`: skillbridge
- `DB_USER`: root
- `DB_PASS`: your_mysql_password
- `MONGO_URI`: mongodb://localhost:27017/skillbridge
- `JWT_SECRET`: your_secret

---

## 💬 Messaging Features

The backend now supports a robust messaging system:
- **Real-time Synchronization**: Messages, typing indicators, and read receipts via **Socket.io**.
- **Multimedia Support**: Integration for image, video, and **Voice Messaging** (Audio recording).
- **Group Management**:
    - Role-based permissions (Admin vs. Member).
    - Administrative controls (Add/Remove members, Promote to Admin).
    - Group Info and live member synchronization.
- **Audit Logs**: System messages within chats for group events.

---

## 🔌 API Reference Highlights

### Auth & Users
- `POST /api/auth/register` | `POST /api/auth/login`
- `GET /api/users/profile` | `PUT /api/users/profile`

### Skills & Requests
- `GET /api/skills` | `POST /api/skills`
- `POST /api/requests` | `PATCH /api/requests/:id/status`

### Messaging (REST & Socket)
- `GET /api/messages/conversations` (Fetch chat list)
- `POST /api/messages/group` (Create group)
- `POST /api/messages/upload` (Multer upload for media)
- **Socket Events**: `message_send`, `typing`, `mark_as_read`, `group_add_members`, `group_leave`.

---

## 🌿 Git Branching Strategy

- **main**: Stable, production-ready.
- **dev**: Active development branch.
- **feature/**: Individual feature branches.

> ⚠️ Always work on `dev` or feature branches. Never commit to `main` directly.

---

## ⚙️ Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Runtime    | Node.js, Express.js                 |
| Databases  | MySQL (Sequelize), MongoDB (Mongoose) |
| Real-time  | Socket.io                           |
| Auth       | JWT + bcrypt                        |
| Media      | Multer (File Uploads)               |
| AI Matching| Python Flask Microservice (Port 5001)|

---

## 📝 License

ISC
