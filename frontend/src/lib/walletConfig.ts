import Web3Modal from 'web3modal';
import WalletConnectProvider from '@walletconnect/web3-provider';

// Avalanche network configuration
export const AVALANCHE_MAINNET = {
  chainId: '0xA86A', // 43114 in hex
  chainName: 'Avalanche Network',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io/'],
};

export const AVALANCHE_FUJI = {
  chainId: '0xA869', // 43113 in hex
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

// Popular wallets that support Avalanche
export const SUPPORTED_WALLETS = {
  METAMASK: {
    name: 'MetaMask',
    icon: '🦊',
    id: 'injected',
    downloadUrl: 'https://metamask.io/download/',
  },
  CORE: {
    name: 'Core Wallet',
    icon: '🔴', 
    id: 'injected',
    downloadUrl: 'https://core.app/',
  },
  COINBASE: {
    name: 'Coinbase Wallet',
    icon: '🔵',
    id: 'injected',
    downloadUrl: 'https://www.coinbase.com/wallet',
  },
  WALLETCONNECT: {
    name: 'WalletConnect',
    icon: '🔗',
    id: 'walletconnect',
    downloadUrl: null,
  },
  TRUST: {
    name: 'Trust Wallet',
    icon: '🔷',
    id: 'injected',
    downloadUrl: 'https://trustwallet.com/',
  },
  PHANTOM: {
    name: 'Phantom',
    icon: '👻',
    id: 'injected', 
    downloadUrl: 'https://phantom.app/',
  },
};

// Web3Modal configuration
export const getWeb3Modal = () => {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          43114: AVALANCHE_MAINNET.rpcUrls[0], // Avalanche Mainnet
          43113: AVALANCHE_FUJI.rpcUrls[0],    // Avalanche Fuji Testnet
          1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY', // Ethereum (fallback)
        },
        chainId: 43114, // Default to Avalanche Mainnet
        bridge: 'https://bridge.walletconnect.org',
      },
    },
  };

  return new Web3Modal({
    cacheProvider: true,
    providerOptions,
    disableInjectedProvider: false,
    theme: {
      background: 'rgb(39, 49, 56)',
      main: 'rgb(199, 199, 199)',
      secondary: 'rgb(136, 136, 136)',
      border: 'rgba(195, 195, 195, 0.14)',
      hover: 'rgb(16, 26, 32)',
    },
  });
};

// Function to detect which wallet is being used
export const detectWallet = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  
  const { ethereum } = window as any;
  
  if (!ethereum) return 'none';
  
  // Check for specific wallet providers
  if (ethereum.isMetaMask) return 'MetaMask';
  if (ethereum.isCore) return 'Core Wallet';
  if (ethereum.isCoinbaseWallet) return 'Coinbase Wallet';
  if (ethereum.isTrust) return 'Trust Wallet';
  if (ethereum.isPhantom) return 'Phantom';
  
  return 'Unknown Wallet';
};

// Function to add Avalanche network to wallet
export const addAvalancheNetwork = async (isTestnet = false) => {
  const network = isTestnet ? AVALANCHE_FUJI : AVALANCHE_MAINNET;
  
  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet detected');
  }

  try {
    // Try to switch to the network first
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainId }],
    });
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to the wallet
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [network],
        });
      } catch (addError) {
        throw new Error('Failed to add Avalanche network to wallet');
      }
    } else {
      throw new Error('Failed to switch to Avalanche network');
    }
  }
};

// Function to check if currently connected to Avalanche
export const isAvalancheNetwork = (chainId: number): boolean => {
  return chainId === 43114 || chainId === 43113; // Mainnet or Fuji testnet
};