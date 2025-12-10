# Developer Guide - Extending the Raw Materials Trading Platform

## Overview

This guide helps developers understand, extend, and maintain the Confidential Raw Materials Trading platform. It covers project structure, development workflows, and patterns for adding new features.

---

## Project Structure

```
ConfidentialRawMaterialsTrading/
├── contracts/
│   └── ConfidentialRawMaterialsTrading.sol
│       └── Main smart contract with FHE integration
│
├── test/
│   └── ConfidentialRawMaterialsTrading.test.ts
│       └── Comprehensive test suite (45+ tests)
│
├── scripts/
│   ├── deploy.ts
│   ├── initialize.ts
│   └── monitor-events.ts
│
├── docs/
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── FHE_OPERATIONS.md
│   └── DEVELOPER_GUIDE.md (this file)
│
├── public/
│   └── Frontend assets and HTML
│
├── hardhat.config.ts
│   └── Hardhat configuration for Sepolia
│
├── package.json
│   └── Dependencies and scripts
│
├── .env.example
│   └── Environment variable template
│
└── tsconfig.json
    └── TypeScript configuration
```

---

## Development Workflow

### 1. Setup Development Environment

```bash
# Clone repository
git clone [repository-url]
cd ConfidentialRawMaterialsTrading

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your private key (testnet only!)

# Verify setup
npx hardhat compile
npx hardhat test
```

### 2. Compile Smart Contracts

```bash
# Compile all contracts
npx hardhat compile

# With verbose output
npx hardhat compile --verbose

# Clean and recompile
npx hardhat clean && npx hardhat compile

# Check for errors
npx hardhat typechain
```

### 3. Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/ConfidentialRawMaterialsTrading.test.ts

# Run tests matching pattern
npx hardhat test --grep "Material"

# Run with coverage
npx hardhat coverage

# Run with detailed output
npx hardhat test --show-stack-traces
```

### 4. Deploy Locally

```bash
# Terminal 1: Start local node
npx hardhat node

# Terminal 2: Deploy to localhost
npx hardhat run scripts/deploy.ts --network localhost

# Save contract address for frontend
# Example: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 5. Deploy to Sepolia

```bash
# Deploy to testnet
npx hardhat run scripts/deploy.ts --network sepolia

# Verify on Etherscan (after 5 block confirmations)
npx hardhat verify --network sepolia CONTRACT_ADDRESS

# Initialize contract
npx hardhat run scripts/initialize.ts --network sepolia
```

---

## Adding New Features

### Example 1: Add Batch Material Listing

**Purpose**: Allow suppliers to list multiple materials in one transaction

**Step 1: Update Contract**

```solidity
// In ConfidentialRawMaterialsTrading.sol

/**
 * @notice List multiple materials in a single transaction
 * @dev Reduces gas overhead for bulk operations
 * @param materials Array of material creation parameters
 */
struct MaterialInput {
    string name;
    MaterialCategory category;
    uint32 quantity;
    uint64 pricePerUnit;
    uint32 minOrder;
    string qualityGrade;
    uint256 deliveryTimeframe;
}

function listMaterialsBatch(MaterialInput[] calldata materials)
    external
    onlyVerifiedSupplier
{
    require(materials.length > 0, "Empty batch");
    require(materials.length <= 10, "Batch too large");

    for (uint i = 0; i < materials.length; i++) {
        MaterialInput memory mat = materials[i];

        // Validate
        require(mat.quantity > 0, "Invalid quantity");
        require(mat.pricePerUnit > 0, "Invalid price");

        // Encrypt
        euint32 encryptedQuantity = FHE.asEuint32(mat.quantity);
        euint64 encryptedPricePerUnit = FHE.asEuint64(mat.pricePerUnit);
        euint32 encryptedMinOrder = FHE.asEuint32(mat.minOrder);

        // Create material
        materials[nextMaterialId] = RawMaterial({
            name: mat.name,
            category: mat.category,
            supplier: msg.sender,
            encryptedQuantity: encryptedQuantity,
            encryptedPricePerUnit: encryptedPricePerUnit,
            encryptedMinOrder: encryptedMinOrder,
            isActive: true,
            createdAt: block.timestamp,
            qualityGrade: mat.qualityGrade,
            deliveryTimeframe: mat.deliveryTimeframe
        });

        // Permissions
        FHE.allowThis(encryptedQuantity);
        FHE.allowThis(encryptedPricePerUnit);
        FHE.allowThis(encryptedMinOrder);
        FHE.allow(encryptedQuantity, msg.sender);
        FHE.allow(encryptedPricePerUnit, msg.sender);
        FHE.allow(encryptedMinOrder, msg.sender);

        // Event
        emit MaterialListed(nextMaterialId, msg.sender, mat.category);
        nextMaterialId++;
    }
}
```

**Step 2: Update Tests**

```typescript
// In test/ConfidentialRawMaterialsTrading.test.ts

describe("Batch Material Listing", () => {
  it("Should list multiple materials in one transaction", async () => {
    const supplier = signers[1]; // Verified supplier

    // Prepare batch
    const batch = [
      {
        name: "Steel Coils",
        category: 0, // METALS
        quantity: 1000,
        pricePerUnit: 500n,
        minOrder: 100,
        qualityGrade: "A1",
        deliveryTimeframe: 14,
      },
      {
        name: "Aluminum Sheets",
        category: 0,
        quantity: 2000,
        pricePerUnit: 300n,
        minOrder: 500,
        qualityGrade: "B2",
        deliveryTimeframe: 21,
      },
    ];

    // Call batch function
    const tx = await contract
      .connect(supplier)
      .listMaterialsBatch(batch);

    // Wait for transaction
    const receipt = await tx.wait();

    // Verify materials created
    const events = receipt?.events?.filter((e) => e.event === "MaterialListed");
    expect(events?.length).to.equal(2);

    // Verify first material
    let material = await contract.getMaterialInfo(1);
    expect(material.name).to.equal("Steel Coils");

    // Verify second material
    material = await contract.getMaterialInfo(2);
    expect(material.name).to.equal("Aluminum Sheets");
  });

  it("Should reject batch larger than 10 items", async () => {
    const supplier = signers[1];
    const batch = Array(11).fill({
      name: "Material",
      category: 0,
      quantity: 100,
      pricePerUnit: 100n,
      minOrder: 10,
      qualityGrade: "A",
      deliveryTimeframe: 7,
    });

    await expect(contract.connect(supplier).listMaterialsBatch(batch)).to.be
      .reverted;
  });
});
```

**Step 3: Update Frontend**

```typescript
// In app.js or equivalent

async function listMaterialsBatch(materialsData) {
  try {
    showLoading(true);

    const batch = materialsData.map((mat) => ({
      name: mat.name,
      category: mat.category,
      quantity: mat.quantity,
      pricePerUnit: mat.pricePerUnit,
      minOrder: mat.minOrder,
      qualityGrade: mat.qualityGrade,
      deliveryTimeframe: mat.deliveryTimeframe,
    }));

    const tx = await contractService.listMaterialsBatch(batch);
    showToast(`Listed ${batch.length} materials in one transaction`, "success");

    setTimeout(() => {
      loadSupplierMaterials();
    }, 5000);
  } catch (error) {
    console.error("Error listing materials batch:", error);
    showToast("Error listing materials: " + error.message, "error");
  } finally {
    showLoading(false);
  }
}
```

---

### Example 2: Add Price Update Functionality

**Purpose**: Allow suppliers to update material prices

**Step 1: Add Contract Function**

```solidity
/**
 * @notice Update price of existing material
 * @dev Only supplier can update their material
 * @param materialId ID of material to update
 * @param newPrice New encrypted price
 */
function updateMaterialPrice(uint256 materialId, uint64 newPrice)
    external
{
    RawMaterial storage material = materials[materialId];

    // Verify caller is supplier
    require(material.supplier == msg.sender, "Not material supplier");
    require(material.isActive, "Material not active");

    // Encrypt new price
    euint64 encryptedNewPrice = FHE.asEuint64(newPrice);

    // Update price
    material.encryptedPricePerUnit = encryptedNewPrice;

    // Grant permissions
    FHE.allowThis(encryptedNewPrice);
    FHE.allow(encryptedNewPrice, msg.sender);

    // Event (optional)
    emit MaterialPriceUpdated(materialId, newPrice);
}

// Add event definition
event MaterialPriceUpdated(
    indexed uint256 materialId,
    uint64 newPrice
);
```

**Step 2: Add Tests**

```typescript
it("Should allow supplier to update material price", async () => {
  const supplier = signers[1];
  const materialId = 1; // Created in setup

  // Update price
  const newPrice = 750n;
  const tx = await contract
    .connect(supplier)
    .updateMaterialPrice(materialId, newPrice);

  // Verify transaction
  const receipt = await tx.wait();
  expect(receipt?.status).to.equal(1);

  // Event verification
  const events = receipt?.events?.filter((e) => e.event === "MaterialPriceUpdated");
  expect(events?.length).to.equal(1);
});

it("Should reject price update from non-supplier", async () => {
  const nonSupplier = signers[3];
  const materialId = 1;

  await expect(
    contract.connect(nonSupplier).updateMaterialPrice(materialId, 750n)
  ).to.be.revertedWith("Not material supplier");
});
```

---

## FHE Pattern Reference

### Pattern 1: Create and Grant Encrypted Value

```solidity
// Create encrypted value
euint32 encryptedValue = FHE.asEuint32(plaintext);

// Grant access to contract (self)
FHE.allowThis(encryptedValue);

// Grant access to user
FHE.allow(encryptedValue, userAddress);

// Store in mapping
myMapping[id] = encryptedValue;
```

**Use Case**: Material quantities, order amounts, price limits

---

### Pattern 2: Perform Encrypted Arithmetic

```solidity
// Get encrypted values
euint32 quantity1 = materials[id1].encryptedQuantity;
euint32 quantity2 = orders[orderId].encryptedQuantity;

// Perform encrypted operation
euint32 result = FHE.sub(quantity1, quantity2);

// Grant access to parties
FHE.allowThis(result);
FHE.allow(result, supplier);
FHE.allow(result, buyer);

// Update state
materials[id1].encryptedQuantity = result;
```

**Use Case**: Inventory updates, price calculations

---

### Pattern 3: Multi-Party Access Control

```solidity
// Supplier lists material
FHE.allow(encryptedQuantity, supplierAddress);

// After matching, buyer gets access
FHE.allow(encryptedQuantity, buyerAddress);

// Contract always has access for operations
FHE.allowThis(encryptedQuantity);

// Result: Both parties can decrypt after match,
// but neither knew the other's terms before
```

**Use Case**: Confidential order matching

---

## Testing Best Practices

### Test Structure Template

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Feature Name", () => {
  let contract;
  let signers;
  let deployer, user1, user2;

  before(async () => {
    // Deploy fresh contract
    signers = await ethers.getSigners();
    [deployer, user1, user2] = signers;

    const Factory = await ethers.getContractFactory(
      "ConfidentialRawMaterialsTrading"
    );
    contract = await Factory.deploy();
    await contract.deployed();

    // Setup: verify users
    await contract.verifySupplier(user1.address);
    await contract.verifyBuyer(user2.address);
  });

  describe("Normal Operation", () => {
    it("Should complete workflow successfully", async () => {
      // Setup
      const testData = {
        name: "Test Material",
        category: 0,
        quantity: 1000,
        price: 500n,
        minOrder: 100,
        grade: "A1",
        delivery: 14,
      };

      // Execute
      const tx = await contract.connect(user1).listMaterial(...Object.values(testData));
      const receipt = await tx.wait();

      // Assert
      expect(receipt?.status).to.equal(1);
      expect(receipt?.events?.length).to.be.greaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("Should reject invalid inputs", async () => {
      await expect(
        contract.connect(user1).listMaterial(
          "Test",
          0,
          0, // Invalid quantity
          500n,
          100,
          "A1",
          14
        )
      ).to.be.revertedWith("Invalid quantity");
    });
  });

  describe("Access Control", () => {
    it("Should prevent unauthorized operations", async () => {
      const unverified = signers[4];

      await expect(
        contract.connect(unverified).listMaterial(
          "Test",
          0,
          100,
          500n,
          10,
          "A1",
          14
        )
      ).to.be.revertedWith("Not verified supplier");
    });
  });
});
```

---

## Common Patterns and Anti-Patterns

### ✓ DO: Grant Permissions After Creation

```solidity
// ✓ CORRECT
euint32 encryptedValue = FHE.asEuint32(value);
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, msg.sender);
dataStructure.encryptedField = encryptedValue;
```

### ✗ DON'T: Store Without Permissions

```solidity
// ✗ WRONG - encrypted value created but no permissions granted
euint32 encryptedValue = FHE.asEuint32(value);
dataStructure.encryptedField = encryptedValue;
// Future functions can't access this value!
```

### ✓ DO: Validate Plaintext Before Encryption

```solidity
// ✓ CORRECT
require(_quantity > 0, "Invalid quantity");
require(_price > 0, "Invalid price");

euint32 encryptedQuantity = FHE.asEuint32(_quantity);
euint64 encryptedPrice = FHE.asEuint64(_price);
```

### ✗ DON'T: Try to Check Encrypted Values

```solidity
// ✗ WRONG - Can't compare encrypted values this way
euint32 encrypted = material.encryptedQuantity;
require(encrypted > 100, "Too small"); // FAILS!

// FHE operations return ebool, not castable to bool
ebool isGreater = FHE.gt(encrypted, 100);
// Can't directly use in require()
```

### ✓ DO: Use Events for Off-Chain Indexing

```solidity
// ✓ CORRECT
event MaterialListed(
    indexed uint256 materialId,
    indexed address supplier,
    MaterialCategory category
);

// Emit event after creation
emit MaterialListed(id, msg.sender, category);
```

### ✗ DON'T: Iterate All Storage to Find Data

```solidity
// ✗ INEFFICIENT
function findMaterialsBySupplier(address supplier)
    external view returns (uint256[] memory)
{
    // Looping through all materials is O(n)
    // Use mapping instead
}

// ✓ CORRECT - use pre-built index
function getSupplierMaterials(address supplier)
    external view returns (uint256[] memory)
{
    return supplierMaterials[supplier]; // O(1)
}
```

---

## Performance Optimization

### Gas Optimization Checklist

- [ ] Use `uint32` instead of `uint256` for small numbers
- [ ] Use `euint32` instead of `euint64` when range allows
- [ ] Avoid redundant FHE operations
- [ ] Index data for O(1) lookups
- [ ] Use events instead of storing logs
- [ ] Batch operations where possible

### Example: Optimized Batch Operation

```solidity
// ✗ Unoptimized: Expensive permission grants per item
function unoptimizedBatch(uint256[] calldata ids) external {
    for (uint i = 0; i < ids.length; i++) {
        euint32 value = FHE.asEuint32(values[i]);
        FHE.allowThis(value);
        FHE.allow(value, msg.sender);
        // 24,000 gas per iteration!
    }
}

// ✓ Optimized: Single permission grant after batch
function optimizedBatch(uint256[] calldata ids) external {
    euint32[] memory encrypted = new euint32[](ids.length);

    for (uint i = 0; i < ids.length; i++) {
        encrypted[i] = FHE.asEuint32(values[i]);
    }

    // Single permission grant
    for (uint i = 0; i < encrypted.length; i++) {
        FHE.allowThis(encrypted[i]);
    }
    // FHE.allow batch call would be even better
}
```

---

## Debugging Guide

### Enable Debug Output

```bash
# Run tests with debug output
HARDHAT_LOG=debug npx hardhat test

# Or in hardhat config
const config = {
  hardhat: {
    logging: {
      debug: true
    }
  }
}
```

### Common Debug Scenarios

**Scenario 1: Transaction Reverted Without Reason**

```bash
# Run with verbose stack traces
npx hardhat test --show-stack-traces

# Or catch in test
try {
  await contract.someFunction();
} catch (error) {
  console.error("Full error:", error);
  console.error("Reason:", error.reason);
  console.error("Data:", error.data);
}
```

**Scenario 2: Encrypted Value Not Accessible**

```solidity
// Check if permissions granted
// Verify FHE.allow() or FHE.allowThis() called
// Verify correct address in FHE.allow(value, address)

// ✓ Correct pattern:
FHE.allowThis(value); // Contract access
FHE.allow(value, msg.sender); // User access
```

**Scenario 3: Gas Estimation Too Low**

```typescript
// Estimate before sending
const gasEstimate = await contract.someFunction.estimateGas();
console.log("Estimated gas:", gasEstimate.toString());

// Send with buffer
const tx = await contract.someFunction({
  gasLimit: gasEstimate.mul(120).div(100), // 20% buffer
});
```

---

## Contributing Guide

### Code Style

```solidity
// ✓ Solidity Style Guidelines
contract MyContract {
  // State variables
  uint256 public count;

  // Events (SCREAMING_SNAKE_CASE)
  event CountIncremented(uint256 newCount);

  // Modifiers
  modifier onlyOwner() {
    require(msg.sender == owner, "Not owner");
    _;
  }

  // Functions (camelCase)
  function increment() external {
    count++;
    emit CountIncremented(count);
  }

  // Internal functions
  function _internalHelper() internal pure returns (uint256) {
    return 1;
  }
}
```

### Commit Message Format

```
feat(contract): add batch material listing

- Implement listMaterialsBatch() function
- Add tests for batch operations
- Update documentation

Closes #123
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New Feature
- [ ] Bug Fix
- [ ] Enhancement
- [ ] Documentation

## Testing
- [ ] Tests added/updated
- [ ] Coverage maintained
- [ ] Manual testing done

## Checklist
- [ ] Code follows style guide
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## Useful Commands

```bash
# Compilation
npm run compile              # Compile contracts
npm run clean              # Clean artifacts

# Testing
npm test                   # Run all tests
npm run coverage          # Generate coverage report

# Deployment
npm run deploy:local      # Deploy to local node
npm run deploy:sepolia    # Deploy to Sepolia testnet

# Development
npm run node              # Start local Hardhat node
npm run console:sepolia   # Open Hardhat console on Sepolia

# Verification
npx hardhat verify --network sepolia ADDRESS
```

---

## Resources

### Documentation
- [Hardhat Docs](https://hardhat.org/)
- [Zama FHEVM Documentation](https://docs.zama.ai/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [ethers.js Documentation](https://docs.ethers.org/)

### Tools
- [Hardhat](https://hardhat.org/) - Smart contract development
- [Solhint](https://www.npmjs.com/package/solhint) - Linter
- [Slither](https://github.com/crytic/slither) - Static analysis
- [Etherscan](https://etherscan.io/) - Block explorer

### Learning Resources
- [CryptoZombies](https://cryptozombies.io/) - Solidity tutorials
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/) - Standard contracts
- [Zama Research](https://www.zama.ai/research) - FHE papers

---

## Support

For issues and questions:
1. Check existing issues on GitHub
2. Review this developer guide
3. Consult Zama documentation
4. Open a new issue with detailed description

---

**Last Updated**: December 2025
**Maintained By**: Development Team
