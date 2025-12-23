// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Public Decrypt Single Value
/// @notice Demonstrates public decryption of encrypted values
/// @dev Shows how to decrypt values that don't require user privacy
contract PublicDecryptSingleValue is ZamaEthereumConfig {
    /// @notice Public state that anyone can decrypt
    euint32 public publicEncryptedValue;

    /// @notice Event emitted when public value is set
    event PublicValueSet(uint32 plainValue);

    /// @notice Sets a publicly decryptable encrypted value
    /// @param encryptedValue The encrypted value
    /// @param inputProof The proof of correct encryption
    /// @dev Unlike user decryption, this value is decryptable by anyone
    function setPublicValue(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        euint32 internalValue = FHE.fromExternal(encryptedValue, inputProof);
        publicEncryptedValue = internalValue;

        // Grant contract permission
        FHE.allowThis(publicEncryptedValue);

        // Do NOT grant user-specific permissions - anyone can decrypt
        // This is the key difference from user decryption
    }

    /// @notice Retrieves the publicly encrypted value
    /// @return The encrypted value handle
    function getPublicEncryptedValue() external view returns (euint32) {
        return publicEncryptedValue;
    }

    /// @notice Demonstrates the difference between public and user decryption
    /// @dev Public Decryption:
    /// - Value is encrypted with contract address
    /// - Anyone can request decryption from relayer
    /// - Relayer can decrypt without user involvement
    /// - Use case: Public results, announcements
    /// @dev User Decryption:
    /// - Value is encrypted with [contract, user] binding
    /// - Only that user can decrypt (relayer needs their key)
    /// - Use case: Private data, secrets
    function decryptionTypesExplained() external pure {
        // Public Decryption Flow:
        // 1. Contract stores euint32 with FHE.allowThis only
        // 2. Anyone can call getPublicEncryptedValue()
        // 3. Anyone can submit to relayer for decryption
        // 4. Relayer decrypts immediately (no private key needed)

        // User Decryption Flow:
        // 1. Contract stores euint32 with FHE.allowThis + FHE.allow(user)
        // 2. Only authorized user can call getEncryptedSecret()
        // 3. User submits to relayer with their private key
        // 4. Relayer uses user's key to decrypt
    }

    /// @notice Use case: Public voting result encryption
    /// @param encryptedVotes Encrypted vote count
    /// @param proof Proof of encryption
    /// @dev Everyone can later decrypt the final vote count
    function recordPublicVotes(externalEuint32 encryptedVotes, bytes calldata proof) external {
        euint32 votes = FHE.fromExternal(encryptedVotes, proof);
        publicEncryptedValue = votes;

        // Only contract permission - not user-specific
        FHE.allowThis(publicEncryptedValue);
    }

    /// @notice Critical difference in permission setup
    /// @dev Pattern for PUBLIC decryption:
    function publicPattern() external pure {
        // ✅ CORRECT for public decryption:
        // FHE.allowThis(value);  // Only this
        // // Do NOT call: FHE.allow(value, msg.sender);
    }

    /// @notice Critical difference in permission setup
    /// @dev Pattern for USER decryption:
    function userPattern() external pure {
        // ✅ CORRECT for user decryption:
        // FHE.allowThis(value);           // Contract access
        // FHE.allow(value, msg.sender);   // User access (REQUIRED)
    }
}
