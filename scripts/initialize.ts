/**
 * Initialize Script
 *
 * Initializes the contract after deployment by setting up:
 * - Supplier verification
 * - Buyer verification
 * - Test data setup
 *
 * Usage: npx hardhat run scripts/initialize.ts --network sepolia
 */

import { ethers } from "hardhat";

async function main() {
  console.log("⚙️ Initializing ConfidentialRawMaterialsTrading...\n");

  const [owner, supplier1, supplier2, buyer1, buyer2] =
    await ethers.getSigners();

  // Get deployed contract
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error(
      "CONTRACT_ADDRESS not set in environment. Deploy first!"
    );
  }

  const contract = await ethers.getContractAt(
    "ConfidentialRawMaterialsTrading",
    contractAddress
  );

  console.log("Contract:", contractAddress);
  console.log("Owner:", owner.address);
  console.log("Supplier 1:", supplier1.address);
  console.log("Supplier 2:", supplier2.address);
  console.log("Buyer 1:", buyer1.address);
  console.log("Buyer 2:", buyer2.address);
  console.log();

  // Verify suppliers
  console.log("📌 Verifying suppliers...");
  let tx = await contract.connect(owner).verifySupplier(supplier1.address);
  await tx.wait();
  console.log("✓ Supplier 1 verified");

  tx = await contract.connect(owner).verifySupplier(supplier2.address);
  await tx.wait();
  console.log("✓ Supplier 2 verified");

  // Verify buyers
  console.log("\n📌 Verifying buyers...");
  tx = await contract.connect(owner).verifyBuyer(buyer1.address);
  await tx.wait();
  console.log("✓ Buyer 1 verified");

  tx = await contract.connect(owner).verifyBuyer(buyer2.address);
  await tx.wait();
  console.log("✓ Buyer 2 verified");

  // Check verification status
  console.log("\n✅ Verification status:");
  const isSupplier1 = await contract.verifiedSuppliers(supplier1.address);
  const isSupplier2 = await contract.verifiedSuppliers(supplier2.address);
  const isBuyer1 = await contract.verifiedBuyers(buyer1.address);
  const isBuyer2 = await contract.verifiedBuyers(buyer2.address);

  console.log("Supplier 1 verified:", isSupplier1);
  console.log("Supplier 2 verified:", isSupplier2);
  console.log("Buyer 1 verified:", isBuyer1);
  console.log("Buyer 2 verified:", isBuyer2);

  // Setup test data (optional)
  console.log("\n📦 Adding test materials...");

  try {
    // Add material from supplier 1
    tx = await contract.connect(supplier1).listMaterial(
      "Steel Coils",
      0, // METALS
      1000, // quantity
      50000n, // price per unit ($500)
      100, // min order
      "A1", // quality grade
      14 // delivery timeframe in days
    );
    await tx.wait();
    console.log("✓ Added: Steel Coils");

    // Add material from supplier 2
    tx = await contract.connect(supplier2).listMaterial(
      "Copper Sheets",
      0, // METALS
      500, // quantity
      75000n, // price per unit ($750)
      50, // min order
      "AAA", // quality grade
      10 // delivery timeframe
    );
    await tx.wait();
    console.log("✓ Added: Copper Sheets");

    // Add chemical material
    tx = await contract.connect(supplier1).listMaterial(
      "Industrial Polymer",
      1, // CHEMICALS
      2000, // quantity
      25000n, // price per unit ($250)
      200, // min order
      "B2", // quality grade
      21 // delivery timeframe
    );
    await tx.wait();
    console.log("✓ Added: Industrial Polymer");

    // Get materials by category
    console.log("\n📊 Materials by category:");
    const metalMaterials = await contract.getMaterialsByCategory(0); // METALS
    console.log("Metals:", metalMaterials.length, "materials");

    const chemMaterials = await contract.getMaterialsByCategory(1); // CHEMICALS
    console.log("Chemicals:", chemMaterials.length, "materials");

    console.log("\n✅ Initialization complete!");
    console.log("\nDeployed Materials:");
    for (const materialId of metalMaterials) {
      const info = await contract.getMaterialInfo(materialId);
      console.log(`  - ID ${materialId}: ${info.name}`);
    }
    for (const materialId of chemMaterials) {
      const info = await contract.getMaterialInfo(materialId);
      console.log(`  - ID ${materialId}: ${info.name}`);
    }
  } catch (error) {
    console.log("\n⚠️ Note: Could not add test materials");
    console.log(
      "This might be expected if not all signers are verified.\n"
    );
  }

  console.log("\n✨ Contract is ready for testing!");
  console.log(
    "Next: Run 'npm test' to verify contract functionality"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
