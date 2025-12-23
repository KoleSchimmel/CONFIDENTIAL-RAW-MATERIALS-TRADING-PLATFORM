# FHE Comparison Operations

**Compare Encrypted Values Without Revealing Them**

## Overview

FHE comparison operations allow you to compare encrypted values and make decisions based on encrypted data. These operations return encrypted boolean results (ebool) that maintain privacy.

## Available Operations

```solidity
// Equality
ebool result = FHE.eq(euint32 a, euint32 b);   // a == b

// Inequality
ebool result = FHE.ne(euint32 a, euint32 b);   // a != b

// Greater than
ebool result = FHE.gt(euint32 a, euint32 b);   // a > b

// Greater than or equal
ebool result = FHE.gte(euint32 a, euint32 b);  // a >= b

// Less than
ebool result = FHE.lt(euint32 a, euint32 b);   // a < b

// Less than or equal
ebool result = FHE.lte(euint32 a, euint32 b);  // a <= b
```

All comparisons work on encrypted data and return encrypted boolean results.

## Use Cases

### Case 1: Access Control

```solidity
function withdrawIfSufficient(inEuint64 calldata amount, bytes calldata proof) external {
    euint64 withdrawAmount = FHE.asEuint64(amount, proof);

    // Check if balance >= withdraw amount
    ebool hasSufficientFunds = FHE.gte(
        encryptedBalance[msg.sender],
        withdrawAmount
    );

    // Require encrypted condition
    FHE.req(hasSufficientFunds);

    // Proceed with withdrawal
    encryptedBalance[msg.sender] = FHE.sub(
        encryptedBalance[msg.sender],
        withdrawAmount
    );

    FHE.allowThis(encryptedBalance[msg.sender]);
}
```

### Case 2: Threshold Checks

```solidity
function checkThreshold(
    inEuint32 calldata value,
    uint32 threshold,
    bytes calldata proof
) external {
    euint32 userValue = FHE.asEuint32(value, proof);
    euint32 thresholdEncrypted = FHE.asEuint32(threshold);

    // Check if value > threshold
    ebool aboveThreshold = FHE.gt(userValue, thresholdEncrypted);

    thresholdResults[msg.sender] = aboveThreshold;
    FHE.allowThis(aboveThreshold);
    FHE.allow(aboveThreshold, msg.sender);
}
```

### Case 3: Auction Winner Determination

```solidity
function compareBlockedBids(uint256 bidId1, uint256 bidId2) external view returns (ebool) {
    euint64 bid1 = bids[bidId1].encryptedAmount;
    euint64 bid2 = bids[bidId2].encryptedAmount;

    // Compare without revealing bid amounts
    ebool bid1Higher = FHE.gt(bid1, bid2);

    return bid1Higher;
}
```

### Case 4: Range Validation

```solidity
function validateRange(
    inEuint32 calldata value,
    uint32 min,
    uint32 max,
    bytes calldata proof
) external {
    euint32 userValue = FHE.asEuint32(value, proof);
    euint32 minEncrypted = FHE.asEuint32(min);
    euint32 maxEncrypted = FHE.asEuint32(max);

    // Check if value >= min
    ebool aboveMin = FHE.gte(userValue, minEncrypted);

    // Check if value <= max
    ebool belowMax = FHE.lte(userValue, maxEncrypted);

    // Both conditions must be true
    FHE.req(aboveMin);
    FHE.req(belowMax);

    validatedValues[msg.sender] = userValue;
    FHE.allowThis(userValue);
}
```

## Implementation Example

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

contract FHEComparison is SepoliaZamaFHEVMConfig {
    euint32 private _value1;
    euint32 private _value2;
    ebool private _lastComparison;

    event ComparisonPerformed(string operation);
    event ConditionalExecuted(bool executed);

    function setValue1(inEuint32 calldata value, bytes calldata proof) external {
        _value1 = FHE.asEuint32(value, proof);
        FHE.allowThis(_value1);
        FHE.allow(_value1, msg.sender);
    }

    function setValue2(inEuint32 calldata value, bytes calldata proof) external {
        _value2 = FHE.asEuint32(value, proof);
        FHE.allowThis(_value2);
        FHE.allow(_value2, msg.sender);
    }

    // Equality check
    function checkEqual() external {
        _lastComparison = FHE.eq(_value1, _value2);
        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);
        emit ComparisonPerformed("eq");
    }

    // Greater than check
    function checkGreater() external {
        _lastComparison = FHE.gt(_value1, _value2);
        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);
        emit ComparisonPerformed("gt");
    }

    // Less than check
    function checkLess() external {
        _lastComparison = FHE.lt(_value1, _value2);
        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);
        emit ComparisonPerformed("lt");
    }

    // Conditional execution based on comparison
    function executeIfGreater() external {
        ebool condition = FHE.gt(_value1, _value2);

        // Require encrypted condition
        FHE.req(condition);

        // This code only executes if condition is true
        emit ConditionalExecuted(true);
    }

    function getLastComparison() external view returns (ebool) {
        return _lastComparison;
    }
}
```

## FHE.req() - Encrypted Requirements

The `FHE.req()` function validates encrypted boolean conditions:

```solidity
function requireSufficient(inEuint32 calldata amount, bytes calldata proof) external {
    euint32 requestedAmount = FHE.asEuint32(amount, proof);

    // Create encrypted comparison
    ebool sufficient = FHE.gte(userBalance[msg.sender], requestedAmount);

    // Require condition - reverts if false
    FHE.req(sufficient);

    // Continue if condition passed
    processRequest(requestedAmount);
}
```

**How FHE.req() Works:**
- Takes encrypted boolean (ebool)
- Contract decrypts only to check true/false
- Reverts transaction if false
- Continues execution if true
- Original values stay encrypted

## Properties

| Property | Value |
|----------|-------|
| **Result Type** | ebool (encrypted boolean) |
| **Operations** | eq, ne, gt, gte, lt, lte |
| **Privacy** | Perfect - values never revealed |
| **Performance** | ~10,000 - 15,000 gas |

## Common Patterns

### Pattern 1: Conditional State Update

```solidity
function conditionalUpdate(
    inEuint32 calldata newValue,
    bytes calldata proof
) external {
    euint32 proposed = FHE.asEuint32(newValue, proof);

    // Only update if new value > current value
    ebool shouldUpdate = FHE.gt(proposed, currentValue[msg.sender]);
    FHE.req(shouldUpdate);

    currentValue[msg.sender] = proposed;
    FHE.allowThis(proposed);
}
```

### Pattern 2: Multi-Condition Validation

```solidity
function validateMultiple(
    inEuint32 calldata amount,
    bytes calldata proof
) external {
    euint32 value = FHE.asEuint32(amount, proof);

    // Multiple conditions
    ebool notZero = FHE.gt(value, FHE.asEuint32(0));
    ebool belowMax = FHE.lte(value, FHE.asEuint32(1000));

    FHE.req(notZero);
    FHE.req(belowMax);

    // Both conditions passed
    validatedData[msg.sender] = value;
}
```

### Pattern 3: Encrypted Min/Max

```solidity
function updateMax(inEuint32 calldata newValue, bytes calldata proof) external {
    euint32 value = FHE.asEuint32(newValue, proof);

    // Update only if new value is greater
    ebool isGreater = FHE.gt(value, maxValue);

    // Note: In real implementation, use conditional assignment
    // For demonstration, using require pattern
    if (/* decrypted isGreater */) {
        maxValue = value;
        FHE.allowThis(maxValue);
    }
}
```

## Common Mistakes

### ❌ Comparing Different Types

```solidity
// WRONG - Type mismatch
euint32 a = FHE.asEuint32(10);
euint64 b = FHE.asEuint64(20);
ebool result = FHE.gt(a, b);  // ERROR!
```

### ✅ Convert to Same Type

```solidity
// CORRECT
euint32 a = FHE.asEuint32(10);
euint64 b = FHE.asEuint64(20);
euint64 a64 = FHE.asEuint64(a);
ebool result = FHE.gt(a64, b);
```

### ❌ Forgetting Permissions for ebool

```solidity
// WRONG
ebool result = FHE.gt(a, b);
userResult[msg.sender] = result;  // No permissions!
```

### ✅ Grant Permissions

```solidity
// CORRECT
ebool result = FHE.gt(a, b);
FHE.allowThis(result);
FHE.allow(result, msg.sender);
userResult[msg.sender] = result;
```

## Testing

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("FHE Comparison", function () {
    let contract: any;

    before(async function () {
        const Factory = await ethers.getContractFactory("FHEComparison");
        contract = await Factory.deploy();
    });

    it("Should perform equality check", async function () {
        await contract.setValue1("0x00", "0x00");
        await contract.setValue2("0x00", "0x00");

        const tx = await contract.checkEqual();
        expect(tx).to.not.be.reverted;
    });

    it("Should perform greater than check", async function () {
        const tx = await contract.checkGreater();
        expect(tx).to.not.be.reverted;
    });

    it("Should execute conditionally", async function () {
        // This will succeed or revert based on encrypted condition
        try {
            await contract.executeIfGreater();
        } catch (error) {
            // Expected if condition is false
        }
    });
});
```

## Gas Considerations

Comparison operations are moderately expensive:

- **eq, ne**: ~8,000 gas
- **gt, gte, lt, lte**: ~12,000 gas
- **FHE.req()**: Additional ~3,000 gas

Optimize comparisons:

```solidity
// ✅ GOOD - Single comparison
ebool sufficient = FHE.gte(balance, amount);
FHE.req(sufficient);

// ❌ LESS EFFICIENT - Multiple separate checks
ebool notEqual = FHE.ne(balance, FHE.asEuint32(0));
ebool hasEnough = FHE.gte(balance, amount);
FHE.req(notEqual);
FHE.req(hasEnough);
```

## Real-World Example: Auction System

```solidity
function placeBid(
    uint256 auctionId,
    inEuint64 calldata bidAmount,
    bytes calldata proof
) external {
    euint64 bid = FHE.asEuint64(bidAmount, proof);

    // Check bid > current highest bid
    ebool isHigher = FHE.gt(bid, auctions[auctionId].highestBid);
    FHE.req(isHigher);

    // Check bidder has sufficient balance
    ebool canAfford = FHE.gte(userBalance[msg.sender], bid);
    FHE.req(canAfford);

    // Update auction
    auctions[auctionId].highestBid = bid;
    auctions[auctionId].highestBidder = msg.sender;

    FHE.allowThis(bid);
}
```

## Related Operations

- [FHE Addition (add)](fhe-add.md)
- [FHE Subtraction (sub)](fhe-sub.md)
- [FHE Multiplication (mul)](fhe-mul.md)
- [Access Control](../basic/access-control.md)

## References

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Comparison Operations Reference](../reference/fhe-operations.md)
