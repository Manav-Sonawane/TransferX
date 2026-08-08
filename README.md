<div align="center">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 20px; border-radius: 16px; display: inline-block; margin-bottom: 20px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>
  </div>

  <h1>TransferX</h1>
  
  <p><strong>Transfer Files Instantly & Securely</strong></p>

  <p>
    A hybrid file-sharing platform that supports both direct peer-to-peer (P2P) transfers and secure cloud-based file sharing with passwords, expiry dates, and download limits.
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#architecture">Architecture</a>
  </p>
</div>

---

## ✨ Features

- ⚡ **Instant P2P Transfer:** Transfer files directly between browsers using WebRTC. No server storage, no wait times.
- 🔒 **Secure Cloud Share:** Upload once, share with a code. Features include password protection, download limits, and auto-expiry.
- 👥 **Multi-Participant:** Multiple users can join a single P2P session and receive files simultaneously.
- 📊 **Dashboard:** Manage your uploads, view download analytics, and track storage usage.
- 🎨 **Modern UI:** Clean, responsive, and beautiful dark-mode interface built with Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (Styling)
- **React Router** (Navigation)
- **Lucide React** (Icons)
- **React Hot Toast** (Notifications)

### Backend
- **Node.js & Express** (API Server)
- **MongoDB** (Database - Mongoose)
- **Socket.io & WebRTC** (P2P Signaling & Transfer)
- **Cloudinary** (Cloud File Storage)
- **JWT** (Authentication)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB connection string
- Cloudinary account

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/TransferX.git
cd TransferX
```

### 2. Setup Backend (Server)
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

# Cloudinary Config
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend server:
```bash
npm run dev
```

### 3. Setup Frontend (Client)
```bash
cd client
npm install
```

Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Start the frontend server:
```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

## 🏗️ Architecture

TransferX uses a hybrid approach:
- **Cloud Mode:** Files are uploaded to Cloudinary, metadata is stored in MongoDB, and a unique 5-character share code is generated.
- **P2P Mode:** The Express server (with Socket.io) acts only as a signaling server to exchange WebRTC session details. Once connected, files flow directly between clients.

For detailed architecture diagrams and design decisions, check out the `docs/` folder in the repository.

## 📄 License

This project is open-source and available under the MIT License.
