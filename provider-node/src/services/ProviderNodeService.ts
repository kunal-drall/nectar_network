import axios from 'axios';
import WebSocket from 'ws';
import { ComputeEngine, ComputeResult } from '../compute/ComputeEngine';
import { ContractInterface } from './ContractInterface';

export interface Job {
  id: string;
  client: string;
  provider: string;
  title: string;
  description: string;
  requirements: string;
  reward: string;
  deadline: number;
  status: number;
  resultHash: string;
  createdAt: number;
  completedAt: number;
}

export interface ProviderConfig {
  id: string;
  address: string;
  capabilities: string[];
  maxConcurrentJobs: number;
  heartbeatInterval: number;
  dispatcherUrl: string;
  rpcUrl: string;
}

export class ProviderNodeService {
  private config: ProviderConfig;
  private computeEngine: ComputeEngine;
  private contractInterface: ContractInterface;
  private currentJobs: Map<string, Job> = new Map();
  private heartbeatTimer?: NodeJS.Timeout;
  private wsConnection?: WebSocket;
  private isRunning = false;

  constructor(
    config: ProviderConfig,
    computeEngine: ComputeEngine,
    contractInterface: ContractInterface
  ) {
    this.config = config;
    this.computeEngine = computeEngine;
    this.contractInterface = contractInterface;
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Provider Node Service...');
    
    // Register with dispatcher
    await this.registerWithDispatcher();
    
    // Set up WebSocket connection
    await this.setupWebSocketConnection();
    
    console.log('✅ Provider Node Service initialized');
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Provider node is already running');
      return;
    }

    console.log('🚀 Starting Provider Node...');
    
    this.isRunning = true;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Set provider online
    await this.updateOnlineStatus(true);
    
    console.log('✅ Provider Node started successfully');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Provider Node...');
    
    this.isRunning = false;
    
    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Set provider offline
    await this.updateOnlineStatus(false);
    
    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
    }
    
    // Cancel running jobs
    const runningJobIds = Array.from(this.currentJobs.keys());
    runningJobIds.forEach(jobId => {
      this.computeEngine.cancelJob(jobId);
    });
    
    console.log('✅ Provider Node stopped');
  }

  async executeJob(job: Job): Promise<ComputeResult> {
    console.log(`🔄 Executing job: ${job.id} - ${job.title}`);
    
    // Add to current jobs
    this.currentJobs.set(job.id, { ...job, status: 2 }); // InProgress
    
    try {
      // Execute the computation
      const result = await this.computeEngine.executeJob({
        id: job.id,
        title: job.title,
        description: job.description,
        requirements: job.requirements
      });
      
      if (result.success) {
        console.log(`✅ Job ${job.id} completed successfully`);
        
        // Update job status
        const updatedJob = { ...job, status: 3, resultHash: result.resultHash, completedAt: Math.floor(Date.now() / 1000) };
        this.currentJobs.set(job.id, updatedJob);
        
        // Submit result to blockchain (in a real implementation)
        await this.submitJobResult(job.id, result.resultHash);
        
        // Remove from current jobs after completion
        setTimeout(() => {
          this.currentJobs.delete(job.id);
        }, 5000); // Keep for 5 seconds for status queries
        
      } else {
        console.error(`❌ Job ${job.id} failed:`, result.error);
        
        // Update job status to failed
        const updatedJob = { ...job, status: 4 }; // Cancelled/Failed
        this.currentJobs.set(job.id, updatedJob);
        
        // Remove from current jobs
        setTimeout(() => {
          this.currentJobs.delete(job.id);
        }, 5000);
      }
      
      return result;
      
    } catch (error: any) {
      console.error(`❌ Error executing job ${job.id}:`, error);
      
      // Update job status to failed
      const updatedJob = { ...job, status: 4 }; // Cancelled/Failed
      this.currentJobs.set(job.id, updatedJob);
      
      // Remove from current jobs
      setTimeout(() => {
        this.currentJobs.delete(job.id);
      }, 5000);
      
      throw error;
    }
  }

  getCurrentJobs(): Job[] {
    return Array.from(this.currentJobs.values());
  }

  getJob(jobId: string): Job | undefined {
    return this.currentJobs.get(jobId);
  }

  getStatus(): any {
    return {
      id: this.config.id,
      address: this.config.address,
      isRunning: this.isRunning,
      capabilities: this.config.capabilities,
      currentJobs: this.getCurrentJobs().length,
      maxConcurrentJobs: this.config.maxConcurrentJobs,
      canAcceptJobs: this.computeEngine.canAcceptJob(this.config.maxConcurrentJobs),
      uptime: process.uptime(),
      lastHeartbeat: new Date().toISOString()
    };
  }

  private async registerWithDispatcher(): Promise<void> {
    try {
      console.log('📡 Registering with dispatcher...');
      
      // In a real implementation, this would register the provider
      // with the reputation contract on the blockchain
      const metadata = JSON.stringify({
        capabilities: this.config.capabilities,
        maxConcurrentJobs: this.config.maxConcurrentJobs,
        nodeVersion: process.version,
        platform: process.platform
      });
      
      console.log('✅ Registered with dispatcher (simulated)');
      console.log(`📋 Metadata: ${metadata}`);
      
    } catch (error) {
      console.error('❌ Failed to register with dispatcher:', error);
      throw error;
    }
  }

  private async setupWebSocketConnection(): Promise<void> {
    try {
      const wsUrl = this.config.dispatcherUrl.replace('http', 'ws');
      console.log(`🔌 Connecting to dispatcher WebSocket: ${wsUrl}`);
      
      this.wsConnection = new WebSocket(wsUrl);
      
      this.wsConnection.on('open', () => {
        console.log('✅ WebSocket connection established');
        
        // Subscribe to job updates
        this.wsConnection?.send(JSON.stringify({
          type: 'subscribe_job_updates',
          providerAddress: this.config.address
        }));
      });
      
      this.wsConnection.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });
      
      this.wsConnection.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (this.isRunning) {
            this.setupWebSocketConnection();
          }
        }, 5000);
      });
      
      this.wsConnection.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
      });
      
    } catch (error) {
      console.error('❌ Failed to setup WebSocket connection:', error);
    }
  }

  private handleWebSocketMessage(message: any): void {
    console.log('📨 Received message:', message.type);
    
    switch (message.type) {
      case 'job_assigned':
        if (message.targetProvider === this.config.address) {
          this.handleJobAssignment(message.data.job);
        }
        break;
        
      case 'new_job_available':
        this.handleNewJobAvailable(message.data.job);
        break;
        
      case 'subscription_confirmed':
        console.log('✅ Subscription confirmed:', message.data.topic);
        break;
        
      default:
        console.log('🔄 Unhandled message type:', message.type);
    }
  }

  private async handleJobAssignment(job: Job): Promise<void> {
    console.log(`📋 Job assigned: ${job.id} - ${job.title}`);
    
    if (!this.computeEngine.canAcceptJob(this.config.maxConcurrentJobs)) {
      console.warn(`⚠️  Cannot accept job ${job.id}: at capacity`);
      return;
    }
    
    // Check if we can handle the job requirements
    if (!this.canHandleJob(job)) {
      console.warn(`⚠️  Cannot handle job ${job.id}: requirements not met`);
      return;
    }
    
    // Start job execution in background
    this.executeJob(job).catch(error => {
      console.error(`❌ Error executing assigned job ${job.id}:`, error);
    });
  }

  private handleNewJobAvailable(job: Job): void {
    console.log(`📢 New job available: ${job.id} - ${job.title}`);
    
    // In a real implementation, this could implement bidding logic
    // or automatically assign jobs based on provider capabilities
    
    if (this.canHandleJob(job) && this.computeEngine.canAcceptJob(this.config.maxConcurrentJobs)) {
      console.log(`💡 Could handle job ${job.id}, but auto-assignment is disabled`);
      // Optionally, could implement auto-bidding here
    }
  }

  private canHandleJob(job: Job): boolean {
    // Simple capability matching
    const requirements = job.requirements.toLowerCase();
    
    return this.config.capabilities.some(capability => 
      requirements.includes(capability.toLowerCase()) || 
      capability.toLowerCase() === 'general'
    );
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        console.error('❌ Heartbeat failed:', error);
      }
    }, this.config.heartbeatInterval);
    
    console.log(`💓 Heartbeat started (${this.config.heartbeatInterval}ms interval)`);
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const heartbeatUrl = `${this.config.dispatcherUrl}/api/providers/${this.config.address}/heartbeat`;
      
      await axios.post(heartbeatUrl, {}, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // console.log('💓 Heartbeat sent'); // Uncomment for verbose logging
      
    } catch (error) {
      // Don't log every heartbeat failure to avoid spam
      if (Math.random() < 0.1) { // Log ~10% of failures
        console.warn('⚠️  Heartbeat failed:', (error as any).message);
      }
    }
  }

  private async updateOnlineStatus(isOnline: boolean): Promise<void> {
    try {
      const statusUrl = `${this.config.dispatcherUrl}/api/providers/${this.config.address}/status`;
      
      await axios.post(statusUrl, {
        isOnline
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 Provider status updated: ${isOnline ? 'online' : 'offline'}`);
      
    } catch (error) {
      console.warn('⚠️  Failed to update provider status:', (error as any).message);
    }
  }

  private async submitJobResult(jobId: string, resultHash: string): Promise<void> {
    try {
      console.log(`📤 Submitting job result: ${jobId} -> ${resultHash}`);
      
      // In a real implementation, this would call the smart contract
      // to submit the job completion with the result hash
      console.log('✅ Job result submitted (simulated)');
      
    } catch (error) {
      console.error('❌ Failed to submit job result:', error);
      throw error;
    }
  }
}