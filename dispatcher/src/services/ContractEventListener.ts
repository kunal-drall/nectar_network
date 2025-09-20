import { ethers } from 'ethers';
import { WebSocketServer } from 'ws';
import { JobDispatchService } from './JobDispatchService';

// Contract ABIs (simplified versions)
const JOB_MANAGER_ABI = [
  "event JobPosted(uint256 indexed jobId, address indexed client, string title, uint256 reward, uint256 deadline)",
  "event JobAssigned(uint256 indexed jobId, address indexed provider)",
  "event JobStarted(uint256 indexed jobId)",
  "event JobCompleted(uint256 indexed jobId, string resultHash)",
  "event JobCancelled(uint256 indexed jobId)",
  "function getJob(uint256 jobId) external view returns (tuple(uint256 id, address client, address provider, string title, string description, string requirements, uint256 reward, uint256 deadline, uint8 status, string resultHash, uint256 createdAt, uint256 completedAt))"
];

const ESCROW_ABI = [
  "event EscrowCreated(uint256 indexed jobId, address indexed client, address indexed provider, uint256 amount)",
  "event PaymentReleased(uint256 indexed jobId, address indexed provider, uint256 amount, uint256 platformFee)",
  "event PaymentRefunded(uint256 indexed jobId, address indexed client, uint256 amount)"
];

const REPUTATION_ABI = [
  "event ProviderRegistered(address indexed provider, string metadata)",
  "event ProviderRated(uint256 indexed ratingId, uint256 indexed jobId, address indexed provider, address client, uint8 score, string comment)"
];

export class ContractEventListener {
  private provider: ethers.providers.JsonRpcProvider;
  private jobManagerContract: ethers.Contract;
  private escrowContract: ethers.Contract;
  private reputationContract: ethers.Contract;
  private jobDispatchService: JobDispatchService;
  private wss: WebSocketServer;
  private isListening = false;

  constructor(jobDispatchService: JobDispatchService, wss: WebSocketServer) {
    this.jobDispatchService = jobDispatchService;
    this.wss = wss;

    // Initialize provider
    const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing contract event listener...');

      // Get contract addresses from environment or use defaults
      const jobManagerAddress = process.env.JOB_MANAGER_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      const escrowAddress = process.env.ESCROW_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
      const reputationAddress = process.env.REPUTATION_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

      // Initialize contracts
      this.jobManagerContract = new ethers.Contract(jobManagerAddress, JOB_MANAGER_ABI, this.provider);
      this.escrowContract = new ethers.Contract(escrowAddress, ESCROW_ABI, this.provider);
      this.reputationContract = new ethers.Contract(reputationAddress, REPUTATION_ABI, this.provider);

      // Test connection
      await this.provider.getNetwork();
      console.log('✅ Connected to blockchain network');

      console.log('📋 Contract addresses:');
      console.log(`  - JobManager: ${jobManagerAddress}`);
      console.log(`  - Escrow: ${escrowAddress}`);
      console.log(`  - Reputation: ${reputationAddress}`);

    } catch (error) {
      console.error('❌ Failed to initialize contract event listener:', error);
      throw error;
    }
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('Event listener is already running');
      return;
    }

    try {
      console.log('🔊 Starting to listen for contract events...');

      // Job Manager Events
      this.jobManagerContract.on('JobPosted', async (jobId, client, title, reward, deadline, event) => {
        console.log(`📄 Job Posted: #${jobId.toString()} by ${client}`);
        await this.handleJobPosted(jobId, client, title, reward, deadline, event);
      });

      this.jobManagerContract.on('JobAssigned', async (jobId, provider, event) => {
        console.log(`✅ Job Assigned: #${jobId.toString()} to ${provider}`);
        await this.handleJobAssigned(jobId, provider, event);
      });

      this.jobManagerContract.on('JobStarted', async (jobId, event) => {
        console.log(`🚀 Job Started: #${jobId.toString()}`);
        await this.handleJobStarted(jobId, event);
      });

      this.jobManagerContract.on('JobCompleted', async (jobId, resultHash, event) => {
        console.log(`🎉 Job Completed: #${jobId.toString()} with result ${resultHash}`);
        await this.handleJobCompleted(jobId, resultHash, event);
      });

      this.jobManagerContract.on('JobCancelled', async (jobId, event) => {
        console.log(`❌ Job Cancelled: #${jobId.toString()}`);
        await this.handleJobCancelled(jobId, event);
      });

      // Escrow Events
      this.escrowContract.on('EscrowCreated', async (jobId, client, provider, amount, event) => {
        console.log(`💰 Escrow Created: Job #${jobId.toString()} - ${ethers.utils.formatEther(amount)} ETH`);
        await this.handleEscrowCreated(jobId, client, provider, amount, event);
      });

      this.escrowContract.on('PaymentReleased', async (jobId, provider, amount, platformFee, event) => {
        console.log(`💸 Payment Released: Job #${jobId.toString()} - ${ethers.utils.formatEther(amount)} ETH to ${provider}`);
        await this.handlePaymentReleased(jobId, provider, amount, platformFee, event);
      });

      // Reputation Events
      this.reputationContract.on('ProviderRegistered', async (provider, metadata, event) => {
        console.log(`👤 Provider Registered: ${provider}`);
        await this.handleProviderRegistered(provider, metadata, event);
      });

      this.reputationContract.on('ProviderRated', async (ratingId, jobId, provider, client, score, comment, event) => {
        console.log(`⭐ Provider Rated: ${provider} received ${score}/5 stars`);
        await this.handleProviderRated(ratingId, jobId, provider, client, score, comment, event);
      });

      this.isListening = true;
      console.log('✅ Event listener started successfully');

    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      throw error;
    }
  }

  private async handleJobPosted(jobId: ethers.BigNumber, client: string, title: string, reward: ethers.BigNumber, deadline: ethers.BigNumber, event: ethers.Event): Promise<void> {
    try {
      // Get full job details
      const jobDetails = await this.jobManagerContract.getJob(jobId);
      
      // Broadcast to WebSocket clients
      this.broadcastToClients({
        type: 'job_posted',
        data: {
          jobId: jobId.toString(),
          client,
          title,
          reward: ethers.utils.formatEther(reward),
          deadline: deadline.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

      // Trigger job dispatch logic
      await this.jobDispatchService.handleNewJob(jobId.toString(), jobDetails);

    } catch (error) {
      console.error('Error handling JobPosted event:', error);
    }
  }

  private async handleJobAssigned(jobId: ethers.BigNumber, provider: string, event: ethers.Event): Promise<void> {
    try {
      this.broadcastToClients({
        type: 'job_assigned',
        data: {
          jobId: jobId.toString(),
          provider,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

      // Notify provider of new assignment
      await this.jobDispatchService.notifyProviderAssignment(jobId.toString(), provider);

    } catch (error) {
      console.error('Error handling JobAssigned event:', error);
    }
  }

  private async handleJobStarted(jobId: ethers.BigNumber, event: ethers.Event): Promise<void> {
    try {
      this.broadcastToClients({
        type: 'job_started',
        data: {
          jobId: jobId.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

    } catch (error) {
      console.error('Error handling JobStarted event:', error);
    }
  }

  private async handleJobCompleted(jobId: ethers.BigNumber, resultHash: string, event: ethers.Event): Promise<void> {
    try {
      this.broadcastToClients({
        type: 'job_completed',
        data: {
          jobId: jobId.toString(),
          resultHash,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

      // Trigger payment release logic
      await this.jobDispatchService.handleJobCompletion(jobId.toString(), resultHash);

    } catch (error) {
      console.error('Error handling JobCompleted event:', error);
    }
  }

  private async handleJobCancelled(jobId: ethers.BigNumber, event: ethers.Event): Promise<void> {
    try {
      this.broadcastToClients({
        type: 'job_cancelled',
        data: {
          jobId: jobId.toString(),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

    } catch (error) {
      console.error('Error handling JobCancelled event:', error);
    }
  }

  private async handleEscrowCreated(jobId: ethers.BigNumber, client: string, provider: string, amount: ethers.BigNumber, event: ethers.Event): Promise<void> {
    try {
      this.broadcastToClients({
        type: 'escrow_created',
        data: {
          jobId: jobId.toString(),
          client,
          provider,
          amount: ethers.utils.formatEther(amount),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

    } catch (error) {
      console.error('Error handling EscrowCreated event:', error);
    }
  }

  private async handlePaymentReleased(jobId: ethers.BigNumber, provider: string, amount: ethers.BigNumber, platformFee: ethers.BigNumber, event: ethers.Event): Promise<void> {
    try {
      this.broadcastToClients({
        type: 'payment_released',
        data: {
          jobId: jobId.toString(),
          provider,
          amount: ethers.utils.formatEther(amount),
          platformFee: ethers.utils.formatEther(platformFee),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

    } catch (error) {
      console.error('Error handling PaymentReleased event:', error);
    }
  }

  private async handleProviderRegistered(provider: string, metadata: string, event: ethers.Event): Promise<void> {
    try {
      this.broadcastToClients({
        type: 'provider_registered',
        data: {
          provider,
          metadata,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

      // Register provider in the provider manager
      await this.jobDispatchService.registerProvider(provider, metadata);

    } catch (error) {
      console.error('Error handling ProviderRegistered event:', error);
    }
  }

  private async handleProviderRated(ratingId: ethers.BigNumber, jobId: ethers.BigNumber, provider: string, client: string, score: number, comment: string, event: ethers.Event): Promise<void> {
    try {
      this.broadcastToClients({
        type: 'provider_rated',
        data: {
          ratingId: ratingId.toString(),
          jobId: jobId.toString(),
          provider,
          client,
          score,
          comment,
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        }
      });

    } catch (error) {
      console.error('Error handling ProviderRated event:', error);
    }
  }

  private broadcastToClients(message: any): void {
    this.wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  stopListening(): void {
    if (!this.isListening) {
      return;
    }

    console.log('🔇 Stopping event listener...');
    
    this.jobManagerContract.removeAllListeners();
    this.escrowContract.removeAllListeners();
    this.reputationContract.removeAllListeners();
    
    this.isListening = false;
    console.log('✅ Event listener stopped');
  }
}