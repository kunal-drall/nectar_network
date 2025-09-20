'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { User } from '@/types';
import { toast } from 'react-hot-toast';
import { 
  getWeb3Modal, 
  detectWallet, 
  addAvalancheNetwork, 
  isAvalancheNetwork,
  AVALANCHE_MAINNET,
  SUPPORTED_WALLETS 
} from '@/lib/walletConfig';

interface Web3ContextType {
  user: User;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  walletName: string;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToAvalanche: () => Promise<void>;
  isLoading: boolean;
  isAvalanche: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [user, setUser] = useState<User>({
    address: '',
    isConnected: false,
    isProvider: false,
  });
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [walletName, setWalletName] = useState('');
  const [chainId, setChainId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [web3Modal, setWeb3Modal] = useState<any>(null);

  const isAvalanche = chainId ? isAvalancheNetwork(chainId) : false;

  // Initialize Web3Modal
  useEffect(() => {
    const modal = getWeb3Modal();
    setWeb3Modal(modal);
  }, []);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      if (!web3Modal) {
        throw new Error('Web3Modal not initialized');
      }

      // Clear any cached provider first for fresh connection
      web3Modal.clearCachedProvider();
      
      // Connect to wallet
      const instance = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(instance);
      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      const network = await web3Provider.getNetwork();
      
      // Detect wallet type
      const detectedWallet = detectWallet();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setWalletName(detectedWallet);
      setChainId(network.chainId);
      setUser({
        address,
        isConnected: true,
        isProvider: false,
      });

      // Setup event listeners for this provider instance
      setupEventListeners(instance);
      
      // Check if on Avalanche network
      if (!isAvalancheNetwork(network.chainId)) {
        toast.error('Please switch to Avalanche network for full functionality', {
          duration: 4000,
        });
      } else {
        toast.success(`Connected to ${detectedWallet} on Avalanche!`);
      }
      
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      // Provide helpful error messages based on the error
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.message?.includes('No provider was found')) {
        toast.error('No wallet found. Please install a wallet like MetaMask or Core Wallet');
      } else {
        toast.error(error.message || 'Failed to connect wallet');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (web3Modal) {
        web3Modal.clearCachedProvider();
      }
      
      setProvider(null);
      setSigner(null);
      setWalletName('');
      setChainId(null);
      setUser({
        address: '',
        isConnected: false,
        isProvider: false,
      });
      
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  const switchToAvalanche = async () => {
    try {
      setIsLoading(true);
      await addAvalancheNetwork(false); // false = mainnet, true = testnet
      toast.success('Switched to Avalanche network!');
    } catch (error: any) {
      console.error('Error switching to Avalanche:', error);
      toast.error(error.message || 'Failed to switch to Avalanche network');
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = (providerInstance: any) => {
    if (!providerInstance?.on) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        // Update user with new account
        try {
          const web3Provider = new ethers.providers.Web3Provider(providerInstance);
          const web3Signer = web3Provider.getSigner();
          const address = await web3Signer.getAddress();
          
          setUser(prev => ({ ...prev, address }));
          toast.success('Account switched');
        } catch (error) {
          console.error('Error handling account change:', error);
        }
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16);
      setChainId(newChainId);
      
      if (isAvalancheNetwork(newChainId)) {
        toast.success('Connected to Avalanche network');
      } else {
        toast.warning('Not on Avalanche network - some features may be limited');
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    // Add event listeners
    providerInstance.on('accountsChanged', handleAccountsChanged);
    providerInstance.on('chainChanged', handleChainChanged);
    providerInstance.on('disconnect', handleDisconnect);

    // Cleanup function
    return () => {
      if (providerInstance.removeListener) {
        providerInstance.removeListener('accountsChanged', handleAccountsChanged);
        providerInstance.removeListener('chainChanged', handleChainChanged);
        providerInstance.removeListener('disconnect', handleDisconnect);
      }
    };
  };

  // Check for cached provider on load
  useEffect(() => {
    const checkCachedProvider = async () => {
      if (!web3Modal) return;
      
      try {
        if (web3Modal.cachedProvider) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error connecting to cached provider:', error);
        web3Modal.clearCachedProvider();
      }
    };

    checkCachedProvider();
  }, [web3Modal]);

  const value = {
    user,
    provider,
    signer,
    walletName,
    chainId,
    connectWallet,
    disconnectWallet,
    switchToAvalanche,
    isLoading,
    isAvalanche,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}