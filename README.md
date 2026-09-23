# 💬 YapYap

> **Your campus. Your conversations.**

**YapYap** is a real-time, campus-verified pseudonymous communication platform that enables students to discover, join, and create live discussion rooms happening around campus.

---

## ✨ Features

- 🎓 **Campus-Verified & Pseudonymous** — Choose a unique pseudonymous handle (`@username`) while keeping your identity private.
- 🌐 **Discover Rooms** — Browse, search, and filter campus discussion rooms across topics like *Campus Life*, *Events*, *Sports*, *Gaming*, *Clubs*, *Hostel*, *Creative*, *Study*, *Random*, *Fest*, and *Mess*.
- ➕ **Create Rooms** — Create custom public campus chat rooms with custom icons, categories, and descriptions.
- 💬 **My Chats Dashboard** — Unified dashboard showing all your joined campus rooms and active 1-on-1 direct message conversations.
- ⚡ **Real-Time Chat** — WebSockets via Socket.IO for instant group room discussions and 1-on-1 direct messages.
- 🔐 **Secure Authentication** — JWT stateless authentication, bcrypt password hashing, and duplicate username checking.
- 🌙 **Modern UI** — Glassmorphism design system with responsive layouts, notification indicators, and dark aesthetic.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — Component-driven user interface
- **Vite** — Dev server and bundle builder
- **React Router 6** — Client-side navigation & routing
- **Axios** — Promise-based HTTP client
- **Socket.IO Client** — Real-time WebSocket connection

### Backend
- **Node.js & Express.js** — RESTful API server & room management
- **MongoDB & Mongoose** — NoSQL database and schema modeling
- **Socket.IO** — Real-time bidirectional event dispatching
- **JSON Web Tokens (JWT)** — Stateless authentication middleware
- **bcryptjs** — Password encryption & hashing

---

## 🚀 Getting Started

### 1. First Time Setup

Clone the repository and install dependencies for both root, backend, and frontend:

```bash
git clone https://github.com/dhriti046/anonymous_community_chat.git
cd VeilTalk-anonymous_chatapp
npm install
npm run install:all
```

### 2. Environment Configuration

Create a `.env` file inside the `backend/` folder:

```env
MONGO_URI=mongodb://localhost:27017/yapyap
JWT_SECRET=your_jwt_secret_key_here
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 3. Run the Development Server

Start both backend and frontend concurrently:

```bash
npm run dev
```

The application will be running at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

---

## 📂 Project Structure

```
VeilTalk-anonymous_chatapp/
├── backend/
│   ├── middleware/        # JWT auth middleware
│   ├── models/            # User, Community, Message, CommunityMessage schemas
│   ├── routes/            # Auth, User, Community, and Message routes
│   └── server.js          # Express app setup & Socket.IO events
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/    # Navbar, Avatar, reusable UI components
│       ├── pages/         # Home, Discover Rooms, MyChats, CommunityChat, Chat, Profile, EditProfile
│       ├── styles/        # CSS styling per page & design tokens
│       ├── App.jsx        # Route definitions
│       └── config.js      # API endpoint configuration
└── package.json           # Root scripts with concurrently
```

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
