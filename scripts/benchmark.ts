/**
 * Performance Benchmark Script
 *
 * Measures gas usage and transaction times for all contract operations
 * Usage: npx hardhat run scripts/benchmark.ts --network localhost
 */

import { ethers } from "hardhat";
import { BigNumber } from "ethers";

interface BenchmarkResult {
  operation: string;
  gasUsed: number;
  minGas: number;
  maxGas: number;
  avgGas: number;
  count: number;
  estimatedCost: number;
}

async function benchmark() {
  console.log("⚙️ Performance Benchmark\n");

  const [owner, supplier1, supplier2, buyer1, buyer2] =
    await ethers.getSigners();

  // Deploy contract
  const Factory = await ethers.getContractFactory(
    "ConfidentialRawMaterialsTrading"
  );
  const contract = await Factory.deploy();
  await contract.deployed();

  console.log("📊 Contract Deployed\n");

  // Gas prices for estimation
  const gasPrice = ethers.utils.parseUnits("2", "gwei");
  const ethPrice = 2000; // USD per ETH

  const results: BenchmarkResult[] = [];

  // ========== VERIFICATION ==========
  console.log("🔒 Verification Operations\n");

  let gasList: number[] = [];

  // Verify Supplier
  console.log("Verifying suppliers...");
  for (let i = 0; i < 3; i++) {
    const tx = await contract.verifySupplier(supplier1.address);
    const receipt = await tx.wait();
    gasList.push(receipt.gasUsed.toNumber());
  }
  results.push(
    createResult("Verify Supplier", gasList, gasPrice, ethPrice)
  );

  gasList = [];

  // Verify Buyer
  console.log("Verifying buyers...");
  for (let i = 0; i < 3; i++) {
    const tx = await contract.verifyBuyer(buyer1.address);
    const receipt = await tx.wait();
    gasList.push(receipt.gasUsed.toNumber());
  }
  results.push(
    createResult("Verify Buyer", gasList, gasPrice, ethPrice)
  );

  // ========== MATERIAL LISTING ==========
  console.log("\n📦 Material Listing Operations\n");

  gasList = [];

  // List materials
  console.log("Listing materials...");
  for (let i = 0; i < 5; i++) {
    const tx = await contract.connect(supplier1).listMaterial(
      `Material ${i}`,
      i % 6,
      Math.floor(Math.random() * 10000) + 100,
      BigNumber.from(Math.floor(Math.random() * 100000) + 10000),
      Math.floor(Math.random() * 1000) + 10,
      `Grade ${String.fromCharCode(65 + (i % 3))}`,
      Math.floor(Math.random() * 30) + 1
    );
    const receipt = await tx.wait();
    gasList.push(receipt.gasUsed.toNumber());
  }
  results.push(
    createResult("List Material", gasList, gasPrice, ethPrice)
  );

  // ========== ORDER PLACEMENT ==========
  console.log("📋 Order Placement Operations\n");

  gasList = [];

  // Place orders
  console.log("Placing orders...");
  for (let i = 0; i < 5; i++) {
    const tx = await contract.connect(buyer1).placeOrder(
      1,
      Math.floor(Math.random() * 500) + 50,
      BigNumber.from(Math.floor(Math.random() * 80000) + 20000),
      `Location ${i}`,
      "0x" + "0".repeat(64)
    );
    const receipt = await tx.wait();
    gasList.push(receipt.gasUsed.toNumber());
  }
  results.push(
    createResult("Place Order", gasList, gasPrice, ethPrice)
  );

  // ========== TRADE MATCHING ==========
  console.log("🤝 Trade Matching Operations\n");

  gasList = [];

  // Match trades
  console.log("Matching trades...");
  for (let i = 2; i < 7; i++) {
    const tx = await contract.connect(supplier1).matchTrade(i);
    const receipt = await tx.wait();
    gasList.push(receipt.gasUsed.toNumber());
  }
  results.push(
    createResult("Match Trade", gasList, gasPrice, ethPrice)
  );

  // ========== TRADE CONFIRMATION ==========
  console.log("✅ Trade Confirmation Operations\n");

  gasList = [];

  // Confirm trades
  console.log("Confirming trades...");
  for (let i = 2; i < 7; i++) {
    const tx = await contract.connect(buyer1).confirmTrade(i);
    const receipt = await tx.wait();
    gasList.push(receipt.gasUsed.toNumber());
  }
  results.push(
    createResult("Confirm Trade", gasList, gasPrice, ethPrice)
  );

  // ========== DEACTIVATION ==========
  console.log("❌ Material Deactivation\n");

  gasList = [];

  // Deactivate materials
  console.log("Deactivating materials...");
  for (let i = 8; i < 10; i++) {
    const tx = await contract
      .connect(supplier1)
      .deactivateMaterial(i);
    const receipt = await tx.wait();
    gasList.push(receipt.gasUsed.toNumber());
  }
  results.push(
    createResult("Deactivate Material", gasList, gasPrice, ethPrice)
  );

  // ========== VIEW OPERATIONS ==========
  console.log("👁️ View Operations (Read-Only)\n");

  console.log("Getting material info...");
  const tx1 = await contract.getMaterialInfo(1);

  console.log("Getting order info...");
  const tx2 = await contract.getOrderInfo(1);

  console.log("Getting materials by category...");
  const tx3 = await contract.getMaterialsByCategory(0);

  console.log("Getting supplier materials...");
  const tx4 = await contract.getSupplierMaterials(supplier1.address);

  console.log("Getting buyer orders...");
  const tx5 = await contract.getBuyerOrders(buyer1.address);

  results.push({
    operation: "View Operations",
    gasUsed: 0,
    minGas: 0,
    maxGas: 0,
    avgGas: 0,
    count: 5,
    estimatedCost: 0,
  });

  // ========== REPORT ==========
  console.log("\n");
  console.log("═════════════════════════════════════════════════════════════");
  console.log("PERFORMANCE BENCHMARK RESULTS");
  console.log("═════════════════════════════════════════════════════════════\n");

  // Table headers
  console.log(
    "Operation             Min Gas    Avg Gas    Max Gas    Cost ($)   Count"
  );
  console.log("─".repeat(70));

  let totalGas = 0;
  let totalCost = 0;

  for (const result of results) {
    if (result.avgGas === 0 && result.operation === "View Operations") {
      console.log(
        `${result.operation.padEnd(20)} ${"-".padEnd(10)} ${"0.00".padEnd(10)} ${"-".padEnd(10)} ${"0.00".padEnd(10)} ${result.count}`
      );
    } else {
      const minGasStr = result.minGas.toLocaleString().padEnd(10);
      const avgGasStr = Math.round(result.avgGas).toLocaleString().padEnd(10);
      const maxGasStr = result.maxGas.toLocaleString().padEnd(10);
      const costStr = `$${result.estimatedCost.toFixed(2)}`.padEnd(10);

      console.log(
        `${result.operation.padEnd(20)} ${minGasStr} ${avgGasStr} ${maxGasStr} ${costStr} ${result.count}`
      );

      totalGas += result.avgGas * result.count;
      totalCost += result.estimatedCost * result.count;
    }
  }

  console.log("─".repeat(70));
  console.log(`${"TOTAL".padEnd(20)} ${"".padEnd(10)} ${"".padEnd(10)} ${"".padEnd(10)} $${totalCost.toFixed(2).padEnd(9)} ${results.length}`);
  console.log("═════════════════════════════════════════════════════════════\n");

  // Summary statistics
  console.log("📈 Summary Statistics\n");

  const avgOperationCost = totalCost / results.length;
  const maxOperation = results.reduce((prev, current) =>
    prev.estimatedCost > current.estimatedCost ? prev : current
  );
  const minOperation = results.reduce((prev, current) =>
    prev.estimatedCost > 0 && prev.estimatedCost < current.estimatedCost
      ? prev
      : current
  );

  console.log(`Total Operations Tested:    ${results.length}`);
  console.log(`Total Gas Used:              ${Math.round(totalGas).toLocaleString()}`);
  console.log(`Total Estimated Cost:        $${totalCost.toFixed(2)}`);
  console.log(`Average Operation Cost:      $${avgOperationCost.toFixed(4)}`);
  console.log(
    `Most Expensive:              ${maxOperation.operation} ($${maxOperation.estimatedCost.toFixed(4)})`
  );
  console.log(
    `Least Expensive (non-zero):  ${minOperation.operation} ($${minOperation.estimatedCost.toFixed(4)})`
  );

  // Cost per trade cycle
  console.log("\n💰 Cost Analysis\n");

  const listCost = results.find((r) => r.operation === "List Material")?.estimatedCost || 0;
  const orderCost = results.find((r) => r.operation === "Place Order")?.estimatedCost || 0;
  const matchCost = results.find((r) => r.operation === "Match Trade")?.estimatedCost || 0;
  const confirmCost = results.find((r) => r.operation === "Confirm Trade")?.estimatedCost || 0;

  const completeTradeChain = listCost + orderCost + matchCost + confirmCost;

  console.log(`Single List Operation:       $${listCost.toFixed(4)}`);
  console.log(`Single Order Operation:      $${orderCost.toFixed(4)}`);
  console.log(`Single Match Operation:      $${matchCost.toFixed(4)}`);
  console.log(`Single Confirm Operation:    $${confirmCost.toFixed(4)}`);
  console.log(`─`.repeat(35));
  console.log(`Complete Trade Cycle:        $${completeTradeChain.toFixed(4)}`);

  // Recommendations
  console.log("\n💡 Recommendations\n");

  if (matchCost > orderCost * 2) {
    console.log(
      "⚠️  Trade matching is expensive - consider batch matching in v2.0"
    );
  }

  if (totalGas > 1000000) {
    console.log(
      "⚠️  Total gas usage is high - consider Layer 2 deployment for production"
    );
  }

  if (completeTradeChain < 5) {
    console.log("✅ Trade cycle cost is very competitive at $" +
      completeTradeChain.toFixed(2));
  }

  console.log("\n✨ Benchmark Complete!\n");
}

function createResult(
  operation: string,
  gasList: number[],
  gasPrice: any,
  ethPrice: number
): BenchmarkResult {
  const minGas = Math.min(...gasList);
  const maxGas = Math.max(...gasList);
  const avgGas = gasList.reduce((a, b) => a + b, 0) / gasList.length;

  const costInEth =
    (avgGas * gasPrice.toNumber()) / 1e18;
  const costInUsd = costInEth * ethPrice;

  return {
    operation,
    gasUsed: avgGas,
    minGas,
    maxGas,
    avgGas,
    count: gasList.length,
    estimatedCost: costInUsd,
  };
}

benchmark()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
