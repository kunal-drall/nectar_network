import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Mock the provider node service for API testing
const mockProviderNodeService = {
  getStatus: jest.fn().mockReturnValue({
    id: 'test-provider',
    address: '0x123...',
    isRunning: true,
    capabilities: ['cpu', 'docker', 'ml'],
    currentJobs: 0,
    maxConcurrentJobs: 3,
    canAcceptJobs: true,
    uptime: 120.5,
    lastHeartbeat: new Date().toISOString()
  }),
  getCurrentJobs: jest.fn().mockReturnValue([]),
  getJob: jest.fn().mockReturnValue(null),
  executeJob: jest.fn().mockResolvedValue({
    jobId: 'test-job',
    success: true,
    output: { type: 'generic', status: 'completed' },
    resultHash: 'abc123...',
    executionTime: 5500,
    resourceUsage: { cpu: 50, memory: 100, disk: 10 },
    logs: ['Job started', 'Job completed']
  })
};

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  const PROVIDER_CONFIG = {
    id: 'test-provider',
    address: '0x123...',
    capabilities: ['cpu', 'docker', 'ml'],
    maxConcurrentJobs: 3
  };

  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      nodeId: PROVIDER_CONFIG.id,
      address: PROVIDER_CONFIG.address,
      capabilities: PROVIDER_CONFIG.capabilities
    });
  });

  // Status endpoint
  app.get('/status', (req, res) => {
    res.json({
      success: true,
      data: mockProviderNodeService.getStatus()
    });
  });

  // Jobs endpoint
  app.get('/jobs', (req, res) => {
    res.json({
      success: true,
      data: mockProviderNodeService.getCurrentJobs()
    });
  });

  // Capabilities endpoint
  app.get('/capabilities', (req, res) => {
    res.json({
      success: true,
      data: {
        capabilities: PROVIDER_CONFIG.capabilities,
        maxConcurrentJobs: PROVIDER_CONFIG.maxConcurrentJobs,
        currentLoad: 0,
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

  // Execute job endpoint
  app.post('/execute-job', async (req, res) => {
    try {
      const { jobId, title, description, requirements } = req.body;

      if (!jobId || !title) {
        return res.status(400).json({
          success: false,
          error: 'jobId and title are required'
        });
      }

      const result = await mockProviderNodeService.executeJob({
        id: jobId,
        title,
        description: description || '',
        requirements: requirements || ''
      });

      return res.json({
        success: true,
        data: { jobId, result }
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Internal server error'
      });
    }
  });

  return app;
};

describe('Provider Node API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.nodeId).toBe('test-provider');
      expect(response.body.capabilities).toEqual(['cpu', 'docker', 'ml']);
    });
  });

  describe('GET /status', () => {
    it('should return provider status', async () => {
      const response = await request(app).get('/status');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-provider');
      expect(response.body.data.isRunning).toBe(true);
      expect(mockProviderNodeService.getStatus).toHaveBeenCalled();
    });
  });

  describe('GET /jobs', () => {
    it('should return current jobs list', async () => {
      const response = await request(app).get('/jobs');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(mockProviderNodeService.getCurrentJobs).toHaveBeenCalled();
    });
  });

  describe('GET /capabilities', () => {
    it('should return provider capabilities and system info', async () => {
      const response = await request(app).get('/capabilities');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.capabilities).toEqual(['cpu', 'docker', 'ml']);
      expect(response.body.data.maxConcurrentJobs).toBe(3);
      expect(response.body.data.systemInfo).toBeDefined();
      expect(response.body.data.systemInfo.platform).toBeDefined();
      expect(response.body.data.systemInfo.memory).toBeDefined();
    });
  });

  describe('POST /execute-job', () => {
    it('should execute a job successfully', async () => {
      const jobData = {
        jobId: 'test-job-123',
        title: 'Test Job',
        description: 'Test job description',
        requirements: 'CPU, 4GB RAM'
      };

      const response = await request(app)
        .post('/execute-job')
        .send(jobData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.jobId).toBe('test-job-123');
      expect(response.body.data.result.success).toBe(true);
      expect(response.body.data.result.resultHash).toBeDefined();
      expect(mockProviderNodeService.executeJob).toHaveBeenCalledWith({
        id: 'test-job-123',
        title: 'Test Job',
        description: 'Test job description',
        requirements: 'CPU, 4GB RAM'
      });
    });

    it('should return 400 if jobId is missing', async () => {
      const jobData = {
        title: 'Test Job'
      };

      const response = await request(app)
        .post('/execute-job')
        .send(jobData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('jobId and title are required');
    });

    it('should return 400 if title is missing', async () => {
      const jobData = {
        jobId: 'test-job-123'
      };

      const response = await request(app)
        .post('/execute-job')
        .send(jobData);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('jobId and title are required');
    });

    it('should handle execution errors', async () => {
      mockProviderNodeService.executeJob.mockRejectedValueOnce(new Error('Execution failed'));

      const jobData = {
        jobId: 'test-job-123',
        title: 'Test Job'
      };

      const response = await request(app)
        .post('/execute-job')
        .send(jobData);
      
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Execution failed');
    });
  });
});