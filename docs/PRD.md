# Product Requirements Document

# Overview

TransferX is a hybrid file sharing application supporting both direct peer-to-peer transfers and cloud-based secure file sharing.

---

# User Personas

## Guest User

Can

- Upload limited files
- Download shared files
- Join P2P sessions

Cannot

- Password protect uploads
- Upload larger files
- View upload history

---

## Registered User

Can

- Unlimited uploads
- Password protection
- Custom expiry
- Download analytics
- File management

---

# Core Modules

## Authentication

Requirements

- Register
- Login
- Logout
- JWT Authentication
- Password Hashing

---

## P2P Transfer

User Story

"As a user, I want to instantly transfer files without uploading them to the server."

Requirements

- Create session
- Join session
- Session Code
- Multiple participants
- File transfer progress
- Auto session deletion

Priority

High

---

## Secure Share

User Story

"As a user, I want to upload files and share them later."

Requirements

- Upload file
- Cloud storage
- Share code generation
- Password protection
- Expiry
- Download counter

Priority

High

---

## File Access

User Story

"As a receiver, I want to enter a code and retrieve files."

Requirements

- Enter code
- Password validation
- Download file
- Display expiry
- Display remaining downloads

---

## Dashboard

Requirements

- Uploaded files
- Recent downloads
- Storage usage
- Active shares
- Expired shares

---

# Functional Requirements

FR-1

User registration

FR-2

User authentication

FR-3

Upload files

FR-4

Download files

FR-5

Delete files

FR-6

Generate share code

FR-7

Password protect files

FR-8

Automatic expiry

FR-9

P2P session creation

FR-10

Join P2P session

FR-11

Multiple participant support

FR-12

Download analytics

---

# Non Functional Requirements

Security

- HTTPS
- JWT
- Password hashing
- Rate limiting

Performance

- Upload progress
- Chunked uploads
- Efficient downloads

Scalability

- Cloud storage
- Stateless backend
- Horizontal scaling

Reliability

- Retry uploads
- Resume downloads

---

# Acceptance Criteria

P2P

✓ Files transfer without server storage

Cloud Share

✓ Files accessible through code

Expiry

✓ Files automatically deleted

Authentication

✓ JWT validation works

Dashboard

✓ User can manage uploads

---

# Future Scope

- End-to-end encryption
- Mobile app
- Desktop client
- QR sharing
- Team workspaces
- File previews
- Folder sharing
- WebSocket notifications