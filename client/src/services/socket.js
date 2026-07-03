import { io } from 'socket.io-client';
import store from '../redux/store.js';
import { addMessage, setTypingStatus, setUserOnlineStatus } from '../redux/slices/chatSlice.js';

let socket = null;

export const connectSocket = (userId) => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
  
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected to backend:', socket.id);
      if (userId) {
        socket.emit('register_user', userId);
      }
    });

    // Handle incoming messages
    socket.on('message_received', (message) => {
      store.dispatch(addMessage(message));
    });

    // Handle typing status updates
    socket.on('typing_received', ({ roomId, username, isTyping }) => {
      store.dispatch(setTypingStatus({ roomId, username, isTyping }));
    });

    // Handle user online/offline status changes
    socket.on('user_status_change', ({ userId, status }) => {
      store.dispatch(setUserOnlineStatus({ userId, status }));
    });

    // Handle real-time notifications
    socket.on('notification_received', (notification) => {
      // Direct browser alert / alert banner can handle this or add to notifications list
      const event = new CustomEvent('app_notification', { detail: notification });
      window.dispatchEvent(event);
    });
  } else if (socket.disconnected) {
    socket.connect();
    socket.emit('register_user', userId);
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

// Room controls
export const joinProjectRoom = (projectId) => {
  if (socket) socket.emit('join_project', projectId);
};

export const leaveProjectRoom = (projectId) => {
  if (socket) socket.emit('leave_project', projectId);
};

export const joinChatRoom = (roomId) => {
  if (socket) socket.emit('join_chat', roomId);
};

export const leaveChatRoom = (roomId) => {
  if (socket) socket.emit('leave_chat', roomId);
};

// Typing indicator triggers
export const emitTypingStart = (roomId, username) => {
  if (socket) socket.emit('typing_start', { roomId, username });
};

export const emitTypingStop = (roomId, username) => {
  if (socket) socket.emit('typing_stop', { roomId, username });
};

// Emit live drag-and-drop moves to the project channel
export const emitTaskMoved = (projectId, taskId, fromStatus, toStatus, updatedTask) => {
  if (socket) {
    socket.emit('task_moved', { projectId, taskId, fromStatus, toStatus, updatedTask });
  }
};
