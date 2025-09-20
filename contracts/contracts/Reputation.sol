// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title Reputation
 * @dev Contract for managing provider reputation scores
 */
contract Reputation is Ownable {
    using Counters for Counters.Counter;
    
    struct ProviderProfile {
        address provider;
        uint256 totalJobs;
        uint256 completedJobs;
        uint256 totalRating;
        uint256 ratingCount;
        bool isActive;
        uint256 registeredAt;
        string metadata; // IPFS hash for additional profile data
    }
    
    struct Rating {
        uint256 jobId;
        address client;
        address provider;
        uint8 score; // 1-5 scale
        string comment;
        uint256 timestamp;
    }
    
    mapping(address => ProviderProfile) public providers;
    mapping(uint256 => Rating) public ratings;
    mapping(uint256 => bool) public jobRated;
    mapping(address => bool) public isRegisteredProvider;
    
    address[] public providerList;
    Counters.Counter private _ratingIdCounter;
    
    uint256 public constant MIN_RATING = 1;
    uint256 public constant MAX_RATING = 5;
    uint256 public constant RATING_SCALE = 100; // For precision in calculations
    
    event ProviderRegistered(
        address indexed provider,
        string metadata
    );
    
    event ProviderUpdated(
        address indexed provider,
        string metadata
    );
    
    event JobCompleted(
        address indexed provider,
        uint256 indexed jobId
    );
    
    event ProviderRated(
        uint256 indexed ratingId,
        uint256 indexed jobId,
        address indexed provider,
        address client,
        uint8 score,
        string comment
    );
    
    event ProviderStatusChanged(
        address indexed provider,
        bool isActive
    );
    
    modifier onlyRegisteredProvider() {
        require(isRegisteredProvider[msg.sender], "Provider not registered");
        _;
    }
    
    modifier validRating(uint8 score) {
        require(score >= MIN_RATING && score <= MAX_RATING, "Invalid rating score");
        _;
    }
    
    /**
     * @dev Register as a compute provider
     */
    function registerProvider(string memory metadata) external {
        require(!isRegisteredProvider[msg.sender], "Provider already registered");
        require(bytes(metadata).length > 0, "Metadata cannot be empty");
        
        providers[msg.sender] = ProviderProfile({
            provider: msg.sender,
            totalJobs: 0,
            completedJobs: 0,
            totalRating: 0,
            ratingCount: 0,
            isActive: true,
            registeredAt: block.timestamp,
            metadata: metadata
        });
        
        isRegisteredProvider[msg.sender] = true;
        providerList.push(msg.sender);
        
        emit ProviderRegistered(msg.sender, metadata);
    }
    
    /**
     * @dev Update provider profile
     */
    function updateProvider(string memory metadata) external onlyRegisteredProvider {
        require(bytes(metadata).length > 0, "Metadata cannot be empty");
        
        providers[msg.sender].metadata = metadata;
        
        emit ProviderUpdated(msg.sender, metadata);
    }
    
    /**
     * @dev Record job assignment to provider
     */
    function recordJobAssignment(address provider, uint256 jobId) external onlyOwner {
        require(isRegisteredProvider[provider], "Provider not registered");
        
        providers[provider].totalJobs++;
    }
    
    /**
     * @dev Record job completion by provider
     */
    function recordJobCompletion(address provider, uint256 jobId) external onlyOwner {
        require(isRegisteredProvider[provider], "Provider not registered");
        
        providers[provider].completedJobs++;
        
        emit JobCompleted(provider, jobId);
    }
    
    /**
     * @dev Rate a provider after job completion
     */
    function rateProvider(
        uint256 jobId,
        address provider,
        uint8 score,
        string memory comment
    ) external validRating(score) {
        require(isRegisteredProvider[provider], "Provider not registered");
        require(!jobRated[jobId], "Job already rated");
        require(msg.sender != provider, "Providers cannot rate themselves");
        
        jobRated[jobId] = true;
        _ratingIdCounter.increment();
        uint256 ratingId = _ratingIdCounter.current();
        
        ratings[ratingId] = Rating({
            jobId: jobId,
            client: msg.sender,
            provider: provider,
            score: score,
            comment: comment,
            timestamp: block.timestamp
        });
        
        // Update provider rating
        providers[provider].totalRating += score * RATING_SCALE;
        providers[provider].ratingCount++;
        
        emit ProviderRated(ratingId, jobId, provider, msg.sender, score, comment);
    }
    
    /**
     * @dev Get provider reputation score (scaled by 100)
     */
    function getProviderScore(address provider) external view returns (uint256) {
        if (!isRegisteredProvider[provider] || providers[provider].ratingCount == 0) {
            return 0;
        }
        
        return providers[provider].totalRating / providers[provider].ratingCount;
    }
    
    /**
     * @dev Get provider average rating (1-5 scale)
     */
    function getProviderRating(address provider) external view returns (uint256) {
        if (!isRegisteredProvider[provider] || providers[provider].ratingCount == 0) {
            return 0;
        }
        
        return (providers[provider].totalRating / providers[provider].ratingCount) / RATING_SCALE;
    }
    
    /**
     * @dev Get provider completion rate (percentage scaled by 100)
     */
    function getCompletionRate(address provider) external view returns (uint256) {
        if (!isRegisteredProvider[provider] || providers[provider].totalJobs == 0) {
            return 0;
        }
        
        return (providers[provider].completedJobs * 10000) / providers[provider].totalJobs;
    }
    
    /**
     * @dev Get provider profile
     */
    function getProvider(address provider) external view returns (ProviderProfile memory) {
        require(isRegisteredProvider[provider], "Provider not registered");
        return providers[provider];
    }
    
    /**
     * @dev Get all registered providers
     */
    function getAllProviders() external view returns (address[] memory) {
        return providerList;
    }
    
    /**
     * @dev Get active providers only
     */
    function getActiveProviders() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // Count active providers
        for (uint256 i = 0; i < providerList.length; i++) {
            if (providers[providerList[i]].isActive) {
                activeCount++;
            }
        }
        
        // Create array of active providers
        address[] memory activeProviders = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < providerList.length; i++) {
            if (providers[providerList[i]].isActive) {
                activeProviders[index] = providerList[i];
                index++;
            }
        }
        
        return activeProviders;
    }
    
    /**
     * @dev Get top-rated providers (limit to top N)
     */
    function getTopProviders(uint256 limit) external view returns (address[] memory) {
        address[] memory activeProviders = this.getActiveProviders();
        
        if (activeProviders.length == 0) {
            return new address[](0);
        }
        
        uint256 resultLimit = limit > activeProviders.length ? activeProviders.length : limit;
        address[] memory topProviders = new address[](resultLimit);
        
        // Simple selection of top providers (could be optimized with sorting)
        for (uint256 i = 0; i < resultLimit; i++) {
            address bestProvider = activeProviders[0];
            uint256 bestScore = 0;
            uint256 bestIndex = 0;
            
            for (uint256 j = 0; j < activeProviders.length; j++) {
                if (activeProviders[j] != address(0)) {
                    uint256 score = this.getProviderScore(activeProviders[j]);
                    if (score > bestScore) {
                        bestScore = score;
                        bestProvider = activeProviders[j];
                        bestIndex = j;
                    }
                }
            }
            
            topProviders[i] = bestProvider;
            activeProviders[bestIndex] = address(0); // Remove from consideration
        }
        
        return topProviders;
    }
    
    /**
     * @dev Set provider active status (admin only)
     */
    function setProviderStatus(address provider, bool isActive) external onlyOwner {
        require(isRegisteredProvider[provider], "Provider not registered");
        
        providers[provider].isActive = isActive;
        
        emit ProviderStatusChanged(provider, isActive);
    }
    
    /**
     * @dev Get rating details
     */
    function getRating(uint256 ratingId) external view returns (Rating memory) {
        require(ratingId <= _ratingIdCounter.current(), "Rating does not exist");
        return ratings[ratingId];
    }
    
    /**
     * @dev Get total number of ratings
     */
    function getTotalRatings() external view returns (uint256) {
        return _ratingIdCounter.current();
    }
    
    /**
     * @dev Get provider statistics
     */
    function getProviderStats(address provider) external view returns (
        uint256 totalJobs,
        uint256 completedJobs,
        uint256 averageRating,
        uint256 completionRate,
        uint256 ratingCount
    ) {
        require(isRegisteredProvider[provider], "Provider not registered");
        
        ProviderProfile memory profile = providers[provider];
        
        return (
            profile.totalJobs,
            profile.completedJobs,
            profile.ratingCount > 0 ? (profile.totalRating / profile.ratingCount) / RATING_SCALE : 0,
            profile.totalJobs > 0 ? (profile.completedJobs * 10000) / profile.totalJobs : 0,
            profile.ratingCount
        );
    }
}