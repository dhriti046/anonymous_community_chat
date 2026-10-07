#  YapYap

**YapYap** is an anonymous, campus‑verified chat platform for IIT Ropar students. It lets you join topic‑based rooms or have 1‑on‑1 direct messages, all while keeping your real identity private.

---

## Problem

Campus communication is fragmented across many WhatsApp groups and social media pages, and students often self‑censor because their real names are visible. YapYap solves this by providing a single space where verified IIT Ropar users can speak freely under a pseudonymous handle.

---

## Objectives

- Authenticate exclusively via IIT Ropar Google accounts (`@iitrpr.ac.in`).
- Allow each user to choose a unique pseudonymous handle.
- Offer real‑time public rooms that can be discovered, filtered, and created.
- Support private 1‑on‑1 messaging.
- Provide a unified "My Chats" dashboard.
- Deliver a modern UI with light/dark theme support.

---

## Team

- **Dhriti**
- **Takshita Nagrale**

---

## Features

- **Campus‑Verified & Pseudonymous** – Sign in with your `@iitrpr.ac.in` Google account, then pick any unique handle.
- **Discover & Create Rooms** – Browse existing rooms or spin up new ones with custom icons and descriptions.
- **My Chats Dashboard** – See all joined rooms and active direct‑message threads in one place.
- **Real‑Time Messaging** – Instant group and private chats powered by Socket.IO.
- **Secure Google OAuth** – Server‑side token verification using `google-auth-library`; JWTs manage sessions.
- **Light / Dark Theme** – System‑aware toggle with consistent styling.
- **Leave Room Confirmation** – Prompt before leaving a room, explaining consequences.

---

## Tech Stack

- **Frontend** – React, Vite, React Router, Axios, @react‑oauth/google, Socket.IO client, vanilla CSS.
- **Backend** – Node.js, Express, MongoDB (Atlas) with Mongoose, Socket.IO, google‑auth‑library, jsonwebtoken.

---

## Authentication Flow

1. User clicks **Sign in with Google**.
2. Google verifies the `@iitrpr.ac.in` domain and returns an ID token.
3. Backend validates the token, checks if the user exists, and:
   - Existing user → JWT issued, redirect to rooms.
   - New user → Frontend asks for username, bio, interests, then creates the profile and issues a JWT.

---

## Project Structure

```
anonymous_community_chatapp/
├─ backend/          # Express server, Socket.IO, auth routes, Mongoose models
├─ frontend/         # React app, pages, components, styles
└─ package.json      # Root scripts (install:all, dev)
```

---
