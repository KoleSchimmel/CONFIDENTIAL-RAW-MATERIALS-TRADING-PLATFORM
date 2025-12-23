# Project Setup and Quick Start Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env and fill in your private key and RPC URL
```

### 3. Compile Contracts

```bash
npm run compile
```

### 4. Run Tests

```bash
npm test
```

### 5. Local Deployment

```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy to local network
npm run deploy:local
```

### 6. Sepolia Testnet Deployment

```bash
npm run deploy:sepolia
npm run verify:sepolia
npm run initialize:sepolia
```

## Available Commands

### Compilation and Testing
```bash
npm run compile       # Compile contracts
npm test             # Run all tests
npm run coverage     # Generate coverage report
npm run clean        # Clean build artifacts
```

### Deployment
```bash
npm run deploy:local      # Deploy to local node
npm run deploy:sepolia    # Deploy to Sepolia testnet
npm run verify:sepolia    # Verify contract on Etherscan
npm run initialize:sepolia # Initialize contract state
```

### Automation Scripts
```bash
npm run create-example   # Create new example
npm run create-category  # Create category examples
npm run generate-docs    # Generate documentation
npm run monitor:events   # Monitor contract events
```

### Development Tools
```bash
npm run console:local    # Open local Hardhat console
npm run console:sepolia  # Open Sepolia Hardhat console
npm run lint            # Check code style
npm run format          # Format code
npm run typecheck       # TypeScript type checking
```

## Project Structure

```
├── contracts/                    # Solidity contracts
│   └── ConfidentialRawMaterialsTrading.sol
├── test/                        # Test files
│   └── ConfidentialRawMaterialsTrading.test.ts
├── scripts/                     # Automation scripts
│   ├── deploy.ts               # Deployment script
│   ├── initialize.ts           # Initialization script
│   ├── monitor-events.ts       # Event monitoring script
│   ├── create-fhevm-example.ts # Example creation script
│   ├── create-fhevm-category.ts # Category creation script
│   └── generate-docs.ts        # Documentation generation script
├── docs/                        # Documentation
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── DEVELOPER_GUIDE.md
│   └── SUBMISSION_INDEX.md
├── artifacts/                   # Compilation output
├── cache/                       # Cache files
├── hardhat.config.ts           # Hardhat configuration
├── package.json               # npm configuration
├── tsconfig.json              # TypeScript configuration
└── .env.example               # Environment variables template
```

## Environment Variables

### Required Configuration
```
PRIVATE_KEY=0x...              # Deployment account private key (testnet only)
```

### Optional Configuration
```
SEPOLIA_RPC_URL=https://...    # Sepolia RPC endpoint
ETHERSCAN_API_KEY=...          # Etherscan API key (for verification)
REPORT_GAS=true                # Whether to generate gas report
```

## Frequently Asked Questions

### Q: Where should I get the private key?
A: Export from MetaMask, but **only use testnet wallets**, never use on mainnet.

### Q: How to get Sepolia ETH?
A: Visit https://sepoliafaucet.com or other Sepolia faucets.

### Q: Where is the contract address?
A: After deployment, it will be saved in `deployments/sepolia.json`

### Q: How to verify the contract?
A:
```bash
npm run verify:sepolia -- 0xYOUR_CONTRACT_ADDRESS
```

## Documentation Reading Guide

- **SUBMISSION.md**: Complete bounty submission document
- **ARCHITECTURE.md**: Technical architecture and design
- **DEPLOYMENT.md**: Detailed deployment guide
- **DEVELOPER_GUIDE.md**: Developer guide and extension documentation
- **SUBMISSION_INDEX.md**: Documentation navigation index

## Key File Descriptions

### contracts/ConfidentialRawMaterialsTrading.sol
Main contract implementing a complete raw materials trading marketplace using FHE to protect sensitive data.

**Main Functions**:
- `listMaterial()`: Suppliers list materials (encrypted quantity and price)
- `placeOrder()`: Buyers place orders (encrypted requirements and price limits)
- `matchTrade()`: Suppliers match orders (encrypted operations)
- `confirmTrade()`: Confirm trade completion
- `verifySupplier()`: Verify supplier identity
- `verifyBuyer()`: Verify buyer identity

### test/ConfidentialRawMaterialsTrading.test.ts
Contains 45+ test cases covering:
- Contract deployment
- Access control
- FHE operations
- Business logic
- Edge cases
- Common error patterns

## Deployment Workflow

```
1. Compile contracts
   npm run compile

2. Run tests
   npm test

3. Setup environment
   cp .env.example .env
   # Edit .env

4. Deploy to Sepolia
   npm run deploy:sepolia

5. Verify contract
   npm run verify:sepolia

6. Initialize state
   npm run initialize:sepolia

7. Monitor events
   npm run monitor:events
```

## Using Automation Scripts

### Create New Example

```bash
npm run create-example -- \
  --name MyExample \
  --category basic \
  --description "My FHE Example"
```

### Create Category Examples

```bash
npm run create-category -- --category access-control
```

### Generate Documentation

```bash
npm run generate-docs
```

## Contact and Support

- Zama Community: https://www.zama.ai/community
- Zama Discord: https://discord.com/invite/zama
- Documentation: https://docs.zama.ai
- GitHub: https://github.com/zama-ai/fhevm

## License

MIT License - See LICENSE file for details
