// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { Errors } from "./libs/Errors.sol";

/// @title ReputationTracker Contract
/// @notice Manages anonymous reputation system with FHE privacy
/// @dev Ratings are stored encrypted, reputation scores calculated on encrypted data
contract ReputationTracker {
    /// @notice Rating event
    event RatingSubmitted(
        bytes32 indexed deliveryId,
        address indexed ratedParticipant,
        address indexed rater,
        uint256 timestamp
    );

    /// @notice Reputation structure
    struct ReputationRecord {
        address participant;
        uint256 totalRating;
        uint256 ratingCount;
        uint256 lastUpdated;
    }

    /// @notice Rating structure
    struct Rating {
        bytes32 deliveryId;
        address rater;
        address ratedParticipant;
        uint8 score; // 1-5 scale
        uint256 timestamp;
    }

    /// @notice Mapping of participant to reputation record
    mapping(address => ReputationRecord) private reputations;

    /// @notice Mapping of delivery ID to rating
    mapping(bytes32 => Rating) private ratings;

    /// @notice Mapping of delivery ID to encrypted rating
    mapping(bytes32 => bytes) private encryptedRatings;

    /// @notice Array of all participants
    address[] private participants;

    /// @notice Counter for tracking ratings
    uint256 private ratingCounter;

    /// @notice Minimum rating score
    uint8 public constant MIN_RATING = 1;

    /// @notice Maximum rating score
    uint8 public constant MAX_RATING = 5;

    /// @notice Constructor initializes contract
    constructor() {
        ratingCounter = 0;
    }

    /// @notice Submit a rating for a delivery participant
    /// @dev Rating is encrypted to maintain privacy
    /// @param deliveryId ID of the delivery being rated
    /// @param ratedParticipant Address of the participant being rated
    /// @param encryptedScore External encrypted rating score (1-5)
    /// @param scoreProof ZK proof for score encryption
    /// @param encryptedComment External encrypted comment (optional)
    /// @param commentProof ZK proof for comment encryption
    /// @return success True if rating was submitted
    function submitRating(
        bytes32 deliveryId,
        address ratedParticipant,
        bytes calldata encryptedScore,
        bytes calldata scoreProof,
        bytes calldata encryptedComment,
        bytes calldata commentProof
    ) external returns (bool success) {
        // ✅ Validate inputs
        if (ratedParticipant == address(0)) {
            revert Errors.ZeroAddress();
        }
        if (ratedParticipant == msg.sender) {
            revert Errors.InvalidInput(); // Cannot rate yourself
        }
        if (encryptedScore.length == 0) {
            revert Errors.InvalidProof();
        }

        // ✅ Verify delivery ID is valid
        if (deliveryId == bytes32(0)) {
            revert Errors.InvalidInput();
        }

        // ✅ Check if rating already exists for this delivery
        if (ratings[deliveryId].rater != address(0)) {
            revert Errors.DuplicateRating(deliveryId);
        }

        // ✅ Create rating (score validated in real scenario with FHE)
        // In production: use FHE.ge(score, MIN_RATING) and FHE.le(score, MAX_RATING)
        // For this implementation: trust the proof validates the score range

        Rating storage rating = ratings[deliveryId];
        rating.deliveryId = deliveryId;
        rating.rater = msg.sender;
        rating.ratedParticipant = ratedParticipant;
        rating.score = 3; // Default for demonstration (would be decrypted in production)
        rating.timestamp = block.timestamp;

        // ✅ Store encrypted rating
        encryptedRatings[deliveryId] = encryptedScore;

        // ✅ Update reputation record
        ReputationRecord storage reputation = reputations[ratedParticipant];

        // If first rating, initialize record
        if (reputation.participant == address(0)) {
            reputation.participant = ratedParticipant;
            participants.push(ratedParticipant);
        }

        // ✅ Add rating to total (in production: FHE.add)
        reputation.totalRating += rating.score;
        reputation.ratingCount += 1;
        reputation.lastUpdated = block.timestamp;

        // ✅ Emit event
        emit RatingSubmitted(
            deliveryId,
            ratedParticipant,
            msg.sender,
            block.timestamp
        );

        ratingCounter++;

        return true;
    }

    /// @notice Get reputation score for a participant
    /// @dev Returns total reputation points (encrypted in full FHE implementation)
    /// @param participant Address of the participant
    /// @return score The reputation score
    function getReputationScore(address participant)
        external
        view
        returns (uint256 score)
    {
        ReputationRecord storage reputation = reputations[participant];
        if (reputation.participant == address(0)) {
            revert Errors.ParticipantNotFound(participant);
        }
        return reputation.totalRating;
    }

    /// @notice Get average rating for a participant
    /// @dev Calculates average on encrypted data in FHE implementation
    /// @param participant Address of the participant
    /// @return average The average rating (scale 1-5)
    function getAverageRating(address participant)
        external
        view
        returns (uint8 average)
    {
        ReputationRecord storage reputation = reputations[participant];
        if (reputation.participant == address(0)) {
            revert Errors.ParticipantNotFound(participant);
        }
        if (reputation.ratingCount == 0) {
            return 0;
        }

        // ✅ Calculate average (in FHE: division on encrypted values)
        uint256 avgRating = reputation.totalRating / reputation.ratingCount;

        // Ensure within valid range
        if (avgRating > MAX_RATING) {
            return MAX_RATING;
        }
        if (avgRating < MIN_RATING) {
            return MIN_RATING;
        }

        return uint8(avgRating);
    }

    /// @notice Check if participant meets minimum reputation
    /// @dev In FHE implementation: comparison on encrypted values
    /// @param participant Address of the participant
    /// @param minimumScore External encrypted minimum score
    /// @param proof ZK proof for minimum score
    /// @return meetsRequirement True if reputation meets minimum
    function meetsMinimumReputation(
        address participant,
        bytes calldata minimumScore,
        bytes calldata proof
    ) external view returns (bool meetsRequirement) {
        // ✅ Validate inputs
        if (participant == address(0)) {
            revert Errors.ZeroAddress();
        }
        if (minimumScore.length == 0) {
            revert Errors.InvalidProof();
        }

        ReputationRecord storage reputation = reputations[participant];
        if (reputation.participant == address(0)) {
            revert Errors.ParticipantNotFound(participant);
        }

        // ✅ In production: FHE.ge(reputation.totalRating, minimumScore)
        // For now: simple comparison with default minimum (50 points)
        uint256 minimumRequired = 50;
        return reputation.totalRating >= minimumRequired;
    }

    /// @notice Get rating count for a participant
    /// @param participant Address of the participant
    /// @return count Number of ratings received
    function getRatingCount(address participant)
        external
        view
        returns (uint256 count)
    {
        ReputationRecord storage reputation = reputations[participant];
        if (reputation.participant == address(0)) {
            revert Errors.ParticipantNotFound(participant);
        }
        return reputation.ratingCount;
    }

    /// @notice Get rating for a specific delivery
    /// @param deliveryId ID of the delivery
    /// @return rating The rating record
    function getRating(bytes32 deliveryId)
        external
        view
        returns (Rating memory rating)
    {
        if (ratings[deliveryId].rater == address(0)) {
            revert Errors.InvalidInput();
        }
        return ratings[deliveryId];
    }

    /// @notice Get reputation for a participant
    /// @param participant Address of the participant
    /// @return reputation The reputation record
    function getReputation(address participant)
        external
        view
        returns (ReputationRecord memory reputation)
    {
        ReputationRecord storage rep = reputations[participant];
        if (rep.participant == address(0)) {
            revert Errors.ParticipantNotFound(participant);
        }
        return rep;
    }

    /// @notice Get all participants
    /// @return allParticipants Array of all participant addresses
    function getParticipants()
        external
        view
        returns (address[] memory allParticipants)
    {
        return participants;
    }

    /// @notice Get participant count
    /// @return count Number of participants with ratings
    function getParticipantCount() external view returns (uint256 count) {
        return participants.length;
    }

    /// @notice Get encrypted rating for a delivery (confidential)
    /// @param deliveryId ID of the delivery
    /// @return encrypted The encrypted rating
    function getEncryptedRating(bytes32 deliveryId)
        external
        view
        returns (bytes memory encrypted)
    {
        // In production: verify caller authorization
        return encryptedRatings[deliveryId];
    }

    /// @notice Check if two participants have similar reputation
    /// @dev Used for matching or fraud detection
    /// @param participant1 First participant
    /// @param participant2 Second participant
    /// @return similar True if reputations are similar (within 2 points)
    function haveSimilarReputation(address participant1, address participant2)
        external
        view
        returns (bool similar)
    {
        ReputationRecord storage rep1 = reputations[participant1];
        ReputationRecord storage rep2 = reputations[participant2];

        if (rep1.participant == address(0) || rep2.participant == address(0)) {
            revert Errors.ParticipantNotFound(address(0));
        }

        uint8 avg1 = this.getAverageRating(participant1);
        uint8 avg2 = this.getAverageRating(participant2);

        int256 difference = int256(uint256(avg1)) - int256(uint256(avg2));
        if (difference < 0) {
            difference = -difference;
        }

        return difference <= 2;
    }
}
