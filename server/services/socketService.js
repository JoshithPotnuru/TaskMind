import { Server } from 'socket.io';

let io;
const activeUsers = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register User Status
    socket.on('register_user', (userId) => {
      if (userId) {
        activeUsers.set(userId, socket.id);
        io.emit('user_status_change', { userId, status: 'online' });
        console.log(`User registered: ${userId} with socket: ${socket.id}`);
      }
    });

    // Join Project Room
    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`Socket ${socket.id} joined project_${projectId}`);
    });

    // Leave Project Room
    socket.on('leave_project', (projectId) => {
      socket.leave(`project_${projectId}`);
      console.log(`Socket ${socket.id} left project_${projectId}`);
    });

    // Real-time Kanban Updates
    socket.on('task_moved', ({ projectId, taskId, fromStatus, toStatus, updatedTask }) => {
      socket.to(`project_${projectId}`).emit('task_moved_update', {
        taskId,
        fromStatus,
        toStatus,
        updatedTask,
      });
    });

    // Typings indicator
    socket.on('typing_start', ({ roomId, username }) => {
      socket.to(roomId).emit('typing_received', { roomId, username, isTyping: true });
    });

    socket.on('typing_stop', ({ roomId, username }) => {
      socket.to(roomId).emit('typing_received', { roomId, username, isTyping: false });
    });

    // Chat Rooms
    socket.on('join_chat', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined chat room: ${roomId}`);
    });

    socket.on('leave_chat', (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left chat room: ${roomId}`);
    });

    // Message events
    socket.on('new_chat_message', ({ roomId, message }) => {
      io.to(roomId).emit('message_received', message);
    });

    // Manual disconnect
    socket.on('disconnect', () => {
      let disconnectedUser = null;
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUser = userId;
          activeUsers.delete(userId);
          break;
        }
      }

      if (disconnectedUser) {
        io.emit('user_status_change', { userId: disconnectedUser, status: 'offline' });
        console.log(`User unregistered: ${disconnectedUser}`);
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Send real-time notification helper
export const sendRealtimeNotification = (recipientId, notification) => {
  if (!io) return;
  const socketId = activeUsers.get(recipientId.toString());
  if (socketId) {
    io.to(socketId).emit('notification_received', notification);
    console.log(`Notification sent in real-time to user ${recipientId}`);
  }
};

// Get user online status
export const getUserStatus = (userId) => {
  return activeUsers.has(userId.toString()) ? 'online' : 'offline';
};
