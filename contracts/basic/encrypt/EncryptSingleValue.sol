// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypt Single Value
/// @notice Demonstrates FHE encryption mechanism for a single value
/// @dev Shows proper encryption patterns and common pitfalls
contract EncryptSingleValue is ZamaEthereumConfig {
    /// @notice Stores encrypted secret value
    euint32 private encryptedSecret;

    /// @notice Event emitted when secret is set
    event SecretSet(address indexed user);

    /// @notice Sets an encrypted secret value
    /// @param encryptedValue The encrypted value to store
    /// @param inputProof The proof of correct encryption
    /// @dev CRITICAL: Both FHE.allowThis and FHE.allow MUST be called
    /// @dev ANTIPATTERN: Forgetting FHE.allowThis will cause decryption to fail
    function setSecret(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        // Convert external encrypted input to internal representation
        euint32 internalValue = FHE.fromExternal(encryptedValue, inputProof);

        // Store the encrypted value
        encryptedSecret = internalValue;

        // ✅ CORRECT: Grant BOTH permissions
        FHE.allowThis(encryptedSecret);          // Allow contract to access
        FHE.allow(encryptedSecret, msg.sender);  // Allow user to access

        // ❌ ANTIPATTERN: The following would fail if either permission is missing
        // FHE.allow(encryptedSecret, msg.sender);  // WITHOUT allowThis -> fails!

        emit SecretSet(msg.sender);
    }

    /// @notice Retrieves the encrypted secret
    /// @return The encrypted secret value
    /// @dev Caller must have proper permissions set via setSecret
    function getEncryptedSecret() external view returns (euint32) {
        return encryptedSecret;
    }

    /// @notice Demonstrates encryption binding concept
    /// @param encryptedFromAlice Encrypted input from Alice
    /// @param proofAlice Proof from Alice's encryption
    /// @param encryptedFromBob Encrypted input from Bob
    /// @param proofBob Proof from Bob's encryption
    /// @dev CRITICAL: Values must be encrypted by the same sender and for this contract
    /// @dev ❌ ANTIPATTERN: Cannot mix encryptions from different users
    function processEncrypted(
        externalEuint32 encryptedFromAlice,
        bytes calldata proofAlice,
        externalEuint32 encryptedFromBob,
        bytes calldata proofBob
    ) external view returns (euint32) {
        // ✅ CORRECT: Use encryptions from the message sender
        euint32 valueAlice = FHE.fromExternal(encryptedFromAlice, proofAlice);

        // ❌ ANTIPATTERN: This would fail at runtime if proofBob is from different user
        // euint32 valueBob = FHE.fromExternal(encryptedFromBob, proofBob);
        // return FHE.add(valueAlice, valueBob); // Cannot add encrypted values from different senders!

        return valueAlice;
    }

    /// @notice Shows the importance of using encryption proofs
    /// @dev Input proofs are zero-knowledge proofs that verify:
    /// 1. The value is correctly encrypted
    /// 2. The value is bound to [contract_address, msg.sender]
    /// 3. The encryption is valid
    function demonstrateProofImportance() external pure {
        // Without a valid proof, FHE.fromExternal would fail
        // The proof is cryptographically signed and verified
        // This prevents unauthorized value injection
    }
}
