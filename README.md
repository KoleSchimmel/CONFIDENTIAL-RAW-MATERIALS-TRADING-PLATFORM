# FHEVM Example Hub

A comprehensive system for creating standalone FHEVM (Fully Homomorphic Encryption Virtual Machine) example repositories with automated scaffolding and documentation generation.

**Zama FHEVM Bounty Submission - December 2025**

[![License](https://img.shields.io/badge/license-BSD--3--Clause--Clear-blue.svg)](LICENSE)
[![Examples](https://img.shields.io/badge/examples-17-green.svg)](#available-examples)
[![Categories](https://img.shields.io/badge/categories-3-orange.svg)](#example-categories)

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Available Examples](#available-examples)
- [Project Structure](#project-structure)
- [Automation Tools](#automation-tools)
- [Core FHEVM Concepts](#core-fhevm-concepts)
- [Documentation](#documentation)
- [Development Workflow](#development-workflow)
- [Bounty Deliverables](#bounty-deliverables)
- [Contributing](#contributing)
- [Resources](#resources)
- [License](#license)
- [Video](https://youtu.be/kgFfIhuodnE)

## Overview

This project provides a complete ecosystem for learning and building with FHEVM by Zama. It includes:

- **🎯 17 Comprehensive Examples** - Covering basic operations, encryption, decryption, access control, and advanced use cases
- **🤖 Automated Scaffolding** - TypeScript-based CLI tools to generate standalone example repositories
- **📚 Auto-Generated Documentation** - GitBook-compatible markdown documentation with code examples
- **🛠️ Base Template** - Complete Hardhat setup ready for FHEVM development
- **✨ Production-Ready Code** - Well-commented, tested, and following best practices

### What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) enables computations on encrypted data without decrypting it. This revolutionary technology allows developers to build truly private smart contracts on the blockchain where:

- **Data remains encrypted on-chain** - Sensitive information never exposed
- **Computations on encrypted values** - Perform operations without decryption
- **Privacy-preserving logic** - Build confidential applications

## Quick Start

### Generate a Standalone Example

```bash
# Install dependencies
npm install

# Generate a single example repository
npm run create-example fhe-counter ./output/my-fhe-counter

# Navigate to the generated example
cd output/my-fhe-counter

# Install dependencies and run
npm install
npm run compile
npm run test
```

### Generate a Category Project (Multiple Examples)

```bash
# Generate all basic examples together
npm run create-category basic ./output/basic-examples

# Navigate and test
cd output/basic-examples
npm install
npm run compile
npm run test
```

### Generate Documentation

```bash
# Generate documentation for a single example
npm run generate-docs fhe-counter

# Generate all documentation
npm run generate-all-docs
```

### View Available Commands

```bash
npm run help:example     # Show example generation help
npm run help:category    # Show category generation help
npm run help:docs        # Show documentation generation help
```

## Available Examples

### Privacy-Preserving Delivery Category (5 examples)

Real-world application demonstrating FHE for anonymous logistics:

- **delivery-manager** - Core delivery lifecycle with encrypted addresses and privacy-preserving matching
- **payment-processor** - Confidential payment processing with encrypted amounts and automatic escrow
- **reputation-tracker** - Anonymous reputation system with encrypted ratings and zero-knowledge verification
- **privacy-layer** - FHE utility functions for address encryption and privacy-preserving operations
- **anonymous-delivery** - Complete integrated anonymous delivery platform

### Basic FHEVM Examples (11 examples)

#### Core Operations
- **fhe-counter** - Simple encrypted counter demonstrating increment/decrement operations
- **fhe-add** - FHE addition operations on encrypted uint32 values
- **fhe-comparison** - FHE comparison operations (eq, lt, gt, le, ge) on encrypted values
- **fhe-if-then-else** - Conditional operations using FHE.select without revealing conditions

#### Encryption
- **encrypt-single-value** - FHE encryption mechanism and common pitfalls
- **encrypt-multiple-values** - Handling multiple encrypted values with proper permissions

#### Decryption
- **user-decrypt-single-value** - User decryption with permission requirements
- **user-decrypt-multiple-values** - Decrypting multiple values for specific users
- **public-decrypt-single-value** - Public decryption for non-sensitive data
- **public-decrypt-multiple-values** - Public decryption of aggregated values

#### Access Control
- **access-control** - FHE.allow and FHE.allowTransient patterns

### Advanced Examples (1 example)

#### Auctions
- **blind-auction** - Sealed-bid auction with encrypted bids and privacy-preserving winner selection

## Project Structure

```
fhevm-example-hub/
├── base-template/               # Base Hardhat template for generated examples
│   ├── contracts/
│   │   ├── interfaces/          # Contract interfaces
│   │   └── libs/                # Shared libraries
│   ├── test/                    # Template test structure
│   ├── deploy/                  # Deployment scripts
│   ├── hardhat.config.ts        # Hardhat configuration
│   └── package.json             # Dependencies
│
├── contracts/                   # All example contracts (source)
│   ├── basic/                   # Basic FHEVM examples (11 contracts)
│   │   ├── FHECounter.sol
│   │   ├── AccessControl.sol
│   │   ├── encrypt/             # Encryption examples
│   │   ├── decrypt/             # Decryption examples
│   │   └── fhe-operations/      # FHE operators
│   ├── auctions/                # Auction examples (1 contract)
│   │   └── BlindAuction.sol
│   ├── DeliveryManager.sol      # Privacy-preserving delivery (5 contracts)
│   ├── PaymentProcessor.sol
│   ├── ReputationTracker.sol
│   ├── PrivacyLayer.sol
│   ├── AnonymousDelivery.sol
│   ├── interfaces/              # Contract interfaces
│   └── libs/                    # Shared libraries
│
├── test/                        # All test files
│   ├── basic/                   # Tests for basic examples
│   ├── auctions/                # Tests for auction examples
│   ├── utils/                   # Test utilities
│   └── [delivery system tests]
│
├── docs/                        # GitBook documentation
│   ├── SUMMARY.md               # Documentation index
│   ├── README.md                # Introduction
│   └── *.md                     # Individual example docs
│
├── scripts/                     # Automation tools
│   ├── create-fhevm-example.ts  # Repository generator
│   ├── create-fhevm-category.ts # Category generator
│   ├── generate-docs.ts         # Documentation generator
│   └── README.md                # Scripts documentation
│
└── README.md                    # This file
```

## Automation Tools

### create-fhevm-example.ts

Generates complete standalone repositories for **single examples**:

```bash
npm run create-example <example-name> <output-directory>
```

**Features:**
- Clones base template with full Hardhat setup
- Copies contract and test files
- Updates deployment scripts
- Generates example-specific README
- Creates ready-to-use standalone repository

**Available Examples:** 17 total (see [Available Examples](#available-examples))

[See scripts/README.md for details](scripts/README.md)

### create-fhevm-category.ts

Generates projects with **multiple examples from a category**:

```bash
npm run create-category <category> <output-directory>
```

**Features:**
- Bundles all contracts from a category
- Includes all corresponding tests
- Generates unified deployment script
- Creates comprehensive README
- Perfect for learning multiple related concepts

**Categories:**
- **privacy-delivery** (5 contracts) - Complete privacy-preserving delivery system
- **basic** (11 contracts) - Fundamental FHEVM operations and patterns
- **auctions** (1 contract) - Privacy-preserving auction implementations

[See scripts/README.md for details](scripts/README.md)

### generate-docs.ts

Creates GitBook-compatible documentation:

```bash
npm run generate-docs <example-name>    # Single example
npm run generate-all-docs                # All examples
```

**Features:**
- Extracts contract and test code
- Generates formatted markdown with tabs
- Updates SUMMARY.md index automatically
- Organizes by category
- Creates side-by-side contract/test view

[See scripts/README.md for details](scripts/README.md)

## Core FHEVM Concepts

### FHEVM Privacy Model

FHEVM uses encryption binding where values are bound to `[contract, user]` pairs:

1. **Encryption Binding** - Values encrypted locally, bound to specific contract/user
2. **Input Proofs** - Zero-knowledge proofs attest correct binding
3. **Permission System** - Both contract and user need FHE permissions

### Critical Patterns

#### ✅ DO: Grant Both Permissions

```solidity
euint32 encryptedValue = FHE.fromExternal(input, proof);

// BOTH permissions required
FHE.allowThis(encryptedValue);        // Contract permission
FHE.allow(encryptedValue, msg.sender); // User permission
```

#### ❌ DON'T: Forget allowThis

```solidity
euint32 encryptedValue = FHE.fromExternal(input, proof);

// WRONG: Missing allowThis - will fail!
FHE.allow(encryptedValue, msg.sender);
```

#### ✅ DO: Match Encryption Signer

```typescript
// Correct: Signer matches
const enc = await fhevm.createEncryptedInput(contractAddr, alice.address)
    .add32(123).encrypt();
await contract.connect(alice).operate(enc.handles[0], enc.inputProof);
```

#### ❌ DON'T: Mismatch Signer

```typescript
// Wrong: Signer mismatch - will fail!
const enc = await fhevm.createEncryptedInput(contractAddr, alice.address)
    .add32(123).encrypt();
await contract.connect(bob).operate(enc.handles[0], enc.inputProof);
```

### Common Anti-Patterns

All examples include extensive comments demonstrating both correct usage and common mistakes:

- Missing `FHE.allowThis` or `FHE.allow` permissions
- Encryption binding mismatches
- Attempting to use `ebool` in regular `if` statements
- Side effects in `FHE.select` arguments
- Forgetting to grant permissions to each value in arrays

## Documentation

### Auto-Generated Documentation

Each example can generate GitBook-compatible documentation:

```bash
npm run generate-docs <example-name>
```

Output includes:
- Contract and test code in tabbed format
- Comprehensive explanations
- Key concepts highlighted
- Usage examples
- Common pitfalls

### Developer Guides

- **[scripts/README.md](scripts/README.md)** - Complete automation tools guide
- **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** - Development patterns and best practices
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - Comprehensive testing documentation
- **[FHE_CONCEPTS.md](FHE_CONCEPTS.md)** - Learn FHE concepts and patterns
- **[API_REFERENCE.md](API_REFERENCE.md)** - Complete API documentation
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for all examples

### Submission Documentation

- **[BOUNTY_SUBMISSION.md](BOUNTY_SUBMISSION.md)** - Detailed submission overview
- **[COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)** - Project completion status
- **[SUBMISSION_FINAL_CHECKLIST.md](SUBMISSION_FINAL_CHECKLIST.md)** - Final verification checklist

## Development Workflow

### Creating a New Example

1. **Write Contract** in `contracts/<category>/YourExample.sol`
   - Include detailed comments explaining FHE concepts
   - Show both correct usage and common pitfalls

2. **Write Tests** in `test/<category>/YourExample.test.ts`
   - Include success and failure scenarios
   - Add explanatory comments

3. **Update Script Configurations**
   - Add to `EXAMPLES_MAP` in `scripts/create-fhevm-example.ts`
   - Add to `EXAMPLES_CONFIG` in `scripts/generate-docs.ts`
   - Update `CATEGORIES` in `scripts/create-fhevm-category.ts` if needed

4. **Generate Documentation**
   ```bash
   npm run generate-docs your-example
   ```

5. **Test Standalone Repository**
   ```bash
   npm run create-example your-example ./test-output
   cd test-output
   npm install && npm run compile && npm run test
   ```

### Testing in Base Template

```bash
# Test a contract before adding to examples
cd base-template/

# Copy your contract and test
cp ../contracts/YourExample.sol contracts/
cp ../test/YourExample.test.ts test/

# Test
npm run compile
npm run test
npm run lint
```

## Bounty Deliverables

This submission includes all required deliverables:

### ✅ base-template/
Complete Hardhat template with:
- @fhevm/solidity integration
- TypeScript configuration
- Test utilities
- Deployment scripts

### ✅ Automation Scripts (TypeScript)
Three comprehensive automation tools:
- **create-fhevm-example.ts** - Single example generation (17 examples)
- **create-fhevm-category.ts** - Category generation (3 categories)
- **generate-docs.ts** - Documentation generation (17 configs)

### ✅ Example Repositories (17 Total)
Fully working examples covering:
- **Privacy-Preserving Delivery** (5 examples) - Real-world application
- **Basic FHEVM** (11 examples) - Core concepts and operations
- **Advanced** (1 example) - Complex use case (blind auction)

### ✅ Auto-Generated Documentation
- GitBook-compatible markdown
- Automated SUMMARY.md updates
- Code examples with syntax highlighting
- Tabbed contract/test view

### ✅ Developer Guide
Comprehensive guides including:
- Adding new examples
- Updating dependencies
- Configuration patterns
- Best practices
- Troubleshooting

### ✅ Complete Test Suite
- Test utilities (instance.ts, signers.ts)
- Example test patterns
- Integration test framework
- Comprehensive FHECounter tests

### Example Categories

- **Privacy-Preserving Delivery** (5 examples) - Complete suite demonstrating FHE for anonymous logistics
- **Basic FHEVM** (11 examples) - Fundamental operations including encryption, decryption, arithmetic, comparisons, and access control
- **Advanced Auctions** (1 example) - Privacy-preserving blind auction implementation

### Features

- ✅ Automated scaffolding tools for generating example repositories
- ✅ Documentation generation from code annotations
- ✅ Category-based project generation
- ✅ Complete implementation of bounty requirements
- ✅ TypeScript-based automation for type safety
- ✅ GitBook-compatible documentation format
- ✅ Comprehensive code examples with best practices and anti-patterns

## Key Dependencies

- **@fhevm/solidity** (v0.9.1) - Core FHEVM Solidity library
- **@fhevm/hardhat-plugin** (v0.3.0-1) - FHEVM testing integration
- **hardhat** - Development environment
- **hardhat-deploy** - Deployment management
- **TypeScript** - Automation and testing

## Testing

```bash
# Run all tests
npm run test

# Run specific contract tests
npm run test test/basic/FHECounter.test.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Gas usage report
npm run test:gas
```

## Resources

- **FHEVM Documentation**: https://docs.zama.ai/fhevm
- **Protocol Examples**: https://docs.zama.org/protocol/examples
- **Base Template**: https://github.com/zama-ai/fhevm-hardhat-template
- **OpenZeppelin Confidential**: https://github.com/OpenZeppelin/openzeppelin-confidential-contracts

## Maintenance

### Updating Dependencies

When `@fhevm/solidity` releases a new version:

1. **Update Base Template**
   ```bash
   cd base-template/
   npm install @fhevm/solidity@latest
   npm run compile
   npm run test
   ```

2. **Test All Examples**
   - Regenerate key examples
   - Ensure they compile and pass tests
   - Update if breaking changes exist

3. **Update Documentation**
   - Regenerate docs if APIs changed
   - Update patterns with new best practices

### Bulk Operations

```bash
# Regenerate all documentation
npm run generate-all-docs

# Test multiple examples
for example in fhe-counter encrypt-single-value user-decrypt-single-value; do
  npm run create-example $example ./test-output/$example
  cd ./test-output/$example && npm install && npm test && cd ../..
done
```

## Contributing

Contributions are welcome! When adding examples:

1. Follow existing patterns and structure
2. Include comprehensive comments in code
3. Demonstrate both correct and incorrect usage
4. Update all automation scripts
5. Test generated standalone repository
6. Verify documentation renders correctly

### Adding a New Example

```bash
# 1. Create contract in contracts/<category>/
# 2. Create test in test/<category>/
# 3. Update scripts/create-fhevm-example.ts
# 4. Update scripts/generate-docs.ts
# 5. Update scripts/create-fhevm-category.ts (if new category)
# 6. Generate documentation
npm run generate-docs new-example
# 7. Test standalone generation
npm run create-example new-example ./test-output
```

## License

This project is licensed under the BSD-3-Clause-Clear License - see the [LICENSE](LICENSE) file for details.

The BSD-3-Clause-Clear License provides:
- Freedom to use, modify, and distribute
- Clear liability limitations
- Protection against AI training without permission

## Bounty Competition Status

**Status**: ✅ Complete and Ready for Submission

This project is submitted for the **Zama FHEVM Bounty Competition (December 2025)** with:

- ✅ All required smart contracts implemented (17 examples)
- ✅ Comprehensive automation tools (3 TypeScript scripts)
- ✅ Complete documentation suite (15+ documentation files)
- ✅ Deployment scripts for multiple networks
- ✅ Code quality standards met
- ✅ FHEVM patterns properly implemented
- ✅ Production-ready code

For complete submission details, see [BOUNTY_SUBMISSION.md](BOUNTY_SUBMISSION.md).

---

## Support & Community

- **Documentation**: See the documentation files linked above
- **Zama Community**: https://www.zama.ai/community
- **Zama Discord**: https://discord.com/invite/zama
- **FHEVM Docs**: https://docs.zama.ai/fhevm

## Acknowledgments

**Built with FHEVM by Zama**

This project demonstrates the power of Fully Homomorphic Encryption for building privacy-preserving smart contracts. Special thanks to the Zama team for developing FHEVM and providing excellent documentation.

---

**For questions or support, please visit the [Zama Community Forum](https://www.zama.ai/community) or join the [Zama Discord](https://discord.com/invite/zama).**
