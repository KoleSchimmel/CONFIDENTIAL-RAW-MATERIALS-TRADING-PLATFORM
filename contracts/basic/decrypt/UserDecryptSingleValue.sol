// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title User Decrypt Single Value
/// @notice Demonstrates user decryption with proper permission management
/// @dev Shows how to decrypt encrypted values for specific users
contract UserDecryptSingleValue is ZamaEthereumConfig {
    /// @notice Maps user addresses to their encrypted secrets
    mapping(address => euint32) public userSecrets;

    /// @notice Event emitted when secret is stored
    event SecretStored(address indexed user);

    /// @notice Stores an encrypted secret for the caller
    /// @param encryptedValue The encrypted value to store
    /// @param inputProof The proof of correct encryption
    function storeSecret(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        // Convert and store encrypted value
        euint32 internalValue = FHE.fromExternal(encryptedValue, inputProof);
        userSecrets[msg.sender] = internalValue;

        // Grant permissions for user to decrypt later
        FHE.allowThis(userSecrets[msg.sender]);
        FHE.allow(userSecrets[msg.sender], msg.sender);

        emit SecretStored(msg.sender);
    }

    /// @notice Retrieves encrypted secret for the caller
    /// @return The encrypted secret
    /// @dev Only the user who stored the secret can decrypt it
    function getEncryptedSecret() external view returns (euint32) {
        return userSecrets[msg.sender];
    }

    /// @notice Demonstrates decryption workflow
    /// @dev In a real application:
    /// 1. User calls getEncryptedSecret() to get euint32 handle
    /// 2. User submits decryption request to relayer
    /// 3. Relayer decrypts using user's private key
    /// 4. Relayer returns plaintext result
    function decryptionWorkflow() external pure {
        // This is a conceptual function showing the decryption process
        // Step 1: User gets encrypted value from contract (via getEncryptedSecret)
        // Step 2: User initializes decryption request with handle
        // Step 3: Relayer decrypts the value using user's keypair
        // Step 4: Result is returned to user (off-chain)
    }

    /// @notice Critical: Demonstrates why FHE permissions are needed
    /// @dev Without FHE.allow(secret, user), the user cannot decrypt their own value
    /// @dev Without FHE.allowThis(secret), the contract cannot work with the value
    function permissionImportance() external pure {
        // ✅ CORRECT pattern:
        // FHE.allowThis(secret);      // Contract can access
        // FHE.allow(secret, msg.sender); // User can decrypt

        // ❌ ANTIPATTERN: Missing FHE.allowThis
        // FHE.allow(secret, msg.sender);  // Only user permission
        // Result: User cannot decrypt because contract doesn't allow it

        // ❌ ANTIPATTERN: Missing FHE.allow
        // FHE.allowThis(secret);      // Only contract permission
        // Result: User cannot decrypt their own value
    }

    /// @notice Shows common decryption mistakes
    /// @dev Pattern to AVOID:
    function antiPatterns() external pure {
        // MISTAKE 1: Expecting to decrypt in a view function
        // euint32 secret = userSecrets[msg.sender];
        // uint32 plaintext = FHE.decrypt(secret); // FAILS: No decryption in contract
        // Decryption happens off-chain via relayer

        // MISTAKE 2: Storing secret without permissions
        // euint32 internalValue = FHE.fromExternal(encryptedValue, inputProof);
        // userSecrets[msg.sender] = internalValue;
        // // MISSING: FHE.allow(userSecrets[msg.sender], msg.sender);
        // Result: User cannot decrypt later

        // MISTAKE 3: Assuming all encrypted values can be shared
        // Value encrypted for contract A cannot be used in contract B
        // Value encrypted by user A cannot be used by user B
    }
}
