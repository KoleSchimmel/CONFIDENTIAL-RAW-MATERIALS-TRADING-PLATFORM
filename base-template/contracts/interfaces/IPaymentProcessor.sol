// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title IPaymentProcessor Interface
/// @notice Interface for the PaymentProcessor contract
interface IPaymentProcessor {
    /// @notice Payment status enumeration
    enum PaymentStatus {
        PENDING,
        ESCROW,
        COMPLETED,
        REFUNDED,
        DISPUTED
    }

    /// @notice Payment structure
    struct Payment {
        bytes32 paymentId;
        bytes32 deliveryId;
        address payer;
        address payee;
        uint256 amount;
        uint256 fee;
        PaymentStatus status;
        uint256 createdAt;
        uint256 completedAt;
    }

    /// @notice Event emitted when payment is created
    event PaymentCreated(
        bytes32 indexed paymentId,
        bytes32 indexed deliveryId,
        address indexed payer,
        address payee,
        uint256 timestamp
    );

    /// @notice Event emitted when payment moves to escrow
    event PaymentEscrowed(
        bytes32 indexed paymentId,
        uint256 timestamp
    );

    /// @notice Event emitted when payment is completed
    event PaymentCompleted(
        bytes32 indexed paymentId,
        address indexed payee,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Event emitted when payment is refunded
    event PaymentRefunded(
        bytes32 indexed paymentId,
        address indexed payer,
        uint256 amount,
        uint256 timestamp
    );

    /// @notice Create a payment with encrypted amount
    /// @param deliveryId ID of the delivery
    /// @param encryptedAmount External encrypted payment amount
    /// @param amountProof ZK proof for amount encryption
    /// @param payee Address of the payee (courier)
    /// @return paymentId The ID of the created payment
    function createPayment(
        bytes32 deliveryId,
        bytes calldata encryptedAmount,
        bytes calldata amountProof,
        address payee
    ) external payable returns (bytes32 paymentId);

    /// @notice Move payment to escrow
    /// @param paymentId ID of the payment
    /// @return success True if payment moved to escrow
    function escrowPayment(bytes32 paymentId) external returns (bool success);

    /// @notice Complete a payment (release from escrow)
    /// @param paymentId ID of the payment
    /// @return success True if payment was completed
    function completePayment(bytes32 paymentId)
        external
        returns (bool success);

    /// @notice Refund a payment with encrypted amount
    /// @param paymentId ID of the payment
    /// @param encryptedAmount External encrypted refund amount
    /// @param amountProof ZK proof for refund amount
    /// @return success True if payment was refunded
    function refundPayment(
        bytes32 paymentId,
        bytes calldata encryptedAmount,
        bytes calldata amountProof
    ) external returns (bool success);

    /// @notice Get payment status
    /// @param paymentId ID of the payment
    /// @return status Current status of the payment
    function getPaymentStatus(bytes32 paymentId)
        external
        view
        returns (PaymentStatus status);

    /// @notice Get payment details
    /// @param paymentId ID of the payment
    /// @return payment The payment details
    function getPayment(bytes32 paymentId)
        external
        view
        returns (Payment memory payment);

    /// @notice Get total number of payments
    /// @return count Total number of payments
    function getPaymentCount() external view returns (uint256 count);

    /// @notice Get payments for a user
    /// @param user Address of the user
    /// @return paymentIds Array of payment IDs
    function getUserPayments(address user)
        external
        view
        returns (bytes32[] memory paymentIds);

    /// @notice Get platform fee percentage
    /// @return feePercentage Fee as percentage (e.g., 2 for 2%)
    function getPlatformFee() external view returns (uint256 feePercentage);
}
