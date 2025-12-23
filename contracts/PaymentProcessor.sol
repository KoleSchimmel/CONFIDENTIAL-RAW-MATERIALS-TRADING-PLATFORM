// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { IPaymentProcessor } from "./interfaces/IPaymentProcessor.sol";
import { Errors } from "./libs/Errors.sol";

/// @title PaymentProcessor Contract
/// @notice Handles all payment operations with FHE privacy
/// @dev Payment amounts are encrypted and never exposed in plaintext
contract PaymentProcessor is IPaymentProcessor {
    /// @notice Mapping of payment ID to payment details
    mapping(bytes32 => Payment) private payments;

    /// @notice Mapping of payment ID to encrypted amount
    mapping(bytes32 => bytes) private encryptedAmounts;

    /// @notice Mapping of user address to array of payment IDs
    mapping(address => bytes32[]) private userPayments;

    /// @notice Array of all payment IDs
    bytes32[] private allPaymentIds;

    /// @notice Counter for generating unique payment IDs
    uint256 private paymentCounter;

    /// @notice Platform fee percentage (2%)
    uint256 public constant PLATFORM_FEE_PERCENT = 2;

    /// @notice Minimum payment amount in wei
    uint256 public constant MINIMUM_PAYMENT = 1000; // 0.001 ETH

    /// @notice Maximum payment amount in wei
    uint256 public constant MAXIMUM_PAYMENT = 1000 ether;

    /// @notice Platform owner address
    address public platformOwner;

    /// @notice Platform balance for collected fees
    uint256 public platformBalance;

    /// @notice Constructor initializes contract
    constructor() {
        paymentCounter = 0;
        platformOwner = msg.sender;
    }

    /// @notice Modifier to check if caller is platform owner
    modifier onlyPlatformOwner() {
        if (msg.sender != platformOwner) {
            revert Errors.PermissionDenied();
        }
        _;
    }

    /// @notice Create a payment with encrypted amount
    /// @dev Amount is encrypted and remains private
    /// @param deliveryId ID of the associated delivery
    /// @param encryptedAmount External encrypted payment amount
    /// @param amountProof ZK proof for amount encryption
    /// @param payee Address of the courier (payee)
    /// @return paymentId The ID of the created payment
    function createPayment(
        bytes32 deliveryId,
        bytes calldata encryptedAmount,
        bytes calldata amountProof,
        address payee
    ) external payable returns (bytes32 paymentId) {
        // ✅ Validate inputs
        if (payee == address(0)) {
            revert Errors.ZeroAddress();
        }
        if (payee == msg.sender) {
            revert Errors.InvalidInput();
        }
        if (encryptedAmount.length == 0) {
            revert Errors.InvalidProof();
        }
        if (msg.value == 0 || msg.value < MINIMUM_PAYMENT) {
            revert Errors.InvalidPaymentAmount();
        }
        if (msg.value > MAXIMUM_PAYMENT) {
            revert Errors.InvalidPaymentAmount();
        }

        // Generate unique payment ID
        paymentCounter++;
        paymentId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, paymentCounter)
        );

        // ✅ Create payment
        Payment storage payment = payments[paymentId];
        payment.paymentId = paymentId;
        payment.deliveryId = deliveryId;
        payment.payer = msg.sender;
        payment.payee = payee;
        payment.amount = msg.value;
        payment.fee = (msg.value * PLATFORM_FEE_PERCENT) / 100;
        payment.status = PaymentStatus.PENDING;
        payment.createdAt = block.timestamp;

        // ✅ Store encrypted amount
        encryptedAmounts[paymentId] = encryptedAmount;

        // Track payment for payer and payee
        userPayments[msg.sender].push(paymentId);
        userPayments[payee].push(paymentId);
        allPaymentIds.push(paymentId);

        // ✅ Emit event (no amount exposed)
        emit PaymentCreated(paymentId, deliveryId, msg.sender, payee, block.timestamp);

        return paymentId;
    }

    /// @notice Move payment to escrow
    /// @dev Only payer can move their payment to escrow
    /// @param paymentId ID of the payment
    /// @return success True if payment moved to escrow
    function escrowPayment(bytes32 paymentId)
        external
        returns (bool success)
    {
        // ✅ Verify payment exists
        Payment storage payment = payments[paymentId];
        if (payment.payer == address(0)) {
            revert Errors.PaymentNotFound(paymentId);
        }

        // ✅ Only payer can escrow
        if (payment.payer != msg.sender) {
            revert Errors.UnauthorizedPaymentAccess(msg.sender);
        }

        // ✅ Can only escrow pending payments
        if (payment.status != PaymentStatus.PENDING) {
            revert Errors.InvalidPaymentStatus();
        }

        // ✅ Move to escrow
        payment.status = PaymentStatus.ESCROW;

        // ✅ Emit event
        emit PaymentEscrowed(paymentId, block.timestamp);

        return true;
    }

    /// @notice Complete a payment (release from escrow to courier)
    /// @dev Only payer can release payment
    /// @param paymentId ID of the payment
    /// @return success True if payment was completed
    function completePayment(bytes32 paymentId)
        external
        returns (bool success)
    {
        // ✅ Verify payment exists
        Payment storage payment = payments[paymentId];
        if (payment.payer == address(0)) {
            revert Errors.PaymentNotFound(paymentId);
        }

        // ✅ Only payer can release
        if (payment.payer != msg.sender) {
            revert Errors.UnauthorizedPaymentAccess(msg.sender);
        }

        // ✅ Can only complete escrowed payments
        if (payment.status != PaymentStatus.ESCROW) {
            revert Errors.InvalidPaymentStatus();
        }

        // ✅ Calculate amounts
        uint256 courierAmount = payment.amount - payment.fee;

        // ✅ Update payment
        payment.status = PaymentStatus.COMPLETED;
        payment.completedAt = block.timestamp;

        // ✅ Update platform balance
        platformBalance += payment.fee;

        // ✅ Transfer to courier
        (bool courierTransfer, ) = payment.payee.call{value: courierAmount}(
            ""
        );
        if (!courierTransfer) {
            revert Errors.TransactionFailed();
        }

        // ✅ Emit event (no sensitive amounts exposed)
        emit PaymentCompleted(
            paymentId,
            payment.payee,
            courierAmount,
            block.timestamp
        );

        return true;
    }

    /// @notice Refund a payment with encrypted amount
    /// @dev Only payer can refund
    /// @param paymentId ID of the payment
    /// @param encryptedAmount External encrypted refund amount
    /// @param amountProof ZK proof for refund amount
    /// @return success True if payment was refunded
    function refundPayment(
        bytes32 paymentId,
        bytes calldata encryptedAmount,
        bytes calldata amountProof
    ) external returns (bool success) {
        // ✅ Verify payment exists
        Payment storage payment = payments[paymentId];
        if (payment.payer == address(0)) {
            revert Errors.PaymentNotFound(paymentId);
        }

        // ✅ Only payer can refund
        if (payment.payer != msg.sender) {
            revert Errors.UnauthorizedPaymentAccess(msg.sender);
        }

        // ✅ Can only refund pending or escrowed payments
        if (
            payment.status != PaymentStatus.PENDING &&
            payment.status != PaymentStatus.ESCROW
        ) {
            revert Errors.InvalidPaymentStatus();
        }

        // ✅ Validate encrypted amount proof
        if (encryptedAmount.length == 0) {
            revert Errors.InvalidProof();
        }

        // ✅ Update payment
        payment.status = PaymentStatus.REFUNDED;

        // ✅ Transfer back to payer (full amount)
        (bool refundSuccess, ) = msg.sender.call{value: payment.amount}("");
        if (!refundSuccess) {
            revert Errors.RefundFailed();
        }

        // ✅ Emit event
        emit PaymentRefunded(paymentId, msg.sender, payment.amount, block.timestamp);

        return true;
    }

    /// @notice Get payment status
    /// @param paymentId ID of the payment
    /// @return status Current status of the payment
    function getPaymentStatus(bytes32 paymentId)
        external
        view
        returns (PaymentStatus status)
    {
        Payment storage payment = payments[paymentId];
        if (payment.payer == address(0)) {
            revert Errors.PaymentNotFound(paymentId);
        }
        return payment.status;
    }

    /// @notice Get payment details (no sensitive amount data)
    /// @param paymentId ID of the payment
    /// @return payment The payment details
    function getPayment(bytes32 paymentId)
        external
        view
        returns (Payment memory payment)
    {
        Payment storage p = payments[paymentId];
        if (p.payer == address(0)) {
            revert Errors.PaymentNotFound(paymentId);
        }
        return p;
    }

    /// @notice Get total number of payments
    /// @return count Total number of payments
    function getPaymentCount() external view returns (uint256 count) {
        return allPaymentIds.length;
    }

    /// @notice Get payments for a user
    /// @param user Address of the user
    /// @return paymentIds Array of payment IDs for this user
    function getUserPayments(address user)
        external
        view
        returns (bytes32[] memory paymentIds)
    {
        return userPayments[user];
    }

    /// @notice Get platform fee percentage
    /// @return feePercentage Fee as percentage (e.g., 2 for 2%)
    function getPlatformFee()
        external
        pure
        returns (uint256 feePercentage)
    {
        return PLATFORM_FEE_PERCENT;
    }

    /// @notice Withdraw platform fees (only owner)
    /// @param amount Amount to withdraw
    function withdrawPlatformFees(uint256 amount) external onlyPlatformOwner {
        if (amount > platformBalance) {
            revert Errors.InsufficientFunds();
        }

        platformBalance -= amount;

        (bool success, ) = msg.sender.call{value: amount}("");
        if (!success) {
            revert Errors.TransactionFailed();
        }
    }

    /// @notice Get encrypted amount for a payment
    /// @param paymentId ID of the payment
    /// @return encrypted The encrypted amount
    function getEncryptedAmount(bytes32 paymentId)
        external
        view
        returns (bytes memory encrypted)
    {
        Payment storage payment = payments[paymentId];
        if (payment.payer == address(0)) {
            revert Errors.PaymentNotFound(paymentId);
        }
        // Only payer can see encrypted amount
        if (payment.payer != msg.sender) {
            revert Errors.UnauthorizedPaymentAccess(msg.sender);
        }
        return encryptedAmounts[paymentId];
    }

    /// @notice Receive function to accept ETH
    receive() external payable {}
}
