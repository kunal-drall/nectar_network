# Nectar Network

A decentralized compute marketplace built on Avalanche, enabling users to post compute jobs and providers to offer computing resources in exchange for cryptocurrency rewards.

## 🏗️ Architecture

The Nectar Network consists of four main components:

1. **Smart Contracts (Solidity)** - Core blockchain logic
2. **Frontend (Next.js)** - User and provider dashboards
3. **Dispatcher (Node.js)** - Event handling and job management
4. **Provider Nodes (Docker)** - Compute job execution

## 📋 Features

### Smart Contracts
- **JobManager**: Complete job lifecycle management (post, assign, start, complete, cancel)
- **Escrow**: Secure payment handling with dispute resolution and platform fees
- **Reputation**: Provider registration, rating system, and performance tracking
- **Events**: Comprehensive event emission for real-time updates

### Frontend
- **Wallet Integration**: MetaMask support with Web3 provider
- **User Dashboard**: Job posting, management, and payment tracking
- **Provider Dashboard**: Job browsing, execution, and earnings
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Dispatcher
- **Event Listening**: Real-time blockchain event monitoring
- **Job Assignment**: Intelligent job routing to suitable providers
- **WebSocket API**: Live updates for frontend applications
- **Provider Management**: Online status and capability tracking

### Provider Nodes
- **Compute Simulation**: Multiple job types (ML, data processing, rendering, etc.)
- **Docker Support**: Containerized workload execution
- **Resource Monitoring**: CPU, memory, and disk usage tracking
- **Result Verification**: Cryptographic result hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kunal-drall/nectar_network.git
   cd nectar_network
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development environment**
   ```bash
   npm run dev
   ```

This will start all services:
- Hardhat local blockchain: `http://localhost:8545`
- Frontend: `http://localhost:3000`
- Dispatcher: `http://localhost:3001`
- Provider Node: `http://localhost:3002`

### Alternative: Individual Service Startup

```bash
# Start blockchain
npm run dev:contracts

# Start frontend
npm run dev:frontend

# Start dispatcher
npm run dev:dispatcher

# Provider nodes start automatically with Docker Compose
```

## 🔧 Configuration

### Smart Contracts

The contracts are configured for Avalanche networks in `contracts/hardhat.config.js`:

```javascript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545"
  },
  "avalanche-testnet": {
    url: "https://api.avax-test.network/ext/bc/C/rpc",
    chainId: 43113
  }
}
```

### Frontend

Configure Web3 settings in `frontend/src/lib/utils.ts`:

```typescript
export const CONTRACT_ADDRESSES: ContractAddresses = {
  jobManager: process.env.NEXT_PUBLIC_JOB_MANAGER_ADDRESS,
  escrow: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
  reputation: process.env.NEXT_PUBLIC_REPUTATION_ADDRESS,
};
```

### Provider Nodes

Customize provider capabilities:

```bash
PROVIDER_CAPABILITIES=cpu,gpu,docker,ml,data-processing,scientific
MAX_CONCURRENT_JOBS=5
HEARTBEAT_INTERVAL=15000
```

## 🧪 Testing

### Smart Contracts
```bash
cd contracts
npm test
```

### Full System Test
```bash
npm run test
```

## 📊 Usage Examples

### Posting a Job (Frontend)
1. Connect your MetaMask wallet
2. Navigate to the Dashboard
3. Click "Post New Job"
4. Fill in job details and requirements
5. Set reward amount and deadline
6. Submit transaction

### Provider Registration
```bash
# Register as a compute provider
curl -X POST http://localhost:3001/api/providers/register \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x...",
    "capabilities": ["cpu", "docker"],
    "metadata": "High-performance compute node"
  }'
```

### Job Execution Simulation
```bash
# Simulate job execution
curl -X POST http://localhost:3002/execute \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "1",
    "title": "Machine Learning Training",
    "description": "Train a neural network model",
    "requirements": "GPU, 16GB RAM, PyTorch"
  }'
```

## 🌐 Deployment

### Local Development
```bash
docker-compose up
```

### Avalanche Testnet
```bash
# Set private key in .env
PRIVATE_KEY=your_private_key

# Deploy contracts
npm run deploy:testnet

# Update frontend with new contract addresses
# Deploy frontend to Vercel/Netlify
npm run build:frontend
```

### Production Considerations
- Use environment variables for sensitive data
- Implement proper key management
- Set up monitoring and logging
- Configure load balancing for multiple provider nodes
- Implement comprehensive error handling

## 🔗 API Documentation

### Dispatcher API

#### Jobs
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/assign` - Force assign job to provider
- `GET /api/jobs/status/queue` - Get job queue status

#### Providers
- `GET /api/providers` - List all providers
- `GET /api/providers/:address` - Get provider details
- `POST /api/providers/:address/heartbeat` - Update provider heartbeat
- `GET /api/providers/stats/overview` - Provider statistics

### Provider Node API

#### Status
- `GET /health` - Health check
- `GET /status` - Provider status
- `GET /capabilities` - Provider capabilities

#### Jobs
- `GET /jobs` - Current jobs
- `POST /execute` - Manual job execution

## 🛡️ Security Features

- **Escrow System**: Funds held securely until job completion
- **Dispute Resolution**: Built-in arbitration for conflicts
- **Reputation System**: Provider performance tracking
- **Access Controls**: Smart contract role-based permissions
- **Result Verification**: Cryptographic proof of work completion

## 🔄 Job Lifecycle

1. **Posting**: Client creates job with requirements and reward
2. **Assignment**: Job assigned to suitable provider (manual or automatic)
3. **Execution**: Provider processes the compute workload
4. **Completion**: Results submitted with cryptographic proof
5. **Payment**: Escrow releases payment to provider
6. **Rating**: Client rates provider performance

## 🏛️ Smart Contract Architecture

```
JobManager.sol
├── Job posting and lifecycle management
├── Provider assignment logic
└── Status tracking and events

Escrow.sol
├── Payment holding and release
├── Dispute handling
└── Platform fee management

Reputation.sol
├── Provider registration
├── Rating and review system
└── Performance metrics
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📜 License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Avalanche Documentation](https://docs.avax.network/)
- [Hardhat Framework](https://hardhat.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ethers.js Documentation](https://docs.ethers.io/)

## 🚧 Roadmap

- [ ] Automated provider discovery and bidding
- [ ] Advanced job scheduling and queuing
- [ ] Multi-chain support (Ethereum, Polygon)
- [ ] IPFS integration for large datasets
- [ ] Machine learning model marketplace
- [ ] Staking mechanisms for providers
- [ ] Advanced analytics dashboard

## ⚠️ Disclaimer

This is a prototype implementation for demonstration purposes. Additional security audits and testing would be required for production use.