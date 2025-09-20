export const JOB_MANAGER_ABI = [
  "function postJob(string title, string description, string requirements, uint256 deadline) external payable returns (uint256)",
  "function assignJob(uint256 jobId, address provider) external",
  "function startJob(uint256 jobId) external",
  "function completeJob(uint256 jobId, string resultHash) external",
  "function cancelJob(uint256 jobId) external",
  "function getJob(uint256 jobId) external view returns (tuple(uint256 id, address client, address provider, string title, string description, string requirements, uint256 reward, uint256 deadline, uint8 status, string resultHash, uint256 createdAt, uint256 completedAt))",
  "function getClientJobs(address client) external view returns (uint256[])",
  "function getProviderJobs(address provider) external view returns (uint256[])",
  "function getAvailableJobs() external view returns (uint256[])",
  "function getTotalJobs() external view returns (uint256)",
  "event JobPosted(uint256 indexed jobId, address indexed client, string title, uint256 reward, uint256 deadline)",
  "event JobAssigned(uint256 indexed jobId, address indexed provider)",
  "event JobStarted(uint256 indexed jobId)",
  "event JobCompleted(uint256 indexed jobId, string resultHash)",
  "event JobCancelled(uint256 indexed jobId)"
];

export const ESCROW_ABI = [
  "function createEscrow(uint256 jobId, address client, address provider) external payable",
  "function createEscrowUSDC(uint256 jobId, address client, address provider, uint256 amount) external",
  "function releasePayment(uint256 jobId) external",
  "function autoReleasePayment(uint256 jobId) external",
  "function refundPayment(uint256 jobId) external",
  "function raiseDispute(uint256 jobId, string reason) external",
  "function getEscrow(uint256 jobId) external view returns (tuple(uint256 jobId, address client, address provider, uint256 amount, bool released, bool refunded, uint8 disputeStatus, uint256 disputeRaisedAt, string disputeReason, address token))",
  "function updateUSDCToken(address newUSDCToken) external",
  "function usdcToken() external view returns (address)",
  "event EscrowCreated(uint256 indexed jobId, address indexed client, address indexed provider, uint256 amount)",
  "event PaymentReleased(uint256 indexed jobId, address indexed provider, uint256 amount, uint256 platformFee)",
  "event PaymentRefunded(uint256 indexed jobId, address indexed client, uint256 amount)"
];

export const REPUTATION_ABI = [
  "function registerProvider(string metadata) external",
  "function updateProvider(string metadata) external",
  "function rateProvider(uint256 jobId, address provider, uint8 score, string comment) external",
  "function getProvider(address provider) external view returns (tuple(address provider, uint256 totalJobs, uint256 completedJobs, uint256 totalRating, uint256 ratingCount, bool isActive, uint256 registeredAt, string metadata))",
  "function getProviderScore(address provider) external view returns (uint256)",
  "function getProviderRating(address provider) external view returns (uint256)",
  "function getCompletionRate(address provider) external view returns (uint256)",
  "function getAllProviders() external view returns (address[])",
  "function getActiveProviders() external view returns (address[])",
  "function getTopProviders(uint256 limit) external view returns (address[])",
  "function getProviderStats(address provider) external view returns (uint256, uint256, uint256, uint256, uint256)",
  "event ProviderRegistered(address indexed provider, string metadata)",
  "event ProviderRated(uint256 indexed ratingId, uint256 indexed jobId, address indexed provider, address client, uint8 score, string comment)"
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];