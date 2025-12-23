// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, inEuint32, inEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

/**
 * @title FHE Arithmetic Operations
 * @notice Demonstrates FHE arithmetic operations (add, sub, mul, div)
 * @dev Shows:
 *      - Addition on encrypted values
 *      - Subtraction on encrypted values
 *      - Multiplication on encrypted values
 *      - Division on encrypted values
 *      - Mixed encrypted and plaintext operations
 *
 * @chapter: arithmetic
 */
contract FHEArithmetic is SepoliaZamaFHEVMConfig {
    // Storage for encrypted values
    euint32 private _result32;
    euint64 private _result64;

    // Events
    event ResultComputed(string operation);

    /**
     * @notice Add two encrypted values
     * @param a First encrypted value
     * @param b Second encrypted value
     * @param proofA Proof for first value
     * @param proofB Proof for second value
     */
    function add(
        inEuint32 calldata a,
        inEuint32 calldata b,
        bytes calldata proofA,
        bytes calldata proofB
    ) external {
        euint32 valueA = FHE.asEuint32(a, proofA);
        euint32 valueB = FHE.asEuint32(b, proofB);

        _result32 = FHE.add(valueA, valueB);

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);

        emit ResultComputed("add");
    }

    /**
     * @notice Subtract encrypted value from another
     * @param a First encrypted value (minuend)
     * @param b Second encrypted value (subtrahend)
     * @param proofA Proof for first value
     * @param proofB Proof for second value
     */
    function subtract(
        inEuint32 calldata a,
        inEuint32 calldata b,
        bytes calldata proofA,
        bytes calldata proofB
    ) external {
        euint32 valueA = FHE.asEuint32(a, proofA);
        euint32 valueB = FHE.asEuint32(b, proofB);

        _result32 = FHE.sub(valueA, valueB);

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);

        emit ResultComputed("subtract");
    }

    /**
     * @notice Multiply two encrypted values
     * @param a First encrypted value
     * @param b Second encrypted value
     * @param proofA Proof for first value
     * @param proofB Proof for second value
     */
    function multiply(
        inEuint32 calldata a,
        inEuint32 calldata b,
        bytes calldata proofA,
        bytes calldata proofB
    ) external {
        euint32 valueA = FHE.asEuint32(a, proofA);
        euint32 valueB = FHE.asEuint32(b, proofB);

        _result32 = FHE.mul(valueA, valueB);

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);

        emit ResultComputed("multiply");
    }

    /**
     * @notice Add plaintext value to encrypted value
     * @param encrypted Encrypted value
     * @param plaintext Plaintext value to add
     * @param proof Proof for encrypted value
     * @dev Useful when one operand is public
     */
    function addPlaintext(
        inEuint32 calldata encrypted,
        uint32 plaintext,
        bytes calldata proof
    ) external {
        euint32 value = FHE.asEuint32(encrypted, proof);
        euint32 plainValue = FHE.asEuint32(plaintext);

        _result32 = FHE.add(value, plainValue);

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);

        emit ResultComputed("add-plaintext");
    }

    /**
     * @notice Subtract plaintext value from encrypted value
     * @param encrypted Encrypted value
     * @param plaintext Plaintext value to subtract
     * @param proof Proof for encrypted value
     */
    function subtractPlaintext(
        inEuint32 calldata encrypted,
        uint32 plaintext,
        bytes calldata proof
    ) external {
        euint32 value = FHE.asEuint32(encrypted, proof);
        euint32 plainValue = FHE.asEuint32(plaintext);

        _result32 = FHE.sub(value, plainValue);

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);

        emit ResultComputed("subtract-plaintext");
    }

    /**
     * @notice Multiply encrypted value by plaintext
     * @param encrypted Encrypted value
     * @param plaintext Plaintext multiplier
     * @param proof Proof for encrypted value
     */
    function multiplyPlaintext(
        inEuint32 calldata encrypted,
        uint32 plaintext,
        bytes calldata proof
    ) external {
        euint32 value = FHE.asEuint32(encrypted, proof);
        euint32 plainValue = FHE.asEuint32(plaintext);

        _result32 = FHE.mul(value, plainValue);

        FHE.allowThis(_result32);
        FHE.allow(_result32, msg.sender);

        emit ResultComputed("multiply-plaintext");
    }

    /**
     * @notice Get the latest result (32-bit)
     * @return Encrypted result
     */
    function getResult32() external view returns (euint32) {
        return _result32;
    }

    /**
     * @notice Get the latest result (64-bit)
     * @return Encrypted result
     */
    function getResult64() external view returns (euint64) {
        return _result64;
    }
}
