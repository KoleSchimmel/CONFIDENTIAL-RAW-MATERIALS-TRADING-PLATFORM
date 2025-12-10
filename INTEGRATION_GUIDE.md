# Integration Guide

Complete guide for integrating the Confidential Raw Materials Trading contract with external systems.

## Table of Contents

1. [Frontend Integration](#frontend-integration)
2. [Backend Integration](#backend-integration)
3. [Oracle Integration](#oracle-integration)
4. [Event Indexing](#event-indexing)
5. [Payment Integration](#payment-integration)
6. [Supply Chain Systems](#supply-chain-systems)

---

## Frontend Integration

### Web3 Wallet Setup

```typescript
import { ethers } from "ethers";

// 1. Connect to MetaMask
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// 2. Request account access
const accounts = await window.ethereum.request({
  method: "eth_requestAccounts",
});

// 3. Get user's address
const userAddress = accounts[0];
console.log("Connected:", userAddress);
```

### Contract Instance Creation

```typescript
import contractABI from "./abi.json";

const contractAddress = "0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827";

const contract = new ethers.Contract(
  contractAddress,
  contractABI,
  signer
);

export default contract;
```

### Material Listing UI

```typescript
// React example with form submission
async function handleListMaterial(formData) {
  try {
    const tx = await contract.listMaterial(
      formData.name,
      formData.category,
      formData.quantity,
      ethers.BigNumber.from(formData.pricePerUnit),
      formData.minOrder,
      formData.qualityGrade,
      formData.deliveryDays
    );

    // Wait for confirmation
    const receipt = await tx.wait(1);
    console.log("Material listed:", receipt.transactionHash);

    // Show success message
    showNotification(
      "Material listed successfully!",
      "success"
    );

    // Refresh materials list
    await loadMaterials();
  } catch (error) {
    showNotification(`Error: ${error.message}`, "error");
  }
}
```

### Display Materials

```typescript
async function loadMaterials() {
  try {
    // Get all materials in category 0 (METALS)
    const metalMaterials = await contract.getMaterialsByCategory(0);

    const materialsData = [];
    for (const materialId of metalMaterials) {
      const info = await contract.getMaterialInfo(materialId);
      materialsData.push({
        id: materialId,
        name: info.name,
        category: info.category,
        supplier: info.supplier,
        grade: info.qualityGrade,
        delivery: info.deliveryTimeframe,
      });
    }

    // Render in UI
    displayMaterialsList(materialsData);
  } catch (error) {
    console.error("Error loading materials:", error);
  }
}
```

### Event Listening

```typescript
// Listen for new material listings
contract.on("MaterialListed", (materialId, supplier, category) => {
  console.log(`New material: ID=${materialId}, Category=${category}`);
  // Update UI in real-time
  loadMaterials();
});

// Listen for trade completions
contract.on(
  "TradeCompleted",
  (orderId, materialId) => {
    console.log(`Trade completed: Order=${orderId}`);
    // Update order status in UI
    updateOrderStatus(orderId, "completed");
  }
);

// Cleanup on component unmount
return () => {
  contract.removeAllListeners("MaterialListed");
  contract.removeAllListeners("TradeCompleted");
};
```

---

## Backend Integration

### Node.js Setup

```typescript
import { ethers } from "ethers";
import * as dotenv from "dotenv";

dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(
  process.env.SEPOLIA_RPC_URL
);

const contractAddress = process.env.CONTRACT_ADDRESS;
const contractABI = require("./abi.json");

const contract = new ethers.Contract(
  contractAddress,
  contractABI,
  provider
);

export { contract, provider };
```

### Order Processing Service

```typescript
import { contract } from "./contract";

class OrderService {
  async createOrder(
    buyer: string,
    materialId: number,
    quantity: number,
    maxPrice: BigNumber
  ) {
    // Get contract with signer
    const signer = provider.getSigner(buyer);
    const contractWithSigner = contract.connect(signer);

    // Create order
    const tx = await contractWithSigner.placeOrder(
      materialId,
      quantity,
      maxPrice,
      buyer.deliveryLocation,
      "0x" + "0".repeat(64)
    );

    // Store transaction hash in database
    await saveOrderTransaction(buyer, materialId, tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait(1);

    // Get order ID from events
    const events = receipt?.events || [];
    const orderEvent = events.find(
      (e) => e.event === "OrderPlaced"
    );
    const orderId = orderEvent?.args?.orderId;

    return {
      orderId,
      transactionHash: tx.hash,
      status: "pending",
    };
  }

  async getOrderStatus(orderId: number) {
    const order = await contract.getOrderInfo(orderId);
    return {
      status: ["pending", "matched", "completed", "cancelled"][
        order.status
      ],
      buyer: order.buyer,
      materialId: order.materialId,
      matchedAt: order.matchedAt?.toNumber(),
      supplier: order.matchedSupplier,
    };
  }

  async monitorOrder(orderId: number) {
    return new Promise((resolve) => {
      contract.on("TradeMatched", (oId, mId, buyer, supplier) => {
        if (oId.toNumber() === orderId) {
          resolve({
            matched: true,
            supplier: supplier,
          });
        }
      });
    });
  }
}

export default OrderService;
```

### Database Storage

```typescript
// Example using MongoDB
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  orderId: Number,
  buyer: String,
  materialId: Number,
  transactionHash: String,
  blockNumber: Number,
  status: String,
  createdAt: Date,
  matchedAt: Date,
  confirmedAt: Date,
  encryptedMetadata: String,
});

const Order = mongoose.model("Order", OrderSchema);

export async function saveOrder(orderData) {
  const order = new Order({
    ...orderData,
    createdAt: new Date(),
  });
  return await order.save();
}
```

---

## Oracle Integration

### Optional: Chainlink Price Feed

```typescript
import { ethers } from "hardhat";

// Example: Integrate Chainlink price oracle
interface IPriceFeed {
  latestRoundData(): Promise<{
    roundId: BigNumber;
    answer: BigNumber;
    startedAt: BigNumber;
    updatedAt: BigNumber;
    answeredInRound: BigNumber;
  }>;
}

async function getCurrentPrice(
  priceFeedAddress: string
): Promise<BigNumber> {
  const priceFeed = new ethers.Contract(
    priceFeedAddress,
    ["function latestRoundData() public view returns (...)"],
    ethers.provider
  );

  const roundData = await priceFeed.latestRoundData();
  return roundData.answer;
}

// Recommendation: Use off-chain price oracle
// Contract stays simple and focused on FHE matching
```

---

## Event Indexing

### Graph Protocol (The Graph)

```graphql
# subgraph.yaml
specVersion: 0.0.2
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: RawMaterialsTrading
    network: sepolia
    source:
      address: "0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827"
      abi: ConfidentialRawMaterialsTrading
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      entities:
        - Material
        - Order
        - Trade
      abis:
        - name: ConfidentialRawMaterialsTrading
          file: ./abis/Contract.json
      eventHandlers:
        - event: MaterialListed(indexed uint256,indexed address,uint256)
          handler: handleMaterialListed
        - event: OrderPlaced(indexed uint256,indexed address,indexed uint256)
          handler: handleOrderPlaced
        - event: TradeMatched(indexed uint256,indexed uint256,indexed address,address)
          handler: handleTradeMatched
```

### Custom Indexing Service

```typescript
import { ethers } from "ethers";

class EventIndexer {
  private contract;
  private lastBlock = 0;

  constructor(contractAddress: string) {
    this.contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );
  }

  async indexEvents(fromBlock: number) {
    const toBlock = await provider.getBlockNumber();

    // Get MaterialListed events
    const materialEvents = await this.contract.queryFilter(
      "MaterialListed",
      fromBlock,
      toBlock
    );

    for (const event of materialEvents) {
      await this.saveMaterialEvent({
        materialId: event.args.materialId,
        supplier: event.args.supplier,
        category: event.args.category,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });
    }

    // Get OrderPlaced events
    const orderEvents = await this.contract.queryFilter(
      "OrderPlaced",
      fromBlock,
      toBlock
    );

    for (const event of orderEvents) {
      await this.saveOrderEvent({
        orderId: event.args.orderId,
        buyer: event.args.buyer,
        materialId: event.args.materialId,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });
    }

    this.lastBlock = toBlock;
  }

  private async saveMaterialEvent(data: any) {
    // Save to database
    await db.materials.insert(data);
  }

  private async saveOrderEvent(data: any) {
    // Save to database
    await db.orders.insert(data);
  }
}
```

---

## Payment Integration

### ERC-20 Token Payment

```typescript
// Future enhancement for v1.1.0

import { ethers } from "ethers";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

async function approvePayment(
  buyerAddress: string,
  contractAddress: string,
  amount: BigNumber
) {
  const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);

  // Approve contract to spend USDC
  const approveTx = await usdc.approve(contractAddress, amount);
  await approveTx.wait(1);

  console.log("Payment approved");
}
```

---

## Supply Chain Systems

### ERP Integration

```typescript
// Example: Integration with ERP systems like SAP, Oracle

interface ERPMaterial {
  erpId: string;
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

async function syncMaterialToBlockchain(
  erpMaterial: ERPMaterial
) {
  // Convert ERP data to contract format
  const tx = await contract.listMaterial(
    erpMaterial.name,
    getCategoryFromERP(erpMaterial.category),
    erpMaterial.quantity,
    ethers.BigNumber.from(erpMaterial.price * 100), // Convert to cents
    Math.floor(erpMaterial.quantity * 0.1), // 10% min order
    "Standard", // Quality grade
    14 // Default delivery
  );

  const receipt = await tx.wait(1);

  // Store blockchain reference in ERP
  await updateERPWithBlockchainData({
    erpId: erpMaterial.erpId,
    blockchainAddress: contract.address,
    transactionHash: receipt.transactionHash,
    materialId: receipt.events[0].args.materialId,
  });
}
```

### Supply Chain Visibility

```typescript
// Provide supply chain visibility without revealing prices

async function getSupplyChainStatus(materialId: number) {
  const material = await contract.getMaterialInfo(materialId);

  return {
    material: {
      name: material.name,
      category: CATEGORIES[material.category],
      supplier: material.supplier,
      quality: material.qualityGrade,
      deliveryTime: material.deliveryTimeframe,
      status: material.isActive ? "available" : "unavailable",
      // Price and quantity are encrypted - not visible here
    },
    orders: {
      pending: await getPendingOrders(materialId),
      completed: await getCompletedOrders(materialId),
    },
    privacy: {
      pricesEncrypted: true,
      quantitiesEncrypted: true,
      onlyAuthorizedCanDecrypt: true,
    },
  };
}
```

---

## API Endpoints

### REST API Example

```typescript
import express from "express";
import { contract } from "./contract";

const app = express();

// Get all materials
app.get("/materials", async (req, res) => {
  const category = req.query.category || 0;
  const materialIds = await contract.getMaterialsByCategory(
    category
  );

  const materials = [];
  for (const id of materialIds) {
    const info = await contract.getMaterialInfo(id);
    materials.push({
      id,
      name: info.name,
      supplier: info.supplier,
      quality: info.qualityGrade,
      delivery: info.deliveryTimeframe,
    });
  }

  res.json(materials);
});

// Get specific order
app.get("/orders/:orderId", async (req, res) => {
  const order = await contract.getOrderInfo(req.params.orderId);

  res.json({
    buyer: order.buyer,
    materialId: order.materialId,
    status: ["pending", "matched", "completed", "cancelled"][
      order.status
    ],
    createdAt: new Date(order.createdAt.toNumber() * 1000),
  });
});

// Place order
app.post("/orders", async (req, res) => {
  const { materialId, quantity, maxPrice } = req.body;

  try {
    const tx = await contract.placeOrder(
      materialId,
      quantity,
      ethers.BigNumber.from(maxPrice),
      req.body.location,
      "0x" + "0".repeat(64)
    );

    const receipt = await tx.wait(1);
    res.json({ transactionHash: receipt.transactionHash });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => console.log("API running on port 3000"));
```

---

## Monitoring & Alerting

```typescript
// Set up monitoring for contract events

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

contract.on("TradeMatched", async (orderId, materialId, buyer, supplier) => {
  // Alert both parties
  await sendAlert({
    to: await getEmailForAddress(buyer),
    subject: "Trade Matched!",
    message: `Your order #${orderId} has been matched with a supplier.`,
  });

  await sendAlert({
    to: await getEmailForAddress(supplier),
    subject: "Order Matched!",
    message: `You matched with an order for material #${materialId}.`,
  });
});

async function sendAlert(options: any) {
  await transporter.sendMail({
    from: process.env.EMAIL,
    to: options.to,
    subject: options.subject,
    text: options.message,
  });
}
```

---

## Testing Integrations

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Integration Tests", () => {
  let contract;
  let materialData;

  before(async () => {
    // Setup
    const Factory = await ethers.getContractFactory(
      "ConfidentialRawMaterialsTrading"
    );
    contract = await Factory.deploy();
  });

  it("Should integrate with ERP system", async () => {
    // Simulate ERP data
    const erpMaterial = {
      name: "Steel Coils",
      quantity: 1000,
      price: 50000,
      category: 0,
    };

    // List on blockchain
    const tx = await contract.listMaterial(
      erpMaterial.name,
      erpMaterial.category,
      erpMaterial.quantity,
      ethers.BigNumber.from(erpMaterial.price),
      100,
      "A1",
      14
    );

    await tx.wait();

    // Verify in blockchain
    const materials = await contract.getMaterialsByCategory(0);
    expect(materials.length).to.be.greaterThan(0);
  });

  it("Should work with payment systems", async () => {
    // Test order placement with payment tracking
    const [, buyer] = await ethers.getSigners();

    const tx = await contract.connect(buyer).placeOrder(
      1,
      500,
      ethers.BigNumber.from("60000"),
      "Location",
      "0x" + "0".repeat(64)
    );

    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
  });
});
```

---

## Troubleshooting

### Common Integration Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Contract not found" | Wrong address or network | Verify network and address |
| "Insufficient gas" | Gas limit too low | Increase gas limit |
| "Transaction reverted" | Access control issue | Check verification status |
| "ABI mismatch" | Wrong ABI format | Use exported ABI from deployment |
| "Timeout" | RPC endpoint slow | Switch to different RPC |

---

## Support

For integration questions:
- GitHub Issues: https://github.com/zama-ai/fhevm
- Discord: https://discord.com/invite/zama
- Docs: https://docs.zama.ai/fhevm

---

**Last Updated**: December 2025
