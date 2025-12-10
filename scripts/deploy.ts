/**
 * Deploy Script
 *
 * Deploys ConfidentialRawMaterialsTrading contract to specified network
 * Usage: npx hardhat run scripts/deploy.ts --network sepolia
 */

import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying ConfidentialRawMaterialsTrading...\n");

  // Get deployer signer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(
    "Account balance:",
    ethers.utils.formatEther(balance),
    "ETH\n"
  );

  // Deploy contract
  console.log("Deploying contract...");
  const ContractFactory = await ethers.getContractFactory(
    "ConfidentialRawMaterialsTrading"
  );

  const contract = await ContractFactory.deploy();
  await contract.deployed();

  console.log("✓ Contract deployed to:", contract.address);
  console.log("✓ Owner:", await contract.owner());
  console.log(
    "✓ Deployment transaction hash:",
    contract.deployTransaction?.hash
  );

  // Verify deployment
  const code = await ethers.provider.getCode(contract.address);
  if (code === "0x") {
    throw new Error("Contract deployment failed - no code at address");
  }
  console.log("✓ Contract code verified\n");

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId,
    address: contract.address,
    deployer: deployer.address,
    owner: await contract.owner(),
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
  };

  console.log("📋 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Save to file
  const fs = require("fs");
  const deploymentPath = `./deployments/${network.name}.json`;
  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`✓ Saved to ${deploymentPath}\n`);

  // Export for frontend
  const abi = ContractFactory.interface.format("json");
  const abiPath = `./artifacts/abi.json`;
  fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
  console.log(`✓ Exported ABI to ${abiPath}\n`);

  console.log("✅ Deployment complete!");
  console.log("\nNext steps:");
  console.log(
    `1. Verify contract: npx hardhat verify --network ${network.name} ${contract.address}`
  );
  console.log(
    `2. Initialize: npx hardhat run scripts/initialize.ts --network ${network.name}`
  );
  console.log(
    `3. Update frontend with address: ${contract.address}`
  );

  return contract.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
