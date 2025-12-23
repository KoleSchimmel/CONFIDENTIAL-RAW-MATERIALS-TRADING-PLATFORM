# FHE Multiplication (mul)

**Multiply Two Encrypted Values Without Decryption**

## Overview

FHE multiplication (FHE.mul) allows you to multiply encrypted integers while keeping them encrypted. The result remains encrypted and can be further computed on. Multiplication is more computationally expensive than addition or subtraction.

## Syntax

```solidity
euint32 result = FHE.mul(euint32 a, euint32 b);
euint64 result = FHE.mul(euint64 a, euint64 b);
```

## Use Cases

### Case 1: Confidential Cost Calculation

```solidity
function calculateTotalCost(
    inEuint32 calldata quantity,
    inEuint64 calldata pricePerUnit,
    bytes calldata proof
) external {
    euint32 qty = FHE.asEuint32(quantity, proof);
    euint64 price = FHE.asEuint64(pricePerUnit, proof);

    // Calculate total while keeping all values hidden
    euint64 totalCost = FHE.mul(qty, price);

    results[msg.sender] = totalCost;
    FHE.allowThis(totalCost);
    FHE.allow(totalCost, msg.sender);
}
```

### Case 2: Encrypted Interest Calculation

```solidity
function calculateInterest(
    inEuint64 calldata principal,
    uint32 ratePercent,  // Not encrypted - interest rate is public
    bytes calldata proof
) external {
    euint64 principalEncrypted = FHE.asEuint64(principal, proof);
    euint64 rateEncrypted = FHE.asEuint64(ratePercent);

    // Calculate interest: principal * (rate / 100)
    euint64 interest = FHE.mul(principalEncrypted, rateEncrypted);

    userInterest[msg.sender] = interest;
    FHE.allowThis(interest);
    FHE.allow(interest, msg.sender);
}
```

### Case 3: Encrypted Scaling

```solidity
function scaleValue(
    inEuint32 calldata value,
    uint32 scaleFactor,
    bytes calldata proof
) external {
    euint32 encrypted = FHE.asEuint32(value, proof);

    // Scale up encrypted value
    euint32 scaled = FHE.mul(encrypted, FHE.asEuint32(scaleFactor));

    results[msg.sender] = scaled;
    FHE.allowThis(scaled);
    FHE.allow(scaled, msg.sender);
}
```

## Implementation Example

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, inEuint32, inEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

contract EncryptedMultiplication is SepoliaZamaFHEVMConfig {
    mapping(address => euint64) private productResults;

    event ProductCalculated(address indexed user);

    function multiply(
        inEuint32 calldata a,
        inEuint32 calldata b,
        bytes calldata proof
    ) external {
        euint32 valueA = FHE.asEuint32(a, proof);
        euint32 valueB = FHE.asEuint32(b, proof);

        // Convert to euint64 to prevent overflow
        euint64 resultA = FHE.asEuint64(valueA);
        euint64 resultB = FHE.asEuint64(valueB);

        // Perform multiplication
        euint64 product = FHE.mul(resultA, resultB);

        productResults[msg.sender] = product;

        FHE.allowThis(product);
        FHE.allow(product, msg.sender);

        emit ProductCalculated(msg.sender);
    }

    function multiplyByConstant(
        inEuint32 calldata value,
        uint32 multiplier,
        bytes calldata proof
    ) external {
        euint32 encrypted = FHE.asEuint32(value, proof);
        euint32 constant_mul = FHE.asEuint32(multiplier);

        euint32 result = FHE.mul(encrypted, constant_mul);

        productResults[msg.sender] = result;
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
    }

    function getProduct() external view returns (euint64) {
        return productResults[msg.sender];
    }
}
```

## Properties

| Property | Value |
|----------|-------|
| **Result Type** | Same as inputs (may need upcasting for large results) |
| **Overflow Behavior** | Wraps around (modular arithmetic) |
| **Performance** | O(n²) where n = bit length |
| **Privacy** | Perfect - result is encrypted |

## Important Considerations

### Overflow Prevention

Multiplying two large numbers can overflow:

```solidity
// ❌ WRONG - Risk of overflow
euint32 a = FHE.asEuint32(100000);
euint32 b = FHE.asEuint32(100000);
euint32 result = FHE.mul(a, b);  // 10^10 overflows euint32!
```

**Solution: Use larger type**

```solidity
// ✅ CORRECT - Convert to larger type
euint32 a = FHE.asEuint32(100000);
euint32 b = FHE.asEuint32(100000);

// Convert to euint64 before multiplication
euint64 a64 = FHE.asEuint64(a);
euint64 b64 = FHE.asEuint64(b);
euint64 result = FHE.mul(a64, b64);  // Safe
```

### Type Conversion

Always consider the result size:

```solidity
// euint32 * euint32 can produce value up to 2^64-1
// So use euint64 for safety

euint32 x = FHE.asEuint32(1000);
euint32 y = FHE.asEuint32(2000);

// Need to upcast
euint64 result = FHE.mul(FHE.asEuint64(x), FHE.asEuint64(y));
```

## Common Mistakes

### ❌ Forgetting Permissions After Mul

```solidity
// WRONG
euint32 result = FHE.mul(a, b);
data = result;  // Lost reference!
```

### ✅ Always Grant Permissions

```solidity
// CORRECT
euint32 result = FHE.mul(a, b);
FHE.allowThis(result);
FHE.allow(result, user);
data = result;
```

### ❌ Not Handling Overflow

```solidity
// WRONG - Multiplying large euint32 values
euint32 large1 = FHE.asEuint32(10000000);
euint32 large2 = FHE.asEuint32(50000000);
euint32 product = FHE.mul(large1, large2);  // Overflows!
```

### ✅ Use Appropriate Types

```solidity
// CORRECT - Use euint64
euint32 a = FHE.asEuint32(10000000);
euint32 b = FHE.asEuint32(50000000);

euint64 a64 = FHE.asEuint64(a);
euint64 b64 = FHE.asEuint64(b);
euint64 product = FHE.mul(a64, b64);  // Safe
```

## Testing

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FHE Multiplication", function () {
    let contract: any;

    before(async function () {
        const Factory = await ethers.getContractFactory("EncryptedMultiplication");
        contract = await Factory.deploy();
    });

    it("Should multiply encrypted values", async function () {
        const tx = await contract.multiply("0x00", "0x00", "0x00");
        expect(tx).to.not.be.reverted;
    });

    it("Should multiply by constant", async function () {
        const tx = await contract.multiplyByConstant("0x00", 10, "0x00");
        expect(tx).to.not.be.reverted;
    });

    it("Should return product", async function () {
        const result = await contract.getProduct();
        expect(result).to.exist;
    });
});
```

## Gas Considerations

Multiplication is significantly more expensive than addition:

- **euint32 mul**: ~25,000 gas
- **euint64 mul**: ~40,000 gas

Optimize multiplication operations:

```solidity
// ✅ GOOD - Minimize multiplications
euint32 result = FHE.mul(a, FHE.asEuint32(2));  // Multiply by constant
euint32 result2 = FHE.mul(result, b);           // One more multiplication

// ❌ BAD - Unnecessary multiplications
euint32 temp1 = FHE.mul(a, b);
euint32 temp2 = FHE.mul(temp1, c);
euint32 temp3 = FHE.mul(temp2, d);
// Multiple expensive operations
```

## Real-World Example: Encrypted Trading

```solidity
function executeTrade(
    inEuint32 calldata quantity,
    inEuint64 calldata pricePerUnit,
    bytes calldata proof
) external onlyVerifiedTrader {
    euint32 qty = FHE.asEuint32(quantity, proof);
    euint64 price = FHE.asEuint64(pricePerUnit, proof);

    // Calculate total cost
    euint64 totalCost = FHE.mul(FHE.asEuint64(qty), price);

    // Check buyer has sufficient balance
    ebool sufficient = FHE.gte(encryptedBalance[msg.sender], totalCost);
    FHE.req(sufficient);

    // Deduct from buyer
    encryptedBalance[msg.sender] = FHE.sub(encryptedBalance[msg.sender], totalCost);

    // Add to seller
    address seller = tradePartners[msg.sender];
    encryptedBalance[seller] = FHE.add(encryptedBalance[seller], totalCost);

    FHE.allowThis(encryptedBalance[msg.sender]);
    FHE.allow(encryptedBalance[msg.sender], msg.sender);
}
```

## Related Operations

- [FHE Addition (add)](fhe-add.md)
- [FHE Subtraction (sub)](fhe-sub.md)
- [FHE Comparison (eq, gt, lt)](fhe-compare.md)

## References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Arithmetic Operations Reference](../reference/fhe-operations.md)
