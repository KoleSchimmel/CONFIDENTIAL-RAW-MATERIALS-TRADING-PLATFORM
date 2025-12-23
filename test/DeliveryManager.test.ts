import { expect } from "chai";
import { ethers } from "hardhat";

describe("DeliveryManager Contract", () => {
  let deliveryManager: any;
  let owner: any;
  let sender: any;
  let courier: any;
  let recipient: any;

  beforeEach(async () => {
    [owner, sender, courier, recipient] = await ethers.getSigners();

    const DeliveryManagerFactory = await ethers.getContractFactory(
      "DeliveryManager"
    );
    deliveryManager = await DeliveryManagerFactory.deploy();
    await deliveryManager.deployed();
  });

  describe("✅ Success Cases", () => {
    it("should create a delivery request successfully", async () => {
      // Arrange: Create dummy encrypted data
      const encryptedRecipient = ethers.utils.toBeHex("recipient_data", 32);
      const encryptedPickup = ethers.utils.toBeHex("pickup_data", 32);
      const encryptedDelivery = ethers.utils.toBeHex("delivery_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      // Act: Create delivery request
      const tx = await deliveryManager
        .connect(sender)
        .createDeliveryRequest(
          encryptedRecipient,
          proof,
          encryptedPickup,
          proof,
          encryptedDelivery,
          proof
        );

      const receipt = await tx.wait();

      // Assert: Check event was emitted
      expect(receipt.events.some((e: any) => e.event === "DeliveryRequested"))
        .to.be.true;
    });

    it("should track delivery for sender", async () => {
      // Arrange: Create delivery
      const encryptedRecipient = ethers.utils.toBeHex("recipient_data", 32);
      const encryptedPickup = ethers.utils.toBeHex("pickup_data", 32);
      const encryptedDelivery = ethers.utils.toBeHex("delivery_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      // Act: Create delivery
      await deliveryManager
        .connect(sender)
        .createDeliveryRequest(
          encryptedRecipient,
          proof,
          encryptedPickup,
          proof,
          encryptedDelivery,
          proof
        );

      // Assert: Sender can retrieve their deliveries
      const deliveries = await deliveryManager.getUserDeliveries(sender.address);
      expect(deliveries.length).to.equal(1);
    });

    it("should accept a delivery with valid location", async () => {
      // Arrange: Create and accept delivery
      const encryptedRecipient = ethers.utils.toBeHex("recipient_data", 32);
      const encryptedPickup = ethers.utils.toBeHex("pickup_data", 32);
      const encryptedDelivery = ethers.utils.toBeHex("delivery_data", 32);
      const encryptedCourierLoc = ethers.utils.toBeHex(
        "courier_location",
        32
      );
      const proof = ethers.utils.toBeHex("proof_data", 32);

      const createTx = await deliveryManager
        .connect(sender)
        .createDeliveryRequest(
          encryptedRecipient,
          proof,
          encryptedPickup,
          proof,
          encryptedDelivery,
          proof
        );

      const createReceipt = await createTx.wait();
      const event = createReceipt.events.find(
        (e: any) => e.event === "DeliveryRequested"
      );
      const deliveryId = event.args.requestId;

      // Act: Accept delivery
      const acceptTx = await deliveryManager
        .connect(courier)
        .acceptDelivery(deliveryId, encryptedCourierLoc, proof);

      const acceptReceipt = await acceptTx.wait();

      // Assert: DeliveryAccepted event emitted
      expect(
        acceptReceipt.events.some((e: any) => e.event === "DeliveryAccepted")
      ).to.be.true;

      // Verify status changed
      const status = await deliveryManager.getDeliveryStatus(deliveryId);
      expect(status).to.equal(1); // ACCEPTED = 1
    });

    it("should complete a delivery", async () => {
      // Arrange: Create and accept delivery
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

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

      // Accept delivery
      await deliveryManager
        .connect(courier)
        .acceptDelivery(deliveryId, encryptedData, proof);

      // Act: Complete delivery
      const completeTx = await deliveryManager
        .connect(courier)
        .completeDelivery(deliveryId);

      const completeReceipt = await completeTx.wait();

      // Assert: Event emitted
      expect(
        completeReceipt.events.some((e: any) => e.event === "DeliveryCompleted")
      ).to.be.true;

      // Status should be COMPLETED (3)
      const status = await deliveryManager.getDeliveryStatus(deliveryId);
      expect(status).to.equal(3);
    });

    it("should cancel a pending delivery", async () => {
      // Arrange: Create delivery
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

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

      // Act: Cancel delivery
      const cancelTx = await deliveryManager
        .connect(sender)
        .cancelDelivery(deliveryId);

      const cancelReceipt = await cancelTx.wait();

      // Assert: Event emitted
      expect(
        cancelReceipt.events.some((e: any) => e.event === "DeliveryCancelled")
      ).to.be.true;

      // Status should be CANCELLED (4)
      const status = await deliveryManager.getDeliveryStatus(deliveryId);
      expect(status).to.equal(4);
    });

    it("should handle multiple deliveries", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

      // Create multiple deliveries
      for (let i = 0; i < 3; i++) {
        await deliveryManager
          .connect(sender)
          .createDeliveryRequest(
            encryptedData,
            proof,
            encryptedData,
            proof,
            encryptedData,
            proof
          );
      }

      // Assert: All deliveries tracked
      const totalCount = await deliveryManager.getDeliveryCount();
      expect(totalCount).to.equal(3);

      const userDeliveries =
        await deliveryManager.getUserDeliveries(sender.address);
      expect(userDeliveries.length).to.equal(3);
    });
  });

  describe("❌ Failure Cases", () => {
    it("should reject delivery with empty encrypted data", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const emptyData = "0x";

      await expect(
        deliveryManager
          .connect(sender)
          .createDeliveryRequest(emptyData, proof, emptyData, proof, emptyData, proof)
      ).to.be.revertedWithCustomError(
        deliveryManager,
        "InvalidProof"
      );
    });

    it("should reject courier accepting own delivery", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

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

      // Sender tries to accept their own delivery
      await expect(
        deliveryManager
          .connect(sender)
          .acceptDelivery(deliveryId, encryptedData, proof)
      ).to.be.revertedWithCustomError(
        deliveryManager,
        "UnauthorizedAccess"
      );
    });

    it("should reject completing delivery by non-courier", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

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

      // Courier accepts
      await deliveryManager
        .connect(courier)
        .acceptDelivery(deliveryId, encryptedData, proof);

      // Different user tries to complete
      await expect(
        deliveryManager.connect(recipient).completeDelivery(deliveryId)
      ).to.be.revertedWithCustomError(
        deliveryManager,
        "UnauthorizedAccess"
      );
    });

    it("should reject completing already accepted delivery", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

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

      // Try to complete again
      await expect(
        deliveryManager.connect(courier).completeDelivery(deliveryId)
      ).to.be.revertedWithCustomError(
        deliveryManager,
        "InvalidDeliveryStatus"
      );
    });

    it("should reject non-sender cancelling delivery", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

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

      // Courier tries to cancel
      await expect(
        deliveryManager.connect(courier).cancelDelivery(deliveryId)
      ).to.be.revertedWithCustomError(
        deliveryManager,
        "UnauthorizedAccess"
      );
    });

    it("should reject querying non-existent delivery", async () => {
      const fakeId = ethers.utils.toBeHex("fake", 32);

      await expect(
        deliveryManager.getDeliveryStatus(fakeId)
      ).to.be.revertedWithCustomError(
        deliveryManager,
        "DeliveryNotFound"
      );
    });
  });

  describe("🔐 Permission Handling", () => {
    it("should restrict encrypted data access", async () => {
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const encryptedData = ethers.utils.toBeHex("data", 32);

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

      // Accept delivery
      await deliveryManager
        .connect(courier)
        .acceptDelivery(deliveryId, encryptedData, proof);

      // Courier should be able to access location (after acceptance)
      const location = await deliveryManager
        .connect(courier)
        .getEncryptedPickupLocation(deliveryId);

      expect(location).to.equal(encryptedData);

      // Recipient should not be able to access
      await expect(
        deliveryManager
          .connect(recipient)
          .getEncryptedPickupLocation(deliveryId)
      ).to.be.revertedWithCustomError(
        deliveryManager,
        "UnauthorizedAccess"
      );
    });
  });
});
