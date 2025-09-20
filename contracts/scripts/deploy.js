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

  // Deploy Escrow with JobManager address, fee recipient, and USDC token
  console.log("\nDeploying Escrow...");
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  
  // Use USDC token address for Avalanche network
  // Avalanche Mainnet USDC: 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E
  // Avalanche Testnet USDC: 0x5425890298aed601595a70AB815c96711a31Bc65
  let usdcAddress;
  if (hre.network.name === "avalanche-mainnet") {
    usdcAddress = "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"; // USDC on Avalanche
  } else if (hre.network.name === "avalanche-testnet") {
    usdcAddress = "0x5425890298aed601595a70AB815c96711a31Bc65"; // USDC on Avalanche Fuji
  } else {
    // For local testing, deploy a mock USDC or use zero address
    usdcAddress = "0x0000000000000000000000000000000000000000";
  }
  
  const escrow = await Escrow.deploy(jobManager.address, deployer.address, usdcAddress);
  await escrow.deployed();
  console.log("Escrow deployed to:", escrow.address);
  console.log("USDC token address configured:", usdcAddress);

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
        constructorArguments: [jobManager.address, deployer.address, usdcAddress],
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