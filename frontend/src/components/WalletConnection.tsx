'use client';

import { useWeb3 } from '@/hooks/useWeb3';
import { formatAddress } from '@/lib/utils';
import { Wallet, LogOut, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { SUPPORTED_WALLETS } from '@/lib/walletConfig';

export default function WalletConnection() {
  const { 
    user, 
    connectWallet, 
    disconnectWallet, 
    switchToAvalanche,
    isLoading, 
    walletName,
    chainId,
    isAvalanche 
  } = useWeb3();

  const getNetworkName = (chainId: number | null): string => {
    if (!chainId) return 'Unknown';
    
    switch (chainId) {
      case 43114: return 'Avalanche';
      case 43113: return 'Avalanche Fuji';
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 56: return 'BSC';
      default: return `Chain ${chainId}`;
    }
  };

  const getNetworkColor = (isAvalanche: boolean): string => {
    return isAvalanche 
      ? 'text-green-600 bg-green-50 border-green-200' 
      : 'text-orange-600 bg-orange-50 border-orange-200';
  };

  if (user.isConnected) {
    return (
      <div className="flex items-center space-x-3">
        {/* Network Status */}
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${getNetworkColor(isAvalanche)}`}>
          {isAvalanche ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {getNetworkName(chainId)}
          </span>
        </div>

        {/* Switch Network Button */}
        {!isAvalanche && (
          <button
            onClick={switchToAvalanche}
            disabled={isLoading}
            className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            Switch to Avalanche
          </button>
        )}

        {/* Wallet Info */}
        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-4 py-2">
          <Wallet className="w-4 h-4 text-gray-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              {formatAddress(user.address)}
            </span>
            {walletName && (
              <span className="text-xs text-gray-500">
                {walletName}
              </span>
            )}
          </div>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={disconnectWallet}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors p-2"
          title="Disconnect Wallet"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Wallet Support Info */}
      <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
        <span>Supports:</span>
        <div className="flex space-x-1">
          {Object.values(SUPPORTED_WALLETS).slice(0, 4).map((wallet) => (
            <span key={wallet.name} title={wallet.name} className="text-lg">
              {wallet.icon}
            </span>
          ))}
        </div>
      </div>

      {/* Connect Button */}
      <button
        onClick={connectWallet}
        disabled={isLoading}
        className="btn-primary flex items-center space-x-2 px-6 py-3"
      >
        <Wallet className="w-4 h-4" />
        <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      {/* Help Text */}
      <div className="hidden lg:block text-xs text-gray-500 max-w-xs">
        <p>Connect any Avalanche-compatible wallet</p>
        <div className="flex items-center space-x-1 mt-1">
          <span>Need a wallet?</span>
          <a 
            href="https://core.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <span>Get Core</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}