// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Counter
/// @notice A simple counter contract using Fully Homomorphic Encryption
/// @dev Demonstrates basic FHE operations: increment and decrement on encrypted values
contract FHECounter is ZamaEthereumConfig {
    /// @notice Encrypted counter value stored on-chain
    euint32 private _counter;

    /// @notice Event emitted when counter is incremented
    event CounterIncremented(address indexed user);

    /// @notice Event emitted when counter is decremented
    event CounterDecremented(address indexed user);

    /// @notice Initializes the counter to encrypted zero
    constructor() {
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
    }

    /// @notice Increments the counter by an encrypted value
    /// @param inputValue The encrypted input value to add
    /// @param inputProof The proof that the input is correctly encrypted
    /// @dev This demonstrates FHE.add operation on encrypted values
    /// @dev IMPORTANT: Both FHE.allowThis and FHE.allow must be called for proper access control
    function increment(externalEuint32 inputValue, bytes calldata inputProof) external {
        // Convert external encrypted input to internal encrypted value
        euint32 encryptedValue = FHE.fromExternal(inputValue, inputProof);

        // Perform homomorphic addition on encrypted values
        _counter = FHE.add(_counter, encryptedValue);

        // Grant permissions: BOTH are required
        FHE.allowThis(_counter);        // Allow contract to access the value
        FHE.allow(_counter, msg.sender); // Allow user to access the value

        emit CounterIncremented(msg.sender);
    }

    /// @notice Decrements the counter by an encrypted value
    /// @param inputValue The encrypted input value to subtract
    /// @param inputProof The proof that the input is correctly encrypted
    /// @dev This demonstrates FHE.sub operation on encrypted values
    /// @dev Note: No underflow checks for simplicity - production contracts should include them
    function decrement(externalEuint32 inputValue, bytes calldata inputProof) external {
        // Convert external encrypted input to internal encrypted value
        euint32 encryptedValue = FHE.fromExternal(inputValue, inputProof);

        // Perform homomorphic subtraction on encrypted values
        _counter = FHE.sub(_counter, encryptedValue);

        // Grant permissions: BOTH are required
        FHE.allowThis(_counter);        // Allow contract to access the value
        FHE.allow(_counter, msg.sender); // Allow user to access the value

        emit CounterDecremented(msg.sender);
    }

    /// @notice Returns the encrypted counter value
    /// @return The encrypted counter as euint32
    /// @dev The caller must have permission to access this value
    /// @dev Permission is granted via FHE.allow in increment/decrement functions
    function getCounter() external view returns (euint32) {
        return _counter;
    }

    /// @notice Resets the counter to encrypted zero
    /// @dev Demonstrates re-initialization of encrypted state
    function reset() external {
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);
    }
}
