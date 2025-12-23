// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE If-Then-Else
/// @notice Demonstrates conditional operations on encrypted values
/// @dev Shows how to perform branching logic on encrypted data without decryption
contract FHEIfThenElse is ZamaEthereumConfig {
    /// @notice Conditional transfer based on encrypted condition
    /// @param condition Encrypted boolean condition
    /// @param amountIfTrue Amount to transfer if true
    /// @param amountIfFalse Amount to transfer if false
    /// @param proofs Proofs for encrypted inputs
    /// @return The amount to transfer (encrypted)
    function conditionalTransfer(
        ebool condition,
        externalEuint32 amountIfTrue,
        externalEuint32 amountIfFalse,
        bytes calldata proofs
    ) external view returns (euint32) {
        euint32 a = FHE.fromExternal(amountIfTrue, proofs);
        euint32 b = FHE.fromExternal(amountIfFalse, proofs);

        // Select encrypted result based on encrypted condition
        // If condition is 1 (true), return a; if 0 (false), return b
        return FHE.select(condition, a, b);
    }

    /// @notice Calculates discount based on encrypted purchase amount
    /// @param purchaseAmount Encrypted purchase amount
    /// @param inputProof Proof of encryption
    /// @return Discounted price (encrypted)
    /// @dev 10% discount if amount >= 100, otherwise full price
    function applyDiscount(
        externalEuint32 purchaseAmount,
        bytes calldata inputProof
    ) external view returns (euint32) {
        euint32 amount = FHE.fromExternal(purchaseAmount, inputProof);
        euint32 threshold = FHE.asEuint32(100);

        // Check if amount >= 100
        ebool qualifiesForDiscount = FHE.ge(amount, threshold);

        // Calculate 90% of amount (10% discount)
        euint32 discountedPrice = FHE.div(
            FHE.mul(amount, FHE.asEuint32(90)),
            FHE.asEuint32(100)
        );

        // Select: discounted if qualifies, full price otherwise
        return FHE.select(qualifiesForDiscount, discountedPrice, amount);
    }

    /// @notice Calculates transaction fee based on encrypted amount
    /// @param amount Encrypted transaction amount
    /// @param proof Proof of encryption
    /// @return Transaction fee (encrypted)
    /// @dev Demonstrates multi-tier if-then-else logic
    function calculateFee(
        externalEuint32 amount,
        bytes calldata proof
    ) external view returns (euint32) {
        euint32 amountValue = FHE.fromExternal(amount, proof);

        // Tier 1: amount < 1000 -> 1% fee
        // Tier 2: 1000 <= amount < 10000 -> 0.5% fee
        // Tier 3: amount >= 10000 -> 0.1% fee

        euint32 threshold1 = FHE.asEuint32(1000);
        euint32 threshold2 = FHE.asEuint32(10000);

        ebool isTier1 = FHE.lt(amountValue, threshold1);
        ebool isTier2 = FHE.and(
            FHE.ge(amountValue, threshold1),
            FHE.lt(amountValue, threshold2)
        );

        euint32 fee1 = FHE.div(amountValue, FHE.asEuint32(100)); // 1%
        euint32 fee2 = FHE.div(amountValue, FHE.asEuint32(200)); // 0.5%
        euint32 fee3 = FHE.div(amountValue, FHE.asEuint32(1000)); // 0.1%

        // Nested selects for multi-tier logic
        euint32 feeAfterTier1 = FHE.select(isTier1, fee1, fee2);
        euint32 finalFee = FHE.select(isTier2, feeAfterTier1, fee3);

        return finalFee;
    }

    /// @notice Demonstrates privacy benefit of encrypted if-then-else
    function privacyBenefit() external pure {
        // Privacy Advantages:
        // 1. No one learns which branch is taken
        // 2. Condition remains encrypted throughout
        // 3. Both branches are computed (no information leak)
        // 4. Result is encrypted until explicitly decrypted

        // Without FHE:
        // if (amount > threshold) { ... } // Condition revealed on-chain!
        // Everyone sees which branch executed

        // With FHE:
        // ebool condition = FHE.gt(encAmount, encThreshold); // Encrypted comparison
        // result = FHE.select(condition, branchA, branchB); // Encrypted selection
        // No one learns the condition or which branch executed
    }

    /// @notice Demonstrates anti-patterns with encrypted conditionals
    function antiPatterns() external pure {
        // MISTAKE 1: Trying to use encrypted boolean in Solidity if
        // euint32 value = ...;
        // ebool condition = FHE.gt(value, 100);
        // if (condition) { ... } // FAILS: ebool is not bool

        // MISTAKE 2: Assuming both branches don't execute
        // FHE.select evaluates BOTH branches before selecting
        // if branch has side effects, both will occur:
        // euint32 result = FHE.select(condition,
        //     transfer(a, 100),    // Executes regardless of condition!
        //     transfer(b, 50)
        // );
        // Result: Both transfers happen (select returns one result but both executed)

        // MISTAKE 3: Forgetting encrypted booleans are still encrypted
        // ebool result = FHE.and(condition1, condition2);
        // bool plainResult = result; // FAILS: Cannot cast ebool to bool
    }

    /// @notice Critical: Side effects in FHE.select
    function sideEffectWarning() external pure {
        // IMPORTANT: FHE.select evaluates BOTH arguments
        // It does not use lazy evaluation like Solidity if/else

        // ❌ DANGEROUS:
        // euint32 result = FHE.select(condition,
        //     payUser(userA, 100),      // Always executes!
        //     payUser(userB, 50)        // Always executes!
        // );
        // Result: Both payments execute, result is selected value

        // ✅ SAFE:
        // Store values, then select
        // euint32 valueIfTrue = amount1;
        // euint32 valueIfFalse = amount2;
        // euint32 result = FHE.select(condition, valueIfTrue, valueIfFalse);
        // No side effects, just arithmetic

        // Lesson: Avoid function calls in FHE.select arguments
        // Use arithmetic and value selections only
    }

    /// @notice Shows how to avoid side effect issues
    /// @param condition Encrypted condition
    /// @param valueA First value
    /// @param valueB Second value
    /// @param proofs Proofs
    /// @return Selected value based on encrypted condition
    function safeSELECT(
        ebool condition,
        externalEuint32 valueA,
        externalEuint32 valueB,
        bytes calldata proofs
    ) external view returns (euint32) {
        // ✅ CORRECT: Pure value selection, no side effects
        euint32 a = FHE.fromExternal(valueA, proofs);
        euint32 b = FHE.fromExternal(valueB, proofs);

        // Only arithmetic, no function calls with side effects
        return FHE.select(condition, a, b);
    }

    /// @notice Best practices for encrypted conditionals
    function bestPractices() external pure {
        // 1. Remember: Encrypted if-then-else uses FHE.select, not if statement
        // 2. Both branches are always evaluated (no lazy evaluation)
        // 3. Avoid side effects in FHE.select arguments
        // 4. Use only for pure arithmetic and value selections
        // 5. For complex logic, build using multiple selects
        // 6. Test encrypted conditionals thoroughly
        // 7. Document which branches are encrypted vs. plaintext
    }

    /// @notice Shows complex branching with multiple conditions
    /// @param value Encrypted value
    /// @param proof Proof of encryption
    /// @return Result based on multiple encrypted conditions
    function complexBranching(
        externalEuint32 value,
        bytes calldata proof
    ) external view returns (euint32) {
        euint32 val = FHE.fromExternal(value, proof);

        // Define multiple thresholds
        euint32 low = FHE.asEuint32(100);
        euint32 mid = FHE.asEuint32(500);
        euint32 high = FHE.asEuint32(1000);

        // Check conditions
        ebool isLow = FHE.lt(val, low);
        ebool isMid = FHE.and(FHE.ge(val, low), FHE.lt(val, mid));
        ebool isHigh = FHE.and(FHE.ge(val, mid), FHE.lt(val, high));

        // Define results for each branch
        euint32 resultLow = FHE.asEuint32(1);
        euint32 resultMid = FHE.asEuint32(2);
        euint32 resultHigh = FHE.asEuint32(3);
        euint32 resultVeryHigh = FHE.asEuint32(4);

        // Build nested selects
        euint32 step1 = FHE.select(isLow, resultLow, resultMid);
        euint32 step2 = FHE.select(isMid, step1, resultHigh);
        euint32 finalResult = FHE.select(isHigh, step2, resultVeryHigh);

        return finalResult;
    }
}
