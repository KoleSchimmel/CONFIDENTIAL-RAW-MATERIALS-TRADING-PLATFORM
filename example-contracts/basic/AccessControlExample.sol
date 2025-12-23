// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

/**
 * @title AccessControlExample
 * @notice Demonstrates FHE access control patterns
 * @dev Shows:
 *      - FHE.allow() for persistent permissions
 *      - FHE.allowTransient() for temporary permissions
 *      - Permission management strategies
 *      - Common access control pitfalls
 *
 * @chapter: access-control
 */
contract AccessControlExample is SepoliaZamaFHEVMConfig {
    /// @notice User secrets (only owner can decrypt)
    mapping(address => euint32) private userSecrets;

    /// @notice Shared pool value (multiple users can access)
    euint32 public sharedPool;

    /// @notice Temporary computation results
    mapping(bytes32 => euint32) private tempResults;

    event PermissionGranted(address indexed from, address indexed to, string permissionType);

    constructor() {
        sharedPool = FHE.asEuint32(0);
        FHE.allowThis(sharedPool);
    }

    /**
     * @notice Store a secret value (Pattern 1: Owner-only access)
     * @param inputSecret Encrypted secret
     * @param inputProof Input proof
     * @dev After storing, only the owner can decrypt
     *
     * Access Control:
     * ✅ FHE.allowThis() - Contract can use value
     * ✅ FHE.allow(owner) - Owner can decrypt
     * ❌ Others cannot decrypt
     */
    function storeSecret(inEuint32 calldata inputSecret, bytes calldata inputProof) external {
        euint32 secret = FHE.asEuint32(inputSecret, inputProof);

        userSecrets[msg.sender] = secret;

        // Grant permissions
        FHE.allowThis(secret);           // Contract access
        FHE.allow(secret, msg.sender);   // Owner access

        emit PermissionGranted(address(this), msg.sender, "permanent");
    }

    /**
     * @notice Share secret with another user (Pattern 2: Explicit sharing)
     * @param recipient Address to share with
     * @dev Grants recipient permission to decrypt your secret
     *
     * Use cases:
     * - Data sharing between users
     * - Delegation
     * - Multi-sig scenarios
     */
    function shareSecretWith(address recipient) external {
        euint32 secret = userSecrets[msg.sender];
        require(FHE.isInitialized(secret), "No secret to share");

        // Grant permission to recipient
        FHE.allow(secret, recipient);

        emit PermissionGranted(msg.sender, recipient, "shared");
    }

    /**
     * @notice Contribute to shared pool (Pattern 3: Shared access)
     * @param inputAmount Encrypted contribution
     * @param inputProof Input proof
     * @dev Multiple users can contribute and view the pool
     *
     * Access Pattern:
     * - New value = old pool + contribution
     * - All previous contributors retain access
     * - New contributor gets access
     */
    function contributeToPool(inEuint32 calldata inputAmount, bytes calldata inputProof) external {
        euint32 amount = FHE.asEuint32(inputAmount, inputProof);

        // Add to pool
        sharedPool = FHE.add(sharedPool, amount);

        // Grant access
        FHE.allowThis(sharedPool);
        FHE.allow(sharedPool, msg.sender);

        emit PermissionGranted(address(this), msg.sender, "pool-access");
    }

    /**
     * @notice Temporary computation (Pattern 4: Transient permissions)
     * @param inputA First value
     * @param inputB Second value
     * @param inputProof Input proof
     * @return computationId ID to retrieve result
     * @dev Uses transient permissions for temporary values
     *
     * FHE.allowTransient() vs FHE.allow():
     * - allowTransient: Permission valid only in current transaction
     * - allow: Permission persists across transactions
     *
     * ⚠️ Note: As of current FHEVM, use FHE.allow() for all cases
     * allowTransient is planned for future optimization
     */
    function computeTemporary(
        inEuint32 calldata inputA,
        inEuint32 calldata inputB,
        bytes calldata inputProof
    ) external returns (bytes32 computationId) {
        euint32 a = FHE.asEuint32(inputA, inputProof);
        euint32 b = FHE.asEuint32(inputB, inputProof);

        // Compute result
        euint32 result = FHE.mul(a, b);

        // Generate unique ID
        computationId = keccak256(abi.encodePacked(msg.sender, block.timestamp));

        // Store temporarily
        tempResults[computationId] = result;

        // Grant permissions
        FHE.allowThis(result);
        FHE.allow(result, msg.sender);
        // In future: FHE.allowTransient(result, msg.sender);

        return computationId;
    }

    /**
     * @notice Retrieve temporary result
     * @param computationId The computation ID
     * @return Encrypted result
     */
    function getTemporaryResult(bytes32 computationId) external view returns (euint32) {
        return tempResults[computationId];
    }

    /**
     * @notice Revoke access pattern (Pattern 5: Access revocation)
     * @dev Note: Current FHEVM doesn't support revoking permissions
     *
     * Workaround: Create new encrypted value without granting permission
     */
    function rotateSecret(inEuint32 calldata newSecret, bytes calldata inputProof) external {
        euint32 secret = FHE.asEuint32(newSecret, inputProof);

        // Replace old secret (old permissions become useless)
        userSecrets[msg.sender] = secret;

        // Grant only to owner (previous sharers lose access)
        FHE.allowThis(secret);
        FHE.allow(secret, msg.sender);
    }

    /**
     * ✅ CORRECT PATTERNS:
     *
     * 1. Always call FHE.allowThis() for contract storage
     * 2. Call FHE.allow(user) for each user who needs access
     * 3. Grant permissions immediately after creating encrypted value
     * 4. Be explicit about who has access
     */

    /**
     * ❌ ANTI-PATTERNS:
     *
     * 1. Forgetting FHE.allowThis():
     *    euint32 value = FHE.add(a, b);
     *    // Missing: FHE.allowThis(value);
     *    userSecrets[msg.sender] = value; // Will fail later!
     *
     * 2. Forgetting FHE.allow() for user:
     *    euint32 value = FHE.asEuint32(input, proof);
     *    FHE.allowThis(value);
     *    // Missing: FHE.allow(value, msg.sender);
     *    // User cannot decrypt their own value!
     *
     * 3. Assuming automatic permissions:
     *    function transfer(address to) external {
     *        userSecrets[to] = userSecrets[msg.sender];
     *        // Missing: FHE.allow(userSecrets[to], to);
     *        // Recipient cannot decrypt!
     *    }
     *
     * 4. Using encrypted values in requires without FHE.req():
     *    require(encryptedValue > 100); // WRONG! Use FHE.req()
     *    FHE.req(FHE.gt(encryptedValue, FHE.asEuint32(100))); // Correct
     */

    /**
     * @notice Get user's secret (owner only can decrypt)
     * @param user User address
     * @return Encrypted secret
     * @dev Returns encrypted value - caller must have permission to decrypt
     */
    function getSecret(address user) external view returns (euint32) {
        return userSecrets[user];
    }

    /**
     * @notice Check if value is initialized
     * @param user User to check
     * @return True if user has stored a secret
     */
    function hasSecret(address user) external view returns (bool) {
        return FHE.isInitialized(userSecrets[user]);
    }
}
