# Project Context

## Project Name

TransferX (Working Title)

> A hybrid secure file transfer platform that supports both direct peer-to-peer transfers and cloud-based file sharing.

---

# Problem Statement

Traditional file sharing platforms generally fall into two categories:

1. Cloud Storage Platforms
   - Google Drive
   - Dropbox
   - OneDrive

   These permanently store user files and require cloud infrastructure.

2. Direct Transfer Platforms
   - LocalSend
   - Snapdrop
   - Wormhole

   These focus on temporary file transfers but often lack persistent sharing features.

Most users require both workflows depending on the situation.

Examples:

- Instantly send a file to a nearby friend.
- Upload notes today and allow classmates to download tomorrow.
- Share interview documents that automatically expire.
- Send confidential files protected by passwords.

The objective is to provide both transfer models inside a single application.

---

# Vision

Create a modern, secure and simple file transfer platform that enables users to choose between:

- Instant peer-to-peer transfers
- Temporary cloud file sharing

without requiring unnecessary complexity.

---

# Target Audience

Primary Users

- College students
- Developers
- Working professionals
- Teams
- Freelancers

Secondary Users

- Teachers
- HR recruiters
- Event organizers
- Small businesses

---

# User Pain Points

Current problems users face include:

- Large email attachment limits
- Permanent cloud storage for temporary files
- Complex account creation
- Slow uploads for quick transfers
- Lack of automatic expiry
- Weak security for shared links

---

# Solution Overview

The platform provides two independent transfer modes.

## Instant Transfer

- WebRTC-based
- Temporary session
- No file storage
- Multiple users can join
- Session expires automatically

## Secure Share

- Upload files to cloud storage
- Receive a unique share code
- Password protection
- Download limits
- Automatic expiry

---

# Goals

Functional Goals

- Secure file sharing
- Fast transfers
- Easy user experience
- Cross-platform browser support

Technical Goals

- MERN Stack
- Cloud storage integration
- WebRTC implementation
- JWT Authentication
- Responsive UI
- REST APIs

---

# Non Goals

The following are intentionally excluded.

- Google Drive replacement
- Document editing
- Collaborative office suite
- Unlimited cloud storage
- Messaging platform
- Video conferencing

---

# Success Metrics

- Successful upload rate
- Successful P2P connection rate
- Average upload time
- Download completion rate
- Average response time
- User retention during testing