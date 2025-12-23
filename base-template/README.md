# FHEVM Hardhat Template

A production-ready Hardhat template for developing privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) with Zama's FHEVM.

## Features

- **FHEVM Integration**: Pre-configured with @fhevm/solidity library
- **TypeScript Support**: Full TypeScript setup for scripts and tests
- **Testing Framework**: Comprehensive testing with Hardhat and Chai
- **Deployment Scripts**: Ready-to-use deployment scripts for local and testnet
- **Code Quality**: ESLint, Prettier, and Solhint configured
- **Gas Reporter**: Built-in gas usage reporting

## Quick Start

### Installation

```bash
npm install
```

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm test
```

### Deploy

```bash
# Local deployment
npm run node          # Terminal 1
npm run deploy:local  # Terminal 2

# Sepolia testnet
npm run deploy:sepolia
```

## Project Structure

```
base-template/
├── contracts/          # Solidity contracts
├── test/              # Test files
├── scripts/           # Deployment and utility scripts
├── hardhat.config.ts  # Hardhat configuration
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
└── .env.example       # Environment variables template
```

## Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://rpc.sepolia.org
ETHERSCAN_API_KEY=your_etherscan_api_key
REPORT_GAS=true
```

## Available Scripts

- `npm run compile` - Compile contracts
- `npm test` - Run tests
- `npm run coverage` - Generate coverage report
- `npm run clean` - Clean artifacts
- `npm run lint` - Lint Solidity files
- `npm run format` - Format code

## FHEVM Basics

This template includes examples of:
- Encrypted data types (euint32, euint64, ebool)
- FHE operations (add, sub, mul, etc.)
- Access control with FHE.allow()
- Input proofs and encryption

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama Community](https://www.zama.ai/community)

## License

BSD-3-Clause-Clear
