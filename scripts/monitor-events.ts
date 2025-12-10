/**
 * Monitor Events Script
 *
 * Listens for contract events in real-time
 * Usage: npx hardhat run scripts/monitor-events.ts --network sepolia
 */

import { ethers } from "hardhat";

async function main() {
  console.log("👂 Listening for contract events...\n");

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

  // Counters for events
  let eventCount = 0;
  const startTime = new Date();

  // Listen for MaterialListed
  contract.on("MaterialListed", (materialId, supplier, category, event) => {
    eventCount++;
    const categoryNames = [
      "METALS",
      "CHEMICALS",
      "ENERGY",
      "AGRICULTURAL",
      "TEXTILES",
      "MINERALS",
    ];
    console.log(`
┌─ EVENT #${eventCount}: MaterialListed
├─ Material ID: ${materialId}
├─ Supplier: ${supplier.substring(0, 10)}...
├─ Category: ${categoryNames[category] || "Unknown"}
├─ Block: ${event.blockNumber}
└─ Tx Hash: ${event.transactionHash.substring(0, 20)}...
    `);
  });

  // Listen for OrderPlaced
  contract.on("OrderPlaced", (orderId, buyer, materialId, event) => {
    eventCount++;
    console.log(`
┌─ EVENT #${eventCount}: OrderPlaced
├─ Order ID: ${orderId}
├─ Buyer: ${buyer.substring(0, 10)}...
├─ Material ID: ${materialId}
├─ Block: ${event.blockNumber}
└─ Tx Hash: ${event.transactionHash.substring(0, 20)}...
    `);
  });

  // Listen for TradeMatched
  contract.on("TradeMatched", (orderId, materialId, buyer, supplier, event) => {
    eventCount++;
    console.log(`
┌─ EVENT #${eventCount}: TradeMatched
├─ Order ID: ${orderId}
├─ Material ID: ${materialId}
├─ Buyer: ${buyer.substring(0, 10)}...
├─ Supplier: ${supplier.substring(0, 10)}...
├─ Block: ${event.blockNumber}
└─ Tx Hash: ${event.transactionHash.substring(0, 20)}...
    `);
  });

  // Listen for TradeCompleted
  contract.on("TradeCompleted", (orderId, materialId, event) => {
    eventCount++;
    console.log(`
┌─ EVENT #${eventCount}: TradeCompleted
├─ Order ID: ${orderId}
├─ Material ID: ${materialId}
├─ Block: ${event.blockNumber}
└─ Tx Hash: ${event.transactionHash.substring(0, 20)}...
    `);
  });

  // Listen for SupplierVerified
  contract.on("SupplierVerified", (supplier, event) => {
    eventCount++;
    console.log(`
┌─ EVENT #${eventCount}: SupplierVerified
├─ Supplier: ${supplier.substring(0, 10)}...
├─ Block: ${event.blockNumber}
└─ Tx Hash: ${event.transactionHash.substring(0, 20)}...
    `);
  });

  // Listen for BuyerVerified
  contract.on("BuyerVerified", (buyer, event) => {
    eventCount++;
    console.log(`
┌─ EVENT #${eventCount}: BuyerVerified
├─ Buyer: ${buyer.substring(0, 10)}...
├─ Block: ${event.blockNumber}
└─ Tx Hash: ${event.transactionHash.substring(0, 20)}...
    `);
  });

  // Display monitoring info
  console.log("═══════════════════════════════════════");
  console.log("CONTRACT EVENT MONITOR");
  console.log("═══════════════════════════════════════");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Started: ${startTime.toISOString()}`);
  console.log("═══════════════════════════════════════");
  console.log("Monitoring events:");
  console.log("  - MaterialListed");
  console.log("  - OrderPlaced");
  console.log("  - TradeMatched");
  console.log("  - TradeCompleted");
  console.log("  - SupplierVerified");
  console.log("  - BuyerVerified");
  console.log("═══════════════════════════════════════\n");
  console.log("Press Ctrl+C to stop monitoring\n");

  // Periodic status
  let lastCount = 0;
  const statusInterval = setInterval(() => {
    const elapsed = Math.floor(
      (new Date().getTime() - startTime.getTime()) / 1000
    );
    const newEvents = eventCount - lastCount;
    console.log(
      `⏱️  [${elapsed}s] Events: ${eventCount} | New: ${newEvents} | Rate: ${(newEvents / 60).toFixed(2)}/min`
    );
    lastCount = eventCount;
  }, 60000); // Every minute

  // Handle exit gracefully
  process.on("SIGINT", () => {
    clearInterval(statusInterval);
    const elapsed = Math.floor(
      (new Date().getTime() - startTime.getTime()) / 1000
    );
    console.log("\n\n═══════════════════════════════════════");
    console.log("MONITORING STOPPED");
    console.log("═══════════════════════════════════════");
    console.log(`Total Events: ${eventCount}`);
    console.log(`Duration: ${elapsed} seconds`);
    console.log(`Average Rate: ${(eventCount / (elapsed / 60)).toFixed(2)}/min`);
    console.log("═══════════════════════════════════════\n");
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
