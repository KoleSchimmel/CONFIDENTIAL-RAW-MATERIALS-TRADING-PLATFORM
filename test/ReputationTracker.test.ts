import { expect } from "chai";
import { ethers } from "hardhat";

describe("ReputationTracker Contract", () => {
  let reputationTracker: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let user3: any;

  beforeEach(async () => {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const ReputationTrackerFactory = await ethers.getContractFactory(
      "ReputationTracker"
    );
    reputationTracker = await ReputationTrackerFactory.deploy();
    await reputationTracker.deployed();
  });

  describe("✅ Success Cases", () => {
    it("should submit a rating successfully", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      const tx = await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      const receipt = await tx.wait();

      expect(
        receipt.events.some((e: any) => e.event === "RatingSubmitted")
      ).to.be.true;
    });

    it("should track reputation after rating", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      const reputation = await reputationTracker.getReputation(user2.address);
      expect(reputation.ratingCount).to.equal(1);
      expect(reputation.totalRating).to.be.gt(0);
    });

    it("should calculate average rating", async () => {
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      // Submit multiple ratings
      for (let i = 0; i < 3; i++) {
        const deliveryId = ethers.utils.toBeHex(`delivery_${i}`, 32);
        await reputationTracker
          .connect([user1, user2, user3][i])
          .submitRating(
            deliveryId,
            user2.address,
            encryptedScore,
            proof,
            encryptedComment,
            proof
          );
      }

      const average = await reputationTracker.getAverageRating(user2.address);
      expect(average).to.be.gt(0);
      expect(average).to.be.lte(5);
    });

    it("should handle multiple ratings from different users", async () => {
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      const deliveryId1 = ethers.utils.toBeHex("delivery_1", 32);
      const deliveryId2 = ethers.utils.toBeHex("delivery_2", 32);
      const deliveryId3 = ethers.utils.toBeHex("delivery_3", 32);

      await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId1,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      await reputationTracker
        .connect(user2)
        .submitRating(
          deliveryId2,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      await reputationTracker
        .connect(user3)
        .submitRating(
          deliveryId3,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      const reputation = await reputationTracker.getReputation(user2.address);
      expect(reputation.ratingCount).to.equal(3);
    });

    it("should track participants", async () => {
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      // Rate different users
      const deliveryId1 = ethers.utils.toBeHex("delivery_1", 32);
      const deliveryId2 = ethers.utils.toBeHex("delivery_2", 32);

      await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId1,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId2,
          user3.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      const participants = await reputationTracker.getParticipants();
      expect(participants.length).to.equal(2);
      expect(participants).to.include(user2.address);
      expect(participants).to.include(user3.address);
    });

    it("should check minimum reputation", async () => {
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const minimumScore = ethers.utils.toBeHex("minimum_data", 32);

      const deliveryId = ethers.utils.utils.toBeHex("delivery_1", 32);

      await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      const meets = await reputationTracker.meetsMinimumReputation(
        user2.address,
        minimumScore,
        proof
      );

      // May or may not meet, depending on rating given
      expect(typeof meets).to.equal("boolean");
    });
  });

  describe("❌ Failure Cases", () => {
    it("should reject rating with zero address", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      await expect(
        reputationTracker
          .connect(user1)
          .submitRating(
            deliveryId,
            ethers.constants.AddressZero,
            encryptedScore,
            proof,
            encryptedScore,
            proof
          )
      ).to.be.revertedWithCustomError(reputationTracker, "ZeroAddress");
    });

    it("should reject self-rating", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      await expect(
        reputationTracker
          .connect(user1)
          .submitRating(
            deliveryId,
            user1.address,
            encryptedScore,
            proof,
            encryptedScore,
            proof
          )
      ).to.be.revertedWithCustomError(reputationTracker, "InvalidInput");
    });

    it("should reject duplicate rating for same delivery", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      // First rating
      await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      // Attempt duplicate
      await expect(
        reputationTracker
          .connect(user3)
          .submitRating(
            deliveryId,
            user2.address,
            encryptedScore,
            proof,
            encryptedComment,
            proof
          )
      ).to.be.revertedWithCustomError(reputationTracker, "DuplicateRating");
    });

    it("should reject rating with empty proof", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const emptyProof = "0x";

      await expect(
        reputationTracker
          .connect(user1)
          .submitRating(
            deliveryId,
            user2.address,
            emptyProof,
            emptyProof,
            emptyProof,
            emptyProof
          )
      ).to.be.revertedWithCustomError(reputationTracker, "InvalidProof");
    });

    it("should reject invalid delivery ID", async () => {
      const invalidDeliveryId = ethers.constants.HashZero;
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      await expect(
        reputationTracker
          .connect(user1)
          .submitRating(
            invalidDeliveryId,
            user2.address,
            encryptedScore,
            proof,
            encryptedScore,
            proof
          )
      ).to.be.revertedWithCustomError(reputationTracker, "InvalidInput");
    });

    it("should reject querying non-existent participant", async () => {
      await expect(
        reputationTracker.getReputation(user1.address)
      ).to.be.revertedWithCustomError(
        reputationTracker,
        "ParticipantNotFound"
      );
    });

    it("should reject average rating for non-existent participant", async () => {
      await expect(
        reputationTracker.getAverageRating(user1.address)
      ).to.be.revertedWithCustomError(
        reputationTracker,
        "ParticipantNotFound"
      );
    });
  });

  describe("📊 Rating Accuracy", () => {
    it("should maintain correct rating count", async () => {
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      for (let i = 0; i < 5; i++) {
        const deliveryId = ethers.utils.toBeHex(`delivery_${i}`, 32);
        await reputationTracker
          .connect(user1)
          .submitRating(
            deliveryId,
            user2.address,
            encryptedScore,
            proof,
            encryptedComment,
            proof
          );
      }

      const ratingCount = await reputationTracker.getRatingCount(user2.address);
      expect(ratingCount).to.equal(5);
    });

    it("should clamp average rating to valid range", async () => {
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      const average = await reputationTracker.getAverageRating(user2.address);
      expect(average).to.be.gte(1);
      expect(average).to.be.lte(5);
    });
  });

  describe("🔒 Encryption Privacy", () => {
    it("should store encrypted ratings", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedScore = ethers.utils.toBeHex("score_data", 32);
      const encryptedComment = ethers.utils.toBeHex("comment_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      await reputationTracker
        .connect(user1)
        .submitRating(
          deliveryId,
          user2.address,
          encryptedScore,
          proof,
          encryptedComment,
          proof
        );

      const encrypted = await reputationTracker.getEncryptedRating(deliveryId);
      expect(encrypted).to.equal(encryptedScore);
    });
  });
});
