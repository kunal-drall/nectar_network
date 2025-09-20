# Multi-Wallet Support for Nectar Network

This document explains the multi-wallet functionality implemented for the Nectar Network frontend.

## Supported Wallets

The application now supports any wallet that is compatible with Avalanche network:

### 🔴 Core Wallet (Recommended)
- **Best for Avalanche**: Native Avalanche support
- **Download**: https://core.app/
- **Features**: Built specifically for Avalanche ecosystem

### 🦊 MetaMask
- **Most Popular**: Widely used browser wallet
- **Download**: https://metamask.io/
- **Note**: Requires manual Avalanche network addition

### 🔵 Coinbase Wallet
- **User-Friendly**: Easy to use interface
- **Download**: https://www.coinbase.com/wallet
- **Features**: Mobile and browser support

### 🔷 Trust Wallet
- **Mobile First**: Excellent mobile experience
- **Download**: https://trustwallet.com/
- **Features**: Multi-chain support

### 👻 Phantom
- **Growing**: Expanding beyond Solana
- **Download**: https://phantom.app/
- **Note**: Avalanche support in development

### 🔗 WalletConnect
- **Protocol**: Connects mobile wallets
- **Supports**: 300+ mobile wallets
- **Features**: QR code connection

## Features

### 🌟 Smart Network Detection
- Automatically detects current network
- Shows network status with visual indicators
- Prompts users to switch to Avalanche for optimal experience

### 🔄 One-Click Network Switching
- Easy switch to Avalanche network
- Automatic network addition if not present
- Support for both Mainnet and Fuji testnet

### 📱 Universal Wallet Support
- Works with any injected wallet provider
- Fallback support for unknown wallets
- WalletConnect for mobile wallet connections

### 🎨 Enhanced UI/UX
- Wallet-specific icons and branding
- Network status indicators
- Clear connection states
- Helpful error messages

## Technical Implementation

### Web3Modal Integration
```typescript
// Web3Modal with custom configuration
const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        rpc: {
          43114: 'https://api.avax.network/ext/bc/C/rpc', // Avalanche
          43113: 'https://api.avax-test.network/ext/bc/C/rpc', // Fuji
        },
      },
    },
  },
});
```

### Network Configuration
```typescript
const AVALANCHE_MAINNET = {
  chainId: '0xA86A', // 43114
  chainName: 'Avalanche Network',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://snowtrace.io/'],
};
```

### Enhanced Web3 Context
The `useWeb3` hook now provides:
- `walletName`: Detected wallet type
- `chainId`: Current network chain ID
- `isAvalanche`: Boolean for Avalanche network detection
- `switchToAvalanche()`: Function to switch networks

## Components

### WalletConnection
- Enhanced connection button with multi-wallet support
- Network status display
- Quick network switching
- Wallet information display

### NetworkStatus
- Visual network indicators
- Switch network prompts
- Avalanche-specific messaging

### WalletSelector (Optional)
- Modal for wallet selection
- Wallet-specific download links
- Educational content about Avalanche

## Configuration

### Environment Variables
Create `.env.local` file:
```bash
# RPC URLs (optional - has defaults)
NEXT_PUBLIC_AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
NEXT_PUBLIC_AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc

# WalletConnect Project ID (required for WalletConnect)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Contract addresses (set after deployment)
NEXT_PUBLIC_JOB_MANAGER_ADDRESS=0x...
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_REPUTATION_ADDRESS=0x...
```

### WalletConnect Setup
1. Go to https://cloud.walletconnect.com/
2. Create a new project
3. Get your Project ID
4. Add it to environment variables

## Usage Examples

### Basic Connection
```typescript
const { connectWallet, user, walletName } = useWeb3();

// Connect any supported wallet
await connectWallet();

// Check connection status
if (user.isConnected) {
  console.log(`Connected with ${walletName}: ${user.address}`);
}
```

### Network Management
```typescript
const { chainId, isAvalanche, switchToAvalanche } = useWeb3();

// Check if on Avalanche
if (isAvalanche) {
  console.log('Ready for optimal experience!');
} else {
  // Prompt user to switch
  await switchToAvalanche();
}
```

### Wallet Detection
```typescript
import { detectWallet } from '@/lib/walletConfig';

const walletType = detectWallet();
console.log(`Using: ${walletType}`);
```

## Benefits

### For Users
- **Choice**: Use their preferred wallet
- **Seamless**: No MetaMask dependency
- **Optimized**: Best experience on Avalanche
- **Educational**: Learn about Avalanche ecosystem

### For Developers
- **Flexible**: Support any wallet provider
- **Future-proof**: Easy to add new wallets
- **Maintainable**: Clean abstraction layer
- **Extensible**: Ready for additional features

## Error Handling

The system provides user-friendly error messages for common scenarios:
- Wallet not installed
- User rejection
- Network switching failures
- Connection timeouts

## Testing

Test with different wallets:
1. Install Core Wallet and test Avalanche features
2. Use MetaMask and verify network switching
3. Try WalletConnect with mobile wallets
4. Test error scenarios (rejected connections, etc.)

## Future Enhancements

- **Hardware Wallets**: Ledger, Trezor support
- **Account Abstraction**: Smart wallet integration  
- **Multi-Chain**: Expand beyond Avalanche
- **Wallet Rankings**: Show recommended wallets
- **Custom Connectors**: Direct wallet integrations