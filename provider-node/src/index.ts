import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

import { ProviderNodeService } from './services/ProviderNodeService';
import { ComputeEngine } from './compute/ComputeEngine';
import { ContractInterface } from './services/ContractInterface';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Provider node configuration
const PROVIDER_CONFIG = {
  id: process.env.PROVIDER_ID || uuidv4(),
  address: process.env.PROVIDER_ADDRESS || '0x' + Buffer.from(uuidv4()).toString('hex').slice(0, 40),
  capabilities: (process.env.PROVIDER_CAPABILITIES || 'cpu,general,docker').split(','),
  maxConcurrentJobs: parseInt(process.env.MAX_CONCURRENT_JOBS || '3'),
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '30000'), // 30 seconds
  dispatcherUrl: process.env.DISPATCHER_URL || 'http://localhost:3001',
  rpcUrl: process.env.RPC_URL || 'http://localhost:8545'
};

console.log('🔧 Provider Node Configuration:');
console.log(`  - ID: ${PROVIDER_CONFIG.id}`);
console.log(`  - Address: ${PROVIDER_CONFIG.address}`);
console.log(`  - Capabilities: ${PROVIDER_CONFIG.capabilities.join(', ')}`);
console.log(`  - Max Concurrent Jobs: ${PROVIDER_CONFIG.maxConcurrentJobs}`);
console.log(`  - Dispatcher URL: ${PROVIDER_CONFIG.dispatcherUrl}`);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    nodeId: PROVIDER_CONFIG.id,
    address: PROVIDER_CONFIG.address,
    capabilities: PROVIDER_CONFIG.capabilities
  });
});

// Provider status endpoint
app.get('/status', (req, res) => {
  if (providerNodeService) {
    res.json({
      success: true,
      data: providerNodeService.getStatus()
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'Provider service not ready'
    });
  }
});

// Job endpoints
app.get('/jobs', (req, res) => {
  if (providerNodeService) {
    res.json({
      success: true,
      data: providerNodeService.getCurrentJobs()
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'Provider service not ready'
    });
  }
});

app.get('/jobs/:jobId', (req, res) => {
  const { jobId } = req.params;
  if (providerNodeService) {
    const job = providerNodeService.getJob(jobId);
    if (job) {
      res.json({
        success: true,
        data: job
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }
  } else {
    res.status(503).json({
      success: false,
      error: 'Provider service not ready'
    });
  }
});

// Compute capabilities endpoint
app.get('/capabilities', (req, res) => {
  res.json({
    success: true,
    data: {
      capabilities: PROVIDER_CONFIG.capabilities,
      maxConcurrentJobs: PROVIDER_CONFIG.maxConcurrentJobs,
      currentLoad: providerNodeService ? providerNodeService.getCurrentJobs().length : 0,
      systemInfo: {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    }
  });
});

// Manual job execution endpoint (for testing)
app.post('/execute', async (req, res) => {
  try {
    const { jobId, title, description, requirements } = req.body;

    if (!jobId || !title) {
      return res.status(400).json({
        success: false,
        error: 'jobId and title are required'
      });
    }

    if (providerNodeService) {
      const result = await providerNodeService.executeJob({
        id: jobId,
        title,
        description: description || '',
        requirements: requirements || '',
        client: '0x0000000000000000000000000000000000000000',
        provider: PROVIDER_CONFIG.address,
        reward: '0',
        deadline: 0,
        status: 2, // InProgress
        resultHash: '',
        createdAt: Math.floor(Date.now() / 1000),
        completedAt: 0
      });

      return res.json({
        success: true,
        data: {
          jobId,
          result
        }
      });
    } else {
      return res.status(503).json({
        success: false,
        error: 'Provider service not ready'
      });
    }

  } catch (error: any) {
    console.error('Error executing job:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Execute job endpoint (alias for /execute to match requirements)
app.post('/execute-job', async (req, res) => {
  try {
    const { jobId, title, description, requirements } = req.body;

    if (!jobId || !title) {
      return res.status(400).json({
        success: false,
        error: 'jobId and title are required'
      });
    }

    if (providerNodeService) {
      const result = await providerNodeService.executeJob({
        id: jobId,
        title,
        description: description || '',
        requirements: requirements || '',
        client: '0x0000000000000000000000000000000000000000',
        provider: PROVIDER_CONFIG.address,
        reward: '0',
        deadline: 0,
        status: 2, // InProgress
        resultHash: '',
        createdAt: Math.floor(Date.now() / 1000),
        completedAt: 0
      });

      return res.json({
        success: true,
        data: {
          jobId,
          result
        }
      });
    } else {
      return res.status(503).json({
        success: false,
        error: 'Provider service not ready'
      });
    }

  } catch (error: any) {
    console.error('Error executing job:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Initialize services
let providerNodeService: ProviderNodeService;

const initializeServices = async () => {
  try {
    console.log('🚀 Initializing Provider Node services...');
    
    // Initialize compute engine
    const computeEngine = new ComputeEngine();
    
    // Initialize contract interface
    const contractInterface = new ContractInterface(PROVIDER_CONFIG.rpcUrl);
    await contractInterface.initialize();
    
    // Initialize provider node service
    providerNodeService = new ProviderNodeService(
      PROVIDER_CONFIG,
      computeEngine,
      contractInterface
    );
    
    await providerNodeService.initialize();
    
    console.log('✅ All services initialized successfully');
    
    // Start the provider node
    await providerNodeService.start();
    
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 3002;

server.listen(PORT, () => {
  console.log(`🚀 Nectar Network Provider Node running on port ${PORT}`);
  console.log(`🏷️  Node ID: ${PROVIDER_CONFIG.id}`);
  console.log(`📍 Provider Address: ${PROVIDER_CONFIG.address}`);
  
  // Initialize services after server starts
  initializeServices();
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('📤 Shutting down gracefully...');
  
  if (providerNodeService) {
    await providerNodeService.stop();
  }
  
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});