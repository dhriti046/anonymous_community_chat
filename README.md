YapYap – Anonymous Campus Chat Platform

YapYap is an anonymous, campus-verified chatting platform built exclusively for IIT Ropar students. It provides a common space where students can connect, share ideas, ask questions, and communicate freely without revealing their real identities.

Students can join public discussion rooms, send private messages, and use an AI-powered College Assistant to find information from college brochures and documents.

⸻

Problem Statement

Students often communicate through multiple WhatsApp groups, social media pages, and other platforms. This makes campus information difficult to find and discussions fragmented.

Additionally, students may hesitate to express their opinions or ask questions when their real identities are visible.

YapYap addresses these problems by providing:

* A common platform for campus discussions.
* Anonymous communication through unique usernames.
* Private and public chatting options.
* Easy access to college-related information through an AI chatbot.

⸻

Key Features

1. Campus Verification & Anonymous Profiles

* Sign in using your IIT Ropar Google account (@iitrpr.ac.in).
* Choose your own unique username.
* Your real email and Google identity remain private from other users.
* Only verified IIT Ropar students can access the platform.

2. Public Communities

* Explore different topic-based discussion rooms.
* Search and filter communities based on interests.
* Create new communities with custom names, icons, and descriptions.
* Join or leave communities whenever you want.

3. Private Direct Messaging

* Chat privately with other students.
* Send and receive messages in real time.
* Maintain private one-to-one conversations.

4. My Chats Dashboard

* View all your joined communities in one place.
* Access your active direct message conversations.
* Easily switch between different chats.

5. AI-Powered College Assistant (RAG Chatbot)

YapYap includes a Retrieval-Augmented Generation (RAG) based chatbot that helps students find college-related information.

How it works:

1. Admins upload college brochures and other approved documents through the Knowledge Library.
2. The system extracts text from these documents and stores it in MongoDB.
3. When a student asks a question, the system searches the uploaded documents for relevant information.
4. Relevant text passages are sent to the Groq AI model.
5. The chatbot generates an answer based on the retrieved information and provides source references.

Main capabilities:

* Students can ask questions about college facilities, rules, events, and other information available in uploaded documents.
* Only configured administrators can upload or delete documents.
* Students can view answers along with source excerpts and PDF page numbers or text sections.
* If relevant information is not available, the chatbot indicates that it cannot find enough information.

Technology used:

* Retrieval: BM25 keyword-based search.
* AI model: openai/gpt-oss-120b through Groq.
* Storage: MongoDB.
* Document processing: PDF, DOCX, TXT, and Markdown.

6. Secure Authentication

* Google OAuth authentication.
* Backend verification of Google ID tokens.
* JWT-based session management.
* Single-use registration tokens for new users.

⸻

Technology Stack

Component	Technologies
Frontend	React, Vite, React Router, Axios
Styling	CSS
Backend	Node.js, Express.js
Database	MongoDB Atlas, Mongoose
Real-time Chat	Socket.IO
Authentication	Google OAuth, google-auth-library, JWT
AI Chatbot	RAG, Groq API, openai/gpt-oss-120b
Document Retrieval	BM25
Version Control	Git, GitHub

⸻

Getting Started

Deployed Website:
https://yapyap-rooms.vercel.app/


Follow these steps to run YapYap on your local machine.

Prerequisites

Make sure you have installed:

* Node.js 22.16 or above (Node.js 24 LTS recommended).
* npm.
* MongoDB Atlas account.
* Google OAuth credentials.
* Groq API key (for the College Assistant).

1. Clone the Repository

git clone <YOUR_GITHUB_REPOSITORY_URL>
cd anonymous_community_chatapp

2. Install Dependencies

Run the following command from the root directory:

npm run install:all

This installs the dependencies required by both frontend and backend.

3. Configure Environment Variables

Create a .env file inside the backend folder.

Add the following variables:

PORT=3001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
CHATBOT_ADMIN_IDS=your_mongodb_user_id

Also configure your Google OAuth credentials according to the authentication setup in the project.

Important:

* Replace the placeholder values with your actual credentials.
* CHATBOT_ADMIN_IDS contains the MongoDB user IDs of administrators who can upload and delete college documents.
* Multiple admin IDs can be separated using commas.
4. Start the Application

From the root directory, run:

npm run dev

This starts the frontend and backend development servers.

Open the frontend URL in your browser:

http://localhost:5173

Sign in using your IIT Ropar Google account to start using YapYap.

⸻

College Assistant Setup

To use the AI-powered College Assistant:

1. Configure your Groq API key in backend/.env.
2. Add your MongoDB user ID to CHATBOT_ADMIN_IDS.
3. Restart the application.
4. Sign in using the configured administrator account.
5. Open the College Assistant section.
6. Go to the Knowledge Library.
7. Upload college brochures and other approved documents.
8. Once processing is complete, students can ask questions about the uploaded information.

Supported Documents

* PDF
* DOCX
* TXT
* Markdown

Document limitations:

* Maximum file size: 5 MB.
* Maximum extracted text: 200,000 characters per document.
* Scanned PDFs require OCR before uploading.
* The pilot knowledge library supports up to 100 documents.

The system uses keyword-based BM25 retrieval to find relevant passages. Therefore, questions containing terms related to the uploaded documents generally produce better results.

The chatbot does not maintain conversation history. Each question is processed independently using the available documents.

⸻

Privacy & Security

YapYap is designed to protect the real identities of its users.

Some important privacy measures include:

* Only IIT Ropar Google accounts are accepted.
* Email addresses and Google IDs are kept on the backend.
* Public profile APIs return only necessary profile information.
* Google names and profile pictures are not automatically imported.
* Registration uses single-use tokens that expire after 10 minutes.
* User discovery and profile endpoints require authentication.
* The College Assistant only accesses administrator-uploaded college documents.
* Private messages and user profiles are not sent to the chatbot.

Note: Email information is still accessible to database administrators. Socket authentication, conversation permissions, and revocable sessions require separate security improvements.

⸻

Running Tests

To run backend tests:

npm test --prefix backend

To build the frontend:

npm run build --prefix frontend

The tests cover authentication, privacy, registration, document processing, chatbot retrieval, citations, administrator permissions, and other important functionality.

Some external services, including MongoDB and Groq, are mocked during automated testing. Real authentication and chatbot responses should also be tested manually.

⸻

Future Improvements

* Improve chatbot retrieval using semantic embeddings.
* Add stronger Socket.IO authentication and message authorization.
* Improve moderation and reporting features.
* Add more campus-related information sources.
* Improve chatbot response accuracy and document search.
* Add more community discovery and personalization options.

⸻

Team

Developed by:

* Dhriti
* Takshita Nagrale

⸻

Project Links

* Presentation Deck: [Add Presentation Link]
* Project Demonstration Video: [Add Video Link]

⸻

YapYap – Connect Freely. Stay Anonymous. Stay Connected.