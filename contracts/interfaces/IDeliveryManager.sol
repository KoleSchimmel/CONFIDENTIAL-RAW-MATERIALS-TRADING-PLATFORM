// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title IDeliveryManager Interface
/// @notice Interface for the DeliveryManager contract
interface IDeliveryManager {
    /// @notice Delivery status enumeration
    enum DeliveryStatus {
        PENDING,
        ACCEPTED,
        IN_TRANSIT,
        COMPLETED,
        CANCELLED
    }

    /// @notice Delivery request structure
    struct DeliveryRequest {
        bytes32 requestId;
        address requester;
        address assignedCourier;
        uint256 createdAt;
        uint256 acceptedAt;
        uint256 completedAt;
        DeliveryStatus status;
    }

    /// @notice Event emitted when delivery is requested
    event DeliveryRequested(
        bytes32 indexed requestId,
        address indexed requester,
        uint256 timestamp
    );

    /// @notice Event emitted when delivery is accepted
    event DeliveryAccepted(
        bytes32 indexed requestId,
        address indexed courier,
        uint256 timestamp
    );

    /// @notice Event emitted when delivery is completed
    event DeliveryCompleted(
        bytes32 indexed requestId,
        address indexed courier,
        uint256 timestamp
    );

    /// @notice Event emitted when delivery is cancelled
    event DeliveryCancelled(
        bytes32 indexed requestId,
        uint256 timestamp
    );

    /// @notice Create a new delivery request with encrypted data
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
    ) external returns (bytes32 requestId);

    /// @notice Accept a delivery based on location
    /// @param requestId ID of the delivery request
    /// @param courierLocation External encrypted courier location
    /// @param locationProof ZK proof for courier location
    /// @return success True if delivery was accepted
    function acceptDelivery(
        bytes32 requestId,
        bytes calldata courierLocation,
        bytes calldata locationProof
    ) external returns (bool success);

    /// @notice Complete a delivery
    /// @param requestId ID of the delivery request
    /// @return success True if delivery was completed
    function completeDelivery(bytes32 requestId) external returns (bool success);

    /// @notice Cancel a delivery
    /// @param requestId ID of the delivery request
    /// @return success True if delivery was cancelled
    function cancelDelivery(bytes32 requestId) external returns (bool success);

    /// @notice Get delivery status
    /// @param requestId ID of the delivery request
    /// @return status Current status of the delivery
    function getDeliveryStatus(bytes32 requestId)
        external
        view
        returns (DeliveryStatus status);

    /// @notice Get delivery details
    /// @param requestId ID of the delivery request
    /// @return delivery The delivery request details
    function getDelivery(bytes32 requestId)
        external
        view
        returns (DeliveryRequest memory delivery);

    /// @notice Get total number of deliveries
    /// @return count Total number of delivery requests
    function getDeliveryCount() external view returns (uint256 count);

    /// @notice Get deliveries for a user
    /// @param user Address of the user
    /// @return deliveryIds Array of delivery request IDs
    function getUserDeliveries(address user)
        external
        view
        returns (bytes32[] memory deliveryIds);
}
