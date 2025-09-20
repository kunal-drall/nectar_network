import { ComputeEngine, ComputeJob } from '../compute/ComputeEngine';

describe('ComputeEngine', () => {
  let computeEngine: ComputeEngine;

  beforeEach(() => {
    computeEngine = new ComputeEngine();
  });

  it('should execute a machine learning job with minimum 5 second delay', async () => {
    const startTime = Date.now();
    
    const job: ComputeJob = {
      id: 'test-ml-job',
      title: 'ML Training Job',
      description: 'Train neural network',
      requirements: 'GPU, PyTorch'
    };

    const result = await computeEngine.executeJob(job);
    
    const executionTime = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(result.jobId).toBe('test-ml-job');
    expect(result.resultHash).toBeDefined();
    expect(result.logs).toContainEqual(expect.stringMatching(/Starting job execution/));
    expect(executionTime).toBeGreaterThanOrEqual(5000); // At least 5 seconds
    expect(result.output.type).toBe('machine_learning');
  }, 15000); // 15 second timeout

  it('should execute a Docker container job', async () => {
    const job: ComputeJob = {
      id: 'test-docker-job',
      title: 'Docker Container Job',
      description: 'Run computation in container',
      requirements: 'docker, 8GB RAM'
    };

    const result = await computeEngine.executeJob(job);
    
    expect(result.success).toBe(true);
    expect(result.output.type).toBe('docker_container');
    expect(result.output.image).toBe('custom/job-processor:latest');
    expect(result.output.exitCode).toBe(0);
  }, 15000);

  it('should execute a data processing job', async () => {
    const job: ComputeJob = {
      id: 'test-data-job',
      title: 'Data Processing Job', 
      description: 'Process large dataset using data processing techniques',
      requirements: 'Python, Pandas'
    };

    const result = await computeEngine.executeJob(job);
    
    expect(result.success).toBe(true);
    expect(result.output.type).toBe('data_processing');
    expect(result.output.inputRecords).toBeGreaterThan(0);
    expect(result.output.outputRecords).toBeGreaterThan(0);
  }, 15000);

  it('should execute a rendering job', async () => {
    const job: ComputeJob = {
      id: 'test-render-job',
      title: 'Rendering Job',
      description: 'Render 3D animation',
      requirements: 'GPU, Blender'
    };

    const result = await computeEngine.executeJob(job);
    
    expect(result.success).toBe(true);
    expect(result.output.type).toBe('rendering');
    expect(result.output.totalFrames).toBeGreaterThan(0);
    expect(result.output.resolution).toBe('1920x1080');
  }, 15000);

  it('should execute a generic job with minimum 5 second delay', async () => {
    const startTime = Date.now();
    
    const job: ComputeJob = {
      id: 'test-generic-job',
      title: 'Generic Computation',
      description: 'General computation task',
      requirements: 'CPU, 4GB RAM'
    };

    const result = await computeEngine.executeJob(job);
    
    const executionTime = Date.now() - startTime;
    
    expect(result.success).toBe(true);
    expect(result.output.type).toBe('generic');
    expect(executionTime).toBeGreaterThanOrEqual(5000); // At least 5 seconds
    expect(result.output.metadata.processingTime).toBeGreaterThanOrEqual(5000);
  }, 15000);

  it('should provide resource usage information', async () => {
    const job: ComputeJob = {
      id: 'test-resource-job',
      title: 'Resource Test Job',
      description: 'Test resource monitoring',
      requirements: 'CPU'
    };

    const result = await computeEngine.executeJob(job);
    
    expect(result.resourceUsage).toBeDefined();
    expect(result.resourceUsage.cpu).toBeGreaterThan(0);
    expect(result.resourceUsage.memory).toBeGreaterThan(0);
    expect(result.resourceUsage.disk).toBeGreaterThan(0);
  }, 15000);

  it('should generate unique result hashes', async () => {
    const job1: ComputeJob = {
      id: 'test-job-1',
      title: 'Test Job 1',
      description: 'First test job',
      requirements: 'CPU'
    };

    const job2: ComputeJob = {
      id: 'test-job-2', 
      title: 'Test Job 2',
      description: 'Second test job',
      requirements: 'CPU'
    };

    const result1 = await computeEngine.executeJob(job1);
    const result2 = await computeEngine.executeJob(job2);
    
    expect(result1.resultHash).not.toBe(result2.resultHash);
    expect(result1.resultHash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex format
    expect(result2.resultHash).toMatch(/^[a-f0-9]{64}$/);
  }, 20000); // Longer timeout for two jobs
});