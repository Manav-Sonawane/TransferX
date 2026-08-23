import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      // Create the socket instance (autoConnect: true by default)
      this.socket = io(SOCKET_URL, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected with ID:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected, reason:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection Error:', error.message);
      });
    } else if (!this.socket.connected) {
      // Socket exists but was disconnected — reconnect it without creating a new instance
      console.log('[Socket] Reconnecting existing socket...');
      this.socket.connect();
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
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }
}

export const socketService = new SocketService();
