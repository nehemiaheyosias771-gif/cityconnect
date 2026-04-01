// src/services/socket.js — Socket.io client (real-time events)
import { io } from 'socket.io-client';
import { getIdToken } from './firebase';

let socket = null;

/**
 * Connect to the CitiConnect real-time server.
 * Automatically injects the current user's Firebase ID token.
 */
export const connectSocket = async () => {
  if (socket?.connected) return socket;

  const token = await getIdToken();

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:4004', {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

/**
 * Join a chat room channel.
 */
export const joinRoom = (room) => {
  socket?.emit('join_room', room);
};

/**
 * Send a chat message to a room.
 */
export const sendMessage = (room, text) => {
  socket?.emit('send_message', { room, text });
};

/**
 * Join an issue's real-time comment channel.
 */
export const joinIssueRoom = (issueId) => {
  socket?.emit('join_room', `issue_${issueId}`);
};

/**
 * Subscribe to a socket event. Returns unsubscribe function.
 */
export const onEvent = (event, callback) => {
  socket?.on(event, callback);
  return () => socket?.off(event, callback);
};

export default { connectSocket, disconnectSocket, joinRoom, sendMessage, joinIssueRoom, onEvent };
