# Nectar Network Dispatcher Service

A Node.js-based dispatcher service that acts as the central coordinator for the Nectar Network decentralized job platform. It listens to Avalanche JobManager contract events using ethers.js and automatically assigns jobs to available providers via REST API.

## Features

### ✅ Core Functionality
- **Express.js Framework**: RESTful API server with comprehensive middleware
- **Blockchain Integration**: Listens to Avalanche JobManager contract events using ethers.js
- **Automatic Job Assignment**: Assigns jobs to available providers when JobPosted events are detected
- **WebSocket Server**: Real-time updates for frontend applications
- **Job Queue Management**: In-memory job queue with status tracking
- **Provider Management**: Heartbeat tracking and provider status management
- **Comprehensive Logging**: Detailed logging throughout the application
- **Graceful Error Handling**: Resilient operation even without blockchain connectivity

### 🔧 Technical Features
- **TypeScript**: Fully typed codebase for better maintainability
- **Service Injection**: Clean dependency injection pattern for services
- **Environment Configuration**: Configurable via environment variables
- **Health Monitoring**: Health check endpoints for system monitoring
- **CORS Support**: Cross-origin requests enabled for frontend integration

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Dispatcher    │    │   Blockchain    │
│                 │◄──►│     Service      │◄──►│    Network      │
│  (WebSocket)    │    │                  │    │  (Avalanche)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌──────────────────┐
                       │   Provider       │
                       │     Nodes        │
                       │  (REST API)      │
                       └──────────────────┘
```

## API Endpoints

### Health & Status
- `GET /health` - Service health check

### Jobs Management
- `GET /api/jobs` - Get all jobs (supports filtering by status and provider)
- `GET /api/jobs/:id` - Get specific job by ID
- `POST /api/jobs/:id/assign` - Force assign job to provider (admin)
- `GET /api/jobs/status/queue` - Get job queue status
- `GET /api/jobs/stats/overview` - Get job statistics

### Provider Management
- `GET /api/providers` - Get all providers (supports filtering by status and capability)
- `GET /api/providers/:address` - Get specific provider details
- `POST /api/providers/:address/heartbeat` - Update provider heartbeat
- `PUT /api/providers/:address/capabilities` - Update provider capabilities
- `PUT /api/providers/:address/status` - Update provider online/offline status
- `GET /api/providers/stats/overview` - Get provider statistics
- `GET /api/providers/top/:limit?` - Get top providers by rating
- `GET /api/providers/:address/jobs` - Get jobs assigned to provider
- `POST /api/providers/find-best` - Find best provider for job requirements

## WebSocket Events

### Client → Server
```json
{
  "type": "subscribe_job_updates"
}
```

### Server → Client
```json
{
  "type": "job_posted",
  "data": {
    "jobId": "1",
    "client": "0x...",
    "title": "Data Processing Task",
    "reward": "0.5",
    "deadline": "1640995200",
    "blockNumber": 12345,
    "transactionHash": "0x..."
  }
}
```

```json
{
  "type": "job_assigned",
  "data": {
    "jobId": "1",
    "provider": "0x...",
    "blockNumber": 12346,
    "transactionHash": "0x..."
  }
}
```

## Environment Variables

```bash
# Blockchain Configuration
RPC_URL=http://localhost:8545
JOB_MANAGER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ESCROW_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
REPUTATION_ADDRESS=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Access to Avalanche network (local or testnet)
- Deployed JobManager, Escrow, and Reputation contracts

### Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp ../env.example .env
   # Edit .env with your configuration
   ```

3. **Build the service**:
   ```bash
   npm run build
   ```

4. **Start in development mode**:
   ```bash
   npm run dev
   ```

5. **Start in production**:
   ```bash
   npm start
   ```

### Development Commands

```bash
npm run dev      # Start with hot reload
npm run build    # Build TypeScript
npm start        # Start production build
npm run lint     # Lint code
npm test         # Run tests
```

## Service Components

### ContractEventListener
- Connects to Avalanche network using ethers.js
- Listens for JobManager, Escrow, and Reputation contract events
- Handles network connectivity issues gracefully
- Broadcasts events via WebSocket

### JobDispatchService
- Manages job queue using in-memory Map
- Handles job assignment logic
- Tracks job lifecycle (posted → assigned → completed)
- Integrates with ProviderManager for assignment decisions

### ProviderManager
- Maintains provider registry and status
- Tracks provider capabilities and availability
- Manages heartbeat system for online/offline status
- Provides provider selection algorithms

## Fault Tolerance

The dispatcher service is designed to be resilient:

- **Network Failures**: Continues operation without blockchain connectivity
- **Service Degradation**: REST API remains functional even if WebSocket fails
- **Graceful Shutdown**: Handles SIGTERM/SIGINT for clean shutdowns
- **Error Recovery**: Comprehensive error handling with detailed logging

## Monitoring & Observability

### Health Checks
```bash
curl http://localhost:3001/health
```

### Queue Status
```bash
curl http://localhost:3001/api/jobs/status/queue
```

### Provider Statistics
```bash
curl http://localhost:3001/api/providers/stats/overview
```

## Security Considerations

- **CORS Configuration**: Restricted to configured frontend URL
- **Input Validation**: All API inputs are validated
- **Error Handling**: Errors don't expose sensitive information
- **Rate Limiting**: Consider implementing rate limiting for production

## Contributing

1. Follow TypeScript best practices
2. Maintain test coverage
3. Update documentation for API changes
4. Use conventional commit messages

## License

MIT License - see LICENSE file for details.