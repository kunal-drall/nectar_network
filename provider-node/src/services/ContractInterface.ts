import { ethers } from 'ethers';

// Simplified contract ABIs for interaction
const JOB_MANAGER_ABI = [
  "function completeJob(uint256 jobId, string resultHash) external",
  "function getJob(uint256 jobId) external view returns (tuple(uint256 id, address client, address provider, string title, string description, string requirements, uint256 reward, uint256 deadline, uint8 status, string resultHash, uint256 createdAt, uint256 completedAt))"
];

const REPUTATION_ABI = [
  "function registerProvider(string metadata) external",
  "function getProvider(address provider) external view returns (tuple(address provider, uint256 totalJobs, uint256 completedJobs, uint256 totalRating, uint256 ratingCount, bool isActive, uint256 registeredAt, string metadata))"
];

export class ContractInterface {
  private provider: ethers.providers.JsonRpcProvider;
  private signer?: ethers.Signer;
  private jobManagerContract?: ethers.Contract;
  private reputationContract?: ethers.Contract;

  constructor(rpcUrl: string) {
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔗 Initializing contract interface...');

      // Get contract addresses from environment or use defaults
      const jobManagerAddress = process.env.JOB_MANAGER_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
      const reputationAddress = process.env.REPUTATION_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';

      // Initialize contracts (read-only for now)
      this.jobManagerContract = new ethers.Contract(jobManagerAddress, JOB_MANAGER_ABI, this.provider);
      this.reputationContract = new ethers.Contract(reputationAddress, REPUTATION_ABI, this.provider);

      // Test connection
      await this.provider.getNetwork();
      console.log('✅ Contract interface connected to blockchain');

      console.log('📋 Contract addresses:');
      console.log(`  - JobManager: ${jobManagerAddress}`);
      console.log(`  - Reputation: ${reputationAddress}`);

    } catch (error) {
      console.error('❌ Failed to initialize contract interface:', error);
      throw error;
    }
  }

  /**
   * Set up signer for transactions (would be done with provider's private key)
   */
  setSigner(privateKey: string): void {
    this.signer = new ethers.Wallet(privateKey, this.provider);
    
    if (this.jobManagerContract) {
      this.jobManagerContract = this.jobManagerContract.connect(this.signer);
    }
    
    if (this.reputationContract) {
      this.reputationContract = this.reputationContract.connect(this.signer);
    }
    
    console.log(`🔐 Signer set for address: ${this.signer.address}`);
  }

  /**
   * Register provider on-chain
   */
  async registerProvider(metadata: string): Promise<string> {
    if (!this.reputationContract || !this.signer) {
      throw new Error('Contract or signer not initialized');
    }

    try {
      console.log('📝 Registering provider on-chain...');
      
      const tx = await this.reputationContract.registerProvider(metadata);
      const receipt = await tx.wait();
      
      console.log(`✅ Provider registered. Transaction: ${receipt.transactionHash}`);
      return receipt.transactionHash;
      
    } catch (error) {
      console.error('❌ Failed to register provider:', error);
      throw error;
    }
  }

  /**
   * Submit job completion on-chain
   */
  async submitJobCompletion(jobId: string, resultHash: string): Promise<string> {
    if (!this.jobManagerContract || !this.signer) {
      throw new Error('Contract or signer not initialized');
    }

    try {
      console.log(`📤 Submitting job completion on-chain: ${jobId}`);
      
      const tx = await this.jobManagerContract.completeJob(jobId, resultHash);
      const receipt = await tx.wait();
      
      console.log(`✅ Job completion submitted. Transaction: ${receipt.transactionHash}`);
      return receipt.transactionHash;
      
    } catch (error) {
      console.error('❌ Failed to submit job completion:', error);
      throw error;
    }
  }

  /**
   * Get job details from contract
   */
  async getJob(jobId: string): Promise<any> {
    if (!this.jobManagerContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const job = await this.jobManagerContract.getJob(jobId);
      
      return {
        id: job.id.toString(),
        client: job.client,
        provider: job.provider,
        title: job.title,
        description: job.description,
        requirements: job.requirements,
        reward: ethers.utils.formatEther(job.reward),
        deadline: job.deadline.toNumber(),
        status: job.status,
        resultHash: job.resultHash,
        createdAt: job.createdAt.toNumber(),
        completedAt: job.completedAt.toNumber(),
      };
      
    } catch (error) {
      console.error(`❌ Failed to get job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Get provider details from contract
   */
  async getProvider(address: string): Promise<any> {
    if (!this.reputationContract) {
      throw new Error('Contract not initialized');
    }

    try {
      const provider = await this.reputationContract.getProvider(address);
      
      return {
        address: provider.provider,
        totalJobs: provider.totalJobs.toNumber(),
        completedJobs: provider.completedJobs.toNumber(),
        totalRating: provider.totalRating.toNumber(),
        ratingCount: provider.ratingCount.toNumber(),
        isActive: provider.isActive,
        registeredAt: provider.registeredAt.toNumber(),
        metadata: provider.metadata,
      };
      
    } catch (error) {
      console.error(`❌ Failed to get provider ${address}:`, error);
      throw error;
    }
  }

  /**
   * Check if provider is registered
   */
  async isProviderRegistered(address: string): Promise<boolean> {
    try {
      const provider = await this.getProvider(address);
      return provider.registeredAt > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getGasPrice();
      return ethers.utils.formatUnits(gasPrice, 'gwei');
    } catch (error) {
      console.error('❌ Failed to get gas price:', error);
      return '0';
    }
  }

  /**
   * Get network information
   */
  async getNetworkInfo(): Promise<any> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        name: network.name,
        chainId: network.chainId,
        blockNumber,
      };
    } catch (error) {
      console.error('❌ Failed to get network info:', error);
      throw error;
    }
  }

  /**
   * Check connection status
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.provider.getNetwork();
      return true;
    } catch {
      return false;
    }
  }
}