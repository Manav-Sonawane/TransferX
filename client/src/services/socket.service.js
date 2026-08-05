import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'], // Fallback to polling if necessary
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected with ID:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected');
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection Error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }
}

export const socketService = new SocketService();
