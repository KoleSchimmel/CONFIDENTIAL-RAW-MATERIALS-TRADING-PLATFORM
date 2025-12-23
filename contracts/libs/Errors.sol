// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

/// @title Error Library for Anonymous Delivery Network
/// @notice Custom error definitions for all contracts
library Errors {
    // DeliveryManager errors
    error DeliveryNotFound(bytes32 requestId);
    error InvalidDeliveryStatus();
    error UnauthorizedAccess(address user);
    error DeliveryAlreadyAccepted(bytes32 requestId);
    error DeliveryNotPending(bytes32 requestId);
    error InvalidProof();
    error LocationMismatch();

    // PaymentProcessor errors
    error PaymentNotFound(bytes32 paymentId);
    error InvalidPaymentAmount();
    error InsufficientFunds();
    error UnauthorizedPaymentAccess(address user);
    error PaymentAlreadyProcessed(bytes32 paymentId);
    error InvalidPaymentStatus();
    error RefundFailed();

    // ReputationTracker errors
    error ParticipantNotFound(address participant);
    error InvalidRating();
    error RatingOutOfRange();
    error DuplicateRating(bytes32 deliveryId);
    error UnauthorizedRatingAccess();

    // General errors
    error ZeroAddress();
    error InvalidInput();
    error PermissionDenied();
    error ContractPaused();
    error TransactionFailed();
}
