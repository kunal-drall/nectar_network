'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';
import { User } from '@/types';
import { toast } from 'react-hot-toast';

interface Web3ContextType {
  user: User;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);

  const connectWallet = async () => {
    try {
      setIsLoading(true);
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const web3Signer = web3Provider.getSigner();
      const address = await web3Signer.getAddress();
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setUser({
        address,
        isConnected: true,
        isProvider: false, // Will be determined by checking reputation contract
      });
      
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setUser({
      address: '',
      isConnected: false,
      isProvider: false,
    });
    toast.success('Wallet disconnected');
  };

  // Check if wallet is already connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            const web3Signer = web3Provider.getSigner();
            const address = await web3Signer.getAddress();
            
            setProvider(web3Provider);
            setSigner(web3Signer);
            setUser({
              address,
              isConnected: true,
              isProvider: false,
            });
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          // Reconnect with new account
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        // Reload the page when chain changes
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const value = {
    user,
    provider,
    signer,
    connectWallet,
    disconnectWallet,
    isLoading,
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