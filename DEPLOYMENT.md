# Deployment Guide - Confidential Raw Materials Trading

## Overview

This guide covers deploying the Confidential Raw Materials Trading smart contract to various networks (Sepolia testnet and local development).

## Prerequisites

### Required Software
- Node.js (v16 or higher)
- npm or yarn
- Git
- A text editor (VS Code recommended)

### Required Accounts/Keys
- Ethereum wallet (MetaMask, Ledger, or similar)
- Private key for deployment account
- Some Sepolia testnet ETH (for gas fees)

### Optional Tools
- Hardhat (installed via npm)
- Etherscan account (for contract verification)
- Remix IDE (for contract exploration)

---

## Environment Setup

### Step 1: Install Dependencies

```bash
# Navigate to project directory
cd ConfidentialRawMaterialsTrading

# Install npm packages
npm install

# Verify Hardhat installation
npx hardhat --version
```

### Step 2: Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your values
# Required variables:
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_key_optional

# Network RPC endpoints (optional, defaults provided):
SEPOLIA_RPC_URL=https://rpc.sepolia.org
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/your-key
```

### Step 3: Verify Configuration

```bash
# Test network connectivity
npx hardhat test --network localhost

# Check Hardhat config
npx hardhat networks
```

---

## Local Development Deployment

### Option 1: Hardhat Local Node

**Best For**: Development and testing without testnet fees

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Output:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545
# Accounts:
# Account #0: 0x1234...
# Private Key: 0xabcd...
```

### Option 2: Deploy to Local Node

```bash
# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.ts --network localhost

# Output:
# ConfidentialRawMaterialsTrading deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
# Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffb92266e
```

### Step-by-Step Local Deployment

**1. Prepare Deployment Script**

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ConfidentialRawMaterialsTrading...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from account:", deployer.address);

  // Get contract factory
  const ContractFactory = await ethers.getContractFactory(
    "ConfidentialRawMaterialsTrading"
  );

  // Deploy contract
  const contract = await ContractFactory.deploy();
  await contract.deployed();

  console.log("Contract deployed to:", contract.address);
  console.log("Owner:", await contract.owner());

  // Verify deployment
  const codeSize = await ethers.provider.getCode(contract.address);
  console.log("Contract code deployed:", codeSize.length > 2);

  return contract.address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**2. Compile Smart Contracts**

```bash
npx hardhat compile

# Output:
# Compiling 1 file with 0.8.24
# Successfully compiled 1 Solidity file
```

**3. Run Tests**

```bash
npx hardhat test

# Output:
# ConfidentialRawMaterialsTrading
#   ✓ Deploys successfully (123ms)
#   ✓ Verifies suppliers (456ms)
#   ... [45 more tests]
# 45 tests passed in 1.234s
```

**4. Deploy to Local Node**

```bash
npx hardhat run scripts/deploy.ts --network localhost

# Save the contract address for later use
# Example: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**5. Verify Contract State**

```bash
# Use Hardhat console to verify
npx hardhat console --network localhost

# In console:
> const contract = await ethers.getContractAt(
    "ConfidentialRawMaterialsTrading",
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
  )
> await contract.owner()
# '0xf39Fd6e51aad88F6F4ce6aB8827279cffb92266e'
```

---

## Sepolia Testnet Deployment

### Step 1: Obtain Test ETH

**Option A: Sepolia Faucets**
- Go to: https://sepoliafaucet.com
- Or: https://faucet.quicknode.com/sepolia
- Request 0.5+ ETH to your wallet address

**Option B: Alchemy Faucet**
- Create account at https://alchemy.com
- Use faucet for free test ETH

**Verification**: Check balance on Sepolia Explorer
- https://sepolia.etherscan.io/address/YOUR_ADDRESS

### Step 2: Configure Hardhat for Sepolia

```bash
# Edit hardhat.config.ts
module.exports = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111
    }
  }
}
```

### Step 3: Prepare Private Key

```bash
# In .env file
PRIVATE_KEY=0x1234567890abcdef...

# ⚠️ SECURITY WARNING ⚠️
# - NEVER commit .env to version control
# - Add to .gitignore: echo ".env" >> .gitignore
# - Use separate wallet for testnet
# - Keep mainnet keys in hardware wallet
```

### Step 4: Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia

# Output:
# Deploying ConfidentialRawMaterialsTrading...
# Deploying from account: 0x1234567890abcdef...
# Contract deployed to: 0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827
# Owner: 0x1234567890abcdef...
```

### Step 5: Verify Deployment on Etherscan

**Option A: Automated Verification**

```bash
# After deployment, verify with Hardhat
npx hardhat verify --network sepolia \
  0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827 \
  --contract "contracts/ConfidentialRawMaterialsTrading.sol:ConfidentialRawMaterialsTrading"

# Output:
# Verifying deployment...
# Successfully verified contract on etherscan
```

**Option B: Manual Verification on Etherscan**

1. Go to: https://sepolia.etherscan.io/contract/0x57190...
2. Click "Verify and Publish"
3. Choose: Solidity (Single file)
4. Paste contract code
5. Compiler version: 0.8.24
6. Click "Verify"

### Step 6: Test on Testnet

```bash
# Create test script
cat > scripts/test-sepolia.ts << 'EOF'
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827";
  const contract = await ethers.getContractAt(
    "ConfidentialRawMaterialsTrading",
    contractAddress
  );

  // Test 1: Check owner
  const owner = await contract.owner();
  console.log("Owner:", owner);

  // Test 2: Verify a supplier
  const [signer] = await ethers.getSigners();
  const tx = await contract.verifySupplier(signer.address);
  console.log("Verification tx:", tx.hash);
  await tx.wait();

  // Test 3: Check verification
  const isVerified = await contract.verifiedSuppliers(signer.address);
  console.log("Verified as supplier:", isVerified);

  console.log("✓ Sepolia deployment working!");
}

main().catch(console.error);
EOF

# Run test
npx hardhat run scripts/test-sepolia.ts --network sepolia
```

---

## Contract Interaction

### Using Hardhat Console

```bash
# Start Hardhat console on Sepolia
npx hardhat console --network sepolia

# Connect to contract
> const contract = await ethers.getContractAt(
    "ConfidentialRawMaterialsTrading",
    "0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827"
  )

# Get owner
> const owner = await contract.owner()
> owner
'0x1234567890abcdef...'

# Verify yourself as supplier
> const tx = await contract.verifySupplier(
    "0x1234567890abcdef..."
  )
> await tx.wait()
{
  transactionHash: '0xabcd...',
  blockNumber: 5234567,
  gasUsed: 45123,
  ...
}

# Check verification
> await contract.verifiedSuppliers("0x1234567890abcdef...")
true
```

### Using ethers.js in Frontend

```typescript
// frontend/src/contractService.ts
import { Contract, ethers } from "ethers";
import { ABI } from "./contractABI";

class ContractService {
  private contract: Contract | null = null;

  async init(provider: ethers.providers.Provider, signer: ethers.Signer) {
    const contractAddress = "0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827";
    this.contract = new Contract(contractAddress, ABI, signer);
  }

  async verifySupplier(address: string) {
    const tx = await this.contract!.verifySupplier(address);
    return await tx.wait();
  }

  async listMaterial(
    name: string,
    category: number,
    quantity: number,
    price: string,
    minOrder: number,
    grade: string,
    delivery: number
  ) {
    const tx = await this.contract!.listMaterial(
      name,
      category,
      quantity,
      ethers.utils.parseUnits(price, 2),
      minOrder,
      grade,
      delivery
    );
    return await tx.wait();
  }
}
```

---

## Post-Deployment Configuration

### Step 1: Initialize Contract State

```bash
# Script to set up initial state
cat > scripts/initialize.ts << 'EOF'
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827";
  const contract = await ethers.getContractAt(
    "ConfidentialRawMaterialsTrading",
    contractAddress
  );

  const [deployer, supplier1, supplier2, buyer1, buyer2] =
    await ethers.getSigners();

  console.log("Setting up contract state...");

  // Verify suppliers
  console.log("Verifying suppliers...");
  let tx = await contract.verifySupplier(supplier1.address);
  await tx.wait();
  console.log("✓ Supplier 1 verified");

  tx = await contract.verifySupplier(supplier2.address);
  await tx.wait();
  console.log("✓ Supplier 2 verified");

  // Verify buyers
  console.log("Verifying buyers...");
  tx = await contract.verifyBuyer(buyer1.address);
  await tx.wait();
  console.log("✓ Buyer 1 verified");

  tx = await contract.verifyBuyer(buyer2.address);
  await tx.wait();
  console.log("✓ Buyer 2 verified");

  console.log("✓ Contract initialization complete!");
}

main().catch(console.error);
EOF

npx hardhat run scripts/initialize.ts --network sepolia
```

### Step 2: Monitor Contract Events

```typescript
// scripts/monitor-events.ts
import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x57190DE0E0bF65eF2356a7BFa0bE0A05b0c48827";
  const contract = await ethers.getContractAt(
    "ConfidentialRawMaterialsTrading",
    contractAddress
  );

  console.log("Listening for contract events...");

  contract.on("MaterialListed", (materialId, supplier, category) => {
    console.log(
      `📦 New material listed: ID=${materialId}, Category=${category}`
    );
  });

  contract.on("OrderPlaced", (orderId, buyer, materialId) => {
    console.log(`📝 New order placed: ID=${orderId}, Material=${materialId}`);
  });

  contract.on("TradeMatched", (orderId, materialId, buyer, supplier) => {
    console.log(`🤝 Trade matched: Order=${orderId}, Buyer=${buyer}`);
  });

  contract.on("TradeCompleted", (orderId, materialId) => {
    console.log(`✅ Trade completed: Order=${orderId}`);
  });

  // Keep listening
  process.on("SIGINT", () => {
    console.log("\nStopped listening for events");
    process.exit(0);
  });
}

main().catch(console.error);
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Private Key Not Found"

```
Error: No private key provided
```

**Solution**:
```bash
# Check .env file exists
ls -la .env

# Verify PRIVATE_KEY is set
grep PRIVATE_KEY .env

# Make sure it's hex format
# Should start with 0x
```

#### Issue 2: "Insufficient Funds"

```
Error: insufficient funds for gas * price + value
```

**Solution**:
```bash
# Get more testnet ETH
# Go to: https://sepoliafaucet.com

# Check current balance
npx hardhat run scripts/check-balance.ts --network sepolia

# Create script:
cat > scripts/check-balance.ts << 'EOF'
import { ethers } from "hardhat";
const main = async () => {
  const [signer] = await ethers.getSigners();
  const balance = await signer.getBalance();
  console.log("Balance:", ethers.utils.formatEther(balance), "ETH");
};
main();
EOF
```

#### Issue 3: "Network Error"

```
Error: Could not connect to Sepolia RPC
```

**Solution**:
```bash
# Verify RPC endpoint
npx hardhat test --network sepolia --show-stack-traces

# Check network connectivity
curl -X POST https://rpc.sepolia.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'

# Response should be: {"jsonrpc":"2.0","result":"0xaa36a7","id":1}
# (0xaa36a7 = 11155111 = Sepolia chain ID)
```

#### Issue 4: "Contract Already Verified"

```
Error: Contract source code already verified
```

**Solution**: Already verified on Etherscan - use existing verification

#### Issue 5: "Out of Memory During Compilation"

```
Error: JavaScript heap out of memory
```

**Solution**:
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npx hardhat compile

# Or use parallel compilation
# Add to hardhat.config.ts:
const config = {
  solidity: {
    compilers: [{
      version: "0.8.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }]
  }
}
```

---

## Verification Checklist

After deployment, verify:

- [ ] Contract address obtained
- [ ] Owner set correctly
- [ ] Sepolia testnet deployment visible on Etherscan
- [ ] Contract code verified on Etherscan
- [ ] Contract initialization script ran successfully
- [ ] Supplier/buyer verification working
- [ ] Material listing gas estimated
- [ ] Order placement tested
- [ ] Event monitoring active
- [ ] Frontend connected to contract

---

## Gas Cost Summary

| Operation | Gas | ETH (at 2 gwei) | USD (at $2000/ETH) |
|-----------|-----|-----------------|-------------------|
| Deploy | 950,000 | 0.0019 | $3.80 |
| Verify Supplier | 45,000 | 0.0001 | $0.18 |
| List Material | 85,000 | 0.0002 | $0.34 |
| Place Order | 95,000 | 0.0002 | $0.38 |
| Match Trade | 125,000 | 0.0003 | $0.50 |
| Confirm Trade | 45,000 | 0.0001 | $0.18 |

---

## Security Reminders

1. **Never Share Private Keys**
   - Use environment variables
   - Never commit to version control
   - Different keys for testnet/mainnet

2. **Test Before Mainnet**
   - Deploy on Sepolia first
   - Test all functions
   - Monitor for errors

3. **Verify Contracts**
   - Use Etherscan verification
   - Independent code audit recommended
   - Security review before production

4. **Monitor Events**
   - Set up event monitoring
   - Alert on anomalies
   - Keep audit trail

---

## Next Steps

1. Deploy to Sepolia ✓
2. Test all contract functions
3. Deploy frontend
4. Connect to contract
5. Run integration tests
6. Monitor production usage

For support and questions, refer to:
- Hardhat Documentation: https://hardhat.org
- Zama FHEVM Docs: https://docs.zama.ai
- Etherscan: https://sepolia.etherscan.io
