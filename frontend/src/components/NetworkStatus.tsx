'use client';

import { useWeb3 } from '@/hooks/useWeb3';
import { AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function NetworkStatus() {
  const { chainId, isAvalanche, switchToAvalanche, isLoading } = useWeb3();

  // Don't show anything if no wallet is connected
  if (!chainId) return null;

  if (isAvalanche) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm font-medium text-green-700">
          Avalanche Network
        </span>
        <div className="flex items-center space-x-1">
          <Zap className="w-3 h-3 text-green-600" />
          <span className="text-xs text-green-600">Fast & Low Cost</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg">
      <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium text-orange-700">
          Switch to Avalanche Network
        </p>
        <p className="text-xs text-orange-600">
          For optimal performance and lower fees
        </p>
      </div>
      <button
        onClick={switchToAvalanche}
        disabled={isLoading}
        className="px-4 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Switching...' : 'Switch'}
      </button>
    </div>
  );
}