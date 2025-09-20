const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Nectar Network Contracts", function () {
  let jobManager, escrow, reputation;
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

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(jobManager.address, feeRecipient.address);
    await escrow.deployed();
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
    it("Should create escrow", async function () {
      const amount = ethers.utils.parseEther("1.0");

      await expect(escrow.createEscrow(1, client.address, provider.address, { value: amount }))
        .to.emit(escrow, "EscrowCreated")
        .withArgs(1, client.address, provider.address, amount);

      const escrowData = await escrow.getEscrow(1);
      expect(escrowData.amount).to.equal(amount);
      expect(escrowData.client).to.equal(client.address);
      expect(escrowData.provider).to.equal(provider.address);
    });
  });
});