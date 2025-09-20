// Environment configuration for multi-wallet support
export const CONFIG = {
  // RPC endpoints for different networks
  RPC_URLS: {
    // Avalanche Mainnet
    43114: process.env.NEXT_PUBLIC_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc',
    // Avalanche Fuji Testnet  
    43113: process.env.NEXT_PUBLIC_AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc',
    // Ethereum Mainnet (fallback)
    1: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY_HERE',
  },
  
  // WalletConnect Project ID (replace with your own)
  WALLETCONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID',
  
  // Default network (Avalanche Mainnet)
  DEFAULT_CHAIN_ID: 43114,
  
  // Contract addresses (will be populated after deployment)
  CONTRACTS: {
    JOB_MANAGER: process.env.NEXT_PUBLIC_JOB_MANAGER_ADDRESS || '',
    ESCROW: process.env.NEXT_PUBLIC_ESCROW_ADDRESS || '',
    REPUTATION: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS || '',
  },
  
  // API endpoints
  API: {
    DISPATCHER: process.env.NEXT_PUBLIC_DISPATCHER_URL || 'http://localhost:3001',
  }
};

// Network configurations
export const NETWORKS = {
  AVALANCHE_MAINNET: {
    chainId: 43114,
    name: 'Avalanche Network',
    symbol: 'AVAX',
    rpc: CONFIG.RPC_URLS[43114],
    explorer: 'https://snowtrace.io',
  },
  AVALANCHE_FUJI: {
    chainId: 43113,
    name: 'Avalanche Fuji Testnet',
    symbol: 'AVAX',
    rpc: CONFIG.RPC_URLS[43113],
    explorer: 'https://testnet.snowtrace.io',
  },
} as const;