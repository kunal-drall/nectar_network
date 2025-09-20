export interface Job {
  id: number;
  client: string;
  provider: string;
  title: string;
  description: string;
  requirements: string;
  reward: string;
  deadline: number;
  status: JobStatus;
  resultHash: string;
  createdAt: number;
  completedAt: number;
}

export enum JobStatus {
  Posted = 0,
  Assigned = 1,
  InProgress = 2,
  Completed = 3,
  Cancelled = 4,
  Disputed = 5,
}

export interface Provider {
  address: string;
  totalJobs: number;
  completedJobs: number;
  averageRating: number;
  completionRate: number;
  isActive: boolean;
  registeredAt: number;
  metadata: string;
}

export interface Rating {
  id: number;
  jobId: number;
  client: string;
  provider: string;
  score: number;
  comment: string;
  timestamp: number;
}

export interface EscrowData {
  jobId: number;
  client: string;
  provider: string;
  amount: string;
  released: boolean;
  refunded: boolean;
  disputeStatus: DisputeStatus;
  disputeRaisedAt: number;
  disputeReason: string;
}

export enum DisputeStatus {
  None = 0,
  Raised = 1,
  InReview = 2,
  Resolved = 3,
}

export interface User {
  address: string;
  isConnected: boolean;
  isProvider: boolean;
}

export interface ContractAddresses {
  jobManager: string;
  escrow: string;
  reputation: string;
}

// Wallet and Network Types
export interface WalletInfo {
  name: string;
  icon: string;
  id: string;
  downloadUrl?: string;
}

export interface NetworkConfig {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export interface Web3ContextType {
  user: User;
  provider: any;
  signer: any;
  walletName: string;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToAvalanche: () => Promise<void>;
  isLoading: boolean;
  isAvalanche: boolean;
}