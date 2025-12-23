import { expect } from "chai";
import { ethers } from "hardhat";

describe("PaymentProcessor Contract", () => {
  let paymentProcessor: any;
  let owner: any;
  let payer: any;
  let payee: any;
  let other: any;

  beforeEach(async () => {
    [owner, payer, payee, other] = await ethers.getSigners();

    const PaymentProcessorFactory = await ethers.getContractFactory(
      "PaymentProcessor"
    );
    paymentProcessor = await PaymentProcessorFactory.deploy();
    await paymentProcessor.deployed();
  });

  describe("✅ Success Cases", () => {
    it("should create a payment successfully", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const tx = await paymentProcessor
        .connect(payer)
        .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
          value: paymentAmount,
        });

      const receipt = await tx.wait();

      expect(
        receipt.events.some((e: any) => e.event === "PaymentCreated")
      ).to.be.true;
    });

    it("should move payment to escrow", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const createTx = await paymentProcessor
        .connect(payer)
        .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
          value: paymentAmount,
        });

      const createReceipt = await createTx.wait();
      const paymentId = createReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      const escrowTx = await paymentProcessor
        .connect(payer)
        .escrowPayment(paymentId);

      const escrowReceipt = await escrowTx.wait();

      expect(
        escrowReceipt.events.some((e: any) => e.event === "PaymentEscrowed")
      ).to.be.true;

      const status = await paymentProcessor.getPaymentStatus(paymentId);
      expect(status).to.equal(1); // ESCROW = 1
    });

    it("should complete a payment", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const createTx = await paymentProcessor
        .connect(payer)
        .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
          value: paymentAmount,
        });

      const createReceipt = await createTx.wait();
      const paymentId = createReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      // Escrow payment
      await paymentProcessor.connect(payer).escrowPayment(paymentId);

      // Complete payment
      const completeTx = await paymentProcessor
        .connect(payer)
        .completePayment(paymentId);

      const completeReceipt = await completeTx.wait();

      expect(
        completeReceipt.events.some((e: any) => e.event === "PaymentCompleted")
      ).to.be.true;

      const status = await paymentProcessor.getPaymentStatus(paymentId);
      expect(status).to.equal(2); // COMPLETED = 2
    });

    it("should refund a payment", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const createTx = await paymentProcessor
        .connect(payer)
        .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
          value: paymentAmount,
        });

      const createReceipt = await createTx.wait();
      const paymentId = createReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      // Refund payment
      const refundTx = await paymentProcessor
        .connect(payer)
        .refundPayment(paymentId, encryptedAmount, proof);

      const refundReceipt = await refundTx.wait();

      expect(
        refundReceipt.events.some((e: any) => e.event === "PaymentRefunded")
      ).to.be.true;

      const status = await paymentProcessor.getPaymentStatus(paymentId);
      expect(status).to.equal(3); // REFUNDED = 3
    });

    it("should handle multiple payments", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.05");

      for (let i = 0; i < 3; i++) {
        await paymentProcessor
          .connect(payer)
          .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
            value: paymentAmount,
          });
      }

      const totalCount = await paymentProcessor.getPaymentCount();
      expect(totalCount).to.equal(3);

      const userPayments = await paymentProcessor.getUserPayments(payer.address);
      expect(userPayments.length).to.equal(3);
    });

    it("should calculate platform fee correctly", async () => {
      const feePercent = await paymentProcessor.getPlatformFee();
      expect(feePercent).to.equal(2); // 2%
    });
  });

  describe("❌ Failure Cases", () => {
    it("should reject payment with zero payee", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      await expect(
        paymentProcessor
          .connect(payer)
          .createPayment(
            deliveryId,
            encryptedAmount,
            proof,
            ethers.constants.AddressZero,
            { value: paymentAmount }
          )
      ).to.be.revertedWithCustomError(paymentProcessor, "ZeroAddress");
    });

    it("should reject payment below minimum", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      await expect(
        paymentProcessor
          .connect(payer)
          .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
            value: ethers.parseEther("0.0001"),
          })
      ).to.be.revertedWithCustomError(
        paymentProcessor,
        "InvalidPaymentAmount"
      );
    });

    it("should reject payment above maximum", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);

      await expect(
        paymentProcessor
          .connect(payer)
          .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
            value: ethers.parseEther("2000"),
          })
      ).to.be.revertedWithCustomError(
        paymentProcessor,
        "InvalidPaymentAmount"
      );
    });

    it("should reject payment with empty proof", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const emptyProof = "0x";
      const paymentAmount = ethers.parseEther("0.1");

      await expect(
        paymentProcessor
          .connect(payer)
          .createPayment(
            deliveryId,
            emptyProof,
            emptyProof,
            payee.address,
            { value: paymentAmount }
          )
      ).to.be.revertedWithCustomError(paymentProcessor, "InvalidProof");
    });

    it("should reject self-payment", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      await expect(
        paymentProcessor
          .connect(payer)
          .createPayment(deliveryId, encryptedAmount, proof, payer.address, {
            value: paymentAmount,
          })
      ).to.be.revertedWithCustomError(paymentProcessor, "InvalidInput");
    });

    it("should reject escrow by non-payer", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const createTx = await paymentProcessor
        .connect(payer)
        .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
          value: paymentAmount,
        });

      const createReceipt = await createTx.wait();
      const paymentId = createReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      await expect(
        paymentProcessor.connect(other).escrowPayment(paymentId)
      ).to.be.revertedWithCustomError(
        paymentProcessor,
        "UnauthorizedPaymentAccess"
      );
    });

    it("should reject completing non-escrowed payment", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const createTx = await paymentProcessor
        .connect(payer)
        .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
          value: paymentAmount,
        });

      const createReceipt = await createTx.wait();
      const paymentId = createReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      // Try to complete without escrow
      await expect(
        paymentProcessor.connect(payer).completePayment(paymentId)
      ).to.be.revertedWithCustomError(
        paymentProcessor,
        "InvalidPaymentStatus"
      );
    });

    it("should reject non-existent payment", async () => {
      const fakeId = ethers.utils.toBeHex("fake", 32);

      await expect(
        paymentProcessor.getPaymentStatus(fakeId)
      ).to.be.revertedWithCustomError(paymentProcessor, "PaymentNotFound");
    });
  });

  describe("🔐 Permission Handling", () => {
    it("should only allow payer to refund", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const createTx = await paymentProcessor
        .connect(payer)
        .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
          value: paymentAmount,
        });

      const createReceipt = await createTx.wait();
      const paymentId = createReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      // Other user tries to refund
      await expect(
        paymentProcessor
          .connect(other)
          .refundPayment(paymentId, encryptedAmount, proof)
      ).to.be.revertedWithCustomError(
        paymentProcessor,
        "UnauthorizedPaymentAccess"
      );

      // Payer can refund
      const refundTx = await paymentProcessor
        .connect(payer)
        .refundPayment(paymentId, encryptedAmount, proof);

      expect(refundTx).to.not.be.reverted;
    });

    it("should restrict encrypted amount access", async () => {
      const deliveryId = ethers.utils.toBeHex("delivery_1", 32);
      const encryptedAmount = ethers.utils.toBeHex("amount_data", 32);
      const proof = ethers.utils.toBeHex("proof_data", 32);
      const paymentAmount = ethers.parseEther("0.1");

      const createTx = await paymentProcessor
        .connect(payer)
        .createPayment(deliveryId, encryptedAmount, proof, payee.address, {
          value: paymentAmount,
        });

      const createReceipt = await createTx.wait();
      const paymentId = createReceipt.events.find(
        (e: any) => e.event === "PaymentCreated"
      ).args.paymentId;

      // Payer can access encrypted amount
      const encrypted = await paymentProcessor
        .connect(payer)
        .getEncryptedAmount(paymentId);
      expect(encrypted).to.equal(encryptedAmount);

      // Other user cannot access
      await expect(
        paymentProcessor.connect(payee).getEncryptedAmount(paymentId)
      ).to.be.revertedWithCustomError(
        paymentProcessor,
        "UnauthorizedPaymentAccess"
      );
    });
  });
});
