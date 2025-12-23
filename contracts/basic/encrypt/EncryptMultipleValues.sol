// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypt Multiple Values
/// @notice Demonstrates FHE encryption and handling of multiple encrypted values
/// @dev Shows how to store and manage multiple encrypted data points
contract EncryptMultipleValues is ZamaEthereumConfig {
    /// @notice Stores encrypted values
    struct EncryptedData {
        euint32 value1;
        euint32 value2;
        euint32 value3;
    }

    /// @notice Maps user to their encrypted data
    mapping(address => EncryptedData) public userDatasets;

    /// @notice Event emitted when data is stored
    event DatasetStored(address indexed user, uint8 valueCount);

    /// @notice Stores multiple encrypted values for a user
    /// @param encryptedValues Array of encrypted values
    /// @param inputProofs Array of proofs corresponding to each value
    /// @dev Shows proper permission handling for multiple values
    function storeMultipleValues(
        externalEuint32[] calldata encryptedValues,
        bytes[] calldata inputProofs
    ) external {
        require(encryptedValues.length == inputProofs.length, "Length mismatch");
        require(encryptedValues.length <= 3, "Maximum 3 values");

        // Convert and store encrypted values
        euint32[] memory values = new euint32[](encryptedValues.length);

        for (uint256 i = 0; i < encryptedValues.length; i++) {
            values[i] = FHE.fromExternal(encryptedValues[i], inputProofs[i]);

            // CRITICAL: Grant permissions for EACH encrypted value
            FHE.allowThis(values[i]);
            FHE.allow(values[i], msg.sender);
        }

        // Store values
        if (encryptedValues.length >= 1) {
            userDatasets[msg.sender].value1 = values[0];
        }
        if (encryptedValues.length >= 2) {
            userDatasets[msg.sender].value2 = values[1];
        }
        if (encryptedValues.length >= 3) {
            userDatasets[msg.sender].value3 = values[2];
        }

        emit DatasetStored(msg.sender, uint8(encryptedValues.length));
    }

    /// @notice Retrieves all encrypted values for the caller
    /// @return data The struct containing all encrypted values
    function getMultipleValues() external view returns (EncryptedData memory) {
        return userDatasets[msg.sender];
    }

    /// @notice Computes on multiple encrypted values
    /// @return Sum of all three encrypted values
    /// @dev Demonstrates operations on multiple values
    function sumAllValues() external view returns (euint32) {
        EncryptedData memory data = userDatasets[msg.sender];

        // Perform operations on multiple values
        euint32 sum = FHE.add(data.value1, data.value2);
        sum = FHE.add(sum, data.value3);

        return sum;
    }

    /// @notice Demonstrates permission handling for multiple values
    /// @dev Critical: Each value needs individual permission setup
    function multipleValuesPermissionPattern() external pure {
        // ✅ CORRECT: Each value gets permissions
        // for (uint256 i = 0; i < values.length; i++) {
        //     FHE.allowThis(values[i]);
        //     FHE.allow(values[i], msg.sender);
        // }

        // ❌ ANTIPATTERN: Only granting to first value
        // FHE.allowThis(values[0]);
        // FHE.allow(values[0], msg.sender);
        // // values[1], values[2] have no permissions!

        // ❌ ANTIPATTERN: Trying to grant permissions to array
        // euint32[] memory values;
        // FHE.allowThis(values); // COMPILATION ERROR
        // Permissions must be granted individually
    }

    /// @notice Shows common mistakes with multiple values
    function antiPatterns() external pure {
        // MISTAKE 1: Assuming array operations work on encrypted values
        // euint32[] memory encrypted = [FHE.asEuint32(1), FHE.asEuint32(2)];
        // euint32 sum = FHE.add(encrypted[0], encrypted[1]); // OK
        // euint32 total = reduce(encrypted); // DOESN'T EXIST

        // MISTAKE 2: Not granting permissions for all values
        // for loop creates encrypted values
        // Forgetting to grant permissions for some values
        // Result: Later operations fail

        // MISTAKE 3: Trying to return array of encrypted values
        // function getAll() returns (euint32[]) // AVOID
        // Better: Return struct or tuple with fixed sizes

        // MISTAKE 4: Mixing encrypted and plaintext arrays
        // euint32[] encrypted;
        // uint32[] plaintext;
        // FHE.add(encrypted, plaintext); // Type mismatch
    }

    /// @notice Best practices for handling multiple encrypted values
    function bestPractices() external pure {
        // 1. Use structs for fixed-size collections
        // 2. Grant permissions to each value individually
        // 3. Document which values each function accesses
        // 4. Be explicit about array sizes (prefer fixed sizes)
        // 5. Test permission edge cases
        // 6. Consider gas costs of multiple operations
        // 7. Use appropriate loops with proper bounds
    }

    /// @notice Demonstrates iteration over encrypted values
    /// @param encryptedValues Array of encrypted values
    /// @param inputProofs Array of corresponding proofs
    /// @return sum The sum of all values
    function iterateAndSum(
        externalEuint32[] calldata encryptedValues,
        bytes[] calldata inputProofs
    ) external view returns (euint32) {
        require(encryptedValues.length == inputProofs.length, "Length mismatch");
        require(encryptedValues.length > 0, "No values provided");

        // Start with first value
        euint32 sum = FHE.fromExternal(encryptedValues[0], inputProofs[0]);

        // Add remaining values
        for (uint256 i = 1; i < encryptedValues.length; i++) {
            euint32 value = FHE.fromExternal(encryptedValues[i], inputProofs[i]);
            sum = FHE.add(sum, value);
        }

        return sum;
    }
}
