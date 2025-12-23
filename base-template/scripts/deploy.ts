import { ethers } from "hardhat";

/**
 * Deployment Script
 *
 * Deploys the contract to the configured network
 *
 * Usage:
 * npm run deploy:local      # Deploy to local network
 * npm run deploy:sepolia    # Deploy to Sepolia testnet
 */

async function main() {
  console.log("Deploying contracts...");

  // Get the contract factory
  const ExampleContract = await ethers.getContractFactory("ExampleContract");

  // Deploy the contract
  const contract = await ExampleContract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ Contract deployed to: ${address}`);

  // Print deployment info
  const network = await ethers.provider.getNetwork();
  console.log(`📍 Network: ${network.name} (ChainID: ${network.chainId})`);
  console.log(`💼 Deployer: ${(await ethers.getSigners())[0].address}`);

  return { address };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
