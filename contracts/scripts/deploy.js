const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy JobManager
  console.log("\nDeploying JobManager...");
  const JobManager = await hre.ethers.getContractFactory("JobManager");
  const jobManager = await JobManager.deploy();
  await jobManager.deployed();
  console.log("JobManager deployed to:", jobManager.address);

  // Deploy Reputation
  console.log("\nDeploying Reputation...");
  const Reputation = await hre.ethers.getContractFactory("Reputation");
  const reputation = await Reputation.deploy();
  await reputation.deployed();
  console.log("Reputation deployed to:", reputation.address);

  // Deploy Escrow with JobManager address and fee recipient
  console.log("\nDeploying Escrow...");
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(jobManager.address, deployer.address);
  await escrow.deployed();
  console.log("Escrow deployed to:", escrow.address);

  // Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    jobManager: jobManager.address,
    reputation: reputation.address,
    escrow: escrow.address,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`\nDeployment info saved to: ${deploymentFile}`);

  // Verify contracts on Avalanche testnet
  if (hre.network.name === "avalanche-testnet") {
    console.log("\nWaiting for block confirmations...");
    await jobManager.deployTransaction.wait(5);
    await reputation.deployTransaction.wait(5);
    await escrow.deployTransaction.wait(5);

    console.log("\nVerifying contracts...");
    try {
      await hre.run("verify:verify", {
        address: jobManager.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("JobManager verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: reputation.address,
        constructorArguments: [],
      });
    } catch (error) {
      console.log("Reputation verification failed:", error.message);
    }

    try {
      await hre.run("verify:verify", {
        address: escrow.address,
        constructorArguments: [jobManager.address, deployer.address],
      });
    } catch (error) {
      console.log("Escrow verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });