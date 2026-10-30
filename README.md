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

## Email privacy and registration

- Email and Google ID stay server-side for authentication and are excluded from profile, login, and profile-update responses.
- User discovery and profile endpoints now require login and return only public profile fields.
- Email is removed from profile screens and browser profile storage; previously stored identity fields are cleaned on startup.
- New profiles no longer import Google names or photos. Registration requires a verified college account and a single-use token that expires after 10 minutes.
- Added 10 regression checks covering privacy, registration security, and browser storage cleanup. Run `npm test --prefix backend`; build with `npm run build --prefix frontend`. Checks use mocked Google/database operations; live sign-in still needs manual testing.

Restart both frontend and backend and reload the browser after updating. For existing deployments, rotate `JWT_SECRET` to invalidate old sessions (this signs everyone out). If MongoDB automatic index creation is disabled, create the unique `tokenHash` and TTL `expiresAt` indexes for `pendingregistrations`.

Emails remain accessible to database administrators. Socket authentication, conversation permissions, and revocable sessions remain separate security work.

## College Assistant (Groq RAG)

Open **College Assistant** in the navigation bar after signing in. It retrieves
relevant passages from administrator-uploaded college documents and asks Groq to
answer using those passages. Answers include numbered source excerpts, with PDF
page numbers or text sections. If retrieval finds no matches or the model cannot
provide verifiable source quotes, the assistant says it cannot find enough information.

### Setup

1. Use Node.js 22.16+ (Node 24 LTS recommended), then run `npm run install:all`.
2. Add these values to `backend/.env` alongside the existing MongoDB/Google/JWT settings:

   ```env
   GROQ_API_KEY=your-groq-api-key
   GROQ_MODEL=llama-3.3-70b-versatile
   CHATBOT_ADMIN_IDS=your-mongodb-user-id
   ```

   Create a key in the [Groq console](https://console.groq.com/keys). Keep it on
   the backend; never put it in a `VITE_` variable or commit `.env`. Your MongoDB
   user ID is the final part of your own profile URL after signing in. Multiple
   administrators can be configured with comma-separated IDs. An empty list grants
   nobody upload access; users cannot grant themselves access through the UI.
3. Restart with `npm run dev`, sign in as the configured administrator, and open
   **College Assistant**. Upload college documents in **Knowledge library**.
4. Wait for the upload to finish, then ask a complete question. Students can ask
   questions and see sources, but only configured administrators can upload/delete.

### Documents and privacy

- Supports text-based PDF, DOCX, UTF-8 TXT, and Markdown files up to 5 MB and
  200,000 extracted characters each. Scanned PDFs need OCR before upload.
- Text is chunked with overlap and stored in the dedicated MongoDB
  `knowledgedocuments` collection. Original file bytes are not retained. Duplicate
  file contents are rejected. The pilot library supports up to 100 documents.
- Retrieval uses local BM25 keyword ranking, not semantic embeddings. Questions
  should use terms present in the documents; paraphrases with different vocabulary
  may be missed. Groq receives only the question and up to five matching passages.
  No OpenAI account, embedding API, or external vector database is required.
- Upload only college information approved for all signed-in users. Document text
  can appear in answers and source excerpts. Only administrator IDs from the
  backend environment can manage this shared library.
- Profiles, emails, private messages, and previous conversations are not retrieved
  or sent to Groq. The app does not save chatbot conversations; history is held in
  page memory and each question is answered independently. Questions and retrieved
  excerpts are processed by Groq under its data policies.
- Removing a document excludes it from future searches. Already displayed answers
  and database backups are not erased by removal; clear the current chat separately.
- AI answers can still be mistaken even when a quoted source is real. Check sources
  and official notices for important decisions. Citation checks verify source/quote
  existence, not every claim's meaning. Review conflicting or outdated documents.

The assistant is disabled until `GROQ_API_KEY` is configured and documents are
uploaded. No college documents or API credentials are bundled. Generation has a
30-second timeout, requests are limited to eight questions per user per minute,
and file parsing runs in a worker with a timeout. These limits are per server
process; use shared rate limiting and a dedicated ingestion service when scaling.

Run `npm test --prefix backend` and `npm run build --prefix frontend`. Tests cover
actual PDF/DOCX/text extraction, retrieval, citations, administrator permissions,
upload validation, rate limits, and failure paths. Groq and MongoDB operations are
mocked in route tests; validate real answers with your configured service and a
reviewed set of college questions before deployment. API usage may incur Groq charges.
