// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title User Decrypt Multiple Values
/// @notice Demonstrates user decryption of multiple encrypted values
/// @dev Shows permission handling for arrays of encrypted data
contract UserDecryptMultipleValues is ZamaEthereumConfig {
    /// @notice Stores multiple encrypted values per user
    struct UserData {
        euint32[] encryptedValues;
        uint256 valueCount;
    }

    /// @notice Maps users to their data
    mapping(address => UserData) public userData;

    /// @notice Event emitted when data is stored
    event DataStored(address indexed user, uint256 count);

    /// @notice Stores multiple encrypted values
    /// @param encryptedValues Array of encrypted values
    /// @param inputProofs Array of proofs (one per value or batch proof)
    function storeMultipleEncrypted(
        externalEuint32[] calldata encryptedValues,
        bytes[] calldata inputProofs
    ) external {
        require(encryptedValues.length == inputProofs.length, "Proof count mismatch");
        require(encryptedValues.length > 0, "No values provided");

        // Clear previous data
        delete userData[msg.sender].encryptedValues;

        // Store each encrypted value with proper permissions
        for (uint256 i = 0; i < encryptedValues.length; i++) {
            euint32 value = FHE.fromExternal(encryptedValues[i], inputProofs[i]);

            // CRITICAL: Grant permissions for EACH value
            FHE.allowThis(value);
            FHE.allow(value, msg.sender);

            userData[msg.sender].encryptedValues.push(value);
        }

        userData[msg.sender].valueCount = encryptedValues.length;

        emit DataStored(msg.sender, encryptedValues.length);
    }

    /// @notice Retrieves count of encrypted values
    /// @return Number of stored values
    function getValueCount() external view returns (uint256) {
        return userData[msg.sender].valueCount;
    }

    /// @notice Demonstrates decryption of multiple values workflow
    /// @dev In production:
    /// 1. User calls this to get encrypted values
    /// 2. User submits decryption request for all values
    /// 3. Relayer decrypts each value using user's keypair
    /// 4. User receives plaintext values
    function decryptMultipleWorkflow() external pure {
        // Step 1: Get encrypted values from contract
        // euint32[] memory encrypted = userData[msg.sender].encryptedValues;

        // Step 2: Prepare decryption request
        // Include handles for all values

        // Step 3: Submit to relayer
        // Relayer has user's private key from key management system

        // Step 4: Relayer decrypts each value
        // Batch decryption is more efficient than individual calls

        // Step 5: Return plaintext values to user
        // User gets all values decrypted in single response
    }

    /// @notice Performs computation on multiple encrypted values
    /// @return The sum of all encrypted values
    function computeOnMultiple() external view returns (euint32) {
        require(userData[msg.sender].valueCount > 0, "No values stored");

        euint32[] memory values = userData[msg.sender].encryptedValues;

        // Start with first value
        euint32 result = values[0];

        // Accumulate operations
        for (uint256 i = 1; i < values.length; i++) {
            result = FHE.add(result, values[i]);
        }

        return result;
    }

    /// @notice Demonstrates conditional operations on multiple values
    /// @return The maximum of all encrypted values (in encrypted form)
    /// @dev Shows how to compare multiple encrypted values
    function findMaxEncrypted() external view returns (euint32) {
        require(userData[msg.sender].valueCount > 0, "No values stored");

        euint32[] memory values = userData[msg.sender].encryptedValues;
        euint32 max = values[0];

        // Compare with each subsequent value
        for (uint256 i = 1; i < values.length; i++) {
            // Check if current value > max
            ebool isGreater = FHE.gt(values[i], max);

            // Update max based on encrypted comparison
            max = FHE.select(isGreater, values[i], max);
        }

        return max;
    }

    /// @notice Critical patterns for multiple decryption
    function multipleDecryptionPatterns() external pure {
        // ✅ CORRECT: Grant permissions to each value
        // for (uint256 i = 0; i < encryptedValues.length; i++) {
        //     euint32 value = FHE.fromExternal(encryptedValues[i], inputProofs[i]);
        //     FHE.allowThis(value);
        //     FHE.allow(value, msg.sender);
        //     userData[msg.sender].values.push(value);
        // }

        // ❌ ANTIPATTERN: Granting permissions to array
        // euint32[] memory values = new euint32[](count);
        // FHE.allow(values, msg.sender); // FAILS: Must do individually

        // ❌ ANTIPATTERN: Forgetting permissions in loop
        // for (uint256 i = 0; i < count; i++) {
        //     euint32 value = FHE.fromExternal(encryptedValues[i], inputProofs[i]);
        //     // Missing: FHE.allowThis(value);
        //     // Missing: FHE.allow(value, msg.sender);
        //     values.push(value);
        // }
        // Result: User cannot decrypt values i onwards
    }

    /// @notice Key differences: Single vs. Multiple decryption
    function singleVsMultiple() external pure {
        // Single Value:
        // euint32 secret;
        // FHE.allowThis(secret);
        // FHE.allow(secret, msg.sender);
        // User can decrypt with single relayer call

        // Multiple Values:
        // euint32[] values;
        // for (i) {
        //     FHE.allowThis(values[i]);
        //     FHE.allow(values[i], msg.sender);
        // }
        // User can decrypt all with batch relayer call
        // More efficient than individual calls

        // Efficiency tip:
        // Batch decryption of N values is faster than N individual decryptions
        // Relayer can optimize batch operations
    }

    /// @notice Best practices for managing multiple encrypted values
    function bestPractices() external pure {
        // 1. Always grant permissions individually in loops
        // 2. Track value count separately
        // 3. Use batch operations when possible
        // 4. Test with various array sizes
        // 5. Document permission requirements
        // 6. Consider gas costs of array operations
        // 7. Use batch decryption at relayer level
        // 8. Implement bounds checking in loops
    }

    /// @notice Shows efficient permission setup pattern
    /// @param count Number of values to prepare
    function efficientPermissionSetup(uint256 count) external pure {
        // Efficient loop pattern:
        // for (uint256 i = 0; i < count; ++i) {
        //     euint32 value = FHE.fromExternal(encrypted[i], proofs[i]);
        //     FHE.allowThis(value);        // 1 storage write per value
        //     FHE.allow(value, user);       // 1 storage write per value
        // }
        // Total: 2N storage operations

        // This is necessary - no way to batch permissions
        // But relayer can batch the decryption requests
    }
}
