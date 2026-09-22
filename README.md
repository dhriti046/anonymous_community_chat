# YapYap

A real-time anonymous messaging platform where users connect based on shared interests while keeping their identity private.

## Features

- 🔐 Secure email & password authentication
- 🎭 Automatically generated anonymous usernames
- 💬 Real-time messaging with Socket.IO
- 👤 Anonymous user profiles
- 🎯 Interest-based user discovery
- 🌙 Modern responsive UI

## Tech Stack

- React
- Node.js
- Express.js
- MongoDB
- Socket.IO
- JWT

## First time setup (run once)

```bash
cd anonymous_chat
npm install
npm run install:all
```

Then create your `.env` file inside the `backend` folder:
```
MONGO_URI=mongodb://localhost:27017/anonymous_chat
JWT_SECRET=anyrandomsecretstring123
PORT=3001
```

## Run the project

```bash
npm run dev
```

This starts both backend and frontend together. Open http://localhost:5173


## Features

- **Register & Login** — Create an account with a username, bio, and interests. Passwords are hashed before storing. Login returns a JWT token that keeps you authenticated.
- **Discover Users** — Browse everyone on the platform. Filter by interest or username to find people you'd actually want to talk to.
- **User Profiles** — Every user has a public profile showing their bio and interests. You can view anyone's profile and jump straight into a chat from there.
- **Edit Profile** — Update your username, bio, and interests any time.
- **Real-time Chat** — One-on-one messaging that delivers instantly using WebSockets. No refresh needed.
- **Chat History** — Messages are saved to the database, so your conversation is still there when you come back.
- **Online Indicators** — Green dot on avatars shows who's currently active.
- **Protected Routes** — Pages like Discover, Chat, and Edit Profile redirect to Login if you're not authenticated.

---

## What We Used and Why

### Backend

| Technology | What it does | Why we chose it |
|---|---|---|
| **Node.js** | Runs JavaScript on the server | Same language as the frontend — no context switching |
| **Express** | HTTP server and routing | Minimal and flexible — just enough structure without being opinionated |
| **MongoDB** | Stores users and messages | Schema-flexible, works naturally with JavaScript objects |
| **Mongoose** | Defines data models for MongoDB | Adds structure and validation on top of raw MongoDB |
| **Socket.io** | Real-time bidirectional messaging | Handles WebSocket connections and fallbacks automatically |
| **bcryptjs** | Hashes passwords | Passwords are never stored as plain text — bcrypt makes them one-way encrypted |
| **jsonwebtoken** | Creates and verifies auth tokens | Stateless authentication — no server-side sessions needed |
| **dotenv** | Loads environment variables | Keeps secrets like DB URIs and JWT keys out of the codebase |
| **cors** | Allows the frontend to call the backend | Browsers block cross-origin requests by default — this lifts that restriction |
| **nodemon** | Auto-restarts server on file changes | Speeds up development — no manual restarts |

### Frontend

| Technology | What it does | Why we chose it |
|---|---|---|
| **React** | Builds the UI from components | Component model makes pages reusable and state management straightforward |
| **Vite** | Dev server and bundler | Much faster than older tools like Create React App |
| **React Router** | Maps URLs to page components | Gives the app multiple pages without full page reloads |
| **Axios** | Makes HTTP requests to the backend | Cleaner API than the native fetch — automatic JSON parsing and better error handling |
| **Socket.io-client** | Connects to the Socket.io server | Pairs with the backend Socket.io instance for real-time events |

### Root

| Technology | What it does | Why we chose it |
|---|---|---|
| **concurrently** | Runs backend and frontend with one command | Without it you'd need two terminals open every time |

---
