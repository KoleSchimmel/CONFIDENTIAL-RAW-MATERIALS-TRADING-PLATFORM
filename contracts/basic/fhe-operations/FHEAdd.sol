// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Add Operation
/// @notice Demonstrates FHE addition operations on encrypted values
/// @dev Shows how to perform arithmetic on encrypted data without decryption
contract FHEAdd is ZamaEthereumConfig {
    /// @notice Adds two encrypted uint32 values
    /// @param encryptedA First encrypted value
    /// @param encryptedB Second encrypted value
    /// @param inputProof Proof of encryption
    /// @return The encrypted sum (A + B)
    /// @dev Both encrypted values must be from the same sender (encryption binding)
    function add(
        externalEuint32 encryptedA,
        externalEuint32 encryptedB,
        bytes calldata inputProof
    ) external view returns (euint32) {
        // Convert external encrypted inputs to internal encrypted values
        euint32 a = FHE.fromExternal(encryptedA, inputProof);
        euint32 b = FHE.fromExternal(encryptedB, inputProof);

        // Perform addition on encrypted values
        euint32 result = FHE.add(a, b);

        return result;
    }

    /// @notice Adds encrypted value to a public value
    /// @param encryptedValue The encrypted operand
    /// @param publicValue The public operand
    /// @param inputProof Proof of encryption
    /// @return The encrypted result (encrypted_value + public_value)
    /// @dev Mixed encrypted/public operations are supported
    function addPublic(
        externalEuint32 encryptedValue,
        uint32 publicValue,
        bytes calldata inputProof
    ) external view returns (euint32) {
        euint32 encrypted = FHE.fromExternal(encryptedValue, inputProof);

        // FHE supports operations with both encrypted and public values
        euint32 result = FHE.add(encrypted, FHE.asEuint32(publicValue));

        return result;
    }

    /// @notice Demonstrates accumulating sum with encryption
    /// @param values Array of encrypted values
    /// @param inputProofs Array of proofs corresponding to each value
    /// @return The encrypted sum of all values
    /// @dev Shows how to accumulate encrypted values in a loop
    function accumulateSum(
        externalEuint32[] calldata values,
        bytes[] calldata inputProofs
    ) external view returns (euint32) {
        require(values.length == inputProofs.length, "Mismatched input lengths");
        require(values.length > 0, "Empty values array");

        // Start with first value
        euint32 sum = FHE.fromExternal(values[0], inputProofs[0]);

        // Accumulate remaining values
        for (uint256 i = 1; i < values.length; i++) {
            euint32 value = FHE.fromExternal(values[i], inputProofs[i]);
            sum = FHE.add(sum, value);
        }

        return sum;
    }
}
