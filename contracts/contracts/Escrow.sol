// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IJobManager {
    function getJob(uint256 jobId) external view returns (
        uint256 id,
        address client,
        address provider,
        string memory title,
        string memory description,
        string memory requirements,
        uint256 reward,
        uint256 deadline,
        uint8 status,
        string memory resultHash,
        uint256 createdAt,
        uint256 completedAt
    );
}

/**
 * @title Escrow
 * @dev Contract for handling escrow payments for compute jobs
 */
contract Escrow is ReentrancyGuard, Ownable {
    
    IJobManager public jobManager;
    
    enum DisputeStatus {
        None,
        Raised,
        InReview,
        Resolved
    }
    
    struct EscrowData {
        uint256 jobId;
        address client;
        address provider;
        uint256 amount;
        bool released;
        bool refunded;
        DisputeStatus disputeStatus;
        uint256 disputeRaisedAt;
        string disputeReason;
    }
    
    mapping(uint256 => EscrowData) public escrows;
    mapping(uint256 => bool) public escrowExists;
    
    uint256 public constant DISPUTE_PERIOD = 7 days;
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public constant MAX_FEE_PERCENTAGE = 1000; // 10%
    
    address public feeRecipient;
    
    event EscrowCreated(
        uint256 indexed jobId,
        address indexed client,
        address indexed provider,
        uint256 amount
    );
    
    event PaymentReleased(
        uint256 indexed jobId,
        address indexed provider,
        uint256 amount,
        uint256 platformFee
    );
    
    event PaymentRefunded(
        uint256 indexed jobId,
        address indexed client,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed jobId,
        address indexed raiser,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed jobId,
        bool favorClient
    );
    
    modifier onlyJobParticipant(uint256 jobId) {
        require(
            msg.sender == escrows[jobId].client || msg.sender == escrows[jobId].provider,
            "Only job participants can perform this action"
        );
        _;
    }
    
    modifier escrowExistsModifier(uint256 jobId) {
        require(escrowExists[jobId], "Escrow does not exist for this job");
        _;
    }
    
    constructor(address _jobManager, address _feeRecipient) {
        jobManager = IJobManager(_jobManager);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Create escrow for a job
     */
    function createEscrow(
        uint256 jobId,
        address client,
        address provider
    ) external payable nonReentrant {
        require(!escrowExists[jobId], "Escrow already exists for this job");
        require(msg.value > 0, "Escrow amount must be greater than 0");
        require(client != address(0) && provider != address(0), "Invalid addresses");
        
        escrows[jobId] = EscrowData({
            jobId: jobId,
            client: client,
            provider: provider,
            amount: msg.value,
            released: false,
            refunded: false,
            disputeStatus: DisputeStatus.None,
            disputeRaisedAt: 0,
            disputeReason: ""
        });
        
        escrowExists[jobId] = true;
        
        emit EscrowCreated(jobId, client, provider, msg.value);
    }
    
    /**
     * @dev Release payment to provider after job completion
     */
    function releasePayment(uint256 jobId) external nonReentrant escrowExistsModifier(jobId) {
        EscrowData storage escrow = escrows[jobId];
        require(!escrow.released && !escrow.refunded, "Payment already processed");
        require(msg.sender == escrow.client, "Only client can release payment");
        
        // Check if job is completed
        (, , , , , , , , uint8 status, , , ) = jobManager.getJob(jobId);
        require(status == 3, "Job must be completed"); // 3 = Completed status
        
        // Check if dispute period has passed or no dispute raised
        require(
            escrow.disputeStatus == DisputeStatus.None ||
            (escrow.disputeStatus == DisputeStatus.Raised && 
             block.timestamp > escrow.disputeRaisedAt + DISPUTE_PERIOD),
            "Cannot release during active dispute period"
        );
        
        escrow.released = true;
        
        uint256 platformFee = (escrow.amount * platformFeePercentage) / 10000;
        uint256 providerPayment = escrow.amount - platformFee;
        
        payable(escrow.provider).transfer(providerPayment);
        payable(feeRecipient).transfer(platformFee);
        
        emit PaymentReleased(jobId, escrow.provider, providerPayment, platformFee);
    }
    
    /**
     * @dev Auto release payment after completion and dispute period
     */
    function autoReleasePayment(uint256 jobId) external nonReentrant escrowExistsModifier(jobId) {
        EscrowData storage escrow = escrows[jobId];
        require(!escrow.released && !escrow.refunded, "Payment already processed");
        
        // Check if job is completed
        (, , , , , , , , uint8 status, , , uint256 completedAt) = jobManager.getJob(jobId);
        require(status == 3, "Job must be completed"); // 3 = Completed status
        require(completedAt > 0, "Job completion time not recorded");
        
        // Check if dispute period has passed without dispute
        require(
            escrow.disputeStatus == DisputeStatus.None &&
            block.timestamp > completedAt + DISPUTE_PERIOD,
            "Dispute period has not passed or dispute exists"
        );
        
        escrow.released = true;
        
        uint256 platformFee = (escrow.amount * platformFeePercentage) / 10000;
        uint256 providerPayment = escrow.amount - platformFee;
        
        payable(escrow.provider).transfer(providerPayment);
        payable(feeRecipient).transfer(platformFee);
        
        emit PaymentReleased(jobId, escrow.provider, providerPayment, platformFee);
    }
    
    /**
     * @dev Refund payment to client
     */
    function refundPayment(uint256 jobId) external nonReentrant escrowExistsModifier(jobId) onlyOwner {
        EscrowData storage escrow = escrows[jobId];
        require(!escrow.released && !escrow.refunded, "Payment already processed");
        
        escrow.refunded = true;
        
        payable(escrow.client).transfer(escrow.amount);
        
        emit PaymentRefunded(jobId, escrow.client, escrow.amount);
    }
    
    /**
     * @dev Raise a dispute
     */
    function raiseDispute(uint256 jobId, string memory reason) external escrowExistsModifier(jobId) onlyJobParticipant(jobId) {
        EscrowData storage escrow = escrows[jobId];
        require(escrow.disputeStatus == DisputeStatus.None, "Dispute already exists");
        require(!escrow.released && !escrow.refunded, "Payment already processed");
        require(bytes(reason).length > 0, "Dispute reason cannot be empty");
        
        escrow.disputeStatus = DisputeStatus.Raised;
        escrow.disputeRaisedAt = block.timestamp;
        escrow.disputeReason = reason;
        
        emit DisputeRaised(jobId, msg.sender, reason);
    }
    
    /**
     * @dev Resolve dispute (admin only)
     */
    function resolveDispute(uint256 jobId, bool favorClient) external onlyOwner escrowExistsModifier(jobId) {
        EscrowData storage escrow = escrows[jobId];
        require(escrow.disputeStatus == DisputeStatus.Raised, "No active dispute");
        require(!escrow.released && !escrow.refunded, "Payment already processed");
        
        escrow.disputeStatus = DisputeStatus.Resolved;
        
        if (favorClient) {
            escrow.refunded = true;
            payable(escrow.client).transfer(escrow.amount);
            emit PaymentRefunded(jobId, escrow.client, escrow.amount);
        } else {
            escrow.released = true;
            uint256 platformFee = (escrow.amount * platformFeePercentage) / 10000;
            uint256 providerPayment = escrow.amount - platformFee;
            
            payable(escrow.provider).transfer(providerPayment);
            payable(feeRecipient).transfer(platformFee);
            emit PaymentReleased(jobId, escrow.provider, providerPayment, platformFee);
        }
        
        emit DisputeResolved(jobId, favorClient);
    }
    
    /**
     * @dev Get escrow details
     */
    function getEscrow(uint256 jobId) external view escrowExistsModifier(jobId) returns (EscrowData memory) {
        return escrows[jobId];
    }
    
    /**
     * @dev Update platform fee (admin only)
     */
    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= MAX_FEE_PERCENTAGE, "Fee percentage too high");
        platformFeePercentage = newFeePercentage;
    }
    
    /**
     * @dev Update fee recipient (admin only)
     */
    function updateFeeRecipient(address newFeeRecipient) external onlyOwner {
        require(newFeeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = newFeeRecipient;
    }
}