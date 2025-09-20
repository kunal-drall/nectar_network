'use client';

import { useWeb3 } from '@/hooks/useWeb3';
import { formatAddress } from '@/lib/utils';
import { Wallet, LogOut } from 'lucide-react';

export default function WalletConnection() {
  const { user, connectWallet, disconnectWallet, isLoading } = useWeb3();

  if (user.isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
          <Wallet className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {formatAddress(user.address)}
          </span>
        </div>
        <button
          onClick={disconnectWallet}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isLoading}
      className="btn-primary flex items-center space-x-2"
    >
      <Wallet className="w-4 h-4" />
      <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  );
}