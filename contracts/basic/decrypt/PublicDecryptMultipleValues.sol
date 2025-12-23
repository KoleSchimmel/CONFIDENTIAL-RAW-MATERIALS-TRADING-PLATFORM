// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Public Decrypt Multiple Values
/// @notice Demonstrates public decryption of multiple encrypted values
/// @dev Shows aggregation of multiple encrypted results
contract PublicDecryptMultipleValues is ZamaEthereumConfig {
    /// @notice Stores encrypted results that are publicly decryptable
    euint32[] public encryptedResults;

    /// @notice Event emitted when results are added
    event ResultsAdded(uint256 count);

    /// @notice Aggregates multiple encrypted values with public decryption
    /// @param encryptedValues Array of encrypted values to aggregate
    /// @param inputProofs Array of encryption proofs
    function aggregatePublicResults(
        externalEuint32[] calldata encryptedValues,
        bytes[] calldata inputProofs
    ) external {
        require(encryptedValues.length == inputProofs.length, "Proof count mismatch");
        require(encryptedValues.length > 0, "No values provided");

        // Clear previous results
        delete encryptedResults;

        // Process and aggregate values
        for (uint256 i = 0; i < encryptedValues.length; i++) {
            euint32 value = FHE.fromExternal(encryptedValues[i], inputProofs[i]);

            // ONLY contract permission - NO user-specific permissions
            // This makes values publicly decryptable
            FHE.allowThis(value);

            encryptedResults.push(value);
        }

        emit ResultsAdded(encryptedValues.length);
    }

    /// @notice Computes statistics on encrypted values
    /// @return Sum of all values (encrypted)
    /// @dev Public can decrypt this result
    function getEncryptedSum() external view returns (euint32) {
        require(encryptedResults.length > 0, "No results stored");

        euint32 sum = encryptedResults[0];

        for (uint256 i = 1; i < encryptedResults.length; i++) {
            sum = FHE.add(sum, encryptedResults[i]);
        }

        return sum;
    }

    /// @notice Computes average of public decryptable results
    /// @return Average value (encrypted)
    /// @dev Anyone can decrypt this average
    function getEncryptedAverage() external view returns (euint32) {
        require(encryptedResults.length > 0, "No results stored");

        euint32 sum = encryptedResults[0];

        for (uint256 i = 1; i < encryptedResults.length; i++) {
            sum = FHE.add(sum, encryptedResults[i]);
        }

        // Divide by count (approximate with encrypted value)
        euint32 count = FHE.asEuint32(uint32(encryptedResults.length));
        euint32 average = FHE.div(sum, count);

        return average;
    }

    /// @notice Gets count of stored results
    /// @return Number of encrypted results
    function getResultCount() external view returns (uint256) {
        return encryptedResults.length;
    }

    /// @notice Demonstrates public vs. user decryption permissions
    function permissionDifference() external pure {
        // Public Decryption Setup:
        // FHE.allowThis(value);  // ONLY this
        // (No FHE.allow for specific user)
        // Anyone can request decryption from relayer

        // User Decryption Setup:
        // FHE.allowThis(value);           // Contract access
        // FHE.allow(value, msg.sender);   // User access
        // Only that user can decrypt

        // Use Case for Public Decryption:
        // - Final auction results
        // - Public statistics
        // - Agreed-upon outcomes
        // - Announcements that should be public
    }

    /// @notice Critical: Permissions for array operations
    function arrayPermissions() external pure {
        // ✅ CORRECT: Only allowThis for public values
        // for (uint256 i = 0; i < values.length; i++) {
        //     FHE.allowThis(values[i]);
        // }
        // Result: Anyone can decrypt

        // ❌ WRONG: Adding user permissions for public data
        // for (uint256 i = 0; i < values.length; i++) {
        //     FHE.allowThis(values[i]);
        //     FHE.allow(values[i], msg.sender); // Unnecessarily restricts
        // }
        // Result: Only msg.sender can decrypt (not public)

        // ❌ WRONG: No permissions at all
        // for (uint256 i = 0; i < values.length; i++) {
        //     // Missing FHE.allowThis for each value
        //     encryptedValues.push(values[i]);
        // }
        // Result: Contract cannot operate on values
    }

    /// @notice Shows difference between single and multiple public results
    function singleVsMultiplePublic() external pure {
        // Single Public Value:
        // euint32 result;
        // FHE.allowThis(result);
        // Relayer can decrypt for anyone

        // Multiple Public Values:
        // euint32[] results;
        // for (i) FHE.allowThis(results[i]);
        // Relayer can decrypt any or all for anyone

        // Key Insight:
        // Public decryption means NO USER BINDING
        // Anyone with a handle can request decryption
        // Relayer doesn't need user's private key
    }

    /// @notice Use case: Public voting results
    /// @param encryptedVotes Encrypted vote counts for candidates
    /// @param proofs Encryption proofs
    function recordPublicVoteResults(
        externalEuint32[] calldata encryptedVotes,
        bytes[] calldata proofs
    ) external {
        require(encryptedVotes.length == proofs.length, "Length mismatch");

        delete encryptedResults;

        // Store each candidate's encrypted vote count publicly
        for (uint256 i = 0; i < encryptedVotes.length; i++) {
            euint32 votes = FHE.fromExternal(encryptedVotes[i], proofs[i]);
            FHE.allowThis(votes);  // Only contract permission

            encryptedResults.push(votes);
        }

        // Everyone can now request decryption of vote counts
        // No privacy needed for final results
    }

    /// @notice Best practices for public decryptable results
    function bestPractices() external pure {
        // 1. Only use public decryption for non-sensitive data
        // 2. Be clear about what data is publicly decryptable
        // 3. Only call FHE.allowThis for public values
        // 4. Document which results are public vs. private
        // 5. Consider data sensitivity before storing encrypted
        // 6. Use user-specific decryption for sensitive data
        // 7. Test that public decryption actually works
    }

    /// @notice Shows efficiency of batch operations
    /// @dev Public results can be batch decrypted efficiently
    function batchDecryptionEfficiency() external pure {
        // With N public values:
        // euint32[N] public values stored
        // Relayer can decrypt all N in single batch call
        // No user private key needed
        // Very efficient for public results

        // Compare with N private values:
        // User must decrypt one at a time (or batch by user)
        // Relayer needs user's private key for each
        // More computational overhead
    }
}
