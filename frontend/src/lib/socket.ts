/**
 * WebSocket Client Configuration
 * 
 * This module sets up the Socket.IO client connection to communicate with the server.
 * It provides real-time bidirectional communication for features like:
 * - Live notifications
 * - Real-time data updates
 * - Chat functionality
 * - Live status updates
 */

'use client';

import { io, Socket } from 'socket.io-client';

// Define the events that can be sent/received
interface ServerToClientEvents {
  notification: (data: { message: string; type: 'info' | 'success' | 'warning' | 'error'; timestamp: number }) => void;
  userUpdate: (data: { userId: string; status: 'online' | 'offline' }) => void;
  dataUpdate: (data: { table: string; action: 'insert' | 'update' | 'delete'; id: string }) => void;
  message: (data: { from: string; message: string; timestamp: number }) => void;
}

interface ClientToServerEvents {
  join: (room: string) => void;
  leave: (room: string) => void;
  sendMessage: (data: { room: string; message: string }) => void;
  subscribe: (table: string) => void;
  unsubscribe: (table: string) => void;
}

// Create typed socket connection
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io('http://localhost:3001', {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 20000,
});

/**
 * Utility functions for common socket operations
 */
export const socketUtils = {
  /**
   * Join a specific room for targeted messages
   * @param room - Room name to join
   * @example socketUtils.joinRoom('user-123')
   */
  joinRoom: (room: string) => {
    socket.emit('join', room);
    console.log(`Joined room: ${room}`);
  },

  /**
   * Leave a specific room
   * @param room - Room name to leave
   */
  leaveRoom: (room: string) => {
    socket.emit('leave', room);
    console.log(`Left room: ${room}`);
  },

  /**
   * Send a message to a specific room
   * @param room - Target room
   * @param message - Message content
   */
  sendMessage: (room: string, message: string) => {
    socket.emit('sendMessage', { room, message });
  },

  /**
   * Subscribe to database table updates
   * @param table - Table name to monitor
   */
  subscribeToTable: (table: string) => {
    socket.emit('subscribe', table);
    console.log(`Subscribed to table updates: ${table}`);
  },

  /**
   * Unsubscribe from database table updates
   * @param table - Table name to stop monitoring
   */
  unsubscribeFromTable: (table: string) => {
    socket.emit('unsubscribe', table);
    console.log(`Unsubscribed from table updates: ${table}`);
  },

  /**
   * Get current connection status
   */
  isConnected: () => socket.connected,

  /**
   * Get socket ID
   */
  getSocketId: () => socket.id,
};

// Connection event listeners for debugging
socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected from WebSocket server:', reason);
});

socket.on('connect_error', (error) => {
  console.error('🔴 Connection error:', error);
});

export default socket;
