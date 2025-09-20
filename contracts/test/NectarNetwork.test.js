const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nectar Network Contracts", function () {
  let jobManager, escrow, reputation, mockUSDC;
  let owner, client, provider, feeRecipient;

  beforeEach(async function () {
    [owner, client, provider, feeRecipient] = await ethers.getSigners();

    // Deploy JobManager
    const JobManager = await ethers.getContractFactory("JobManager");
    jobManager = await JobManager.deploy();
    await jobManager.deployed();

    // Deploy Reputation
    const Reputation = await ethers.getContractFactory("Reputation");
    reputation = await Reputation.deploy();
    await reputation.deployed();

    // Deploy MockUSDC for testing
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();

    // Deploy Escrow with MockUSDC address
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(jobManager.address, feeRecipient.address, mockUSDC.address);
    await escrow.deployed();

    // Mint some USDC to client for testing
    await mockUSDC.mint(client.address, ethers.utils.parseUnits("1000", 6)); // 1000 USDC
  });

  describe("JobManager", function () {
    it("Should post a new job", async function () {
      const jobReward = ethers.utils.parseEther("1.0");
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const tx = await jobManager.connect(client).postJob(
        "Test Compute Job",
        "A test job for compute processing",
        "CPU: 2 cores, RAM: 4GB",
        deadline,
        { value: jobReward }
      );

      await expect(tx)
        .to.emit(jobManager, "JobPosted")
        .withArgs(1, client.address, "Test Compute Job", jobReward, deadline);

      const job = await jobManager.getJob(1);
      expect(job.title).to.equal("Test Compute Job");
      expect(job.client).to.equal(client.address);
      expect(job.reward).to.equal(jobReward);
    });

    it("Should assign job to provider", async function () {
      const jobReward = ethers.utils.parseEther("1.0");
      const deadline = Math.floor(Date.now() / 1000) + 86400;

      // Post job
      await jobManager.connect(client).postJob(
        "Test Job",
        "Description",
        "Requirements",
        deadline,
        { value: jobReward }
      );

      // Assign job
      await expect(jobManager.connect(client).assignJob(1, provider.address))
        .to.emit(jobManager, "JobAssigned")
        .withArgs(1, provider.address);

      const job = await jobManager.getJob(1);
      expect(job.provider).to.equal(provider.address);
      expect(job.status).to.equal(1); // Assigned status
    });

    it("Should complete job workflow", async function () {
      const jobReward = ethers.utils.parseEther("1.0");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      const resultHash = "QmTestResultHash123";

      // Post job
      await jobManager.connect(client).postJob(
        "Test Job",
        "Description",
        "Requirements",
        deadline,
        { value: jobReward }
      );

      // Assign job
      await jobManager.connect(client).assignJob(1, provider.address);

      // Start job
      await expect(jobManager.connect(provider).startJob(1))
        .to.emit(jobManager, "JobStarted")
        .withArgs(1);

      // Complete job
      await expect(jobManager.connect(provider).completeJob(1, resultHash))
        .to.emit(jobManager, "JobCompleted")
        .withArgs(1, resultHash);

      const job = await jobManager.getJob(1);
      expect(job.status).to.equal(3); // Completed status
      expect(job.resultHash).to.equal(resultHash);
    });
  });

  describe("Reputation", function () {
    beforeEach(async function () {
      // Register provider
      await reputation.connect(provider).registerProvider("ipfs://provider-metadata");
    });

    it("Should register a provider", async function () {
      const providerProfile = await reputation.getProvider(provider.address);
      expect(providerProfile.provider).to.equal(provider.address);
      expect(providerProfile.isActive).to.be.true;
      expect(providerProfile.metadata).to.equal("ipfs://provider-metadata");
    });

    it("Should rate a provider", async function () {
      const jobId = 1;
      const score = 5;
      const comment = "Excellent work!";

      await expect(reputation.connect(client).rateProvider(jobId, provider.address, score, comment))
        .to.emit(reputation, "ProviderRated")
        .withArgs(1, jobId, provider.address, client.address, score, comment);

      const rating = await reputation.getProviderRating(provider.address);
      expect(rating).to.equal(5);
    });
  });

  describe("Escrow", function () {
    it("Should create escrow with ETH", async function () {
      const amount = ethers.utils.parseEther("1.0");

      await expect(escrow.createEscrow(1, client.address, provider.address, { value: amount }))
        .to.emit(escrow, "EscrowCreated")
        .withArgs(1, client.address, provider.address, amount);

      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.amount).to.equal(amount);
      expect(escrowData.client).to.equal(client.address);
      expect(escrowData.provider).to.equal(provider.address);
      expect(escrowData.token).to.equal("0x0000000000000000000000000000000000000000"); // ETH
    });

    it("Should create escrow with USDC", async function () {
      const amount = ethers.utils.parseUnits("100", 6); // 100 USDC

      // Approve escrow contract to spend USDC
      await mockUSDC.connect(client).approve(escrow.address, amount);

      await expect(escrow.connect(client).createEscrowUSDC(2, client.address, provider.address, amount))
        .to.emit(escrow, "EscrowCreated")
        .withArgs(2, client.address, provider.address, amount);

      const escrowData = await escrow.getEscrow(2);
      expect(escrowData.amount).to.equal(amount);
      expect(escrowData.client).to.equal(client.address);
      expect(escrowData.provider).to.equal(provider.address);
      expect(escrowData.token).to.equal(mockUSDC.address); // USDC token
    });

    it("Should update USDC token address", async function () {
      const newUSDCAddress = "0x1234567890123456789012345678901234567890";
      
      await expect(escrow.updateUSDCToken(newUSDCAddress))
        .to.not.be.reverted;
      
      expect(await escrow.usdcToken()).to.equal(newUSDCAddress);
    });

    it("Should not allow non-owner to update USDC token", async function () {
      const newUSDCAddress = "0x1234567890123456789012345678901234567890";
      
      await expect(escrow.connect(client).updateUSDCToken(newUSDCAddress))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should release USDC payment to provider", async function () {
      const amount = ethers.utils.parseUnits("100", 6); // 100 USDC
      const jobId = 3;

      // Create and complete a job
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await jobManager.connect(client).postJob("Test Job", "Description", "Requirements", deadline, { value: ethers.utils.parseEther("1") });
      await jobManager.connect(client).assignJob(1, provider.address);
      await jobManager.connect(provider).startJob(1);
      await jobManager.connect(provider).completeJob(1, "result-hash");

      // Create USDC escrow
      await mockUSDC.connect(client).approve(escrow.address, amount);
      await escrow.connect(client).createEscrowUSDC(1, client.address, provider.address, amount);

      // Check initial balances
      const initialProviderBalance = await mockUSDC.balanceOf(provider.address);
      const initialFeeRecipientBalance = await mockUSDC.balanceOf(feeRecipient.address);

      // Release payment
      await expect(escrow.connect(client).releasePayment(1))
        .to.emit(escrow, "PaymentReleased");

      // Check balances after release
      const finalProviderBalance = await mockUSDC.balanceOf(provider.address);
      const finalFeeRecipientBalance = await mockUSDC.balanceOf(feeRecipient.address);

      // Calculate expected amounts (2.5% platform fee)
      const platformFee = amount.mul(250).div(10000);
      const providerPayment = amount.sub(platformFee);

      expect(finalProviderBalance.sub(initialProviderBalance)).to.equal(providerPayment);
      expect(finalFeeRecipientBalance.sub(initialFeeRecipientBalance)).to.equal(platformFee);
    });
  });

  describe("Full Workflow Integration", function () {
    it("Should complete full job workflow with USDC payment", async function () {
      const amount = ethers.utils.parseUnits("100", 6); // 100 USDC
      const deadline = Math.floor(Date.now() / 1000) + 86400;

      // 1. Register provider in reputation system
      await reputation.connect(provider).registerProvider("ipfs://provider-metadata");

      // 2. Post job with ETH (for simplicity in this test)
      await jobManager.connect(client).postJob(
        "Test Compute Job",
        "Process data using GPU",
        "GPU: RTX 4090, RAM: 32GB",
        deadline,
        { value: ethers.utils.parseEther("0.1") }
      );

      // 3. Assign job to provider
      await jobManager.connect(client).assignJob(1, provider.address);

      // 4. Create USDC escrow for the job
      await mockUSDC.connect(client).approve(escrow.address, amount);
      await escrow.connect(client).createEscrowUSDC(1, client.address, provider.address, amount);

      // 5. Provider starts job
      await jobManager.connect(provider).startJob(1);

      // 6. Provider completes job
      await jobManager.connect(provider).completeJob(1, "QmResultHash123");

      // 7. Client releases payment
      const initialProviderBalance = await mockUSDC.balanceOf(provider.address);
      await escrow.connect(client).releasePayment(1);
      const finalProviderBalance = await mockUSDC.balanceOf(provider.address);

      // 8. Rate the provider
      await reputation.connect(client).rateProvider(1, provider.address, 5, "Excellent work!");

      // Verify job is completed
      const job = await jobManager.getJob(1);
      expect(job.status).to.equal(3); // Completed

      // Verify payment was released
      const expectedPayment = amount.sub(amount.mul(250).div(10000)); // minus 2.5% fee
      expect(finalProviderBalance.sub(initialProviderBalance)).to.equal(expectedPayment);

      // Verify provider rating
      const rating = await reputation.getProviderRating(provider.address);
      expect(rating).to.equal(5);

      // Verify escrow is marked as released
      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.released).to.be.true;
      expect(escrowData.token).to.equal(mockUSDC.address);
    });
  });
});