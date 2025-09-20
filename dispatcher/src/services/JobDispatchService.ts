import { WebSocketServer } from 'ws';
import { ProviderManager } from './ProviderManager';

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

export interface Provider {
  address: string;
  isOnline: boolean;
  capabilities: string[];
  currentJobs: string[];
  lastSeen: number;
  metadata: string;
}

export class JobDispatchService {
  private providerManager: ProviderManager;
  private wss: WebSocketServer;
  private jobQueue: Map<string, Job> = new Map();
  private jobAssignments: Map<string, string> = new Map(); // jobId -> providerAddress

  constructor(providerManager: ProviderManager, wss: WebSocketServer) {
    this.providerManager = providerManager;
    this.wss = wss;
  }

  /**
   * Handle a newly posted job
   */
  async handleNewJob(jobId: string, jobDetails: any): Promise<void> {
    try {
      console.log(`📋 Processing new job #${jobId}`);

      const job: Job = {
        id: jobId,
        client: jobDetails.client,
        provider: jobDetails.provider,
        title: jobDetails.title,
        description: jobDetails.description,
        requirements: jobDetails.requirements,
        reward: jobDetails.reward.toString(),
        deadline: jobDetails.deadline.toNumber(),
        status: jobDetails.status,
        resultHash: jobDetails.resultHash,
        createdAt: jobDetails.createdAt.toNumber(),
        completedAt: jobDetails.completedAt.toNumber(),
      };

      // Add to job queue
      this.jobQueue.set(jobId, job);

      // Try to auto-assign to available providers
      await this.tryAutoAssignJob(job);

      // Broadcast job availability to providers
      this.broadcastJobToProviders(job);

    } catch (error) {
      console.error(`❌ Error processing new job #${jobId}:`, error);
    }
  }

  /**
   * Handle job completion
   */
  async handleJobCompletion(jobId: string, resultHash: string): Promise<void> {
    try {
      console.log(`✅ Processing job completion #${jobId} with result: ${resultHash}`);

      const job = this.jobQueue.get(jobId);
      if (!job) {
        console.warn(`⚠️  Job #${jobId} not found in queue`);
        return;
      }

      // Update job status
      job.status = 3; // Completed
      job.resultHash = resultHash;
      job.completedAt = Math.floor(Date.now() / 1000);

      // Remove from provider's current jobs
      const providerAddress = this.jobAssignments.get(jobId);
      if (providerAddress) {
        this.providerManager.removeJobFromProvider(providerAddress, jobId);
        this.jobAssignments.delete(jobId);
      }

      // Remove from queue
      this.jobQueue.delete(jobId);

      // Broadcast completion
      this.broadcastToClients({
        type: 'job_completion_processed',
        data: {
          jobId,
          resultHash,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error(`❌ Error processing job completion #${jobId}:`, error);
    }
  }

  /**
   * Notify provider of job assignment
   */
  async notifyProviderAssignment(jobId: string, providerAddress: string): Promise<void> {
    try {
      console.log(`📮 Notifying provider ${providerAddress} of job assignment #${jobId}`);

      const job = this.jobQueue.get(jobId);
      if (!job) {
        console.warn(`⚠️  Job #${jobId} not found in queue`);
        return;
      }

      // Update job assignment
      this.jobAssignments.set(jobId, providerAddress);
      job.provider = providerAddress;
      job.status = 1; // Assigned

      // Add job to provider
      this.providerManager.assignJobToProvider(providerAddress, jobId);

      // Send direct notification to provider (if connected via WebSocket)
      this.sendToProvider(providerAddress, {
        type: 'job_assigned',
        data: {
          job,
          timestamp: Date.now()
        }
      });

      // Broadcast to all clients
      this.broadcastToClients({
        type: 'job_assignment_processed',
        data: {
          jobId,
          providerAddress,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error(`❌ Error notifying provider assignment:`, error);
    }
  }

  /**
   * Register a new provider
   */
  async registerProvider(providerAddress: string, metadata: string): Promise<void> {
    try {
      console.log(`👤 Registering provider: ${providerAddress}`);

      this.providerManager.registerProvider(providerAddress, metadata);

      // Broadcast provider registration
      this.broadcastToClients({
        type: 'provider_registration_processed',
        data: {
          providerAddress,
          metadata,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error(`❌ Error registering provider:`, error);
    }
  }

  /**
   * Try to automatically assign a job to an available provider
   */
  private async tryAutoAssignJob(job: Job): Promise<boolean> {
    try {
      // Get available providers
      const availableProviders = this.providerManager.getAvailableProviders();
      
      if (availableProviders.length === 0) {
        console.log(`📋 No available providers for job #${job.id}`);
        return false;
      }

      // Simple assignment strategy: pick the first available provider
      // In a production system, this could be more sophisticated:
      // - Consider provider capabilities vs job requirements
      // - Load balancing
      // - Provider reputation scores
      // - Geographic proximity
      // - Pricing optimization

      const selectedProvider = availableProviders[0];
      console.log(`🎯 Auto-assigning job #${job.id} to provider ${selectedProvider.address}`);

      // For demo purposes, we'll just log this
      // In a real system, this would trigger a smart contract transaction
      console.log(`ℹ️  Auto-assignment would trigger contract transaction here`);

      return true;

    } catch (error) {
      console.error(`❌ Error in auto-assignment:`, error);
      return false;
    }
  }

  /**
   * Broadcast job availability to all providers
   */
  private broadcastJobToProviders(job: Job): void {
    this.broadcastToClients({
      type: 'new_job_available',
      data: {
        job,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Send message to specific provider
   */
  private sendToProvider(providerAddress: string, message: any): void {
    // In a real implementation, you would maintain WebSocket connections
    // mapped to provider addresses. For now, we'll broadcast to all clients
    // and let them filter by their address
    this.broadcastToClients({
      ...message,
      targetProvider: providerAddress
    });
  }

  /**
   * Broadcast message to all WebSocket clients
   */
  private broadcastToClients(message: any): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Get job queue status
   */
  getJobQueueStatus(): any {
    return {
      totalJobs: this.jobQueue.size,
      activeAssignments: this.jobAssignments.size,
      jobs: Array.from(this.jobQueue.values()),
      assignments: Object.fromEntries(this.jobAssignments)
    };
  }

  /**
   * Get job by ID
   */
  getJob(jobId: string): Job | undefined {
    return this.jobQueue.get(jobId);
  }

  /**
   * Get jobs by status
   */
  getJobsByStatus(status: number): Job[] {
    return Array.from(this.jobQueue.values()).filter(job => job.status === status);
  }

  /**
   * Get jobs assigned to a provider
   */
  getJobsForProvider(providerAddress: string): Job[] {
    const providerJobIds = this.providerManager.getProviderJobs(providerAddress);
    return providerJobIds.map(jobId => this.jobQueue.get(jobId)).filter(Boolean) as Job[];
  }

  /**
   * Force assignment of job to provider (admin function)
   */
  async forceAssignJob(jobId: string, providerAddress: string): Promise<boolean> {
    try {
      const job = this.jobQueue.get(jobId);
      if (!job) {
        console.error(`Job #${jobId} not found`);
        return false;
      }

      if (job.status !== 0) { // Not posted status
        console.error(`Job #${jobId} is not available for assignment (status: ${job.status})`);
        return false;
      }

      if (!this.providerManager.isProviderRegistered(providerAddress)) {
        console.error(`Provider ${providerAddress} is not registered`);
        return false;
      }

      console.log(`🔧 Force assigning job #${jobId} to provider ${providerAddress}`);
      
      // This would trigger a smart contract transaction in a real implementation
      await this.notifyProviderAssignment(jobId, providerAddress);
      
      return true;

    } catch (error) {
      console.error(`❌ Error force assigning job:`, error);
      return false;
    }
  }
}