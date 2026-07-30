# System Architecture

# Technology Stack

Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- React Dropzone

Backend

- Node.js
- Express.js

Database

- MongoDB Atlas

Authentication

- JWT
- bcrypt

Cloud Storage

- AWS S3 / Cloudinary

Realtime

- Socket.IO
- WebRTC

Deployment

Frontend

- Vercel

Backend

- Railway / Render

Database

- MongoDB Atlas

---

# High-Level Architecture

                    React Client
                         │
               REST API / WebSocket
                         │
                 Express Backend
          ┌──────────────┴──────────────┐
          │                             │
     MongoDB Atlas               Cloud Storage
          │                             │
          └──────────────┬──────────────┘
                         │
                     File Metadata

P2P connections use WebRTC after signaling through the backend.

---

# System Components

## Frontend

Responsibilities

- Authentication
- File upload
- Dashboard
- Session management
- Progress tracking

---

## Backend

Responsibilities

- APIs
- Authentication
- Share code generation
- Metadata storage
- Expiry scheduler
- WebSocket signaling

---

## Database

Collections

Users

Files

Shares

Sessions

DownloadLogs

---

# Data Flow

## Cloud Upload

User

↓

React

↓

Express

↓

Cloud Storage

↓

Metadata saved in MongoDB

↓

Share code generated

---

## File Download

Receiver

↓

Enter Code

↓

Backend Validation

↓

Metadata Lookup

↓

Cloud Storage

↓

Download

---

## P2P Transfer

Sender

↓

Create Session

↓

Backend creates Session ID

↓

Receiver joins

↓

WebRTC Signaling

↓

Direct Peer Connection

↓

File Transfer

---

# Security

Authentication

- JWT

Authorization

- Middleware

Passwords

- bcrypt hashing

Rate Limiting

- Express Rate Limit

Validation

- Zod / Joi

CORS

- Enabled

HTTPS

- Required

---

# Background Jobs

Cron Scheduler

Responsibilities

- Delete expired files
- Delete expired metadata
- Cleanup inactive sessions

---

# API Structure

/api/auth

/api/files

/api/share

/api/session

/api/user

---

# Suggested Folder Structure

project/

client/

server/

docs/

README.md

---

client/

components/

pages/

hooks/

context/

services/

utils/

assets/

---

server/

controllers/

routes/

middleware/

services/

models/

config/

utils/

jobs/

socket/

---

# Future Improvements

- Redis caching
- RabbitMQ queues
- File deduplication
- End-to-end encryption
- Chunked uploads
- Resumable uploads
- Multi-region storage
- Admin dashboard
- Audit logging