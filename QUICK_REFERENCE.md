# Quick Reference Guide

## All Available Examples (17 Total)

### Privacy-Preserving Delivery (5)
```bash
npm run create-example delivery-manager ./output/delivery-manager
npm run create-example payment-processor ./output/payment-processor
npm run create-example reputation-tracker ./output/reputation-tracker
npm run create-example privacy-layer ./output/privacy-layer
npm run create-example anonymous-delivery ./output/anonymous-delivery
```

### Basic - Core Operations (4)
```bash
npm run create-example fhe-counter ./output/fhe-counter
npm run create-example fhe-add ./output/fhe-add
npm run create-example fhe-comparison ./output/fhe-comparison
npm run create-example fhe-if-then-else ./output/fhe-if-then-else
```

### Basic - Encryption (2)
```bash
npm run create-example encrypt-single-value ./output/encrypt-single
npm run create-example encrypt-multiple-values ./output/encrypt-multiple
```

### Basic - User Decryption (2)
```bash
npm run create-example user-decrypt-single-value ./output/user-decrypt-single
npm run create-example user-decrypt-multiple-values ./output/user-decrypt-multiple
```

### Basic - Public Decryption (2)
```bash
npm run create-example public-decrypt-single-value ./output/public-decrypt-single
npm run create-example public-decrypt-multiple-values ./output/public-decrypt-multiple
```

### Basic - Access Control (1)
```bash
npm run create-example access-control ./output/access-control
```

### Advanced - Auctions (1)
```bash
npm run create-example blind-auction ./output/blind-auction
```

## Categories (3)

```bash
# Privacy-Preserving Delivery System (5 examples)
npm run create-category privacy-delivery ./output/privacy-delivery

# Basic FHEVM Examples (11 examples)
npm run create-category basic ./output/basic-examples

# Auction Examples (1 example)
npm run create-category auctions ./output/auction-examples
```

## Documentation

```bash
# Generate docs for single example
npm run generate-docs fhe-counter

# Generate all documentation
npm run generate-all-docs

# Show help
npm run help:example
npm run help:category
npm run help:docs
```

## Key Contracts by Category

### 🔐 Encryption Concepts
- **EncryptSingleValue.sol** - How encryption works, binding, proofs
- **EncryptMultipleValues.sol** - Managing multiple encrypted values
- **AccessControl.sol** - FHE.allow vs FHE.allowTransient

### 🔓 Decryption Concepts
- **UserDecryptSingleValue.sol** - User-specific decryption
- **UserDecryptMultipleValues.sol** - Decrypting multiple values
- **PublicDecryptSingleValue.sol** - Public decryption (no user binding)
- **PublicDecryptMultipleValues.sol** - Public aggregation

### 🧮 Operations
- **FHECounter.sol** - Increment/decrement encrypted values
- **FHEAdd.sol** - Arithmetic on encrypted data
- **FHEComparison.sol** - Comparison without decryption (eq, lt, gt, etc.)
- **FHEIfThenElse.sol** - Conditional logic on encrypted values

### 🎯 Real-World Applications
- **BlindAuction.sol** - Sealed-bid auction (advanced)
- **DeliveryManager.sol** - Privacy-preserving delivery
- **PaymentProcessor.sol** - Confidential payments
- **ReputationTracker.sol** - Anonymous ratings
- **AnonymousDelivery.sol** - Complete integrated platform

## Common Patterns

### Permission Setup (CRITICAL)
```solidity
// For stored encrypted values
euint32 value = FHE.fromExternal(input, proof);
FHE.allowThis(value);          // Contract permission
FHE.allow(value, msg.sender);  // User permission

// For temporary operations in view functions
FHE.allowTransient(value, msg.sender);
```

### Comparisons (Returns encrypted boolean)
```solidity
ebool condition = FHE.eq(a, b);      // Equal?
ebool condition = FHE.gt(a, b);      // Greater than?
ebool condition = FHE.lt(a, b);      // Less than?

// Use with select, not with if statement
euint32 result = FHE.select(condition, optionA, optionB);
```

### Arithmetic
```solidity
euint32 result = FHE.add(a, b);      // Addition
euint32 result = FHE.sub(a, b);      // Subtraction
euint32 result = FHE.mul(a, b);      // Multiplication
euint32 result = FHE.div(a, b);      // Division
```

## File Structure

```
contracts/
├── basic/                      # 11 basic examples
│   ├── FHECounter.sol
│   ├── AccessControl.sol
│   ├── encrypt/                # 2 examples
│   ├── decrypt/                # 4 examples
│   └── fhe-operations/         # 4 examples
├── auctions/                   # 1 auction example
│   └── BlindAuction.sol
├── [5 delivery system contracts]
└── interfaces/ & libs/

test/
├── basic/                      # Matching test structure
├── auctions/
├── [delivery system tests]
└── utils/                      # Instance & signer helpers
```

## Testing

```bash
# Run all tests
npm run test

# Run specific test
npm run test test/basic/FHECounter.test.ts

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Gas report
npm run test:gas
```

## Compilation

```bash
# Compile
npm run compile

# Clean
npm run clean

# Lint
npm run lint
```

## What Each Example Teaches

| Example | Learn |
|---------|-------|
| FHECounter | Basics: increment/decrement encrypted values |
| FHEAdd | Arithmetic: addition on encrypted data |
| FHEComparison | Logic: comparing encrypted values |
| FHEIfThenElse | Branching: conditional execution without revealing condition |
| EncryptSingleValue | Encryption: how to encrypt, binding, proofs |
| EncryptMultipleValues | Scaling: handling multiple encrypted values |
| UserDecryptSingle | Permissions: user-specific decryption |
| UserDecryptMultiple | Batch: decrypting multiple user values |
| PublicDecryptSingle | Public Results: shared encrypted outputs |
| PublicDecryptMultiple | Aggregation: public result computation |
| AccessControl | Permissions: FHE.allow vs FHE.allowTransient |
| BlindAuction | Advanced: privacy-preserving auction |
| DeliveryManager | Real-world: privacy-preserving logistics |
| PaymentProcessor | Real-world: confidential payments |
| ReputationTracker | Real-world: anonymous ratings |
| PrivacyLayer | Utilities: reusable privacy functions |
| AnonymousDelivery | Integration: complete system |

## Learning Path

### Beginner → Intermediate → Advanced

1. **Start**: FHECounter.sol
2. **Progress**:
   - EncryptSingleValue.sol
   - UserDecryptSingleValue.sol
   - FHEAdd.sol
   - FHEComparison.sol
3. **Deepen**:
   - EncryptMultipleValues.sol
   - UserDecryptMultipleValues.sol
   - FHEIfThenElse.sol
   - AccessControl.sol
4. **Apply**:
   - BlindAuction.sol
   - DeliveryManager.sol
5. **Integrate**:
   - AnonymousDelivery.sol

## Debugging Tips

### Permission Issues
```
Error: FHE.decrypt failed
→ Missing FHE.allow or FHE.allowThis

Error: Contract cannot access value
→ Missing FHE.allowThis

Error: User cannot decrypt
→ Missing FHE.allow(value, user)
```

### Encryption Binding Issues
```
Error: Invalid input proof
→ Encryption signer != msg.sender

Error: Wrong contract address
→ Encrypted for different contract
```

### Comparison Issues
```
Cannot use ebool in if statement
→ Use FHE.select instead

Cannot decrypt comparison result
→ Result is already encrypted
```

## Resources

- 📖 **Docs**: README.md, BOUNTY_SUBMISSION.md
- 🔧 **Automation**: scripts/README.md
- 🚀 **Setup**: SETUP_GUIDE.md
- 📝 **Concepts**: FHE_CONCEPTS.md
- 🧪 **Testing**: TESTING_GUIDE.md

## Contact & Support

- Zama Community: https://www.zama.ai/community
- Discord: https://discord.com/invite/zama
- FHEVM Docs: https://docs.zama.ai/fhevm

---

**Last Updated**: December 24, 2025
