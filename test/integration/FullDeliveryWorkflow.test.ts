import { expect } from "chai";
import { ethers } from "hardhat";

describe("Integration: Complete Delivery Workflow", () => {
  let deliveryManager: any;
  let paymentProcessor: any;
  let reputationTracker: any;

  let sender: any;
  let courier: any;
  let recipient: any;

  beforeEach(async () => {
    [sender, courier, recipient] = await ethers.getSigners();

    // Deploy all contracts
    const DeliveryManagerFactory = await ethers.getContractFactory(
      "DeliveryManager"
    );
    deliveryManager = await DeliveryManagerFactory.deploy();
    await deliveryManager.deployed();

    const PaymentProcessorFactory = await ethers.getContractFactory(
      "PaymentProcessor"
    );
    paymentProcessor = await PaymentProcessorFactory.deploy();
    await paymentProcessor.deployed();

    const ReputationTrackerFactory = await ethers.getContractFactory(
      "ReputationTracker"
    );
    reputationTracker = await ReputationTrackerFactory.deploy();
    await reputationTracker.deployed();
  });

  describe("📦 Complete Delivery Lifecycle", () => {
    it("should complete full workflow: request -> accept -> payment -> complete -> rate", async () => {
      // ═══════════════════════════════════════════════════════════════════
      // Step 1: Sender creates delivery request with encrypted data
      // ═══════════════════════════════════════════════════════════════════
      const encryptedRecipient = ethers.utils.toBeHex("recipient_addr", 32);
      const encryptedPickup = ethers.utils.toBeHex("pickup_location", 32);
      const encryptedDelivery = ethers.utils.toBeHex("delivery_location", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      const createDeliveryTx = await deliveryManager
        .connect(sender)
        .createDeliveryRequest(
          encryptedRecipient,
          proof,
          encryptedPickup,
          proof,
          encryptedDelivery,
          proof
        );

      const createReceipt = await createDeliveryTx.wait();
      const deliveryId = createReceipt.events.find(
        (e: any) => e.event === "DeliveryRequested"
      ).args.requestId;

      // Verify delivery created
      let status = await deliveryManager.getDeliveryStatus(deliveryId);
      expect(status).to.equal(0); // PENDING

      // ═══════════════════════════════════════════════════════════════════
      // Step 2: Courier accepts delivery based on location
      // ═══════════════════════════════════════════════════════════════════
      const encryptedCourierLocation = ethers.utils.toBeHex(
        "courier_location",
        32
      );

      const acceptTx = await deliveryManager
        .connect(courier)
        .acceptDelivery(deliveryId, encryptedCourierLocation, proof);

      const acceptReceipt = await acceptTx.wait();

      // Verify delivery accepted
      expect(
        acceptReceipt.events.some((e: any) => e.event === "DeliveryAccepted")
      ).to.be.true;

      status = await deliveryManager.getDeliveryStatus(deliveryId);
      expect(status).to.equal(1); // ACCEPTED

      // ═══════════════════════════════════════════════════════════════════
      // Step 3: Sender creates payment for delivery
      // ═══════════════════════════════════════════════════════════════════
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const createPaymentTx = await paymentProcessor
        .connect(sender)
        .createPayment(deliveryId, encryptedAmount, proof, courier.address, {
          value: paymentAmount,
        });

      const paymentReceipt = await createPaymentTx.wait();
      const paymentId = paymentReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      // Verify payment created
      let paymentStatus = await paymentProcessor.getPaymentStatus(paymentId);
      expect(paymentStatus).to.equal(0); // PENDING

      // ═══════════════════════════════════════════════════════════════════
      // Step 4: Move payment to escrow
      // ═══════════════════════════════════════════════════════════════════
      await paymentProcessor.connect(sender).escrowPayment(paymentId);

      paymentStatus = await paymentProcessor.getPaymentStatus(paymentId);
      expect(paymentStatus).to.equal(1); // ESCROW

      // ═══════════════════════════════════════════════════════════════════
      // Step 5: Courier completes delivery
      // ═══════════════════════════════════════════════════════════════════
      const completeTx = await deliveryManager
        .connect(courier)
        .completeDelivery(deliveryId);

      const completeReceipt = await completeTx.wait();

      // Verify delivery completed
      expect(
        completeReceipt.events.some((e: any) => e.event === "DeliveryCompleted")
      ).to.be.true;

      status = await deliveryManager.getDeliveryStatus(deliveryId);
      expect(status).to.equal(3); // COMPLETED

      // ═══════════════════════════════════════════════════════════════════
      // Step 6: Release payment from escrow to courier
      // ═══════════════════════════════════════════════════════════════════
      const courierBalanceBefore = await ethers.provider.getBalance(
        courier.address
      );

      await paymentProcessor.connect(sender).completePayment(paymentId);

      const courierBalanceAfter = await ethers.provider.getBalance(
        courier.address
      );

      // Courier should have received payment (minus platform fee)
      expect(courierBalanceAfter).to.be.gt(courierBalanceBefore);

      paymentStatus = await paymentProcessor.getPaymentStatus(paymentId);
      expect(paymentStatus).to.equal(2); // COMPLETED

      // ═══════════════════════════════════════════════════════════════════
      // Step 7: Both parties rate each other
      // ═══════════════════════════════════════════════════════════════════
      const encryptedRating = ethers.utils.toBeHex("rating_data", 32);

      // Sender rates courier
      const senderRatesTx = await reputationTracker
        .connect(sender)
        .submitRating(
          deliveryId,
          courier.address,
          encryptedRating,
          proof,
          encryptedRating,
          proof
        );

      const senderRatesReceipt = await senderRatesTx.wait();
      expect(
        senderRatesReceipt.events.some((e: any) => e.event === "RatingSubmitted")
      ).to.be.true;

      // Courier rates sender
      const courierRatesTx = await reputationTracker
        .connect(courier)
        .submitRating(
          deliveryId,
          sender.address,
          encryptedRating,
          proof,
          encryptedRating,
          proof
        );

      const courierRatesReceipt = await courierRatesTx.wait();
      expect(
        courierRatesReceipt.events.some((e: any) => e.event === "RatingSubmitted")
      ).to.be.true;

      // ═══════════════════════════════════════════════════════════════════
      // Step 8: Verify final state
      // ═══════════════════════════════════════════════════════════════════

      // Courier has reputation
      const courierReputation = await reputationTracker.getReputation(
        courier.address
      );
      expect(courierReputation.ratingCount).to.equal(1);

      // Sender has reputation
      const senderReputation = await reputationTracker.getReputation(
        sender.address
      );
      expect(senderReputation.ratingCount).to.equal(1);

      // Delivery is complete
      status = await deliveryManager.getDeliveryStatus(deliveryId);
      expect(status).to.equal(3); // COMPLETED

      // Payment is released
      paymentStatus = await paymentProcessor.getPaymentStatus(paymentId);
      expect(paymentStatus).to.equal(2); // COMPLETED
    });
  });

  describe("🔄 Multiple Concurrent Deliveries", () => {
    it("should handle multiple deliveries simultaneously", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

      // Create 3 deliveries
      const deliveryIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const tx = await deliveryManager
          .connect(sender)
          .createDeliveryRequest(
            encryptedData,
            proof,
            encryptedData,
            proof,
            encryptedData,
            proof
          );

        const receipt = await tx.wait();
        const deliveryId = receipt.events.find(
          (e: any) => e.event === "DeliveryRequested"
        ).args.requestId;

        deliveryIds.push(deliveryId);
      }

      // Accept all deliveries
      for (const deliveryId of deliveryIds) {
        await deliveryManager
          .connect(courier)
          .acceptDelivery(deliveryId, encryptedData, proof);
      }

      // Verify all accepted
      const totalDeliveries = await deliveryManager.getDeliveryCount();
      expect(totalDeliveries).to.equal(3);

      const courierDeliveries =
        await deliveryManager.getUserDeliveries(courier.address);
      expect(courierDeliveries.length).to.equal(3);
    });
  });

  describe("🔒 Privacy Maintenance", () => {
    it("should not expose encrypted data to unauthorized parties", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

      // Sender creates delivery
      const tx = await deliveryManager
        .connect(sender)
        .createDeliveryRequest(
          encryptedData,
          proof,
          encryptedData,
          proof,
          encryptedData,
          proof
        );

      const receipt = await tx.wait();
      const deliveryId = receipt.events.find(
        (e: any) => e.event === "DeliveryRequested"
      ).args.requestId;

      // Recipient should not be able to access location before courier accepts
      await expect(
        deliveryManager
          .connect(recipient)
          .getEncryptedPickupLocation(deliveryId)
      ).to.be.reverted;

      // Courier accepts
      await deliveryManager
        .connect(courier)
        .acceptDelivery(deliveryId, encryptedData, proof);

      // Now courier can access location
      const location = await deliveryManager
        .connect(courier)
        .getEncryptedPickupLocation(deliveryId);

      expect(location).to.equal(encryptedData);

      // But recipient still cannot
      await expect(
        deliveryManager
          .connect(recipient)
          .getEncryptedPickupLocation(deliveryId)
      ).to.be.reverted;
    });
  });

  describe("💰 Payment and Fees", () => {
    it("should calculate and distribute platform fees correctly", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);
      const paymentAmount = ethers.parseEther("1.0");

      // Create and accept delivery
      const createTx = await deliveryManager
        .connect(sender)
        .createDeliveryRequest(
          encryptedData,
          proof,
          encryptedData,
          proof,
          encryptedData,
          proof
        );

      const createReceipt = await createTx.wait();
      const deliveryId = createReceipt.events.find(
        (e: any) => e.event === "DeliveryRequested"
      ).args.requestId;

      await deliveryManager
        .connect(courier)
        .acceptDelivery(deliveryId, encryptedData, proof);

      // Create payment
      const paymentTx = await paymentProcessor
        .connect(sender)
        .createPayment(deliveryId, encryptedData, proof, courier.address, {
          value: paymentAmount,
        });

      const paymentReceipt = await paymentTx.wait();
      const paymentId = paymentReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      const payment = await paymentProcessor.getPayment(paymentId);

      // Fee should be 2% of payment amount
      const expectedFee = paymentAmount.div(50); // 2%
      expect(payment.fee).to.equal(expectedFee);

      // Courier amount should be payment - fee
      const expectedCourierAmount = paymentAmount.sub(expectedFee);
      expect(payment.amount.sub(payment.fee)).to.equal(expectedCourierAmount);
    });
  });

  describe("⭐ Reputation System", () => {
    it("should build reputation over multiple deliveries", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

      // Perform 3 deliveries
      for (let i = 0; i < 3; i++) {
        // Create delivery
        const createTx = await deliveryManager
          .connect(sender)
          .createDeliveryRequest(
            encryptedData,
            proof,
            encryptedData,
            proof,
            encryptedData,
            proof
          );

        const createReceipt = await createTx.wait();
        const deliveryId = createReceipt.events.find(
          (e: any) => e.event === "DeliveryRequested"
        ).args.requestId;

        // Accept and complete
        await deliveryManager
          .connect(courier)
          .acceptDelivery(deliveryId, encryptedData, proof);
        await deliveryManager
          .connect(courier)
          .completeDelivery(deliveryId);

        // Rate
        await reputationTracker
          .connect(sender)
          .submitRating(
            deliveryId,
            courier.address,
            encryptedData,
            proof,
            encryptedData,
            proof
          );
      }

      // Check final reputation
      const reputation = await reputationTracker.getReputation(courier.address);
      expect(reputation.ratingCount).to.equal(3);

      const average = await reputationTracker.getAverageRating(courier.address);
      expect(average).to.be.gt(0);
    });
  });
});
