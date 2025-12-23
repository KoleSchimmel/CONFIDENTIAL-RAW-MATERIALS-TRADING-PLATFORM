# Getting Started with FHEVM

**Your First Steps in Privacy-Preserving Smart Contract Development**

## Welcome

This guide will help you get started with FHEVM (Fully Homomorphic Encryption Virtual Machine) development. By the end of this guide, you'll understand the basics of FHE and be ready to build your first encrypted smart contract.

## Prerequisites

### Required Knowledge

- Basic understanding of Ethereum and smart contracts
- Familiarity with Solidity programming
- Experience with Node.js and npm
- Understanding of cryptography concepts (helpful but not required)

### Development Environment

- **Node.js**: v18 or higher
- **npm** or **yarn**: Latest version
- **Hardhat**: Development environment
- **Code Editor**: VS Code recommended

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-repo/RawMaterialsTrading.git
cd RawMaterialsTrading
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `fhevm` - Core FHE library
- `fhevm-core-contracts` - FHE system contracts
- `hardhat` - Development environment
- `@nomicfoundation/hardhat-toolbox` - Testing utilities
- `fhevmjs` - Client-side encryption library

### Step 3: Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here

# Optional: Deployment verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# FHEVM Gateway (for decryption)
GATEWAY_URL=https://gateway.zama.ai
```

### Step 4: Compile Contracts

```bash
npm run compile
```

This compiles all Solidity contracts and generates TypeScript type bindings.

## Understanding FHE Basics

### What is Fully Homomorphic Encryption?

FHE allows computations on encrypted data without decryption:

```
Traditional:
plaintext → computation → result

FHE:
encrypted → computation → encrypted result → decrypt → result
```

**Key Benefit**: Smart contract never sees plaintext data!

### Core Concepts

#### 1. Encrypted Types

FHEVM provides encrypted versions of basic types:

```solidity
// Regular Solidity types
uint32 age = 25;
uint64 balance = 1000000;
bool isActive = true;

// FHE encrypted types
euint32 encryptedAge;
euint64 encryptedBalance;
ebool encryptedIsActive;
```

#### 2. FHE Operations

Perform operations on encrypted data:

```solidity
// Addition on encrypted values
euint32 sum = FHE.add(encryptedA, encryptedB);

// Comparison on encrypted values
ebool isGreater = FHE.gt(encryptedA, encryptedB);

// Result stays encrypted!
```

#### 3. Access Control

Control who can decrypt values:

```solidity
// Allow contract to use the value
FHE.allowThis(encryptedValue);

// Allow specific user to decrypt
FHE.allow(encryptedValue, userAddress);
```

#### 4. Input Proofs

Verify encrypted inputs from users:

```solidity
function storeSecret(inEuint32 calldata secret, bytes calldata proof) external {
    // Proof verifies the encryption is valid
    euint32 encrypted = FHE.asEuint32(secret, proof);
}
```

## Your First FHE Contract

### Simple Encrypted Counter

Let's build a basic encrypted counter:

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

contract MyFirstFHEContract is SepoliaZamaFHEVMConfig {
    // Encrypted counter
    euint32 private _counter;
    address public owner;

    constructor() {
        owner = msg.sender;
        // Initialize with encrypted zero
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
    }

    // Increment by encrypted amount
    function increment(inEuint32 calldata amount, bytes calldata proof) external {
        euint32 value = FHE.asEuint32(amount, proof);

        // Add to counter (still encrypted!)
        _counter = FHE.add(_counter, value);

        // Grant permissions
        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);
    }

    // Get encrypted counter
    function getCounter() external view returns (euint32) {
        return _counter;
    }
}
```

### Testing Your Contract

Create a test file `test/MyFirstFHEContract.test.ts`:

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("MyFirstFHEContract", function () {
    let contract: any;
    let owner: any;

    before(async function () {
        [owner] = await ethers.getSigners();

        const Factory = await ethers.getContractFactory("MyFirstFHEContract");
        contract = await Factory.deploy();
        await contract.waitForDeployment();
    });

    it("Should initialize with encrypted zero", async function () {
        const counter = await contract.getCounter();
        expect(counter).to.exist; // Still encrypted
    });

    it("Should increment counter", async function () {
        // In production, use fhevmjs to create encrypted input
        // For now, demonstrate the pattern
        const tx = await contract.increment("0x00", "0x00");
        expect(tx).to.not.be.reverted;
    });
});
```

### Run Tests

```bash
npm test
```

## Next Steps

### Learning Path

1. **Basic Examples** (Start here!)
   - [FHE Counter](basic/fhe-counter.md) - Your first FHE contract
   - [Encryption Patterns](basic/encryption.md) - Different encryption methods
   - [Access Control](basic/access-control.md) - Permission management

2. **FHE Operations**
   - [Addition](operations/fhe-add.md)
   - [Subtraction](operations/fhe-sub.md)
   - [Multiplication](operations/fhe-mul.md)
   - [Comparison](operations/fhe-compare.md)

3. **Advanced Examples**
   - [Blind Auction](advanced/blind-auction.md)
   - [Confidential Trading](advanced/raw-materials-trading.md)

### Using Automation Tools

Generate your own example project:

```bash
# Create a new FHE project
npm run create-example -- \
  --name MyCounter \
  --category basic \
  --description "My encrypted counter"
```

This creates a complete standalone project with:
- Hardhat configuration
- Contract template
- Test suite
- Deployment scripts
- Documentation

### Deployment to Testnet

Deploy to Sepolia testnet:

```bash
# Make sure .env is configured
npm run deploy:sepolia
```

Verify on Etherscan:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Common First-Time Mistakes

### ❌ Mistake 1: Trying to Decrypt in View Function

```solidity
// WRONG - View functions can't decrypt
function getBalance() external view returns (uint64) {
    return FHE.decrypt(balance); // FAILS!
}
```

**Fix**: Return encrypted value, decrypt client-side:

```solidity
// CORRECT
function getBalance() external view returns (euint64) {
    return balance; // Still encrypted
}
```

### ❌ Mistake 2: Forgetting FHE.allowThis()

```solidity
// WRONG
euint32 result = FHE.add(a, b);
storedValue = result; // Will fail later!
```

**Fix**: Always grant contract permission:

```solidity
// CORRECT
euint32 result = FHE.add(a, b);
FHE.allowThis(result);
storedValue = result;
```

### ❌ Mistake 3: Missing Input Proof

```solidity
// WRONG
function store(inEuint32 calldata value) external {
    data = FHE.asEuint32(value); // Missing proof!
}
```

**Fix**: Always include proof verification:

```solidity
// CORRECT
function store(inEuint32 calldata value, bytes calldata proof) external {
    data = FHE.asEuint32(value, proof);
}
```

### ❌ Mistake 4: Comparing Encrypted to Plaintext

```solidity
// WRONG
require(encryptedAge > 18); // Type mismatch!
```

**Fix**: Use FHE comparison:

```solidity
// CORRECT
FHE.req(FHE.gt(encryptedAge, FHE.asEuint32(18)));
```

## Development Workflow

### Typical Development Cycle

1. **Design** - Plan what data should be encrypted
2. **Write Contract** - Use FHE types and operations
3. **Write Tests** - Test with mock encrypted data
4. **Local Testing** - Run on Hardhat network
5. **Deploy to Testnet** - Deploy to Sepolia
6. **Integration Testing** - Test with fhevmjs client
7. **Production** - Deploy to mainnet

### Best Practices

✅ **Always grant permissions**
```solidity
FHE.allowThis(encrypted);
FHE.allow(encrypted, user);
```

✅ **Validate inputs**
```solidity
require(msg.sender != address(0), "Invalid sender");
FHE.req(FHE.gt(amount, FHE.asEuint32(0)));
```

✅ **Use appropriate types**
```solidity
euint32 smallValue;  // 0 to 4 billion
euint64 largeValue;  // 0 to 18 quintillion
```

✅ **Test thoroughly**
```typescript
it("Should handle all edge cases", async function () {
    // Test zero values
    // Test maximum values
    // Test access control
    // Test error conditions
});
```

## Troubleshooting

### Contract Won't Compile

**Error**: `Cannot find module '@fhevm/solidity'`

**Fix**: Install dependencies
```bash
npm install
```

### Tests Failing

**Error**: `Provider not found`

**Fix**: Start local Hardhat node
```bash
npm run node
# In another terminal:
npm test
```

### Deployment Fails

**Error**: `Insufficient funds`

**Fix**: Get testnet ETH from faucet
- Sepolia: https://sepoliafaucet.com

## Resources

### Documentation

- [FHEVM Fundamentals](fhevm-fundamentals.md) - Deep dive into FHE concepts
- [API Reference](reference/api.md) - Complete API documentation
- [Best Practices](best-practices/overview.md) - Production guidelines

### Official Resources

- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [GitHub Repository](https://github.com/zama-ai/fhevm)
- [Community Forum](https://community.zama.ai)
- [Discord Channel](https://discord.gg/zama)

### Tools

- [fhevmjs](https://github.com/zama-ai/fhevmjs) - Client library for encryption
- [Hardhat](https://hardhat.org) - Development environment
- [Remix Plugin](https://remix.ethereum.org) - Browser-based IDE

## Get Help

- **Questions**: Ask in [Community Forum](https://community.zama.ai)
- **Bug Reports**: [GitHub Issues](https://github.com/zama-ai/fhevm/issues)
- **Real-time Chat**: [Discord #fhevm](https://discord.gg/zama)

---

**Ready to build privacy-preserving dApps? Start with the [FHE Counter example](basic/fhe-counter.md)!**
