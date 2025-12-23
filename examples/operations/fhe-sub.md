# FHE Subtraction (sub)

**Subtract Two Encrypted Values Without Decryption**

## Overview

FHE subtraction (FHE.sub) allows you to subtract encrypted integers while keeping them encrypted. The result remains encrypted and can be further computed on.

## Syntax

```solidity
euint32 result = FHE.sub(euint32 a, euint32 b);
euint64 result = FHE.sub(euint64 a, euint64 b);
```

## Use Cases

### Case 1: Confidential Balance Updates

```solidity
function withdraw(address user, inEuint64 calldata amount, bytes calldata proof) external {
    euint64 withdrawAmount = FHE.asEuint64(amount, proof);

    // Update balance without revealing current or new balance
    encryptedBalances[user] = FHE.sub(encryptedBalances[user], withdrawAmount);

    FHE.allowThis(encryptedBalances[user]);
    FHE.allow(encryptedBalances[user], user);
}
```

### Case 2: Encrypted Inventory Tracking

```solidity
function consumeFromPool(inEuint32 calldata quantity, bytes calldata proof) external {
    euint32 consumption = FHE.asEuint32(quantity, proof);

    // Decrement encrypted inventory
    encryptedInventory = FHE.sub(encryptedInventory, consumption);

    FHE.allowThis(encryptedInventory);
}
```

### Case 3: Difference Calculation

```solidity
function calculateDifference(
    inEuint32 calldata value1,
    inEuint32 calldata value2,
    bytes calldata proof
) external {
    euint32 v1 = FHE.asEuint32(value1, proof);
    euint32 v2 = FHE.asEuint32(value2, proof);

    // Calculate difference while keeping values hidden
    euint32 difference = FHE.sub(v1, v2);

    results[msg.sender] = difference;
    FHE.allowThis(difference);
    FHE.allow(difference, msg.sender);
}
```

## Implementation Example

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

contract EncryptedSubtraction is SepoliaZamaFHEVMConfig {
    euint32 private _balance;

    event ValueSubtracted(address indexed user, uint32 amount);

    function initialize(uint32 initialValue) external {
        _balance = FHE.asEuint32(initialValue);
        FHE.allowThis(_balance);
    }

    function subtractValue(inEuint32 calldata amount, bytes calldata proof) external {
        euint32 value = FHE.asEuint32(amount, proof);

        // Perform encrypted subtraction
        _balance = FHE.sub(_balance, value);

        // Update permissions
        FHE.allowThis(_balance);
        FHE.allow(_balance, msg.sender);

        emit ValueSubtracted(msg.sender, 0);  // Amount stays hidden
    }

    function getBalance() external view returns (euint32) {
        return _balance;
    }
}
```

## Properties

| Property | Value |
|----------|-------|
| **Result Type** | Same as inputs |
| **Underflow Behavior** | Wraps around (modular arithmetic) |
| **Performance** | O(n) where n = bit length |
| **Privacy** | Perfect - result is encrypted |

## Important Considerations

### Underflow Handling

Subtraction in unsigned integers wraps around:

```solidity
// Example: euint32 with max value 2^32 - 1
euint32 a = FHE.asEuint32(5);
euint32 b = FHE.asEuint32(10);
euint32 result = FHE.sub(a, b);  // Result wraps around!
```

For financial applications, validate before subtraction:

```solidity
function safeWithdraw(inEuint32 calldata amount, bytes calldata proof) external {
    euint32 withdrawAmount = FHE.asEuint32(amount, proof);

    // Ensure balance >= amount before subtraction
    ebool sufficient = FHE.gte(userBalance[msg.sender], withdrawAmount);
    FHE.req(sufficient);  // Require condition

    // Safe to subtract
    userBalance[msg.sender] = FHE.sub(userBalance[msg.sender], withdrawAmount);
    FHE.allowThis(userBalance[msg.sender]);
}
```

## Common Mistakes

### ❌ Forgetting Permissions After Sub

```solidity
// WRONG
euint32 result = FHE.sub(a, b);
data = result;  // Lost reference - cannot decrypt!
```

### ✅ Always Grant Permissions

```solidity
// CORRECT
euint32 result = FHE.sub(a, b);
FHE.allowThis(result);
FHE.allow(result, user);
data = result;
```

### ❌ Not Handling Underflow

```solidity
// WRONG - May underflow without check
function withdraw(inEuint32 calldata amount, bytes calldata proof) external {
    euint32 withdrawAmount = FHE.asEuint32(amount, proof);
    balance[msg.sender] = FHE.sub(balance[msg.sender], withdrawAmount);
}
```

### ✅ Validate Before Subtraction

```solidity
// CORRECT
function withdraw(inEuint32 calldata amount, bytes calldata proof) external {
    euint32 withdrawAmount = FHE.asEuint32(amount, proof);

    // Check balance >= amount
    ebool canWithdraw = FHE.gte(balance[msg.sender], withdrawAmount);
    FHE.req(canWithdraw);

    balance[msg.sender] = FHE.sub(balance[msg.sender], withdrawAmount);
    FHE.allowThis(balance[msg.sender]);
}
```

## Testing

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FHE Subtraction", function () {
    let contract: any;

    before(async function () {
        const Factory = await ethers.getContractFactory("EncryptedSubtraction");
        contract = await Factory.deploy();
        await contract.initialize(100);  // Start with 100
    });

    it("Should subtract encrypted values", async function () {
        const tx = await contract.subtractValue("0x00", "0x00");
        expect(tx).to.not.be.reverted;
    });

    it("Should have updated balance", async function () {
        const result = await contract.getBalance();
        expect(result).to.exist;  // Still encrypted
    });
});
```

## Gas Considerations

Subtraction has similar gas costs to addition:

- **euint32 sub**: ~5,000 gas
- **euint64 sub**: ~7,000 gas

Chain multiple operations efficiently:

```solidity
// Efficient - chain operations
result = FHE.sub(result, v1);
result = FHE.sub(result, v2);
result = FHE.sub(result, v3);
```

## Related Operations

- [FHE Addition (add)](fhe-add.md)
- [FHE Multiplication (mul)](fhe-mul.md)
- [FHE Comparison (eq, gt, lt)](fhe-compare.md)

## References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Arithmetic Operations Reference](../reference/fhe-operations.md)
