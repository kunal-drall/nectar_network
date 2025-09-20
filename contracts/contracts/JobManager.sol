// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title JobManager
 * @dev Contract for managing compute jobs on Nectar Network
 */
contract JobManager is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _jobIdCounter;
    
    enum JobStatus {
        Posted,
        Assigned,
        InProgress,
        Completed,
        Cancelled,
        Disputed
    }
    
    struct Job {
        uint256 id;
        address client;
        address provider;
        string title;
        string description;
        string requirements;
        uint256 reward;
        uint256 deadline;
        JobStatus status;
        string resultHash;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    mapping(uint256 => Job) public jobs;
    mapping(address => uint256[]) public clientJobs;
    mapping(address => uint256[]) public providerJobs;
    
    event JobPosted(
        uint256 indexed jobId,
        address indexed client,
        string title,
        uint256 reward,
        uint256 deadline
    );
    
    event JobAssigned(
        uint256 indexed jobId,
        address indexed provider
    );
    
    event JobStarted(
        uint256 indexed jobId
    );
    
    event JobCompleted(
        uint256 indexed jobId,
        string resultHash
    );
    
    event JobCancelled(
        uint256 indexed jobId
    );
    
    modifier onlyClient(uint256 jobId) {
        require(jobs[jobId].client == msg.sender, "Only client can perform this action");
        _;
    }
    
    modifier onlyProvider(uint256 jobId) {
        require(jobs[jobId].provider == msg.sender, "Only assigned provider can perform this action");
        _;
    }
    
    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].id != 0, "Job does not exist");
        _;
    }
    
    /**
     * @dev Post a new compute job
     */
    function postJob(
        string memory title,
        string memory description,
        string memory requirements,
        uint256 deadline
    ) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "Job reward must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(bytes(title).length > 0, "Title cannot be empty");
        
        _jobIdCounter.increment();
        uint256 jobId = _jobIdCounter.current();
        
        jobs[jobId] = Job({
            id: jobId,
            client: msg.sender,
            provider: address(0),
            title: title,
            description: description,
            requirements: requirements,
            reward: msg.value,
            deadline: deadline,
            status: JobStatus.Posted,
            resultHash: "",
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        clientJobs[msg.sender].push(jobId);
        
        emit JobPosted(jobId, msg.sender, title, msg.value, deadline);
        
        return jobId;
    }
    
    /**
     * @dev Assign a job to a provider
     */
    function assignJob(uint256 jobId, address provider) external onlyClient(jobId) jobExists(jobId) {
        require(jobs[jobId].status == JobStatus.Posted, "Job is not available for assignment");
        require(provider != address(0), "Invalid provider address");
        require(provider != jobs[jobId].client, "Client cannot be the provider");
        
        jobs[jobId].provider = provider;
        jobs[jobId].status = JobStatus.Assigned;
        
        providerJobs[provider].push(jobId);
        
        emit JobAssigned(jobId, provider);
    }
    
    /**
     * @dev Start working on an assigned job
     */
    function startJob(uint256 jobId) external onlyProvider(jobId) jobExists(jobId) {
        require(jobs[jobId].status == JobStatus.Assigned, "Job is not assigned");
        require(block.timestamp < jobs[jobId].deadline, "Job deadline has passed");
        
        jobs[jobId].status = JobStatus.InProgress;
        
        emit JobStarted(jobId);
    }
    
    /**
     * @dev Complete a job with results
     */
    function completeJob(uint256 jobId, string memory resultHash) external onlyProvider(jobId) jobExists(jobId) {
        require(jobs[jobId].status == JobStatus.InProgress, "Job is not in progress");
        require(bytes(resultHash).length > 0, "Result hash cannot be empty");
        
        jobs[jobId].status = JobStatus.Completed;
        jobs[jobId].resultHash = resultHash;
        jobs[jobId].completedAt = block.timestamp;
        
        emit JobCompleted(jobId, resultHash);
    }
    
    /**
     * @dev Cancel a job (only if not assigned or in progress)
     */
    function cancelJob(uint256 jobId) external onlyClient(jobId) jobExists(jobId) {
        require(
            jobs[jobId].status == JobStatus.Posted || jobs[jobId].status == JobStatus.Assigned,
            "Cannot cancel job in current status"
        );
        
        jobs[jobId].status = JobStatus.Cancelled;
        
        // Refund the client
        payable(jobs[jobId].client).transfer(jobs[jobId].reward);
        
        emit JobCancelled(jobId);
    }
    
    /**
     * @dev Get job details
     */
    function getJob(uint256 jobId) external view jobExists(jobId) returns (Job memory) {
        return jobs[jobId];
    }
    
    /**
     * @dev Get all jobs posted by a client
     */
    function getClientJobs(address client) external view returns (uint256[] memory) {
        return clientJobs[client];
    }
    
    /**
     * @dev Get all jobs assigned to a provider
     */
    function getProviderJobs(address provider) external view returns (uint256[] memory) {
        return providerJobs[provider];
    }
    
    /**
     * @dev Get total number of jobs
     */
    function getTotalJobs() external view returns (uint256) {
        return _jobIdCounter.current();
    }
    
    /**
     * @dev Get available jobs (posted status)
     */
    function getAvailableJobs() external view returns (uint256[] memory) {
        uint256 totalJobs = _jobIdCounter.current();
        uint256[] memory tempJobs = new uint256[](totalJobs);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= totalJobs; i++) {
            if (jobs[i].status == JobStatus.Posted) {
                tempJobs[count] = i;
                count++;
            }
        }
        
        uint256[] memory availableJobs = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            availableJobs[i] = tempJobs[i];
        }
        
        return availableJobs;
    }
}