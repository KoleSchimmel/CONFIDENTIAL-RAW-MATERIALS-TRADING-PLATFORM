# FHE Operations Reference Guide

## Overview

This guide explains all Fully Homomorphic Encryption (FHE) operations used in the Confidential Raw Materials Trading platform.

## Basic Concepts

### What is FHE?

Fully Homomorphic Encryption allows computations on encrypted data without decryption. The contract can:
- Encrypt plaintext values
- Perform operations on encrypted values
- Grant decryption permissions
- Never reveal plaintext to unauthorized parties

### FHE Data Types

**euint32** - Encrypted 32-bit unsigned integer
- Range: 0 to 4,294,967,295
- Use for: quantities, counts, small values

**euint64** - Encrypted 64-bit unsigned integer
- Range: 0 to 18,446,744,073,709,551,615
- Use for: prices, large values, totals

**ebool** - Encrypted boolean
- Values: encrypted true/false
- Use for: comparison results

## Core Operations

### 1. Encryption

```solidity
euint32 encryptedValue = FHE.asEuint32(uint32 plaintext);
euint64 encryptedValue = FHE.asEuint64(uint64 plaintext);
```

**Example: Material Listing**
```solidity
function listMaterial(
    string memory _name,
    uint32 _quantity,      // Plaintext input
    uint64 _pricePerUnit   // Plaintext input
) external {
    // Encrypt values before storage
    euint32 encryptedQuantity = FHE.asEuint32(_quantity);
    euint64 encryptedPrice = FHE.asEuint64(_pricePerUnit);

    // Store encrypted values
    material.encryptedQuantity = encryptedQuantity;
    material.encryptedPricePerUnit = encryptedPrice;
}
```

**Key Points**:
- Conversion from plaintext to encrypted is one-way
- No plaintext is stored on-chain
- Conversion is cheap (~1000 gas)

### 2. Permission Grants

#### FHE.allowThis(value)

Grants the contract itself access to decrypt the value.

```solidity
euint32 encryptedValue = FHE.asEuint32(1000);
FHE.allowThis(encryptedValue);
// Contract can now read this value in future functions
```

**Use Cases**:
- Store encrypted values in state
- Access encrypted values in state transitions
- Perform future operations on the value

**Cost**: ~2000 gas per call

#### FHE.allow(value, address)

Grants a specific address access to decrypt the value.

```solidity
euint32 encryptedValue = FHE.asEuint32(1000);
FHE.allow(encryptedValue, supplier_address);
// Only supplier can decrypt this value
```

**Use Cases**:
- Supplier learns their own material details
- Buyer learns matched trade terms
- Both parties can decrypt final settlement

**Cost**: ~2000-3000 gas per address

#### Example: Multi-Party Permissions

```solidity
function matchTrade(uint256 _orderId) external {
    Order order = orders[_orderId];
    RawMaterial material = materials[order.materialId];

    // Perform encrypted subtraction
    euint32 remaining = FHE.sub(
        material.encryptedQuantity,
        order.encryptedQuantity
    );

    // Update material with new encrypted quantity
    material.encryptedQuantity = remaining;

    // Grant access permissions
    FHE.allowThis(remaining);           // Contract access
    FHE.allow(material.encryptedPricePerUnit, order.buyer);      // Buyer sees price
    FHE.allow(material.encryptedPricePerUnit, material.supplier); // Supplier sees price
}
```

### 3. Arithmetic Operations

#### Addition
```solidity
euint32 result = FHE.add(encrypted1, encrypted2);
euint64 result = FHE.add(encryptedPrice1, encryptedPrice2);
```

**Example**: Total cost calculation
```solidity
euint64 unitPrice = material.encryptedPricePerUnit;
euint32 quantity = order.encryptedQuantity;
// Calculate total without revealing individual values
euint64 totalCost = FHE.mul(unitPrice, quantity);
```

#### Subtraction
```solidity
euint32 result = FHE.sub(encrypted1, encrypted2);
```

**Example**: Inventory update
```solidity
euint32 remaining = FHE.sub(
    material.encryptedQuantity,    // 1000 units
    order.encryptedQuantity         // 500 units
);
// Result: 500 encrypted (encrypted!)
material.encryptedQuantity = remaining;
```

**Important**: Result stays encrypted
- Contract doesn't know it's 500
- Both parties must decrypt separately
- Each decryption is authorized via FHE.allow()

#### Multiplication
```solidity
euint64 result = FHE.mul(euint32 a, euint64 b);
```

**Example**: Price calculation
```solidity
euint64 unitPrice = FHE.asEuint64(50000);  // $500.00
euint32 quantity = FHE.asEuint32(100);     // 100 units
euint64 totalPrice = FHE.mul(unitPrice, quantity);
// Result: encrypted 5,000,000 cents ($50,000)
```

### 4. Comparison Operations

#### Equality (FHE.eq)
```solidity
ebool result = FHE.eq(encrypted1, encrypted2);
```

**Example**: Exact quantity match
```solidity
euint32 requestedQuantity = FHE.asEuint32(500);
euint32 availableQuantity = material.encryptedQuantity;

ebool isExactMatch = FHE.eq(requestedQuantity, availableQuantity);
// Result is encrypted true/false
// Neither party learns the comparison result
```

**Limitation**: Cannot use ebool directly in require()
```solidity
// ✗ WRONG - cannot cast ebool to bool
if (FHE.eq(a, b)) { ... }  // FAILS!

// ✓ CORRECT - store for async verification
ebool isEqual = FHE.eq(a, b);
FHE.allowThis(isEqual);
```

#### Greater Than/Less Than
```solidity
ebool result = FHE.gt(encrypted1, encrypted2);   // greater than
ebool result = FHE.lt(encrypted1, encrypted2);   // less than
ebool result = FHE.gte(encrypted1, encrypted2);  // greater or equal
ebool result = FHE.lte(encrypted1, encrypted2);  // less or equal
```

**Example**: Verify sufficient inventory (OFF-CHAIN)
```solidity
// ON-CHAIN: Store the comparison result
euint32 orderQuantity = order.encryptedQuantity;
euint32 available = material.encryptedQuantity;

ebool hasSufficient = FHE.gte(available, orderQuantity);
FHE.allowThis(hasSufficient);

// OFF-CHAIN: Buyer and supplier decrypt and verify
// Both can verify quantity meets minimum order requirement
```

### 5. Conditional Operations

#### If-Then-Else
```solidity
euint32 result = FHE.ifthenelse(condition, encrypted1, encrypted2);
```

**Example**: Price adjustment based on volume
```solidity
euint32 quantity = order.encryptedQuantity;
euint32 bulkThreshold = FHE.asEuint32(1000);

// If quantity >= 1000, apply discount
ebool isBulk = FHE.gte(quantity, bulkThreshold);
euint64 discountPrice = FHE.asEuint64(45000);  // $450
euint64 regularPrice = FHE.asEuint64(50000);  // $500

euint64 finalPrice = FHE.ifthenelse(
    isBulk,
    discountPrice,
    regularPrice
);

// Neither party knows which price applies without decryption
```

## Complex Patterns

### Pattern 1: Two-Party Matching

```solidity
function matchTrade(uint256 _orderId) external {
    Order order = orders[_orderId];
    RawMaterial material = materials[order.materialId];

    // Step 1: Verify quantity available (encrypted comparison)
    euint32 available = material.encryptedQuantity;
    euint32 needed = order.encryptedQuantity;
    ebool sufficient = FHE.gte(available, needed);
    FHE.allowThis(sufficient);  // Contract knows result

    // Step 2: Calculate remaining inventory
    euint32 remaining = FHE.sub(available, needed);
    FHE.allowThis(remaining);
    FHE.allow(remaining, material.supplier);  // Supplier can check

    // Step 3: Grant price access to both parties
    FHE.allow(material.encryptedPricePerUnit, order.buyer);
    FHE.allow(material.encryptedPricePerUnit, material.supplier);

    // Step 4: Update state
    material.encryptedQuantity = remaining;
    order.status = OrderStatus.MATCHED;
}
```

**Privacy Guarantee**:
- Supplier never sees buyer's max price
- Buyer never sees supplier's true capacity
- Contract verifies compatibility without knowing exact values
- Both learn final trade terms after match

### Pattern 2: Aggregate Operations

```solidity
// Calculate total inventory across materials
euint64 totalValue = FHE.asEuint64(0);
FHE.allowThis(totalValue);

for (uint i = 1; i < nextMaterialId; i++) {
    RawMaterial material = materials[i];

    // Encrypted multiplication
    euint64 materialValue = FHE.mul(
        material.encryptedQuantity,
        material.encryptedPricePerUnit
    );

    // Encrypted addition
    totalValue = FHE.add(totalValue, materialValue);
    FHE.allowThis(totalValue);  // Keep access
}

// totalValue is encrypted total - only authorized parties can decrypt
```

### Pattern 3: Multi-Step Verification

```solidity
function verifyTradeEligibility(uint256 _orderId) external {
    Order order = orders[_orderId];
    RawMaterial material = materials[order.materialId];

    // Check 1: Minimum order requirement
    ebool meetsMinimum = FHE.gte(
        order.encryptedQuantity,
        material.encryptedMinOrder
    );

    // Check 2: Price within range
    ebool priceAcceptable = FHE.lte(
        material.encryptedPricePerUnit,
        order.encryptedMaxPrice
    );

    // Check 3: Sufficient inventory
    ebool sufficientInventory = FHE.gte(
        material.encryptedQuantity,
        order.encryptedQuantity
    );

    // Store all checks encrypted
    // Only authorized parties can decrypt and verify
    FHE.allowThis(meetsMinimum);
    FHE.allowThis(priceAcceptable);
    FHE.allowThis(sufficientInventory);

    // Create encrypted trade match record
    // Settlement happens when all conditions met
}
```

## Gas Costs

### Operation Costs

| Operation | Gas Cost | Type |
|-----------|----------|------|
| FHE.asEuint32() | ~1,000 | Encryption |
| FHE.asEuint64() | ~1,200 | Encryption |
| FHE.allowThis() | ~2,000 | Permission |
| FHE.allow() | ~2,500 | Permission |
| FHE.add() | ~3,500 | Arithmetic |
| FHE.sub() | ~3,500 | Arithmetic |
| FHE.mul() | ~5,000 | Arithmetic |
| FHE.eq() | ~4,500 | Comparison |
| FHE.gte() | ~4,500 | Comparison |
| FHE.ifthenelse() | ~6,000 | Conditional |

### Optimization Tips

1. **Batch Permissions**: Grant multiple parties access in sequence
   ```solidity
   // Cheaper than individual calls
   FHE.allowThis(value);
   FHE.allow(value, party1);
   FHE.allow(value, party2);
   ```

2. **Reuse Encrypted Values**: Store and reuse rather than re-encrypt
   ```solidity
   // Store once, reuse multiple times
   euint32 quantity = material.encryptedQuantity;
   // Use quantity in multiple operations
   ```

3. **Minimize Operations**: Combine operations where possible
   ```solidity
   // One FHE.mul instead of two operations
   euint64 totalCost = FHE.mul(price, quantity);
   ```

## Common Pitfalls

### ✗ Anti-Pattern 1: Casting to Bool

```solidity
// WRONG - Cannot cast ebool to bool
ebool result = FHE.gt(encrypted1, encrypted2);
if (result) { ... }  // COMPILATION ERROR

// CORRECT - Store encrypted and decrypt off-chain
ebool result = FHE.gt(encrypted1, encrypted2);
FHE.allowThis(result);
// Off-chain: decrypt and verify
```

### ✗ Anti-Pattern 2: Accessing Without Permissions

```solidity
// WRONG - No permission granted
euint32 value = FHE.asEuint32(100);
material.encryptedQuantity = value;
// Future call cannot access!

// CORRECT - Always grant permissions
euint32 value = FHE.asEuint32(100);
FHE.allowThis(value);      // Contract access
FHE.allow(value, owner);   // Owner access
material.encryptedQuantity = value;
```

### ✗ Anti-Pattern 3: Plaintext Comparisons

```solidity
// WRONG - Defeats FHE purpose
uint32 plainQuantity = 500;  // Visible on-chain
if (plainQuantity > 1000) { ... }  // Public comparison

// CORRECT - Encrypt before comparison
euint32 encryptedQuantity = FHE.asEuint32(500);
ebool isGreater = FHE.gt(encryptedQuantity, FHE.asEuint32(1000));
// Result stays encrypted
```

## Decryption

### User Decryption Flow

```typescript
// Frontend: Request decryption handle
const tx = await contract.requestDecryption(orderId);
const decryptionRequest = await getDecryptionHandle(tx);

// Get decryption key from FHE service
const decryptionKey = await fhevmInstance.getDecryptionKey(orderId);

// Decrypt off-chain
const plainValue = await fhevmInstance.decrypt(
    decryptedHandle,
    decryptionKey
);

console.log("Decrypted value:", plainValue);
```

### Important: Async Decryption

- Decryption doesn't happen on-chain
- Contract stays private even after decryption
- Each party decrypts separately with their key
- Decryption is optional - values stay encrypted on-chain forever

## References

- [FHEVM Solidity Documentation](https://docs.zama.ai/fhevm/solidity)
- [FHE Cryptography Primer](https://docs.zama.ai/fhevm/overview)
- [Smart Contract Best Practices](https://docs.zama.ai/fhevm/best_practices)

---

**Chapter**: access-control
**Last Updated**: December 2025
