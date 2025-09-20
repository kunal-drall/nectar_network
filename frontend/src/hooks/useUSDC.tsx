'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from './useWeb3';
import { USDC_ADDRESS } from '@/lib/utils';
import { USDC_ABI } from '@/lib/abis';
import { toast } from 'react-hot-toast';

export function useUSDC() {
  const { provider, signer, user } = useWeb3();
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const usdcContract = provider
    ? new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider)
    : null;

  const usdcWithSigner = signer
    ? new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer)
    : null;

  const fetchBalance = async () => {
    if (!usdcContract || !user.address) return;

    try {
      const balance = await usdcContract.balanceOf(user.address);
      const decimals = await usdcContract.decimals();
      setBalance(ethers.utils.formatUnits(balance, decimals));
    } catch (error) {
      console.error('Error fetching USDC balance:', error);
    }
  };

  const approveUSDC = async (spender: string, amount: string) => {
    if (!usdcWithSigner) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      setIsLoading(true);
      const decimals = await usdcContract?.decimals();
      const amountWei = ethers.utils.parseUnits(amount, decimals);
      
      const tx = await usdcWithSigner.approve(spender, amountWei);
      await tx.wait();
      
      toast.success('USDC approval successful!');
      return true;
    } catch (error: any) {
      console.error('Error approving USDC:', error);
      toast.error(error.reason || 'Failed to approve USDC');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAllowance = async (owner: string, spender: string): Promise<string> => {
    if (!usdcContract) return '0';

    try {
      const allowance = await usdcContract.allowance(owner, spender);
      const decimals = await usdcContract.decimals();
      return ethers.utils.formatUnits(allowance, decimals);
    } catch (error) {
      console.error('Error checking allowance:', error);
      return '0';
    }
  };

  const hasEnoughBalance = (amount: string): boolean => {
    try {
      return parseFloat(balance) >= parseFloat(amount);
    } catch {
      return false;
    }
  };

  const hasEnoughAllowance = async (spender: string, amount: string): Promise<boolean> => {
    if (!user.address) return false;
    
    const allowance = await checkAllowance(user.address, spender);
    try {
      return parseFloat(allowance) >= parseFloat(amount);
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (usdcContract && user.address) {
      fetchBalance();
    }
  }, [usdcContract, user.address]);

  return {
    balance,
    isLoading,
    approveUSDC,
    checkAllowance,
    hasEnoughBalance,
    hasEnoughAllowance,
    fetchBalance,
  };
}