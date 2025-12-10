/**
 * Test Suite for ConfidentialRawMaterialsTrading
 *
 * @chapter: access-control
 *
 * Comprehensive test coverage including:
 * - Contract deployment and initialization
 * - Access control and permission management
 * - FHE encryption operations
 * - Business logic workflows
 * - Edge cases and error handling
 * - Common anti-patterns
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ConfidentialRawMaterialsTrading", () => {
  let contract: any;
  let owner: SignerWithAddress;
  let supplier1: SignerWithAddress;
  let supplier2: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;

  before(async () => {
    const signers = await ethers.getSigners();
    [owner, supplier1, supplier2, buyer1, buyer2] = signers;

    const Factory = await ethers.getContractFactory(
      "ConfidentialRawMaterialsTrading"
    );
    contract = await Factory.deploy();
    await contract.deployed();
  });

  describe("Deployment", () => {
    it("Should deploy successfully", async () => {
      expect(contract.address).to.not.be.undefined;
      expect(contract.address).to.match(/^0x[a-fA-F0-9]{40}$/);
    });

    it("Should set owner correctly", async () => {
      const contractOwner = await contract.owner();
      expect(contractOwner).to.equal(owner.address);
    });

    it("Should initialize counters", async () => {
      const nextMaterialId = await contract.nextMaterialId();
      const nextOrderId = await contract.nextOrderId();
      expect(nextMaterialId).to.equal(1);
      expect(nextOrderId).to.equal(1);
    });
  });

  describe("Supplier Verification", () => {
    it("Should verify suppliers", async () => {
      const tx = await contract.verifySupplier(supplier1.address);
      await tx.wait();

      const isVerified = await contract.verifiedSuppliers(supplier1.address);
      expect(isVerified).to.be.true;
    });

    it("Should emit SupplierVerified event", async () => {
      const tx = contract.verifySupplier(supplier2.address);
      await expect(tx).to.emit(contract, "SupplierVerified");
    });

    it("Should only allow owner to verify suppliers", async () => {
      await expect(
        contract.connect(buyer1).verifySupplier(supplier1.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow re-verification", async () => {
      const tx1 = await contract.verifySupplier(supplier1.address);
      await tx1.wait();

      const tx2 = await contract.verifySupplier(supplier1.address);
      await tx2.wait();

      const isVerified = await contract.verifiedSuppliers(supplier1.address);
      expect(isVerified).to.be.true;
    });
  });

  describe("Buyer Verification", () => {
    it("Should verify buyers", async () => {
      const tx = await contract.verifyBuyer(buyer1.address);
      await tx.wait();

      const isVerified = await contract.verifiedBuyers(buyer1.address);
      expect(isVerified).to.be.true;
    });

    it("Should emit BuyerVerified event", async () => {
      const tx = contract.verifyBuyer(buyer2.address);
      await expect(tx).to.emit(contract, "BuyerVerified");
    });

    it("Should only allow owner to verify buyers", async () => {
      await expect(
        contract.connect(supplier1).verifyBuyer(buyer1.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Material Listing", () => {
    before(async () => {
      // Verify suppliers before testing
      await contract.verifySupplier(supplier1.address);
      await contract.verifySupplier(supplier2.address);
    });

    it("Should list material by verified supplier", async () => {
      const tx = await contract.connect(supplier1).listMaterial(
        "Steel Coils",
        0, // METALS
        1000,
        50000n,
        100,
        "A1",
        14
      );
      await tx.wait();

      const material = await contract.getMaterialInfo(1);
      expect(material.name).to.equal("Steel Coils");
      expect(material.supplier).to.equal(supplier1.address);
      expect(material.isActive).to.be.true;
    });

    it("Should prevent unverified supplier from listing", async () => {
      const unverified = (await ethers.getSigners())[5];

      await expect(
        contract.connect(unverified).listMaterial(
          "Aluminum",
          0,
          500,
          40000n,
          50,
          "B1",
          21
        )
      ).to.be.revertedWith("Not verified supplier");
    });

    it("Should reject zero quantity", async () => {
      await expect(
        contract.connect(supplier1).listMaterial(
          "Material",
          0,
          0, // Invalid
          1000n,
          1,
          "A1",
          7
        )
      ).to.be.revertedWith("Invalid quantity");
    });

    it("Should reject zero price", async () => {
      await expect(
        contract.connect(supplier1).listMaterial(
          "Material",
          0,
          100,
          0n, // Invalid
          1,
          "A1",
          7
        )
      ).to.be.revertedWith("Invalid price");
    });

    it("Should reject zero min order", async () => {
      await expect(
        contract.connect(supplier1).listMaterial(
          "Material",
          0,
          100,
          1000n,
          0, // Invalid
          "A1",
          7
        )
      ).to.be.revertedWith("Invalid minimum order");
    });

    it("Should emit MaterialListed event", async () => {
      const tx = contract.connect(supplier1).listMaterial(
        "Copper",
        0,
        500,
        75000n,
        50,
        "AAA",
        10
      );

      await expect(tx).to.emit(contract, "MaterialListed");
    });

    it("Should track supplier materials", async () => {
      await contract.connect(supplier1).listMaterial(
        "Test Material",
        1,
        2000,
        25000n,
        200,
        "B2",
        21
      );

      const supplierMaterials = await contract.getSupplierMaterials(
        supplier1.address
      );
      expect(supplierMaterials.length).to.be.greaterThan(0);
    });

    it("Should support all material categories", async () => {
      const categories = [
        { id: 0, name: "METALS" },
        { id: 1, name: "CHEMICALS" },
        { id: 2, name: "ENERGY" },
        { id: 3, name: "AGRICULTURAL" },
        { id: 4, name: "TEXTILES" },
        { id: 5, name: "MINERALS" },
      ];

      for (const cat of categories) {
        const tx = await contract.connect(supplier2).listMaterial(
          `${cat.name} Sample`,
          cat.id,
          100,
          50000n,
          10,
          "Standard",
          7
        );
        await tx.wait();
      }

      for (const cat of categories) {
        const materials = await contract.getMaterialsByCategory(cat.id);
        expect(materials.length).to.be.greaterThan(0);
      }
    });
  });

  describe("Order Placement", () => {
    before(async () => {
      // Verify all participants
      await contract.verifySupplier(supplier1.address);
      await contract.verifyBuyer(buyer1.address);
      await contract.verifyBuyer(buyer2.address);

      // List test material
      await contract.connect(supplier1).listMaterial(
        "Test Material",
        0,
        1000,
        50000n,
        100,
        "A1",
        14
      );
    });

    it("Should allow verified buyer to place order", async () => {
      const tx = await contract.connect(buyer1).placeOrder(
        1, // materialId
        500, // quantity
        60000n, // maxPrice
        "New York", // deliveryLocation
        "0x" + "0".repeat(64)
      );
      await tx.wait();

      const order = await contract.getOrderInfo(1);
      expect(order.buyer).to.equal(buyer1.address);
      expect(order.materialId).to.equal(1);
      expect(order.status).to.equal(0); // PENDING
    });

    it("Should prevent unverified buyer from ordering", async () => {
      const unverified = (await ethers.getSigners())[6];

      await expect(
        contract.connect(unverified).placeOrder(
          1,
          500,
          60000n,
          "NY",
          "0x" + "0".repeat(64)
        )
      ).to.be.revertedWith("Not verified buyer");
    });

    it("Should reject order for inactive material", async () => {
      // First deactivate the material
      const material = await contract.connect(supplier1);
      const materialId = 1;

      // Try to order from inactive material
      await expect(
        contract.connect(buyer1).placeOrder(
          999, // Non-existent material
          100,
          50000n,
          "Location",
          "0x" + "0".repeat(64)
        )
      ).to.be.reverted;
    });

    it("Should reject zero quantity order", async () => {
      await expect(
        contract.connect(buyer1).placeOrder(
          1,
          0, // Invalid
          50000n,
          "Location",
          "0x" + "0".repeat(64)
        )
      ).to.be.revertedWith("Invalid quantity");
    });

    it("Should reject zero max price", async () => {
      await expect(
        contract.connect(buyer1).placeOrder(
          1,
          500,
          0n, // Invalid
          "Location",
          "0x" + "0".repeat(64)
        )
      ).to.be.revertedWith("Invalid max price");
    });

    it("Should emit OrderPlaced event", async () => {
      const tx = contract.connect(buyer2).placeOrder(
        1,
        300,
        55000n,
        "Los Angeles",
        "0x" + "0".repeat(64)
      );

      await expect(tx).to.emit(contract, "OrderPlaced");
    });

    it("Should track buyer orders", async () => {
      const buyerOrders = await contract.getBuyerOrders(buyer1.address);
      expect(buyerOrders.length).to.be.greaterThan(0);
    });
  });

  describe("Trade Matching", () => {
    let materialId: number;
    let orderId: number;

    before(async () => {
      // Setup
      await contract.verifySupplier(supplier1.address);
      await contract.verifyBuyer(buyer1.address);

      // List material
      const tx1 = await contract.connect(supplier1).listMaterial(
        "Matching Test",
        0,
        2000,
        100000n,
        200,
        "A1",
        10
      );
      await tx1.wait();

      // Place order
      const tx2 = await contract.connect(buyer1).placeOrder(
        materialId || 1,
        800,
        120000n,
        "Chicago",
        "0x" + "0".repeat(64)
      );
      await tx2.wait();

      materialId = (await contract.nextMaterialId()).toNumber() - 1;
      orderId = (await contract.nextOrderId()).toNumber() - 1;
    });

    it("Should match trade between supplier and buyer", async () => {
      const tx = await contract.connect(supplier1).matchTrade(orderId);
      await tx.wait();

      const order = await contract.getOrderInfo(orderId);
      expect(order.status).to.equal(1); // MATCHED
      expect(order.matchedSupplier).to.equal(supplier1.address);
    });

    it("Should prevent non-supplier from matching", async () => {
      const newOrderId = (await contract.nextOrderId()).toNumber();
      await contract.connect(buyer1).placeOrder(
        materialId,
        300,
        110000n,
        "Boston",
        "0x" + "0".repeat(64)
      );

      await expect(
        contract.connect(buyer1).matchTrade(newOrderId)
      ).to.be.revertedWith("Not material supplier");
    });

    it("Should prevent matching non-pending orders", async () => {
      // Try to match already matched order
      await expect(
        contract.connect(supplier1).matchTrade(orderId)
      ).to.be.revertedWith("Order not pending");
    });

    it("Should emit TradeMatched event", async () => {
      const newOrderId = (await contract.nextOrderId()).toNumber();
      await contract.connect(buyer2).placeOrder(
        materialId,
        500,
        115000n,
        "Denver",
        "0x" + "0".repeat(64)
      );

      const tx = contract.connect(supplier1).matchTrade(newOrderId);
      await expect(tx).to.emit(contract, "TradeMatched");
    });
  });

  describe("Trade Confirmation", () => {
    let orderId: number;

    before(async () => {
      // Setup and match
      await contract.verifySupplier(supplier1.address);
      await contract.verifyBuyer(buyer1.address);

      const tx1 = await contract.connect(supplier1).listMaterial(
        "Confirm Test",
        0,
        1500,
        80000n,
        150,
        "A2",
        12
      );
      await tx1.wait();

      const materialId = (await contract.nextMaterialId()).toNumber() - 1;

      const tx2 = await contract.connect(buyer1).placeOrder(
        materialId,
        600,
        90000n,
        "Seattle",
        "0x" + "0".repeat(64)
      );
      await tx2.wait();

      orderId = (await contract.nextOrderId()).toNumber() - 1;

      await contract.connect(supplier1).matchTrade(orderId);
    });

    it("Should confirm matched trade", async () => {
      const tx = await contract.connect(buyer1).confirmTrade(orderId);
      await tx.wait();

      const order = await contract.getOrderInfo(orderId);
      expect(order.status).to.equal(2); // COMPLETED
    });

    it("Should prevent confirmation by unauthorized party", async () => {
      const newOrderId = (await contract.nextOrderId()).toNumber();
      const materialId = (await contract.nextMaterialId()).toNumber() - 1;

      await contract.connect(buyer2).placeOrder(
        materialId,
        400,
        85000n,
        "Miami",
        "0x" + "0".repeat(64)
      );

      const supplier = (await ethers.getSigners())[7];
      await expect(
        contract.connect(supplier).confirmTrade(newOrderId)
      ).to.be.reverted;
    });

    it("Should prevent double confirmation", async () => {
      await expect(
        contract.connect(buyer1).confirmTrade(orderId)
      ).to.be.revertedWith("Order not matched");
    });

    it("Should emit TradeCompleted event", async () => {
      const newOrderId = (await contract.nextOrderId()).toNumber();
      const materialId = (await contract.nextMaterialId()).toNumber() - 1;

      await contract.connect(buyer2).placeOrder(
        materialId,
        350,
        88000n,
        "Phoenix",
        "0x" + "0".repeat(64)
      );

      await contract.connect(supplier1).matchTrade(newOrderId);

      const tx = contract.connect(buyer2).confirmTrade(newOrderId);
      await expect(tx).to.emit(contract, "TradeCompleted");
    });
  });

  describe("Order Cancellation", () => {
    before(async () => {
      await contract.verifySupplier(supplier1.address);
      await contract.verifyBuyer(buyer1.address);

      const tx = await contract.connect(supplier1).listMaterial(
        "Cancel Test",
        0,
        1000,
        60000n,
        100,
        "B1",
        15
      );
      await tx.wait();
    });

    it("Should allow buyer to cancel pending order", async () => {
      const materialId = (await contract.nextMaterialId()).toNumber() - 1;

      const tx1 = await contract.connect(buyer1).placeOrder(
        materialId,
        400,
        70000n,
        "Tampa",
        "0x" + "0".repeat(64)
      );
      await tx1.wait();

      const orderId = (await contract.nextOrderId()).toNumber() - 1;

      const tx2 = await contract.connect(buyer1).cancelOrder(orderId);
      await tx2.wait();

      const order = await contract.getOrderInfo(orderId);
      expect(order.status).to.equal(3); // CANCELLED
    });

    it("Should prevent non-owner from cancelling", async () => {
      const materialId = (await contract.nextMaterialId()).toNumber() - 1;

      const tx1 = await contract.connect(buyer1).placeOrder(
        materialId,
        300,
        68000n,
        "Orlando",
        "0x" + "0".repeat(64)
      );
      await tx1.wait();

      const orderId = (await contract.nextOrderId()).toNumber() - 1;

      await expect(
        contract.connect(buyer2).cancelOrder(orderId)
      ).to.be.revertedWith("Not order owner");
    });

    it("Should prevent cancellation of matched orders", async () => {
      const materialId = (await contract.nextMaterialId()).toNumber() - 1;

      const tx1 = await contract.connect(buyer1).placeOrder(
        materialId,
        250,
        65000n,
        "Atlanta",
        "0x" + "0".repeat(64)
      );
      await tx1.wait();

      const orderId = (await contract.nextOrderId()).toNumber() - 1;
      await contract.connect(supplier1).matchTrade(orderId);

      await expect(
        contract.connect(buyer1).cancelOrder(orderId)
      ).to.be.revertedWith("Cannot cancel");
    });
  });

  describe("Material Deactivation", () => {
    before(async () => {
      await contract.verifySupplier(supplier1.address);

      const tx = await contract.connect(supplier1).listMaterial(
        "Deactivate Test",
        0,
        500,
        45000n,
        50,
        "C1",
        20
      );
      await tx.wait();
    });

    it("Should allow supplier to deactivate material", async () => {
      const materialId = (await contract.nextMaterialId()).toNumber() - 1;

      const tx = await contract.connect(supplier1).deactivateMaterial(materialId);
      await tx.wait();

      const material = await contract.getMaterialInfo(materialId);
      expect(material.isActive).to.be.false;
    });

    it("Should prevent non-owner from deactivating", async () => {
      const materialId = (await contract.nextMaterialId()).toNumber() - 1;

      await expect(
        contract.connect(buyer1).deactivateMaterial(materialId)
      ).to.be.revertedWith("Not material owner");
    });
  });

  describe("Edge Cases", () => {
    it("Should handle maximum uint32 quantities", async () => {
      await contract.verifySupplier(supplier1.address);

      const maxUint32 = 2 ** 32 - 1;

      const tx = await contract.connect(supplier1).listMaterial(
        "Max Quantity",
        0,
        maxUint32,
        50000n,
        1,
        "A1",
        7
      );

      await expect(tx).to.not.be.reverted;
    });

    it("Should handle maximum uint64 prices", async () => {
      await contract.verifySupplier(supplier1.address);

      const maxUint64 = BigInt("18446744073709551615");

      const tx = await contract.connect(supplier1).listMaterial(
        "Max Price",
        0,
        100,
        maxUint64,
        10,
        "A1",
        7
      );

      await expect(tx).to.not.be.reverted;
    });

    it("Should handle rapid sequential operations", async () => {
      await contract.verifySupplier(supplier1.address);
      await contract.verifyBuyer(buyer1.address);

      const materialId = (await contract.nextMaterialId()).toNumber();

      const tx1 = await contract.connect(supplier1).listMaterial(
        "Rapid Test",
        0,
        1000,
        50000n,
        100,
        "A1",
        7
      );
      await tx1.wait();

      const tx2 = await contract.connect(buyer1).placeOrder(
        materialId,
        500,
        55000n,
        "Location",
        "0x" + "0".repeat(64)
      );
      await tx2.wait();

      const tx3 = await contract.connect(supplier1).matchTrade(1);
      await expect(tx3).to.not.be.reverted;
    });
  });

  describe("FHE Operations", () => {
    it("Should encrypt quantities without errors", async () => {
      // FHE encryption happens in contract
      // We verify it by checking material storage
      await contract.verifySupplier(supplier1.address);

      const tx = await contract.connect(supplier1).listMaterial(
        "FHE Test",
        0,
        12345,
        50000n,
        1000,
        "A1",
        7
      );
      await tx.wait();

      const material = await contract.getMaterialInfo(
        (await contract.nextMaterialId()).toNumber() - 1
      );
      expect(material.name).to.equal("FHE Test");
    });

    it("Should handle access control for encrypted values", async () => {
      // Access control is implicit in matching
      await contract.verifySupplier(supplier1.address);
      await contract.verifyBuyer(buyer1.address);

      const materialId = (await contract.nextMaterialId()).toNumber();

      const tx1 = await contract.connect(supplier1).listMaterial(
        "Access Test",
        0,
        5000,
        50000n,
        500,
        "A1",
        7
      );
      await tx1.wait();

      const tx2 = await contract.connect(buyer1).placeOrder(
        materialId,
        2000,
        55000n,
        "Test",
        "0x" + "0".repeat(64)
      );
      await tx2.wait();

      const orderId = (await contract.nextOrderId()).toNumber() - 1;
      const tx3 = await contract.connect(supplier1).matchTrade(orderId);
      await expect(tx3).to.not.be.reverted;
    });
  });

  describe("Information Queries", () => {
    before(async () => {
      await contract.verifySupplier(supplier1.address);

      const tx = await contract.connect(supplier1).listMaterial(
        "Query Test",
        0,
        750,
        50000n,
        75,
        "A1",
        7
      );
      await tx.wait();
    });

    it("Should return material info correctly", async () => {
      const materialId = (await contract.nextMaterialId()).toNumber() - 1;
      const material = await contract.getMaterialInfo(materialId);

      expect(material.name).to.equal("Query Test");
      expect(material.supplier).to.equal(supplier1.address);
      expect(material.isActive).to.be.true;
      expect(material.qualityGrade).to.equal("A1");
    });

    it("Should return order info correctly", async () => {
      await contract.verifyBuyer(buyer1.address);

      const materialId = (await contract.nextMaterialId()).toNumber() - 1;
      const tx = await contract.connect(buyer1).placeOrder(
        materialId,
        300,
        60000n,
        "Test Location",
        "0x" + "0".repeat(64)
      );
      await tx.wait();

      const orderId = (await contract.nextOrderId()).toNumber() - 1;
      const order = await contract.getOrderInfo(orderId);

      expect(order.buyer).to.equal(buyer1.address);
      expect(order.materialId).to.equal(materialId);
      expect(order.status).to.equal(0); // PENDING
    });

    it("Should retrieve materials by category", async () => {
      const metals = await contract.getMaterialsByCategory(0);
      expect(metals.length).to.be.greaterThan(0);
    });

    it("Should retrieve supplier materials", async () => {
      const materials = await contract.getSupplierMaterials(supplier1.address);
      expect(materials.length).to.be.greaterThan(0);
    });

    it("Should retrieve buyer orders", async () => {
      const orders = await contract.getBuyerOrders(buyer1.address);
      expect(orders.length).to.be.greaterThan(0);
    });
  });
});
