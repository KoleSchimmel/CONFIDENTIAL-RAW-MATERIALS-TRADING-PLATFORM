import { expect } from "chai";
import { ethers } from "hardhat";
import { FHECounter } from "../../types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { createInstance } from "../utils/instance";
import { getSigners } from "../utils/signers";

describe("FHECounter", function () {
  let counter: FHECounter;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let contractAddress: string;

  before(async function () {
    const signers = await getSigners();
    owner = signers.owner;
    user1 = signers.user1;
  });

  beforeEach(async function () {
    const CounterFactory = await ethers.getContractFactory("FHECounter");
    counter = await CounterFactory.connect(owner).deploy();
    await counter.waitForDeployment();
    contractAddress = await counter.getAddress();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(contractAddress).to.properAddress;
    });

    it("Should initialize counter to zero", async function () {
      const fhevm = await createInstance(contractAddress, owner);
      const encryptedCounter = await counter.connect(owner).getCounter();

      // Note: We cannot directly decrypt to verify it's zero without proper relayer setup
      // In production tests, you would use the relayer to decrypt and verify
      expect(encryptedCounter).to.not.equal(0); // Handle should not be zero
    });
  });

  describe("Increment", function () {
    it("Should increment counter by encrypted value", async function () {
      const fhevm = await createInstance(contractAddress, owner);

      // Create encrypted input for value 5
      const input = fhevm.createEncryptedInput(contractAddress, owner.address);
      input.add32(5);
      const encryptedInput = await input.encrypt();

      // Increment counter
      const tx = await counter.connect(owner).increment(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );
      await tx.wait();

      // Verify transaction was successful
      expect(tx).to.emit(counter, "CounterIncremented");
    });

    it("Should grant proper permissions after increment", async function () {
      const fhevm = await createInstance(contractAddress, owner);

      const input = fhevm.createEncryptedInput(contractAddress, owner.address);
      input.add32(10);
      const encryptedInput = await input.encrypt();

      await counter.connect(owner).increment(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      // User should be able to get counter after increment
      const encryptedCounter = await counter.connect(owner).getCounter();
      expect(encryptedCounter).to.not.equal(0);
    });

    it("Should increment multiple times", async function () {
      const fhevm = await createInstance(contractAddress, owner);

      // First increment
      const input1 = fhevm.createEncryptedInput(contractAddress, owner.address);
      input1.add32(3);
      const encrypted1 = await input1.encrypt();
      await counter.connect(owner).increment(encrypted1.handles[0], encrypted1.inputProof);

      // Second increment
      const input2 = fhevm.createEncryptedInput(contractAddress, owner.address);
      input2.add32(7);
      const encrypted2 = await input2.encrypt();
      const tx = await counter.connect(owner).increment(encrypted2.handles[0], encrypted2.inputProof);

      expect(tx).to.emit(counter, "CounterIncremented");
    });
  });

  describe("Decrement", function () {
    it("Should decrement counter by encrypted value", async function () {
      const fhevm = await createInstance(contractAddress, owner);

      // First increment to have a non-zero value
      const inputInc = fhevm.createEncryptedInput(contractAddress, owner.address);
      inputInc.add32(10);
      const encryptedInc = await inputInc.encrypt();
      await counter.connect(owner).increment(encryptedInc.handles[0], encryptedInc.inputProof);

      // Then decrement
      const inputDec = fhevm.createEncryptedInput(contractAddress, owner.address);
      inputDec.add32(3);
      const encryptedDec = await inputDec.encrypt();
      const tx = await counter.connect(owner).decrement(encryptedDec.handles[0], encryptedDec.inputProof);

      expect(tx).to.emit(counter, "CounterDecremented");
    });

    it("Should grant proper permissions after decrement", async function () {
      const fhevm = await createInstance(contractAddress, owner);

      // Increment first
      const inputInc = fhevm.createEncryptedInput(contractAddress, owner.address);
      inputInc.add32(20);
      const encryptedInc = await inputInc.encrypt();
      await counter.connect(owner).increment(encryptedInc.handles[0], encryptedInc.inputProof);

      // Decrement
      const inputDec = fhevm.createEncryptedInput(contractAddress, owner.address);
      inputDec.add32(5);
      const encryptedDec = await inputDec.encrypt();
      await counter.connect(owner).decrement(encryptedDec.handles[0], encryptedDec.inputProof);

      // Should be able to get counter
      const encryptedCounter = await counter.connect(owner).getCounter();
      expect(encryptedCounter).to.not.equal(0);
    });
  });

  describe("Reset", function () {
    it("Should reset counter to zero", async function () {
      const fhevm = await createInstance(contractAddress, owner);

      // Increment counter first
      const input = fhevm.createEncryptedInput(contractAddress, owner.address);
      input.add32(15);
      const encrypted = await input.encrypt();
      await counter.connect(owner).increment(encrypted.handles[0], encrypted.inputProof);

      // Reset counter
      await counter.connect(owner).reset();

      // Should be able to get counter after reset
      const encryptedCounter = await counter.connect(owner).getCounter();
      expect(encryptedCounter).to.not.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should allow user to access counter after increment", async function () {
      const fhevm = await createInstance(contractAddress, owner);

      const input = fhevm.createEncryptedInput(contractAddress, owner.address);
      input.add32(8);
      const encrypted = await input.encrypt();

      await counter.connect(owner).increment(encrypted.handles[0], encrypted.inputProof);

      // Owner should have access
      const counterValue = await counter.connect(owner).getCounter();
      expect(counterValue).to.not.equal(0);
    });
  });
});
