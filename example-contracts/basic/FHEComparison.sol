// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, ebool, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

/**
 * @title FHE Comparison Operations
 * @notice Demonstrates encrypted value comparisons
 * @dev Shows:
 *      - Equality comparison (FHE.eq)
 *      - Greater than (FHE.gt)
 *      - Less than (FHE.lt)
 *      - Greater or equal (FHE.gte)
 *      - Less or equal (FHE.lte)
 *      - Using comparisons in conditionals (FHE.req)
 *
 * @chapter: comparison
 */
contract FHEComparison is SepoliaZamaFHEVMConfig {
    // Storage for encrypted values
    euint32 private _value1;
    euint32 private _value2;
    ebool private _lastComparison;

    // Events
    event ComparisonPerformed(string operation);
    event ConditionalExecuted(bool condition);

    /**
     * @notice Set first encrypted value
     * @param value Encrypted value
     * @param proof Input proof
     */
    function setValue1(inEuint32 calldata value, bytes calldata proof) external {
        _value1 = FHE.asEuint32(value, proof);
        FHE.allowThis(_value1);
        FHE.allow(_value1, msg.sender);
    }

    /**
     * @notice Set second encrypted value
     * @param value Encrypted value
     * @param proof Input proof
     */
    function setValue2(inEuint32 calldata value, bytes calldata proof) external {
        _value2 = FHE.asEuint32(value, proof);
        FHE.allowThis(_value2);
        FHE.allow(_value2, msg.sender);
    }

    /**
     * @notice Check if two encrypted values are equal
     * @dev Encrypted equality returns encrypted boolean
     */
    function checkEqual() external {
        _lastComparison = FHE.eq(_value1, _value2);

        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);

        emit ComparisonPerformed("equal");
    }

    /**
     * @notice Check if first value > second value
     */
    function checkGreater() external {
        _lastComparison = FHE.gt(_value1, _value2);

        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);

        emit ComparisonPerformed("greater-than");
    }

    /**
     * @notice Check if first value < second value
     */
    function checkLess() external {
        _lastComparison = FHE.lt(_value1, _value2);

        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);

        emit ComparisonPerformed("less-than");
    }

    /**
     * @notice Check if first value >= second value
     */
    function checkGreaterOrEqual() external {
        _lastComparison = FHE.gte(_value1, _value2);

        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);

        emit ComparisonPerformed("greater-or-equal");
    }

    /**
     * @notice Check if first value <= second value
     */
    function checkLessOrEqual() external {
        _lastComparison = FHE.lte(_value1, _value2);

        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);

        emit ComparisonPerformed("less-or-equal");
    }

    /**
     * @notice Conditional execution based on encrypted comparison
     * @dev Demonstrates using FHE.req() to conditionally require encrypted condition
     *
     * Example:
     * - Transfer only if encrypted balance >= amount
     * - Execute only if encrypted age >= 18
     * - Approve only if encrypted rating > 5
     */
    function executeIfGreater() external {
        // Check if value1 > value2
        ebool condition = FHE.gt(_value1, _value2);

        // Require the condition to be true
        FHE.req(condition);

        // If we reach here, value1 > value2 was true
        emit ConditionalExecuted(true);
    }

    /**
     * @notice Conditional execution with equality check
     */
    function executeIfEqual() external {
        ebool condition = FHE.eq(_value1, _value2);
        FHE.req(condition);

        emit ConditionalExecuted(true);
    }

    /**
     * @notice Compare encrypted value with plaintext
     * @param encrypted Encrypted value to compare
     * @param plaintext Plaintext value to compare with
     * @param proof Proof for encrypted value
     */
    function compareWithPlaintext(
        inEuint32 calldata encrypted,
        uint32 plaintext,
        bytes calldata proof
    ) external {
        euint32 encValue = FHE.asEuint32(encrypted, proof);
        euint32 plainValue = FHE.asEuint32(plaintext);

        _lastComparison = FHE.gt(encValue, plainValue);

        FHE.allowThis(_lastComparison);
        FHE.allow(_lastComparison, msg.sender);

        emit ComparisonPerformed("compare-plaintext");
    }

    /**
     * @notice Get last comparison result
     * @return Encrypted boolean
     */
    function getLastComparison() external view returns (ebool) {
        return _lastComparison;
    }

    /**
     * ❌ ANTI-PATTERN: What NOT to do
     *
     * function badCompare() external {
     *     // WRONG: Cannot compare encrypted directly to plaintext in require
     *     require(_value1 > 100); // FAILS!
     * }
     *
     * ✅ CORRECT: Use FHE.gt() and FHE.req()
     *
     * function goodCompare() external {
     *     ebool condition = FHE.gt(_value1, FHE.asEuint32(100));
     *     FHE.req(condition); // Correct!
     * }
     */
}
