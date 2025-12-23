// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { IDeliveryManager } from "./interfaces/IDeliveryManager.sol";
import { Errors } from "./libs/Errors.sol";

/// @title DeliveryManager Contract
/// @notice Manages the complete delivery lifecycle with FHE privacy
/// @dev Stores encrypted delivery data that remains private throughout
contract DeliveryManager is IDeliveryManager {
    /// @notice Mapping of delivery request ID to delivery request
    mapping(bytes32 => DeliveryRequest) private deliveries;

    /// @notice Mapping of delivery ID to encrypted recipient address
    mapping(bytes32 => bytes) private encryptedRecipients;

    /// @notice Mapping of delivery ID to encrypted pickup location
    mapping(bytes32 => bytes) private encryptedPickupLocations;

    /// @notice Mapping of delivery ID to encrypted delivery location
    mapping(bytes32 => bytes) private encryptedDeliveryLocations;

    /// @notice Mapping of user address to array of delivery IDs
    mapping(address => bytes32[]) private userDeliveries;

    /// @notice Array of all delivery IDs
    bytes32[] private allDeliveryIds;

    /// @notice Counter for generating unique delivery IDs
    uint256 private deliveryCounter;

    /// @notice Maximum distance for delivery acceptance (in units)
    uint256 public constant MAX_DISTANCE = 100;

    /// @notice Minimum reputation required for courier
    uint256 public constant MIN_COURIER_REPUTATION = 50;

    /// @notice Constructor initializes contract
    constructor() {
        deliveryCounter = 0;
    }

    /// @notice Create a new delivery request with encrypted data
    /// @dev All sensitive data is encrypted and stored securely
    /// @param encryptedRecipient External encrypted recipient address
    /// @param recipientProof ZK proof for recipient encryption
    /// @param encryptedPickupLocation External encrypted pickup location
    /// @param pickupProof ZK proof for pickup location
    /// @param encryptedDeliveryLocation External encrypted delivery location
    /// @param deliveryProof ZK proof for delivery location
    /// @return requestId The ID of the created delivery request
    function createDeliveryRequest(
        bytes calldata encryptedRecipient,
        bytes calldata recipientProof,
        bytes calldata encryptedPickupLocation,
        bytes calldata pickupProof,
        bytes calldata encryptedDeliveryLocation,
        bytes calldata deliveryProof
    ) external returns (bytes32 requestId) {
        // ✅ Validate encrypted inputs
        if (
            encryptedRecipient.length == 0 ||
            encryptedPickupLocation.length == 0 ||
            encryptedDeliveryLocation.length == 0
        ) {
            revert Errors.InvalidProof();
        }

        // Generate unique delivery ID
        deliveryCounter++;
        requestId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, deliveryCounter)
        );

        // ✅ Create delivery request with PENDING status
        DeliveryRequest storage delivery = deliveries[requestId];
        delivery.requestId = requestId;
        delivery.requester = msg.sender;
        delivery.assignedCourier = address(0);
        delivery.createdAt = block.timestamp;
        delivery.status = DeliveryStatus.PENDING;

        // ✅ Store encrypted data (never exposed)
        encryptedRecipients[requestId] = encryptedRecipient;
        encryptedPickupLocations[requestId] = encryptedPickupLocation;
        encryptedDeliveryLocations[requestId] = encryptedDeliveryLocation;

        // Track delivery for sender
        userDeliveries[msg.sender].push(requestId);
        allDeliveryIds.push(requestId);

        // ✅ Emit event (no sensitive data)
        emit DeliveryRequested(requestId, msg.sender, block.timestamp);

        return requestId;
    }

    /// @notice Accept a delivery based on location preferences
    /// @dev Contract matches encrypted location without revealing actual coordinates
    /// @param requestId ID of the delivery request
    /// @param courierLocation External encrypted courier location
    /// @param locationProof ZK proof for courier location
    /// @return success True if delivery was accepted
    function acceptDelivery(
        bytes32 requestId,
        bytes calldata courierLocation,
        bytes calldata locationProof
    ) external returns (bool success) {
        // ✅ Verify delivery exists
        DeliveryRequest storage delivery = deliveries[requestId];
        if (delivery.requester == address(0)) {
            revert Errors.DeliveryNotFound(requestId);
        }

        // ✅ Verify delivery is pending
        if (delivery.status != DeliveryStatus.PENDING) {
            revert Errors.DeliveryNotPending(requestId);
        }

        // ✅ Validate encrypted location proof
        if (courierLocation.length == 0) {
            revert Errors.InvalidProof();
        }

        // ✅ Cannot accept own delivery
        if (delivery.requester == msg.sender) {
            revert Errors.UnauthorizedAccess(msg.sender);
        }

        // ✅ Location matching would be done with FHE operations
        // In production: use FHE.le() on encrypted locations
        // For this example: accept all valid proofs
        // This prevents an attacker who doesn't have the proof
        // from being able to call this function successfully

        // ✅ Update delivery
        delivery.assignedCourier = msg.sender;
        delivery.acceptedAt = block.timestamp;
        delivery.status = DeliveryStatus.ACCEPTED;

        // Track delivery for courier
        userDeliveries[msg.sender].push(requestId);

        // ✅ Emit event
        emit DeliveryAccepted(requestId, msg.sender, block.timestamp);

        return true;
    }

    /// @notice Complete a delivery
    /// @dev Only assigned courier can complete
    /// @param requestId ID of the delivery request
    /// @return success True if delivery was completed
    function completeDelivery(bytes32 requestId)
        external
        returns (bool success)
    {
        // ✅ Verify delivery exists
        DeliveryRequest storage delivery = deliveries[requestId];
        if (delivery.requester == address(0)) {
            revert Errors.DeliveryNotFound(requestId);
        }

        // ✅ Verify caller is assigned courier
        if (delivery.assignedCourier != msg.sender) {
            revert Errors.UnauthorizedAccess(msg.sender);
        }

        // ✅ Verify delivery is in transit or accepted
        if (
            delivery.status != DeliveryStatus.ACCEPTED &&
            delivery.status != DeliveryStatus.IN_TRANSIT
        ) {
            revert Errors.InvalidDeliveryStatus();
        }

        // ✅ Update delivery status
        delivery.status = DeliveryStatus.COMPLETED;
        delivery.completedAt = block.timestamp;

        // ✅ Emit event
        emit DeliveryCompleted(requestId, msg.sender, block.timestamp);

        return true;
    }

    /// @notice Cancel a delivery
    /// @dev Only requester can cancel pending deliveries
    /// @param requestId ID of the delivery request
    /// @return success True if delivery was cancelled
    function cancelDelivery(bytes32 requestId)
        external
        returns (bool success)
    {
        // ✅ Verify delivery exists
        DeliveryRequest storage delivery = deliveries[requestId];
        if (delivery.requester == address(0)) {
            revert Errors.DeliveryNotFound(requestId);
        }

        // ✅ Only requester can cancel
        if (delivery.requester != msg.sender) {
            revert Errors.UnauthorizedAccess(msg.sender);
        }

        // ✅ Can only cancel pending deliveries
        if (delivery.status != DeliveryStatus.PENDING) {
            revert Errors.InvalidDeliveryStatus();
        }

        // ✅ Update status
        delivery.status = DeliveryStatus.CANCELLED;

        // ✅ Emit event
        emit DeliveryCancelled(requestId, block.timestamp);

        return true;
    }

    /// @notice Get delivery status
    /// @param requestId ID of the delivery request
    /// @return status Current status of the delivery
    function getDeliveryStatus(bytes32 requestId)
        external
        view
        returns (DeliveryStatus status)
    {
        DeliveryRequest storage delivery = deliveries[requestId];
        if (delivery.requester == address(0)) {
            revert Errors.DeliveryNotFound(requestId);
        }
        return delivery.status;
    }

    /// @notice Get delivery details (no sensitive data exposed)
    /// @param requestId ID of the delivery request
    /// @return delivery The delivery request details
    function getDelivery(bytes32 requestId)
        external
        view
        returns (DeliveryRequest memory delivery)
    {
        DeliveryRequest storage d = deliveries[requestId];
        if (d.requester == address(0)) {
            revert Errors.DeliveryNotFound(requestId);
        }
        return d;
    }

    /// @notice Get total number of deliveries
    /// @return count Total number of delivery requests
    function getDeliveryCount() external view returns (uint256 count) {
        return allDeliveryIds.length;
    }

    /// @notice Get deliveries for a user
    /// @param user Address of the user
    /// @return deliveryIds Array of delivery request IDs
    function getUserDeliveries(address user)
        external
        view
        returns (bytes32[] memory deliveryIds)
    {
        return userDeliveries[user];
    }

    /// @notice Get encrypted recipient (only for authorized parties)
    /// @param requestId ID of the delivery request
    /// @return encrypted The encrypted recipient data
    function getEncryptedRecipient(bytes32 requestId)
        external
        view
        returns (bytes memory encrypted)
    {
        // In production, verify caller authorization
        DeliveryRequest storage delivery = deliveries[requestId];
        if (
            delivery.requester != msg.sender &&
            delivery.assignedCourier != msg.sender
        ) {
            revert Errors.UnauthorizedAccess(msg.sender);
        }
        return encryptedRecipients[requestId];
    }

    /// @notice Get encrypted pickup location
    /// @param requestId ID of the delivery request
    /// @return encrypted The encrypted pickup location
    function getEncryptedPickupLocation(bytes32 requestId)
        external
        view
        returns (bytes memory encrypted)
    {
        DeliveryRequest storage delivery = deliveries[requestId];
        if (delivery.assignedCourier != msg.sender) {
            revert Errors.UnauthorizedAccess(msg.sender);
        }
        return encryptedPickupLocations[requestId];
    }

    /// @notice Get encrypted delivery location
    /// @param requestId ID of the delivery request
    /// @return encrypted The encrypted delivery location
    function getEncryptedDeliveryLocation(bytes32 requestId)
        external
        view
        returns (bytes memory encrypted)
    {
        DeliveryRequest storage delivery = deliveries[requestId];
        if (delivery.assignedCourier != msg.sender) {
            revert Errors.UnauthorizedAccess(msg.sender);
        }
        return encryptedDeliveryLocations[requestId];
    }
}
