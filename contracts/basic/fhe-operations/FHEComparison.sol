// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Comparison Operations
/// @notice Demonstrates FHE comparison operations (eq, lt, gt, le, ge)
/// @dev Shows how to compare encrypted values without decryption
contract FHEComparison is ZamaEthereumConfig {
    /// @notice Checks if two encrypted values are equal
    /// @param encryptedA First encrypted value
    /// @param encryptedB Second encrypted value
    /// @param inputProof Encryption proof
    /// @return Encrypted boolean result
    function checkEquality(
        externalEuint32 encryptedA,
        externalEuint32 encryptedB,
        bytes calldata inputProof
    ) external view returns (ebool) {
        euint32 a = FHE.fromExternal(encryptedA, inputProof);
        euint32 b = FHE.fromExternal(encryptedB, inputProof);

        // Returns encrypted boolean: 1 if equal, 0 if not
        return FHE.eq(a, b);
    }

    /// @notice Checks if A > B
    /// @param encryptedA First value
    /// @param encryptedB Second value
    /// @param inputProof Proof
    /// @return Encrypted boolean (true if A > B)
    function checkGreaterThan(
        externalEuint32 encryptedA,
        externalEuint32 encryptedB,
        bytes calldata inputProof
    ) external view returns (ebool) {
        euint32 a = FHE.fromExternal(encryptedA, inputProof);
        euint32 b = FHE.fromExternal(encryptedB, inputProof);

        return FHE.gt(a, b);
    }

    /// @notice Checks if A < B
    /// @param encryptedA First value
    /// @param encryptedB Second value
    /// @param inputProof Proof
    /// @return Encrypted boolean (true if A < B)
    function checkLessThan(
        externalEuint32 encryptedA,
        externalEuint32 encryptedB,
        bytes calldata inputProof
    ) external view returns (ebool) {
        euint32 a = FHE.fromExternal(encryptedA, inputProof);
        euint32 b = FHE.fromExternal(encryptedB, inputProof);

        return FHE.lt(a, b);
    }

    /// @notice Checks if A >= B
    /// @param encryptedA First value
    /// @param encryptedB Second value
    /// @param inputProof Proof
    /// @return Encrypted boolean
    function checkGreaterOrEqual(
        externalEuint32 encryptedA,
        externalEuint32 encryptedB,
        bytes calldata inputProof
    ) external view returns (ebool) {
        euint32 a = FHE.fromExternal(encryptedA, inputProof);
        euint32 b = FHE.fromExternal(encryptedB, inputProof);

        return FHE.ge(a, b);
    }

    /// @notice Checks if A <= B
    /// @param encryptedA First value
    /// @param encryptedB Second value
    /// @param inputProof Proof
    /// @return Encrypted boolean
    function checkLessOrEqual(
        externalEuint32 encryptedA,
        externalEuint32 encryptedB,
        bytes calldata inputProof
    ) external view returns (ebool) {
        euint32 a = FHE.fromExternal(encryptedA, inputProof);
        euint32 b = FHE.fromExternal(encryptedB, inputProof);

        return FHE.le(a, b);
    }

    /// @notice Compares with public value
    /// @param encryptedValue Encrypted value
    /// @param publicValue Plain value
    /// @param inputProof Proof
    /// @return True if encrypted > public
    function compareWithPublic(
        externalEuint32 encryptedValue,
        uint32 publicValue,
        bytes calldata inputProof
    ) external view returns (ebool) {
        euint32 encrypted = FHE.fromExternal(encryptedValue, inputProof);
        euint32 publicEncrypted = FHE.asEuint32(publicValue);

        return FHE.gt(encrypted, publicEncrypted);
    }

    /// @notice Demonstrates conditional selection on encrypted values
    /// @param condition Encrypted boolean condition
    /// @param valueIfTrue Encrypted value if condition is true
    /// @param valueIfFalse Encrypted value if condition is false
    /// @param proofs Proofs for all encrypted inputs
    /// @return Selected encrypted value based on condition
    function selectEncrypted(
        ebool condition,
        externalEuint32 valueIfTrue,
        externalEuint32 valueIfFalse,
        bytes calldata proofs
    ) external view returns (euint32) {
        euint32 a = FHE.fromExternal(valueIfTrue, proofs);
        euint32 b = FHE.fromExternal(valueIfFalse, proofs);

        // Select based on encrypted condition
        return FHE.select(condition, a, b);
    }

    /// @notice Shows why comparisons are important for privacy
    function comparisonBenefits() external pure {
        // Encrypted Comparisons Enable:
        // 1. Private auctions (compare bids without revealing amounts)
        // 2. Confidential rankings (rank values without exposing them)
        // 3. Conditional logic on private data (if X > Y do Z)
        // 4. Threshold checks (ensure value meets criteria secretly)

        // Example: Blind auction
        // Compare all bids encrypted to find winner
        // Winner determined on encrypted values
        // No bid amounts revealed

        // Example: Confidential voting
        // Compare vote counts encrypted
        // Determine winner without revealing individual votes
        // Results stay encrypted until public reveal
    }

    /// @notice Critical: Comparison result is also encrypted
    function comparisonResults() external pure {
        // ✅ IMPORTANT: Comparison returns ebool (encrypted boolean)
        // ebool result = FHE.eq(a, b);  // result is encrypted!
        // You cannot write: if (result) ... // Not allowed!

        // ❌ MISTAKE: Trying to use encrypted boolean in Solidity condition
        // ebool isEqual = FHE.eq(a, b);
        // if (isEqual) { ... }  // FAILS: ebool is not bool

        // ✅ CORRECT: Use FHE.select with encrypted condition
        // ebool isGreater = FHE.gt(a, b);
        // euint32 result = FHE.select(isGreater, valueA, valueB);
        // Result is encrypted value based on encrypted comparison
    }

    /// @notice Shows common comparison pitfalls
    function antiPatterns() external pure {
        // MISTAKE 1: Assuming encrypted comparison is plaintext
        // ebool result = FHE.eq(encrypted1, encrypted2);
        // require(result); // FAILS: ebool is not bool

        // MISTAKE 2: Trying to decrypt comparison result
        // ebool isEqual = FHE.eq(a, b);
        // bool plainBool = FHE.decrypt(isEqual); // FAILS: No decrypt of bool

        // MISTAKE 3: Using encrypted comparison in require
        // require(FHE.gt(value, 100)); // FAILS: ebool is not bool

        // CORRECT: Use select for conditional encrypted operations
        // ebool condition = FHE.gt(value, threshold);
        // euint32 result = FHE.select(condition, optionA, optionB);
    }

    /// @notice Best practices for FHE comparisons
    function bestPractices() external pure {
        // 1. Remember: Comparison results are encrypted (ebool, not bool)
        // 2. Use FHE.select to act on encrypted comparisons
        // 3. Comparisons work on encrypted values without decryption
        // 4. No information about values is revealed
        // 5. Build complex logic using combinations of comparisons
        // 6. Test encrypted logic thoroughly before deployment
    }

    /// @notice Shows how to build complex conditions
    /// @param encryptedA First value
    /// @param encryptedB Second value
    /// @param proofA Proof for A
    /// @param proofB Proof for B
    /// @return Result of (A > B AND A < 1000)
    function complexCondition(
        externalEuint32 encryptedA,
        externalEuint32 encryptedB,
        bytes calldata proofA,
        bytes calldata proofB
    ) external view returns (euint32) {
        euint32 a = FHE.fromExternal(encryptedA, proofA);
        euint32 b = FHE.fromExternal(encryptedB, proofB);
        euint32 thousand = FHE.asEuint32(1000);

        // Check: A > B
        ebool firstCondition = FHE.gt(a, b);

        // Check: A < 1000
        ebool secondCondition = FHE.lt(a, thousand);

        // Combine conditions (AND operation)
        ebool combinedCondition = FHE.and(firstCondition, secondCondition);

        // Return A if condition is true, 0 otherwise
        return FHE.select(combinedCondition, a, FHE.asEuint32(0));
    }
}
