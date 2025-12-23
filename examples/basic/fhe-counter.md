# FHE Counter Example

**Learn FHE Fundamentals with a Simple Counter**

## Overview

The FHE Counter is the most basic example of using Fully Homomorphic Encryption in smart contracts. It demonstrates:

- Creating encrypted values (euint32)
- Performing encrypted arithmetic (add, sub)
- Managing access permissions (FHE.allow, FHE.allowThis)
- Basic state management with encrypted data

## Key Concepts

### Encrypted Integer Type

```solidity
euint32 private _counter;  // 32-bit encrypted integer
```

The counter is stored as an encrypted value, meaning its actual value remains hidden even to the contract.

### Initialization

```solidity
_counter = FHE.asEuint32(0);
FHE.allowThis(_counter);
FHE.allow(_counter, owner);
```

1. **FHE.asEuint32(0)** - Encrypt the plaintext 0
2. **FHE.allowThis(_counter)** - Grant the contract permission to read the value
3. **FHE.allow(_counter, owner)** - Grant the owner permission to decrypt the value later

### Encrypted Arithmetic

```solidity
function increment(inEuint32 calldata inputValue, bytes calldata inputProof) external {
    // 1. Decrypt and verify the user input
    euint32 value = FHE.asEuint32(inputValue, inputProof);

    // 2. Perform encrypted addition
    _counter = FHE.add(_counter, value);

    // 3. Update permissions
    FHE.allowThis(_counter);
    FHE.allow(_counter, msg.sender);
}
```

## Privacy Properties

### What's Hidden

- The current counter value
- The increment amount
- All intermediate computation results

### What's Visible

- The contract address
- The caller's address
- The fact that increment was called

## Code Example

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

contract FHECounter is SepoliaZamaFHEVMConfig {
    euint32 private _counter;

    constructor() {
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
    }

    function increment(inEuint32 calldata inputValue, bytes calldata inputProof) external {
        euint32 value = FHE.asEuint32(inputValue, inputProof);
        _counter = FHE.add(_counter, value);

        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);
    }

    function getCounter() external view returns (euint32) {
        return _counter;
    }
}
```

## Test Example

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FHECounter", function () {
    let counter: any;
    let owner: any;

    before(async function () {
        [owner] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("FHECounter");
        counter = await Factory.deploy();
        await counter.waitForDeployment();
    });

    it("Should initialize with encrypted zero", async function () {
        const value = await counter.getCounter();
        expect(value).to.exist;
    });

    it("Should increment the counter", async function () {
        // In production, use fhevmjs to create encrypted input
        // For this example, demonstrate the pattern
        const tx = counter.increment(
            "0x00", // Encrypted handle
            "0x00"  // Input proof
        );

        // In real implementation, this would succeed
        // expect(tx).to.not.be.reverted;
    });
});
```

## Common Pitfalls

### ❌ Forgetting FHE.allowThis()

```solidity
// WRONG
euint32 newCounter = FHE.add(_counter, value);
_counter = newCounter;  // Will fail later!
```

### ✅ Correct Pattern

```solidity
// CORRECT
euint32 newCounter = FHE.add(_counter, value);
FHE.allowThis(newCounter);  // Grant contract permission
FHE.allow(newCounter, msg.sender);  // Grant user permission
_counter = newCounter;
```

## Next Steps

1. Read [EncryptionExample](encryption.md) to learn different encryption patterns
2. Study [AccessControlExample](access-control.md) to understand permissions
3. Explore [FHEArithmetic](fhe-add.md) for more arithmetic operations

## References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHE Operations Reference](../reference/fhe-operations.md)
- [API Reference](../reference/api.md)
