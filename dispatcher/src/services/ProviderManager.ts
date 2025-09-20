export interface Provider {
  address: string;
  isOnline: boolean;
  capabilities: string[];
  currentJobs: string[];
  lastSeen: number;
  metadata: string;
  registeredAt: number;
  totalJobsCompleted: number;
  averageRating: number;
}

export class ProviderManager {
  private providers: Map<string, Provider> = new Map();
  private offlineTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start periodic cleanup of offline providers
    setInterval(() => {
      this.cleanupOfflineProviders();
    }, 60000); // Check every minute
  }

  /**
   * Register a new provider
   */
  registerProvider(address: string, metadata: string): void {
    console.log(`👤 Registering provider: ${address}`);

    const existingProvider = this.providers.get(address);
    
    if (existingProvider) {
      // Update existing provider
      existingProvider.metadata = metadata;
      existingProvider.lastSeen = Date.now();
      existingProvider.isOnline = true;
      console.log(`🔄 Updated existing provider: ${address}`);
    } else {
      // Create new provider
      const provider: Provider = {
        address,
        isOnline: true,
        capabilities: this.parseCapabilities(metadata),
        currentJobs: [],
        lastSeen: Date.now(),
        metadata,
        registeredAt: Date.now(),
        totalJobsCompleted: 0,
        averageRating: 0
      };

      this.providers.set(address, provider);
      console.log(`✅ Registered new provider: ${address}`);
    }
  }

  /**
   * Update provider status to online
   */
  setProviderOnline(address: string): void {
    const provider = this.providers.get(address);
    if (provider) {
      provider.isOnline = true;
      provider.lastSeen = Date.now();
      console.log(`🟢 Provider ${address} is now online`);
    }
  }

  /**
   * Update provider status to offline
   */
  setProviderOffline(address: string): void {
    const provider = this.providers.get(address);
    if (provider) {
      provider.isOnline = false;
      console.log(`🔴 Provider ${address} is now offline`);
    }
  }

  /**
   * Assign a job to a provider
   */
  assignJobToProvider(providerAddress: string, jobId: string): boolean {
    const provider = this.providers.get(providerAddress);
    if (!provider) {
      console.error(`❌ Provider ${providerAddress} not found`);
      return false;
    }

    if (!provider.currentJobs.includes(jobId)) {
      provider.currentJobs.push(jobId);
      provider.lastSeen = Date.now();
      console.log(`📋 Assigned job ${jobId} to provider ${providerAddress}`);
      return true;
    }

    console.warn(`⚠️  Job ${jobId} already assigned to provider ${providerAddress}`);
    return false;
  }

  /**
   * Remove a job from a provider
   */
  removeJobFromProvider(providerAddress: string, jobId: string): boolean {
    const provider = this.providers.get(providerAddress);
    if (!provider) {
      console.error(`❌ Provider ${providerAddress} not found`);
      return false;
    }

    const jobIndex = provider.currentJobs.indexOf(jobId);
    if (jobIndex > -1) {
      provider.currentJobs.splice(jobIndex, 1);
      provider.totalJobsCompleted++;
      console.log(`✅ Removed job ${jobId} from provider ${providerAddress}`);
      return true;
    }

    console.warn(`⚠️  Job ${jobId} not found in provider ${providerAddress} job list`);
    return false;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): Provider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get online providers only
   */
  getOnlineProviders(): Provider[] {
    return Array.from(this.providers.values()).filter(provider => provider.isOnline);
  }

  /**
   * Get available providers (online and not at capacity)
   */
  getAvailableProviders(maxJobsPerProvider = 5): Provider[] {
    return this.getOnlineProviders().filter(provider => 
      provider.currentJobs.length < maxJobsPerProvider
    );
  }

  /**
   * Get providers by capability
   */
  getProvidersByCapability(capability: string): Provider[] {
    return this.getOnlineProviders().filter(provider =>
      provider.capabilities.includes(capability.toLowerCase())
    );
  }

  /**
   * Get provider by address
   */
  getProvider(address: string): Provider | undefined {
    return this.providers.get(address);
  }

  /**
   * Check if provider is registered
   */
  isProviderRegistered(address: string): boolean {
    return this.providers.has(address);
  }

  /**
   * Get jobs assigned to a provider
   */
  getProviderJobs(providerAddress: string): string[] {
    const provider = this.providers.get(providerAddress);
    return provider ? provider.currentJobs : [];
  }

  /**
   * Update provider heartbeat
   */
  updateProviderHeartbeat(address: string): void {
    const provider = this.providers.get(address);
    if (provider) {
      provider.lastSeen = Date.now();
      if (!provider.isOnline) {
        provider.isOnline = true;
        console.log(`🟢 Provider ${address} came back online`);
      }
    }
  }

  /**
   * Update provider capabilities
   */
  updateProviderCapabilities(address: string, capabilities: string[]): boolean {
    const provider = this.providers.get(address);
    if (!provider) {
      console.error(`❌ Provider ${address} not found`);
      return false;
    }

    provider.capabilities = capabilities.map(cap => cap.toLowerCase());
    provider.lastSeen = Date.now();
    console.log(`🔧 Updated capabilities for provider ${address}:`, capabilities);
    return true;
  }

  /**
   * Update provider rating
   */
  updateProviderRating(address: string, newRating: number): boolean {
    const provider = this.providers.get(address);
    if (!provider) {
      console.error(`❌ Provider ${address} not found`);
      return false;
    }

    // Simple average calculation (in production, this would be more sophisticated)
    const totalRatings = provider.totalJobsCompleted;
    if (totalRatings > 0) {
      provider.averageRating = ((provider.averageRating * (totalRatings - 1)) + newRating) / totalRatings;
    } else {
      provider.averageRating = newRating;
    }

    console.log(`⭐ Updated rating for provider ${address}: ${provider.averageRating.toFixed(2)}`);
    return true;
  }

  /**
   * Get provider statistics
   */
  getProviderStats(): any {
    const providers = this.getAllProviders();
    const onlineProviders = this.getOnlineProviders();
    const availableProviders = this.getAvailableProviders();

    return {
      total: providers.length,
      online: onlineProviders.length,
      available: availableProviders.length,
      totalJobsInProgress: providers.reduce((sum, p) => sum + p.currentJobs.length, 0),
      totalJobsCompleted: providers.reduce((sum, p) => sum + p.totalJobsCompleted, 0),
      averageRating: providers.length > 0 
        ? providers.reduce((sum, p) => sum + p.averageRating, 0) / providers.length 
        : 0
    };
  }

  /**
   * Get top providers by rating
   */
  getTopProviders(limit = 10): Provider[] {
    return this.getOnlineProviders()
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }

  /**
   * Find best provider for a job based on requirements
   */
  findBestProviderForJob(requirements: string[], preferHighRating = true): Provider | null {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      return null;
    }

    // Filter providers that meet requirements
    const suitableProviders = availableProviders.filter(provider => {
      return requirements.every(req => 
        provider.capabilities.some(cap => 
          cap.includes(req.toLowerCase()) || req.toLowerCase().includes(cap)
        )
      );
    });

    if (suitableProviders.length === 0) {
      // If no provider exactly matches, return the best available
      return preferHighRating 
        ? availableProviders.sort((a, b) => b.averageRating - a.averageRating)[0]
        : availableProviders[0];
    }

    // Return best suitable provider
    return preferHighRating
      ? suitableProviders.sort((a, b) => b.averageRating - a.averageRating)[0]
      : suitableProviders.sort((a, b) => a.currentJobs.length - b.currentJobs.length)[0]; // Least loaded
  }

  /**
   * Parse capabilities from metadata
   */
  private parseCapabilities(metadata: string): string[] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(metadata);
      if (parsed.capabilities && Array.isArray(parsed.capabilities)) {
        return parsed.capabilities.map((cap: string) => cap.toLowerCase());
      }
    } catch {
      // If not JSON, treat as comma-separated list
      return metadata.toLowerCase()
        .split(',')
        .map(cap => cap.trim())
        .filter(cap => cap.length > 0);
    }

    // Default capabilities
    return ['cpu', 'general'];
  }

  /**
   * Cleanup offline providers
   */
  private cleanupOfflineProviders(): void {
    const now = Date.now();
    const providersToMarkOffline: string[] = [];

    this.providers.forEach((provider, address) => {
      if (provider.isOnline && (now - provider.lastSeen) > this.offlineTimeout) {
        providersToMarkOffline.push(address);
      }
    });

    providersToMarkOffline.forEach(address => {
      this.setProviderOffline(address);
    });

    if (providersToMarkOffline.length > 0) {
      console.log(`🧹 Marked ${providersToMarkOffline.length} providers as offline due to inactivity`);
    }
  }

  /**
   * Remove a provider completely
   */
  removeProvider(address: string): boolean {
    const provider = this.providers.get(address);
    if (!provider) {
      return false;
    }

    // Check if provider has active jobs
    if (provider.currentJobs.length > 0) {
      console.warn(`⚠️  Cannot remove provider ${address} - has ${provider.currentJobs.length} active jobs`);
      return false;
    }

    this.providers.delete(address);
    console.log(`🗑️  Removed provider ${address}`);
    return true;
  }
}