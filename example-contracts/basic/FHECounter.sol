// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

/**
 * @title FHECounter
 * @notice A simple confidential counter demonstrating basic FHE operations
 * @dev This example shows:
 *      - How to use encrypted integers (euint32)
 *      - FHE arithmetic operations (add, sub)
 *      - Access control with FHE.allow()
 *      - Input proof usage
 *
 * @chapter: basic
 */
contract FHECounter is SepoliaZamaFHEVMConfig {
    /// @notice Encrypted counter value
    euint32 private _counter;

    /// @notice Owner of the counter
    address public owner;

    /// @notice Event emitted when counter is incremented
    event Incremented(address indexed user);

    /// @notice Event emitted when counter is decremented
    event Decremented(address indexed user);

    constructor() {
        owner = msg.sender;
        // Initialize counter to encrypted 0
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
        FHE.allow(_counter, owner);
    }

    /**
     * @notice Increment counter by an encrypted value
     * @param inputEncryptedValue The encrypted input handle
     * @param inputProof The zero-knowledge proof for the input
     * @dev Demonstrates:
     *      - Using FHE.asEuint32() to convert input
     *      - FHE.add() for encrypted addition
     *      - FHE.allowThis() to grant contract access
     *      - FHE.allow() to grant user access
     */
    function increment(inEuint32 calldata inputEncryptedValue, bytes calldata inputProof) external {
        // Convert input to encrypted value with proof verification
        euint32 value = FHE.asEuint32(inputEncryptedValue, inputProof);

        // Perform encrypted addition
        _counter = FHE.add(_counter, value);

        // Grant permissions
        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);

        emit Incremented(msg.sender);
    }

    /**
     * @notice Decrement counter by an encrypted value
     * @param inputEncryptedValue The encrypted input handle
     * @param inputProof The zero-knowledge proof for the input
     * @dev Note: This example omits underflow checks for simplicity
     *      In production, you should implement proper bounds checking
     */
    function decrement(inEuint32 calldata inputEncryptedValue, bytes calldata inputProof) external {
        euint32 value = FHE.asEuint32(inputEncryptedValue, inputProof);

        // Perform encrypted subtraction
        _counter = FHE.sub(_counter, value);

        // Grant permissions
        FHE.allowThis(_counter);
        FHE.allow(_counter, msg.sender);

        emit Decremented(msg.sender);
    }

    /**
     * @notice Get the encrypted counter value
     * @return The encrypted counter (handle)
     * @dev The returned value is still encrypted.
     *      To decrypt, the caller must have permission and use the gateway
     */
    function getCounter() external view returns (euint32) {
        return _counter;
    }

    /**
     * @notice Reset counter to zero (owner only)
     * @dev Example of combining traditional access control with FHE
     */
    function reset() external {
        require(msg.sender == owner, "Only owner can reset");
        _counter = FHE.asEuint32(0);
        FHE.allowThis(_counter);
        FHE.allow(_counter, owner);
    }
}
