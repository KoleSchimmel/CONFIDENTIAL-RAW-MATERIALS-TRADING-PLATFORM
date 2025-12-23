// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Access Control for FHE
/// @notice Demonstrates FHE access control patterns
/// @dev Shows FHE.allow, FHE.allowTransient, and permission management
contract AccessControl is ZamaEthereumConfig {
    /// @notice Maps addresses to their confidential data
    mapping(address => euint32) private userData;

    /// @notice Temporary data that should not persist permissions
    euint32 private temporaryData;

    /// @notice Event emitted when data is stored
    event DataStored(address indexed user);

    /// @notice Event emitted when data is shared
    event DataShared(address indexed from, address indexed to);

    /// @notice Stores encrypted data with persistent permissions
    /// @param encryptedValue The encrypted value to store
    /// @param inputProof The proof of correct encryption
    /// @dev Uses FHE.allow for persistent access control
    function storeData(externalEuint32 encryptedValue, bytes calldata inputProof) external {
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);
        userData[msg.sender] = value;

        // ✅ FHE.allow: Persistent permission
        // This permission stays until explicitly revoked
        FHE.allowThis(userData[msg.sender]);
        FHE.allow(userData[msg.sender], msg.sender);

        emit DataStored(msg.sender);
    }

    /// @notice Demonstrates transient permissions
    /// @param encryptedValue The encrypted value
    /// @param inputProof The proof of encryption
    /// @dev Uses FHE.allowTransient for temporary computation
    function processTemporaryData(
        externalEuint32 encryptedValue,
        bytes calldata inputProof
    ) external view returns (euint32) {
        euint32 value = FHE.fromExternal(encryptedValue, inputProof);

        // ✅ FHE.allowTransient: Temporary permission
        // Permission only valid for this transaction
        // Does not persist in storage
        FHE.allowTransient(value, msg.sender);

        // Process the value
        euint32 result = FHE.add(value, FHE.asEuint32(10));

        return result;
    }

    /// @notice Shares data with another user
    /// @param recipient The address to share data with
    /// @dev Demonstrates granting access to existing encrypted data
    function shareData(address recipient) external {
        require(recipient != address(0), "Invalid recipient");

        euint32 data = userData[msg.sender];

        // Grant permission to recipient
        FHE.allow(data, recipient);

        emit DataShared(msg.sender, recipient);
    }

    /// @notice Retrieves user's own data
    /// @return The encrypted data
    function getMyData() external view returns (euint32) {
        return userData[msg.sender];
    }

    /// @notice Demonstrates the difference between allow and allowTransient
    /// @dev Critical understanding for FHE development
    function accessControlExplanation() external pure {
        // FHE.allow vs FHE.allowTransient

        // ✅ FHE.allow(value, user):
        // - Grants PERSISTENT permission
        // - Permission remains across transactions
        // - Stored in contract state
        // - Use for: User data, persistent values
        // Example: FHE.allow(userData[msg.sender], msg.sender);

        // ✅ FHE.allowTransient(value, user):
        // - Grants TEMPORARY permission
        // - Permission only for current transaction
        // - Not stored in state (gas efficient)
        // - Use for: Temporary computations, view functions
        // Example: FHE.allowTransient(tempValue, msg.sender);

        // ❌ ANTIPATTERN: Using allowTransient for stored data
        // euint32 data = FHE.fromExternal(input, proof);
        // userData[msg.sender] = data;
        // FHE.allowTransient(data, msg.sender); // WRONG!
        // Result: User cannot access their data in future transactions

        // ❌ ANTIPATTERN: Using allow for temporary view operations
        // function computeView() view returns (euint32) {
        //     euint32 temp = FHE.asEuint32(100);
        //     FHE.allow(temp, msg.sender); // Wasteful!
        //     return temp;
        // }
        // Should use: FHE.allowTransient(temp, msg.sender);
    }

    /// @notice Demonstrates FHE.allowThis importance
    /// @dev Contract MUST have permission to work with encrypted values
    function allowThisExplanation() external pure {
        // FHE.allowThis(value) grants permission to the CONTRACT

        // ✅ CORRECT pattern for stored encrypted data:
        // euint32 value = FHE.fromExternal(input, proof);
        // FHE.allowThis(value);           // Contract can use it
        // FHE.allow(value, msg.sender);   // User can decrypt it

        // ❌ ANTIPATTERN: Missing FHE.allowThis
        // euint32 value = FHE.fromExternal(input, proof);
        // FHE.allow(value, msg.sender);   // User permission only
        // Result: Contract cannot perform operations on this value

        // Why both are needed:
        // - allowThis: Contract needs to read/write/compute with the value
        // - allow: User needs to decrypt the value later
    }

    /// @notice Demonstrates permission checking
    /// @dev Shows how permissions affect operations
    function permissionChecking() external pure {
        // Permissions are checked automatically by FHEVM

        // When you call: FHE.decrypt(value)
        // FHEVM checks: Does msg.sender have permission?

        // When contract computes: FHE.add(value1, value2)
        // FHEVM checks: Does contract have allowThis permission?

        // If permission missing -> Transaction reverts

        // This ensures:
        // - Users can only decrypt their authorized data
        // - Contracts can only operate on properly permissioned values
        // - Privacy guarantees are enforced at protocol level
    }

    /// @notice Best practices for access control
    function bestPractices() external pure {
        // 1. Always call FHE.allowThis for stored encrypted values
        // 2. Always call FHE.allow for user-accessible values
        // 3. Use FHE.allowTransient for temporary view operations
        // 4. Grant permissions immediately after encryption
        // 5. Be explicit about who should access what
        // 6. Document permission requirements in comments
    }
}
