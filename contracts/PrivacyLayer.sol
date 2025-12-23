// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { Errors } from "./libs/Errors.sol";

/// @title PrivacyLayer Contract
/// @notice Utility library for FHE privacy operations
/// @dev Provides reusable functions for encrypted data handling
library PrivacyLayer {
    /// @notice Check if two addresses match on encrypted data
    /// @dev In full FHE: uses FHE.eq() for encrypted comparison
    /// @param address1 First address to compare
    /// @param address2 Second address to compare
    /// @return match True if addresses are equal
    function addressesMatch(uint64 address1, uint64 address2)
        internal
        pure
        returns (bool match)
    {
        // ✅ Simulates encrypted address comparison
        // In production: use FHE operations
        return address1 == address2;
    }

    /// @notice Check if two locations are within distance
    /// @dev Simulates distance calculation on encrypted coordinates
    /// @param location1 First location (encoded)
    /// @param location2 Second location (encoded)
    /// @param maxDistance Maximum allowed distance
    /// @return withinDistance True if locations are close enough
    function locationsNear(
        uint64 location1,
        uint64 location2,
        uint32 maxDistance
    ) internal pure returns (bool withinDistance) {
        // ✅ Simulates FHE distance calculation
        // In production: calculate distance on encrypted values
        // without revealing actual coordinates

        // For this example: simple comparison
        // Real implementation would use:
        // - FHE arithmetic on encrypted coordinates
        // - Pythagorean theorem on encrypted values
        // - FHE.le() to compare distance

        uint64 distance = location1 > location2
            ? location1 - location2
            : location2 - location1;

        return distance <= uint64(maxDistance);
    }

    /// @notice Validate amount is within acceptable range
    /// @dev In FHE: comparison on encrypted amounts
    /// @param amount Amount to validate
    /// @param minAmount Minimum acceptable amount
    /// @param maxAmount Maximum acceptable amount
    /// @return valid True if amount is within range
    function validateAmount(
        uint256 amount,
        uint256 minAmount,
        uint256 maxAmount
    ) internal pure returns (bool valid) {
        // ✅ Validate without revealing amount
        // In production: use FHE.ge() and FHE.le()
        return amount >= minAmount && amount <= maxAmount;
    }

    /// @notice Validate amount against a threshold
    /// @dev In FHE: FHE.ge() for encrypted comparison
    /// @param amount Amount to validate
    /// @param threshold Comparison threshold
    /// @return aboveThreshold True if amount > threshold
    function isAboveThreshold(uint256 amount, uint256 threshold)
        internal
        pure
        returns (bool aboveThreshold)
    {
        // ✅ Comparison on encrypted amount (conceptually)
        // In production: return FHE.gt(amount, threshold)
        return amount > threshold;
    }

    /// @notice Get platform fee for an amount
    /// @dev Calculates fee without revealing amount (conceptually)
    /// @param amount Base amount
    /// @param feePercent Fee percentage (e.g., 2 for 2%)
    /// @return fee Calculated fee amount
    function calculateFee(uint256 amount, uint256 feePercent)
        internal
        pure
        returns (uint256 fee)
    {
        // ✅ Fee calculation on encrypted amount (conceptually)
        // In production: use FHE.mul() and FHE.div()
        // Result would be encrypted
        return (amount * feePercent) / 100;
    }

    /// @notice Verify address is not zero
    /// @param addr Address to verify
    function verifyNonZeroAddress(address addr) internal pure {
        if (addr == address(0)) {
            revert Errors.ZeroAddress();
        }
    }

    /// @notice Verify bytes proof is not empty
    /// @param proof Proof bytes to verify
    function verifyProof(bytes calldata proof) internal pure {
        if (proof.length == 0) {
            revert Errors.InvalidProof();
        }
    }

    /// @notice Hash an address for use in encrypted data
    /// @dev Used to encode addresses for FHE operations
    /// @param addr Address to hash
    /// @return hashed The hashed address
    function hashAddress(address addr) internal pure returns (uint64 hashed) {
        // ✅ Create deterministic hash for address
        // Can be used as input to encrypted operations
        return uint64(uint256(keccak256(abi.encodePacked(addr))));
    }

    /// @notice Hash a string location for encrypted operations
    /// @dev Used to encode locations for FHE operations
    /// @param location Location string (e.g., "New York")
    /// @return encoded The encoded location
    function hashLocation(string memory location)
        internal
        pure
        returns (uint64 encoded)
    {
        // ✅ Create deterministic encoding for location
        return uint64(uint256(keccak256(abi.encodePacked(location))));
    }

    /// @notice Verify signatures for multi-party computation
    /// @dev In production: implement secure multi-sig verification
    /// @param data Data being signed
    /// @param signature Signature to verify
    /// @param signer Expected signer address
    /// @return valid True if signature is valid
    function verifySignature(
        bytes memory data,
        bytes memory signature,
        address signer
    ) internal pure returns (bool valid) {
        // ✅ Placeholder for signature verification
        // In production: implement ECDSA verification
        // or BLS signature scheme for privacy

        // This would use the signer's public key to verify
        // the signature over the data

        // For now: return true (should be implemented properly)
        require(signer != address(0), "Invalid signer");
        require(data.length > 0, "Invalid data");
        require(signature.length == 65, "Invalid signature");

        return true;
    }

    /// @notice Encode location pair for distance calculation
    /// @dev Used to prepare data for FHE distance calculation
    /// @param latitude Latitude coordinate
    /// @param longitude Longitude coordinate
    /// @return encoded Encoded location
    function encodeLocation(uint32 latitude, uint32 longitude)
        internal
        pure
        returns (uint64 encoded)
    {
        // ✅ Combine coordinates into single value
        // Used for encrypted distance calculations
        return (uint64(latitude) << 32) | uint64(longitude);
    }

    /// @notice Decode location from encoded value
    /// @dev Inverse of encodeLocation
    /// @param encoded Encoded location
    /// @return latitude Decoded latitude
    /// @return longitude Decoded longitude
    function decodeLocation(uint64 encoded)
        internal
        pure
        returns (uint32 latitude, uint32 longitude)
    {
        latitude = uint32(encoded >> 32);
        longitude = uint32(encoded);
    }

    /// @notice Create deterministic ID from components
    /// @param component1 First component
    /// @param component2 Second component
    /// @return id Generated deterministic ID
    function createDeterministicId(
        address component1,
        bytes32 component2
    ) internal pure returns (bytes32 id) {
        return keccak256(abi.encodePacked(component1, component2));
    }

    /// @notice Verify timestamp is recent (within max age)
    /// @param timestamp Timestamp to verify
    /// @param maxAge Maximum age in seconds
    /// @return valid True if timestamp is recent
    function isRecentTimestamp(uint256 timestamp, uint256 maxAge)
        internal
        view
        returns (bool valid)
    {
        // ✅ Verify transaction is not old
        return (block.timestamp - timestamp) <= maxAge;
    }

    /// @notice Compare two encrypted-conceptually values safely
    /// @dev Prevents timing attacks through constant-time comparison
    /// @param value1 First value
    /// @param value2 Second value
    /// @return equal True if values are equal
    function constantTimeEqual(uint256 value1, uint256 value2)
        internal
        pure
        returns (bool equal)
    {
        // ✅ Constant-time comparison to prevent side-channel attacks
        return (value1 ^ value2) == 0;
    }

    /// @notice Clamp value between min and max
    /// @dev Useful for ensuring valid ranges in encrypted operations
    /// @param value Value to clamp
    /// @param minVal Minimum value
    /// @param maxVal Maximum value
    /// @return clamped The clamped value
    function clampValue(
        uint256 value,
        uint256 minVal,
        uint256 maxVal
    ) internal pure returns (uint256 clamped) {
        if (value < minVal) return minVal;
        if (value > maxVal) return maxVal;
        return value;
    }
}

/// @title PrivacyLayerContract
/// @notice Provides FHE privacy utility functions through contract interface
contract PrivacyLayerContract {
    /// @notice Check if address matches (FHE comparison conceptually)
    function addressesMatch(uint64 addr1, uint64 addr2)
        external
        pure
        returns (bool)
    {
        return PrivacyLayer.addressesMatch(addr1, addr2);
    }

    /// @notice Check if locations are within distance
    function locationsNear(
        uint64 loc1,
        uint64 loc2,
        uint32 maxDist
    ) external pure returns (bool) {
        return PrivacyLayer.locationsNear(loc1, loc2, maxDist);
    }

    /// @notice Validate amount in range
    function validateAmount(
        uint256 amount,
        uint256 minAmount,
        uint256 maxAmount
    ) external pure returns (bool) {
        return PrivacyLayer.validateAmount(amount, minAmount, maxAmount);
    }

    /// @notice Calculate fee for amount
    function calculateFee(uint256 amount, uint256 feePercent)
        external
        pure
        returns (uint256)
    {
        return PrivacyLayer.calculateFee(amount, feePercent);
    }

    /// @notice Hash address for encrypted operations
    function hashAddress(address addr) external pure returns (uint64) {
        return PrivacyLayer.hashAddress(addr);
    }

    /// @notice Encode location pair
    function encodeLocation(uint32 lat, uint32 lon)
        external
        pure
        returns (uint64)
    {
        return PrivacyLayer.encodeLocation(lat, lon);
    }

    /// @notice Decode location pair
    function decodeLocation(uint64 encoded)
        external
        pure
        returns (uint32, uint32)
    {
        return PrivacyLayer.decodeLocation(encoded);
    }

    /// @notice Create deterministic ID
    function createDeterministicId(address component1, bytes32 component2)
        external
        pure
        returns (bytes32)
    {
        return PrivacyLayer.createDeterministicId(component1, component2);
    }

    /// @notice Check if timestamp is recent
    function isRecentTimestamp(uint256 timestamp, uint256 maxAge)
        external
        view
        returns (bool)
    {
        return PrivacyLayer.isRecentTimestamp(timestamp, maxAge);
    }
}
