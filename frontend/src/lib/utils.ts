import { ethers } from 'ethers';
import { ContractAddresses } from '@/types';

// Default contract addresses (will be updated with actual deployed addresses)
export const CONTRACT_ADDRESSES: ContractAddresses = {
  jobManager: process.env.NEXT_PUBLIC_JOB_MANAGER_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  escrow: process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  reputation: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS || '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};

export const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';

export const NETWORK_CONFIG = {
  chainId: 31337, // Local Hardhat network
  chainName: 'Hardhat Local',
  rpcUrls: [RPC_URL],
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const AVALANCHE_TESTNET_CONFIG = {
  chainId: 43113,
  chainName: 'Avalanche Fuji Testnet',
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  nativeCurrency: {
    name: 'Avalanche',
    symbol: 'AVAX',
    decimals: 18,
  },
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatEther(wei: string | number): string {
  try {
    return ethers.utils.formatEther(wei);
  } catch {
    return '0';
  }
}

export function parseEther(ether: string): string {
  try {
    return ethers.utils.parseEther(ether).toString();
  } catch {
    return '0';
  }
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatDateTime(timestamp: number): string {
  if (!timestamp) return '';
  return new Date(timestamp * 1000).toLocaleString();
}

export function getJobStatusText(status: number): string {
  const statusMap = {
    0: 'Posted',
    1: 'Assigned',
    2: 'In Progress',
    3: 'Completed',
    4: 'Cancelled',
    5: 'Disputed',
  };
  return statusMap[status as keyof typeof statusMap] || 'Unknown';
}

export function getJobStatusColor(status: number): string {
  const colorMap = {
    0: 'status-posted',
    1: 'status-assigned',
    2: 'status-in-progress',
    3: 'status-completed',
    4: 'status-cancelled',
    5: 'status-cancelled',
  };
  return colorMap[status as keyof typeof colorMap] || 'status-posted';
}

export function isValidEthereumAddress(address: string): boolean {
  return ethers.utils.isAddress(address);
}

export function calculateTimeRemaining(deadline: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = deadline - now;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function validateJobForm(data: {
  title: string;
  description: string;
  requirements: string;
  reward: string;
  deadline: string;
}): string[] {
  const errors: string[] = [];
  
  if (!data.title.trim()) {
    errors.push('Title is required');
  }
  
  if (!data.description.trim()) {
    errors.push('Description is required');
  }
  
  if (!data.requirements.trim()) {
    errors.push('Requirements are required');
  }
  
  try {
    const reward = parseFloat(data.reward);
    if (isNaN(reward) || reward <= 0) {
      errors.push('Reward must be a positive number');
    }
  } catch {
    errors.push('Invalid reward amount');
  }
  
  try {
    const deadline = new Date(data.deadline);
    const now = new Date();
    if (deadline <= now) {
      errors.push('Deadline must be in the future');
    }
  } catch {
    errors.push('Invalid deadline');
  }
  
  return errors;
}