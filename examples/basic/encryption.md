# Encryption Patterns

**Master Different Ways to Encrypt Data in FHEVM**

## Overview

Data encryption in FHEVM follows specific patterns to ensure security and correctness. This guide covers:

- Single value encryption
- Multiple value encryption
- Contract-side encryption
- User-side encryption with proofs

## Pattern 1: Single Value Encryption

### User Provides Encrypted Input

The most secure pattern: user encrypts data on their device.

```solidity
function storeSecret(inEuint32 calldata secret, bytes calldata proof) external {
    // 1. User provides encrypted input + proof
    euint32 encrypted = FHE.asEuint32(secret, proof);

    // 2. Store encrypted value
    userSecrets[msg.sender] = encrypted;

    // 3. Grant permissions
    FHE.allowThis(encrypted);
    FHE.allow(encrypted, msg.sender);
}
```

**Security Properties:**
- Plaintext never enters the blockchain
- User encrypts before transmission
- Proof verifies correct encryption
- Only authorized parties can decrypt

### Contract Encrypts Plaintext

Useful for public constants or initialization.

```solidity
function initializePuplicValue(uint32 value) external {
    // Contract encrypts plaintext
    euint32 encrypted = FHE.asEuint32(value);

    publicValue = encrypted;
    FHE.allowThis(encrypted);
}
```

**When to Use:**
- Initialization with known values
- Public constants
- Non-sensitive data

## Pattern 2: Multiple Value Encryption

### Single Proof for Multiple Values

More gas-efficient than separate transactions.

```solidity
function storeMultiple(
    inEuint32 calldata value1,
    inEuint32 calldata value2,
    bytes calldata proof
) external {
    // One proof covers both encrypted values
    euint32 enc1 = FHE.asEuint32(value1, proof);
    euint32 enc2 = FHE.asEuint32(value2, proof);

    // Store both
    userData1[msg.sender] = enc1;
    userData2[msg.sender] = enc2;

    // Grant permissions for both
    FHE.allowThis(enc1);
    FHE.allow(enc1, msg.sender);
    FHE.allowThis(enc2);
    FHE.allow(enc2, msg.sender);
}
```

**Benefits:**
- Single proof verification
- Lower gas cost
- All values from same user

## Pattern 3: Encrypted Arithmetic

Creating new encrypted values from operations.

```solidity
function combineEncrypted(
    inEuint32 calldata a,
    inEuint32 calldata b,
    bytes calldata proof
) external {
    euint32 valueA = FHE.asEuint32(a, proof);
    euint32 valueB = FHE.asEuint32(b, proof);

    // Perform encrypted computation
    euint32 sum = FHE.add(valueA, valueB);
    euint32 product = FHE.mul(valueA, valueB);

    // Store results
    results[msg.sender] = (sum, product);

    // Grant permissions
    FHE.allowThis(sum);
    FHE.allowThis(product);
    FHE.allow(sum, msg.sender);
    FHE.allow(product, msg.sender);
}
```

## Pattern 4: Type Conversions

Different encrypted types for different ranges.

```solidity
function useMultipleTypes(
    inEuint32 calldata small,
    inEuint64 calldata large,
    bytes calldata proofSmall,
    bytes calldata proofLarge
) external {
    // euint32: for smaller values (0 to 4B)
    euint32 smallValue = FHE.asEuint32(small, proofSmall);

    // euint64: for larger values (0 to 18.4B)
    euint64 largeValue = FHE.asEuint64(large, proofLarge);

    // Use appropriately
    uint32Value = smallValue;
    uint64Value = largeValue;
}
```

**Type Choices:**
- **euint8**: 0-255 (minimal gas)
- **euint32**: 0-4 billion (common)
- **euint64**: 0-18 quintillion (large values)

## Anti-Patterns to Avoid

### ❌ Missing Proof

```solidity
// WRONG - No proof verification
function badStore(inEuint32 calldata secret) external {
    data = FHE.asEuint32(secret);  // MISSING PROOF!
    // Security vulnerability
}
```

### ✅ Always Include Proof

```solidity
// CORRECT - With proof verification
function goodStore(inEuint32 calldata secret, bytes calldata proof) external {
    data = FHE.asEuint32(secret, proof);  // Proof verifies encryption
}
```

### ❌ Forgetting Permissions

```solidity
// WRONG - No permissions
function badEncrypt(inEuint32 calldata value, bytes calldata proof) external {
    euint32 encrypted = FHE.asEuint32(value, proof);
    data[msg.sender] = encrypted;
    // No permissions set - cannot decrypt later!
}
```

### ✅ Grant Both Permissions

```solidity
// CORRECT - Both permissions
function goodEncrypt(inEuint32 calldata value, bytes calldata proof) external {
    euint32 encrypted = FHE.asEuint32(value, proof);
    data[msg.sender] = encrypted;

    FHE.allowThis(encrypted);        // Contract can use
    FHE.allow(encrypted, msg.sender); // User can decrypt
}
```

## Testing Encryption

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { FhevmInstance } from "fhevmjs";

describe("Encryption", function () {
    let contract: any;
    let owner: any;
    let fhevm: FhevmInstance;

    before(async function () {
        [owner] = await ethers.getSigners();
        // Create FHE instance
        fhevm = await FhevmInstance.create();

        const Factory = await ethers.getContractFactory("EncryptionExample");
        contract = await Factory.deploy();
    });

    it("Should encrypt and store value", async function () {
        const value = 42;

        // 1. Create encrypted input client-side
        const input = fhevm.createEncryptedInput(
            contract.target,
            owner.address
        );
        input.add32(value);
        const encrypted = await input.encrypt();

        // 2. Send to contract
        const tx = await contract.encryptSingleValue(
            encrypted.handles[0],
            encrypted.inputProof
        );

        expect(tx).to.not.be.reverted;
    });
});
```

## Next Steps

1. Learn [AccessControlExample](access-control.md) for permission management
2. Explore [FHEArithmetic](../operations/fhe-add.md) for encrypted operations
3. Study [Decryption Patterns](../decryption/overview.md) for revealing results

## References

- [FHEVM Docs - Input Proofs](https://docs.zama.ai/fhevm/concepts/input-proofs)
- [FHEVM Docs - Encryption](https://docs.zama.ai/fhevm/concepts/encryption)
