# Design Document

# Design Philosophy

The application should feel

- Clean
- Fast
- Minimal
- Modern

Primary inspiration

- Dashbeam
- WeTransfer
- Dropbox
- Linear
- Vercel Dashboard

---

# Color Palette

Primary

Blue

Secondary

Purple

Success

Green

Warning

Orange

Danger

Red

Background

White / Dark Gray

---

# Typography

Headings

Poppins

Body

Inter

Code

JetBrains Mono

---

# Navigation

Guest

Home

Transfer

Share

Access

Login

Register

---

Authenticated

Dashboard

Upload

Transfers

Profile

Settings

Logout

---

# User Flow

## P2P Transfer

Home

↓

Create Session

↓

Generate Code

↓

Others Join

↓

Transfer Files

↓

Session Ends

---

## Cloud Share

Dashboard

↓

Upload

↓

Configure Expiry

↓

Optional Password

↓

Generate Code

↓

Share Code

↓

Receiver Downloads

↓

Expiry Deletes File

---

## Access Flow

Home

↓

Enter Code

↓

Validate

↓

Password

↓

Download

---

# Pages

Landing Page

Dashboard

Upload

Access File

P2P Session

Login

Register

Profile

Settings

404 Page

---

# Components

Navbar

Sidebar

File Card

Progress Bar

Upload Modal

Download Modal

Share Modal

QR Dialog

Confirmation Dialog

Toast Notifications

---

# Responsive Design

Desktop

Primary Target

Tablet

Supported

Mobile

Supported

---

# UX Guidelines

- Drag and drop upload
- Skeleton loading
- Toast feedback
- Smooth transitions
- Dark mode
- Keyboard accessibility
- Copy-to-clipboard
- Progress indicators

---

# Wireframe Structure

Landing

---------------------------------
Logo

Hero

Transfer Button

Share Button

Access Button

Features

Footer

---------------------------------

Dashboard

---------------------------------
Sidebar

Statistics

Recent Uploads

Recent Downloads

Quick Actions

---------------------------------

Upload

---------------------------------
Drop Zone

Selected Files

Upload Options

Expiry

Password

Upload Button

---------------------------------