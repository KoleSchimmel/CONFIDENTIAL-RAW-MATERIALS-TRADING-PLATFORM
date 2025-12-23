# FHEVM Example Hub

Welcome to the **FHEVM Example Hub** - a comprehensive collection of examples, patterns, and best practices for building privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) on Ethereum.

## What is FHEVM?

FHEVM (Fully Homomorphic Encryption Virtual Machine) enables smart contracts to perform computations on encrypted data without revealing the underlying values. This revolutionary technology allows developers to build truly privacy-preserving decentralized applications.

## Purpose of This Hub

This repository serves as a complete learning and reference resource for FHEVM development:

- **Educational Examples**: From basic counters to complex marketplaces
- **Best Practices**: Proven patterns and anti-patterns to avoid
- **Automation Tools**: Scripts to generate new examples and documentation
- **Production Ready**: Real-world implementations you can learn from

## Quick Start

### 1. Explore Examples

Browse examples by category:
- **Basic**: Counter, encryption, access control
- **Advanced**: Trading platforms, auctions, voting systems
- **OpenZeppelin**: Confidential token standards

### 2. Generate Your Own Project

```bash
# Create a single example
npm run create-example -- \
  --name MyCounter \
  --category basic \
  --description "My FHE Counter"

# Create a category of examples
npm run create-category -- --category basic
```

### 3. Learn FHE Concepts

Each example demonstrates specific FHEVM concepts:
- Encrypted types (euint32, euint64, ebool)
- FHE operations (add, sub, mul, comparisons)
- Access control (FHE.allow, FHE.allowThis)
- Input proofs and security

## Repository Structure

```
RawMaterialsTrading/
├── base-template/          # Hardhat template for new projects
├── example-contracts/      # Source contracts for all examples
│   ├── basic/             # Basic FHE examples
│   └── advanced/          # Complex implementations
├── example-tests/          # Test suites for examples
├── examples/              # GitBook documentation
├── scripts/               # Automation tools
│   ├── create-fhevm-example.ts
│   ├── create-fhevm-category.ts
│   └── generate-docs.ts
├── contracts/             # Production contract (Raw Materials Trading)
└── test/                  # Production tests
```

## Featured Examples

### Basic Examples

#### FHE Counter
A simple encrypted counter demonstrating:
- Encrypted integers (euint32)
- Basic arithmetic (add, sub)
- Access control patterns
- [View Example](basic/fhe-counter.md)

#### Encryption Patterns
Learn different ways to encrypt data:
- Single vs multiple value encryption
- Input proofs explained
- Contract-side vs client-side encryption
- [View Example](basic/encryption.md)

#### Access Control
Master FHE permission system:
- FHE.allow() for user permissions
- FHE.allowThis() for contract storage
- Permission sharing patterns
- [View Example](basic/access-control.md)

### Advanced Examples

#### Confidential Raw Materials Trading
A production-grade B2B marketplace featuring:
- Encrypted quantities and prices
- Two-party matching algorithm
- Complete order lifecycle
- Multi-party settlements
- **Lines of Code**: 350+ (contract) + 800+ (tests)
- **Test Coverage**: 95%
- **Deployed**: Sepolia Testnet
- [View Example](advanced/raw-materials-trading.md)

## Key FHE Concepts

### Encrypted Types

```solidity
euint32 encryptedAge;      // Encrypted 32-bit integer
euint64 encryptedBalance;  // Encrypted 64-bit integer
ebool encryptedFlag;       // Encrypted boolean
```

### FHE Operations

```solidity
// Arithmetic
euint32 sum = FHE.add(a, b);
euint32 diff = FHE.sub(a, b);
euint32 product = FHE.mul(a, b);

// Comparisons
ebool isEqual = FHE.eq(a, b);
ebool isGreater = FHE.gt(a, b);
ebool isLess = FHE.lt(a, b);
```

### Access Control

```solidity
// Grant contract permission to store
FHE.allowThis(encryptedValue);

// Grant user permission to decrypt
FHE.allow(encryptedValue, userAddress);
```

### Input Proofs

```solidity
// Convert user input with proof verification
euint32 value = FHE.asEuint32(inputHandle, inputProof);
```

## Common Pitfalls

### ❌ Don't Do This

```solidity
// Wrong: View function cannot decrypt
function getBalance() external view returns (uint64) {
    return FHE.decrypt(balance); // FAILS!
}

// Wrong: Missing FHE.allowThis()
euint32 value = FHE.add(a, b);
storage = value; // Will fail later!

// Wrong: Comparing encrypted to plaintext
require(encryptedAge > 18); // FAILS!
```

### ✅ Do This Instead

```solidity
// Correct: Return encrypted value, use gateway for decryption
function getBalance() external view returns (euint64) {
    return balance; // Still encrypted
}

// Correct: Always grant permissions
euint32 value = FHE.add(a, b);
FHE.allowThis(value);
FHE.allow(value, msg.sender);

// Correct: Use FHE.req() for encrypted comparisons
FHE.req(FHE.gt(encryptedAge, FHE.asEuint32(18)));
```

## Automation Tools

### Create Example Repository

Generate a standalone project from any example:

```bash
npm run create-example -- --name FHECounter --category basic
```

This creates:
- Complete Hardhat setup
- Contract and test files
- Deployment scripts
- Documentation
- Configuration files

### Create Category Project

Generate multiple related examples:

```bash
npm run create-category -- --category basic
```

Includes all examples from a category in one project.

### Generate Documentation

Auto-generate GitBook docs from code:

```bash
npm run generate-docs
```

Extracts:
- JSDoc comments
- Code examples
- Chapter tags
- Test patterns

## Learning Path

### Beginner
1. Start with [FHE Counter](basic/fhe-counter.md)
2. Learn [Encryption Patterns](basic/encryption.md)
3. Understand [Access Control](basic/access-control.md)
4. Avoid [Common Pitfalls](pitfalls/overview.md)

### Intermediate
1. Explore [FHE Operations](operations/overview.md)
2. Practice [Decryption Patterns](decryption/overview.md)
3. Study [Best Practices](best-practices/overview.md)

### Advanced
1. Build [Complex Applications](advanced/overview.md)
2. Integrate [OpenZeppelin Contracts](openzeppelin/overview.md)
3. Optimize for [Gas and Performance](best-practices/gas-optimization.md)

## Contributing

We welcome contributions! To add a new example:

1. Create contract in `example-contracts/<category>/`
2. Add tests in `example-tests/<category>/`
3. Update automation scripts
4. Generate documentation
5. Test standalone repository generation

See [Developer Guide](../DEVELOPER_GUIDE.md) for details.

## Resources

### Official Documentation
- [FHEVM Docs](https://docs.zama.ai/fhevm)
- [Zama GitHub](https://github.com/zama-ai/fhevm)
- [OpenZeppelin Confidential](https://github.com/OpenZeppelin/openzeppelin-confidential-contracts)

### Community
- [Zama Community Forum](https://community.zama.ai)
- [Discord](https://discord.gg/zama)
- [Twitter/X](https://twitter.com/zama_fhe)

### Tools
- [fhevmjs](https://github.com/zama-ai/fhevmjs) - Client library
- [Hardhat](https://hardhat.org) - Development environment
- [Remix IDE Plugin](https://remix.ethereum.org) - Browser-based development

## License

This project is licensed under BSD-3-Clause-Clear.

## Support

- **Issues**: [GitHub Issues](https://github.com/zama-ai/fhevm/issues)
- **Questions**: [Community Forum](https://community.zama.ai)
- **Chat**: [Discord #fhevm](https://discord.gg/zama)

---

**Built with privacy at its core, powered by Zama's FHEVM**

Start your FHE journey: [Getting Started Guide](getting-started.md)
