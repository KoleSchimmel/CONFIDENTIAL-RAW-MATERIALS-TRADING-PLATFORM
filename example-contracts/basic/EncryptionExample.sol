// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64, ebool, inEuint32, inEuint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

/**
 * @title EncryptionExample
 * @notice Demonstrates various encryption patterns and types
 * @dev Shows:
 *      - Different encrypted types (euint32, euint64, ebool)
 *      - Encryption from plaintext
 *      - Encryption from user input with proofs
 *      - Multiple encrypted values per user
 *
 * @chapter: encryption
 */
contract EncryptionExample is SepoliaZamaFHEVMConfig {
    /// @notice Mapping of user addresses to their encrypted balances
    mapping(address => euint64) public encryptedBalances;

    /// @notice Mapping of user addresses to encrypted flags
    mapping(address => ebool) public encryptedFlags;

    /// @notice Shared encrypted value accessible to all
    euint32 public sharedEncryptedValue;

    event ValueEncrypted(address indexed user, string valueType);

    constructor() {
        // Initialize shared value
        sharedEncryptedValue = FHE.asEuint32(100);
        FHE.allowThis(sharedEncryptedValue);
    }

    /**
     * @notice Encrypt a single value from user input
     * @param inputValue Encrypted input handle
     * @param inputProof Zero-knowledge proof
     * @dev Pattern 1: Single value encryption with proof
     *
     * ✅ Correct Usage:
     * - User creates encrypted input with fhevmjs
     * - Provides input proof for verification
     * - Contract stores encrypted value
     */
    function encryptSingleValue(
        inEuint64 calldata inputValue,
        bytes calldata inputProof
    ) external {
        // Convert input to encrypted value (proof is verified)
        euint64 encrypted = FHE.asEuint64(inputValue, inputProof);

        // Store for user
        encryptedBalances[msg.sender] = encrypted;

        // Grant permissions
        FHE.allowThis(encrypted);
        FHE.allow(encrypted, msg.sender);

        emit ValueEncrypted(msg.sender, "single-euint64");
    }

    /**
     * @notice Encrypt multiple values in one transaction
     * @param inputValue1 First encrypted value
     * @param inputValue2 Second encrypted value
     * @param inputProof Combined proof for both values
     * @dev Pattern 2: Multiple values with single proof
     *
     * Key Points:
     * - More gas efficient than separate transactions
     * - Single proof covers all inputs
     * - All values must be from same user
     */
    function encryptMultipleValues(
        inEuint32 calldata inputValue1,
        inEuint32 calldata inputValue2,
        bytes calldata inputProof
    ) external {
        euint32 encrypted1 = FHE.asEuint32(inputValue1, inputProof);
        euint32 encrypted2 = FHE.asEuint32(inputValue2, inputProof);

        // Example: Calculate sum
        euint32 sum = FHE.add(encrypted1, encrypted2);

        // Store result
        sharedEncryptedValue = sum;

        // Grant permissions
        FHE.allowThis(sum);
        FHE.allow(sum, msg.sender);

        emit ValueEncrypted(msg.sender, "multiple-euint32");
    }

    /**
     * @notice Encrypt from plaintext (contract-side)
     * @param plaintextValue Public value to encrypt
     * @dev Pattern 3: Contract encrypts plaintext
     *
     * ⚠️ Warning: Use carefully!
     * - Plaintext is visible in transaction
     * - Useful for public constants or initialization
     * - NOT suitable for sensitive user data
     */
    function encryptFromPlaintext(uint32 plaintextValue) external {
        // Contract encrypts the plaintext value
        euint32 encrypted = FHE.asEuint32(plaintextValue);

        sharedEncryptedValue = encrypted;

        FHE.allowThis(encrypted);
        FHE.allow(encrypted, msg.sender);

        emit ValueEncrypted(msg.sender, "plaintext-euint32");
    }

    /**
     * @notice Encrypt a boolean flag
     * @param inputFlag Encrypted boolean input
     * @param inputProof Input proof
     * @dev Pattern 4: Encrypted booleans
     *
     * Use cases:
     * - Feature flags
     * - Eligibility checks
     * - Conditional logic
     */
    function encryptBooleanFlag(
        inEuint32 calldata inputFlag,
        bytes calldata inputProof
    ) external {
        // Note: Boolean is represented as euint8 or comparison result
        euint32 value = FHE.asEuint32(inputFlag, inputProof);
        ebool flag = FHE.eq(value, FHE.asEuint32(1));

        encryptedFlags[msg.sender] = flag;

        FHE.allowThis(flag);
        FHE.allow(flag, msg.sender);

        emit ValueEncrypted(msg.sender, "boolean");
    }

    /**
     * @notice Get user's encrypted balance
     * @return Encrypted balance (still encrypted!)
     * @dev Returns encrypted value, not plaintext
     *
     * ❌ Common Mistake:
     * uint64 balance = uint64(getEncryptedBalance()); // WRONG! Still encrypted
     *
     * ✅ Correct Approach:
     * euint64 encBalance = getEncryptedBalance();
     * // Use gateway to decrypt with proper permissions
     */
    function getEncryptedBalance(address user) external view returns (euint64) {
        return encryptedBalances[user];
    }

    /**
     * @notice Example: Grant permission to another user
     * @param allowedUser User to grant permission to
     * @dev Pattern 5: Permission management
     *
     * Allows another user to decrypt your encrypted balance
     * Useful for: escrow, auditing, delegation
     */
    function allowUserToViewBalance(address allowedUser) external {
        euint64 balance = encryptedBalances[msg.sender];
        FHE.allow(balance, allowedUser);
    }

    /**
     * ❌ ANTI-PATTERN: View function trying to decrypt
     * This will NOT work - view functions cannot decrypt
     *
     * function getPlaintextBalance() external view returns (uint64) {
     *     return FHE.decrypt(encryptedBalances[msg.sender]); // FAILS!
     * }
     *
     * ✅ Instead: Use gateway for async decryption
     */

    /**
     * ❌ ANTI-PATTERN: Missing input proof
     * This will fail or be insecure
     *
     * function insecureEncrypt(euint64 value) external {
     *     encryptedBalances[msg.sender] = value; // No proof verification!
     * }
     *
     * ✅ Always use: FHE.asEuintXX(input, proof)
     */
}
