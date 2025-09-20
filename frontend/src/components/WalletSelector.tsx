'use client';

import { useState } from 'react';
import { X, ExternalLink, AlertCircle } from 'lucide-react';
import { SUPPORTED_WALLETS } from '@/lib/walletConfig';

interface WalletSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletSelect: (walletId: string) => void;
}

export default function WalletSelector({ isOpen, onClose, onWalletSelect }: WalletSelectorProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleWalletClick = (walletId: string) => {
    setSelectedWallet(walletId);
    onWalletSelect(walletId);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Connect Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Avalanche Notice */}
        <div className="p-4 bg-orange-50 border-l-4 border-orange-400 mx-6 mt-4 rounded">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm text-orange-700">
                <strong>Avalanche Network Required</strong>
              </p>
              <p className="text-xs text-orange-600 mt-1">
                Make sure your wallet supports Avalanche network for full functionality.
              </p>
            </div>
          </div>
        </div>

        {/* Wallet List */}
        <div className="p-6 space-y-3">
          {Object.entries(SUPPORTED_WALLETS).map(([key, wallet]) => (
            <button
              key={key}
              onClick={() => handleWalletClick(wallet.id)}
              disabled={selectedWallet === wallet.id}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{wallet.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{wallet.name}</div>
                  {wallet.name === 'Core Wallet' && (
                    <div className="text-xs text-green-600">Recommended for Avalanche</div>
                  )}
                  {wallet.name === 'WalletConnect' && (
                    <div className="text-xs text-gray-500">Mobile wallets & more</div>
                  )}
                </div>
              </div>
              
              {selectedWallet === wallet.id ? (
                <div className="text-blue-600 text-sm">Connecting...</div>
              ) : (
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 rounded-b-lg">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-600">
              Don't have a wallet? Install one to get started:
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="https://core.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <span>Core Wallet</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <span>MetaMask</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}