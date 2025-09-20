'use client';

import { useWeb3 } from '@/hooks/useWeb3';
import { detectWallet, SUPPORTED_WALLETS } from '@/lib/walletConfig';

export default function WalletTestPage() {
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

  const handleTestDetection = () => {
    const detected = detectWallet();
    alert(`Detected wallet: ${detected}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Multi-Wallet Test Page</h1>
      
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Connected:</strong> {user.isConnected ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>Address:</strong> {user.address || 'None'}
          </div>
          <div>
            <strong>Wallet:</strong> {walletName || 'None'}
          </div>
          <div>
            <strong>Chain ID:</strong> {chainId || 'None'}
          </div>
          <div>
            <strong>On Avalanche:</strong> {isAvalanche ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>Loading:</strong> {isLoading ? '🔄 Yes' : '❌ No'}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          <button
            onClick={disconnectWallet}
            disabled={!user.isConnected}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            Disconnect
          </button>
          
          <button
            onClick={switchToAvalanche}
            disabled={isLoading || isAvalanche}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            Switch to Avalanche
          </button>
          
          <button
            onClick={handleTestDetection}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Test Wallet Detection
          </button>
        </div>
      </div>

      {/* Supported Wallets */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Supported Wallets</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(SUPPORTED_WALLETS).map(([key, wallet]) => (
            <div key={key} className="border rounded p-4 text-center">
              <div className="text-2xl mb-2">{wallet.icon}</div>
              <div className="font-medium">{wallet.name}</div>
              <div className="text-sm text-gray-500">{wallet.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Network Information</h2>
        <div className="text-sm space-y-2">
          <div><strong>Avalanche Mainnet:</strong> Chain ID 43114</div>
          <div><strong>Avalanche Fuji:</strong> Chain ID 43113</div>
          <div><strong>Current Chain:</strong> {chainId || 'Not connected'}</div>
          <div><strong>Is Avalanche Network:</strong> {isAvalanche ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
}