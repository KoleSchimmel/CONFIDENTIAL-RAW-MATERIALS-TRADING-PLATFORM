# FHE Addition (add)

**Add Two Encrypted Values Without Decryption**

## Overview

FHE addition (FHE.add) allows you to add encrypted integers while keeping them encrypted. The result remains encrypted and can be further computed on.

## Syntax

```solidity
euint32 result = FHE.add(euint32 a, euint32 b);
euint64 result = FHE.add(euint64 a, euint64 b);
```

## Use Cases

### Case 1: Confidential Balances

```solidity
function addFunds(address user, inEuint64 calldata amount, bytes calldata proof) external {
    euint64 contribution = FHE.asEuint64(amount, proof);

    // Add to encrypted balance without revealing it
    encryptedBalances[user] = FHE.add(encryptedBalances[user], contribution);

    FHE.allowThis(encryptedBalances[user]);
    FHE.allow(encryptedBalances[user], user);
}
```

### Case 2: Encrypted Pools

```solidity
function depositToPool(inEuint32 calldata amount, bytes calldata proof) external {
    euint32 deposit = FHE.asEuint32(amount, proof);

    // Add to shared encrypted pool
    encryptedPoolBalance = FHE.add(encryptedPoolBalance, deposit);

    FHE.allowThis(encryptedPoolBalance);
}
```

### Case 3: Multi-Party Computation

```solidity
function aggregateEncrypted(
    inEuint32 calldata value1,
    inEuint32 calldata value2,
    inEuint32 calldata value3,
    bytes calldata proof
) external {
    euint32 v1 = FHE.asEuint32(value1, proof);
    euint32 v2 = FHE.asEuint32(value2, proof);
    euint32 v3 = FHE.asEuint32(value3, proof);

    // Chain additions: ((v1 + v2) + v3)
    euint32 sum = FHE.add(v1, v2);
    sum = FHE.add(sum, v3);

    results[msg.sender] = sum;
    FHE.allowThis(sum);
    FHE.allow(sum, msg.sender);
}
```

## Implementation Example

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

contract EncryptedAddition is SepoliaZamaFHEVMConfig {
    euint32 private _accumulatedValue;

    event ValueAdded(address indexed user);

    function initialize(uint32 startValue) external {
        _accumulatedValue = FHE.asEuint32(startValue);
        FHE.allowThis(_accumulatedValue);
    }

    function addValue(inEuint32 calldata amount, bytes calldata proof) external {
        euint32 value = FHE.asEuint32(amount, proof);

        // Perform encrypted addition
        _accumulatedValue = FHE.add(_accumulatedValue, value);

        // Update permissions
        FHE.allowThis(_accumulatedValue);
        FHE.allow(_accumulatedValue, msg.sender);

        emit ValueAdded(msg.sender);
    }

    function getAccumulated() external view returns (euint32) {
        return _accumulatedValue;
    }
}
```

## Properties

| Property | Value |
|----------|-------|
| **Result Type** | Same as inputs |
| **Overflow Behavior** | Wraps around |
| **Performance** | O(n) where n = bit length |
| **Privacy** | Perfect - result is encrypted |

## Common Mistakes

### ❌ Forgetting Permissions After Add

```solidity
// WRONG
euint32 result = FHE.add(a, b);
data = result;  // Lost reference - cannot decrypt!
```

### ✅ Always Grant Permissions

```solidity
// CORRECT
euint32 result = FHE.add(a, b);
FHE.allowThis(result);
FHE.allow(result, user);
data = result;
```

### ❌ Mixing Encrypted and Plaintext

```solidity
// This WON'T compile - types must match
uint32 plain = 10;
euint32 encrypted = FHE.asEuint32(5);
euint32 result = FHE.add(encrypted, plain);  // ERROR!
```

### ✅ Convert First

```solidity
// CORRECT - convert both to same type
uint32 plain = 10;
euint32 encrypted = FHE.asEuint32(5);
euint32 plainEnc = FHE.asEuint32(plain);
euint32 result = FHE.add(encrypted, plainEnc);
```

## Testing

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FHE Addition", function () {
    let contract: any;

    before(async function () {
        const Factory = await ethers.getContractFactory("EncryptedAddition");
        contract = await Factory.deploy();
        await contract.initialize(100);  // Start with 100
    });

    it("Should add encrypted values", async function () {
        // In production, use fhevmjs for proper encryption
        const tx = contract.addValue("0x00", "0x00");

        expect(tx).to.not.be.reverted;

        const result = await contract.getAccumulated();
        expect(result).to.exist;  // Still encrypted
    });
});
```

## Gas Considerations

Addition is one of the cheapest FHE operations:

- **euint32 add**: ~5,000 gas
- **euint64 add**: ~7,000 gas

Chain multiple additions efficiently:

```solidity
// Good - chain adds
sum = FHE.add(sum, v1);
sum = FHE.add(sum, v2);
sum = FHE.add(sum, v3);  // More gas efficient
```

## Related Operations

- [FHE Subtraction (sub)](fhe-sub.md)
- [FHE Multiplication (mul)](fhe-mul.md)
- [FHE Comparison (eq, gt, lt)](fhe-compare.md)

## References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Arithmetic Operations Reference](../reference/fhe-operations.md)
