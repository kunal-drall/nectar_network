import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

import { ContractEventListener } from './services/ContractEventListener';
import { JobDispatchService } from './services/JobDispatchService';
import { ProviderManager } from './services/ProviderManager';
import jobRoutes from './routes/jobs';
import providerRoutes from './routes/providers';
import { errorHandler, notFound } from './utils/middleware';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/providers', providerRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received WebSocket message:', data);
      
      // Handle WebSocket messages here
      switch (data.type) {
        case 'subscribe_job_updates':
          // Subscribe to job updates
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            data: { topic: 'job_updates' }
          }));
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Initialize services
const initializeServices = async () => {
  try {
    console.log('Initializing Nectar Network Dispatcher...');
    
    // Initialize provider manager
    const providerManager = new ProviderManager();
    
    // Initialize job dispatch service
    const jobDispatchService = new JobDispatchService(providerManager, wss);
    
    // Initialize contract event listener
    const eventListener = new ContractEventListener(jobDispatchService, wss);
    await eventListener.initialize();
    
    console.log('All services initialized successfully');
    
    // Start listening for events
    await eventListener.startListening();
    
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Nectar Network Dispatcher running on port ${PORT}`);
  console.log(`📡 WebSocket server running on port ${PORT}`);
  console.log(`🔗 RPC URL: ${process.env.RPC_URL || 'http://localhost:8545'}`);
  
  // Initialize services after server starts
  initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});