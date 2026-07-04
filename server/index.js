import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import { initSocket } from './services/socketService.js';
import User from './models/User.js';
import seedData from './services/seedService.js';

// Route Imports
import authRoutes from './routes/auth.js';
import orgRoutes from './routes/org.js';
import projectRoutes from './routes/project.js';
import taskRoutes from './routes/task.js';
import aiRoutes from './routes/ai.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notification.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

// Connect to Database & Auto-Seed
await connectDB();

try {
  const userCount = await User.countDocuments({});
  if (userCount === 0) {
    console.log('No users found in database. Auto-seeding default demo accounts and projects...');
    await seedData();
  }
} catch (seedError) {
  console.error('Failed to auto-seed database on startup:', seedError.message);
}

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Initialize WebSockets
const io = initSocket(server);

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Attach API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Serve frontend static assets in production
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

export { app, server };
