# Smart Contract API Reference

## ConfidentialRawMaterialsTrading Contract

Full API documentation for the main smart contract.

### State Variables

#### public address owner
Contract owner (deployer)

#### public uint256 nextMaterialId
Next material ID to be assigned (starts at 1)

#### public uint256 nextOrderId
Next order ID to be assigned (starts at 1)

---

## Access Control Functions

### verifySupplier(address supplier)

**Purpose**: Verify an address as a supplier
**Access**: onlyOwner
**Parameters**:
- `supplier` (address): Address to verify

**Returns**: None

**Events**: SupplierVerified(indexed address)

**Gas**: ~45,000 gas

**Example**:
```solidity
// Owner verifies supplier
await contract.verifySupplier("0x123...");
```

**Error Conditions**:
- Not authorized (caller is not owner)

---

### verifyBuyer(address buyer)

**Purpose**: Verify an address as a buyer
**Access**: onlyOwner
**Parameters**:
- `buyer` (address): Address to verify

**Returns**: None

**Events**: BuyerVerified(indexed address)

**Gas**: ~45,000 gas

**Example**:
```solidity
// Owner verifies buyer
await contract.verifyBuyer("0x456...");
```

---

## Material Management

### listMaterial(string memory _name, MaterialCategory _category, uint32 _quantity, uint64 _pricePerUnit, uint32 _minOrder, string memory _qualityGrade, uint256 _deliveryTimeframe)

**Purpose**: List a raw material for sale
**Access**: onlyVerifiedSupplier
**Parameters**:
- `_name` (string): Material name (e.g., "Steel Coils")
- `_category` (MaterialCategory): Enum {METALS=0, CHEMICALS=1, ENERGY=2, AGRICULTURAL=3, TEXTILES=4, MINERALS=5}
- `_quantity` (uint32): Available quantity (encrypted)
- `_pricePerUnit` (uint64): Price per unit in cents (encrypted)
- `_minOrder` (uint32): Minimum order quantity (encrypted)
- `_qualityGrade` (string): Quality grade (e.g., "A1", "AAA")
- `_deliveryTimeframe` (uint256): Delivery days

**Returns**: None

**Events**: MaterialListed(indexed uint256 materialId, indexed address supplier, MaterialCategory category)

**Gas**: ~85,000 gas

**Example**:
```typescript
await contract.connect(supplierSigner).listMaterial(
  "Steel Coils",
  0,                    // METALS
  1000,                 // 1000 units
  ethers.BigNumber.from("5000000"), // $50,000.00
  100,                  // minimum order
  "A1",                 // quality grade
  14                    // 14 days delivery
);
```

**Error Conditions**:
- Not verified supplier
- Invalid quantity (zero)
- Invalid price (zero)
- Invalid minimum order (zero)

**Security Notes**:
- Quantities and prices are encrypted before storage
- Only supplier can decrypt their own material details
- Competitors cannot see sensitive pricing

---

### getMaterialInfo(uint256 _materialId)

**Purpose**: Get public information about a material
**Access**: Public (view)
**Parameters**:
- `_materialId` (uint256): Material ID

**Returns**:
- `name` (string): Material name
- `category` (MaterialCategory): Material category
- `supplier` (address): Supplier address
- `isActive` (bool): Whether material is still available
- `createdAt` (uint256): Timestamp material was listed
- `qualityGrade` (string): Quality grade
- `deliveryTimeframe` (uint256): Delivery timeframe

**Gas**: ~5,000 gas

**Example**:
```typescript
const material = await contract.getMaterialInfo(1);
console.log(material.name);        // "Steel Coils"
console.log(material.supplier);    // "0x123..."
console.log(material.isActive);    // true
```

**Note**: Encrypted fields (quantity, price) are NOT returned
- Only authorized parties can decrypt these values

---

### getMaterialsByCategory(MaterialCategory category)

**Purpose**: Get all active materials in a category
**Access**: Public (view)
**Parameters**:
- `category` (MaterialCategory): Material category (0-5)

**Returns**: Array of material IDs

**Gas**: ~20,000 - 50,000 gas (depends on count)

**Example**:
```typescript
const metalMaterials = await contract.getMaterialsByCategory(0);
console.log(metalMaterials.length);  // Number of metal materials
```

---

### getSupplierMaterials(address supplier)

**Purpose**: Get all materials listed by a supplier
**Access**: Public (view)
**Parameters**:
- `supplier` (address): Supplier address

**Returns**: Array of material IDs

**Gas**: ~3,000 gas

**Example**:
```typescript
const myMaterials = await contract.getSupplierMaterials(supplierAddress);
```

---

### deactivateMaterial(uint256 _materialId)

**Purpose**: Remove a material from marketplace
**Access**: Only material supplier
**Parameters**:
- `_materialId` (uint256): Material ID to deactivate

**Returns**: None

**Gas**: ~25,000 gas

**Example**:
```typescript
await contract.connect(supplierSigner).deactivateMaterial(1);
```

**Error Conditions**:
- Not material owner/supplier
- Material already inactive

---

## Order Management

### placeOrder(uint256 _materialId, uint32 _quantity, uint64 _maxPrice, string memory _deliveryLocation, bytes32 _encryptedSpecialRequirements)

**Purpose**: Place an order for material
**Access**: onlyVerifiedBuyer
**Parameters**:
- `_materialId` (uint256): ID of material to order
- `_quantity` (uint32): Quantity needed (encrypted)
- `_maxPrice` (uint64): Maximum price in cents (encrypted)
- `_deliveryLocation` (string): Delivery address/location
- `_encryptedSpecialRequirements` (bytes32): Special requirements hash

**Returns**: None

**Events**: OrderPlaced(indexed uint256 orderId, indexed address buyer, indexed uint256 materialId)

**Gas**: ~95,000 gas

**Example**:
```typescript
await contract.connect(buyerSigner).placeOrder(
  1,                    // material ID
  500,                  // 500 units needed
  ethers.BigNumber.from("6000000"), // max $60,000.00
  "123 Main St, New York",
  "0x" + "0".repeat(64) // no special requirements
);
```

**Error Conditions**:
- Not verified buyer
- Material not active
- Invalid quantity (zero)
- Invalid max price (zero)

**Security Notes**:
- Quantity and price limit are encrypted
- Supplier cannot see buyer's price limit
- Buyer's constraints stay private until match

---

### getOrderInfo(uint256 _orderId)

**Purpose**: Get public information about an order
**Access**: Public (view)
**Parameters**:
- `_orderId` (uint256): Order ID

**Returns**:
- `buyer` (address): Buyer address
- `materialId` (uint256): Material ID
- `status` (OrderStatus): Order status {PENDING=0, MATCHED=1, COMPLETED=2, CANCELLED=3}
- `createdAt` (uint256): Timestamp order was placed
- `matchedAt` (uint256): Timestamp order was matched (0 if not matched)
- `matchedSupplier` (address): Supplier who matched order
- `deliveryLocation` (string): Delivery location

**Gas**: ~5,000 gas

**Example**:
```typescript
const order = await contract.getOrderInfo(1);
console.log(order.buyer);          // "0x456..."
console.log(order.status);         // 0 (PENDING)
console.log(order.deliveryLocation); // "New York"
```

---

### getBuyerOrders(address buyer)

**Purpose**: Get all orders placed by a buyer
**Access**: Public (view)
**Parameters**:
- `buyer` (address): Buyer address

**Returns**: Array of order IDs

**Gas**: ~3,000 gas

**Example**:
```typescript
const myOrders = await contract.getBuyerOrders(buyerAddress);
```

---

## Trade Management

### matchTrade(uint256 _orderId)

**Purpose**: Match an order with material (by supplier)
**Access**: Only material supplier
**Parameters**:
- `_orderId` (uint256): Order ID to match

**Returns**: None

**Events**: TradeMatched(indexed uint256 orderId, indexed uint256 materialId, indexed address buyer, address supplier)

**Gas**: ~125,000 gas

**Example**:
```typescript
// Supplier matches with buyer's order
await contract.connect(supplierSigner).matchTrade(1);
```

**Logic**:
1. Verify caller is the material's supplier
2. Perform encrypted comparison of quantities
3. Update material inventory (encrypted)
4. Grant decryption access to both parties
5. Create trade match record
6. Emit event

**Error Conditions**:
- Not material supplier
- Order not pending
- Material not active

**FHE Operations**:
```solidity
// Encrypted subtraction happens here
euint32 remaining = FHE.sub(
  material.encryptedQuantity,
  order.encryptedQuantity
);
```

---

### confirmTrade(uint256 _orderId)

**Purpose**: Confirm a matched trade (finalize)
**Access**: Buyer or supplier of matched trade
**Parameters**:
- `_orderId` (uint256): Order ID to confirm

**Returns**: None

**Events**: TradeCompleted(indexed uint256 orderId, indexed uint256 materialId)

**Gas**: ~45,000 gas

**Example**:
```typescript
// Either party confirms to complete
await contract.connect(buyerSigner).confirmTrade(1);
```

**Error Conditions**:
- Order not matched
- Not authorized (not buyer or supplier)
- Already confirmed

---

### getTradeMatch(uint256 _orderId)

**Purpose**: Get trade match information
**Access**: Public (view)
**Parameters**:
- `_orderId` (uint256): Order ID

**Returns**:
- `materialId` (uint256): Material ID
- `buyer` (address): Buyer address
- `supplier` (address): Supplier address
- `timestamp` (uint256): Match timestamp
- `isConfirmed` (bool): Whether trade is confirmed

**Gas**: ~3,000 gas

---

## Order Lifecycle

### cancelOrder(uint256 _orderId)

**Purpose**: Cancel a pending order
**Access**: Only order owner (buyer)
**Parameters**:
- `_orderId` (uint256): Order ID to cancel

**Returns**: None

**Gas**: ~25,000 gas

**Example**:
```typescript
await contract.connect(buyerSigner).cancelOrder(1);
```

**Error Conditions**:
- Not order owner
- Order not pending (already matched/completed)

---

## Enums

### MaterialCategory
```solidity
enum MaterialCategory {
  METALS,        // 0
  CHEMICALS,     // 1
  ENERGY,        // 2
  AGRICULTURAL,  // 3
  TEXTILES,      // 4
  MINERALS       // 5
}
```

### OrderStatus
```solidity
enum OrderStatus {
  PENDING,       // 0
  MATCHED,       // 1
  COMPLETED,     // 2
  CANCELLED      // 3
}
```

---

## Data Structures

### RawMaterial
```solidity
struct RawMaterial {
  string name;
  MaterialCategory category;
  address supplier;
  euint32 encryptedQuantity;      // FHE encrypted
  euint64 encryptedPricePerUnit;  // FHE encrypted
  euint32 encryptedMinOrder;      // FHE encrypted
  bool isActive;
  uint256 createdAt;
  string qualityGrade;
  uint256 deliveryTimeframe;
}
```

### Order
```solidity
struct Order {
  address buyer;
  uint256 materialId;
  euint32 encryptedQuantity;      // FHE encrypted
  euint64 encryptedMaxPrice;      // FHE encrypted
  OrderStatus status;
  uint256 createdAt;
  uint256 matchedAt;
  address matchedSupplier;
  euint64 encryptedFinalPrice;    // FHE encrypted
  string deliveryLocation;
  bytes32 encryptedSpecialRequirements;
}
```

### TradeMatch
```solidity
struct TradeMatch {
  uint256 orderId;
  uint256 materialId;
  address buyer;
  address supplier;
  euint32 encryptedQuantity;      // FHE encrypted
  euint64 encryptedPrice;         // FHE encrypted
  uint256 timestamp;
  bool isConfirmed;
}
```

---

## Events

### MaterialListed(indexed uint256 materialId, indexed address supplier, MaterialCategory category)
Emitted when supplier lists a new material

### OrderPlaced(indexed uint256 orderId, indexed address buyer, indexed uint256 materialId)
Emitted when buyer places an order

### TradeMatched(indexed uint256 orderId, indexed uint256 materialId, indexed address buyer, address supplier)
Emitted when supplier matches with an order

### TradeCompleted(indexed uint256 orderId, indexed uint256 materialId)
Emitted when trade is confirmed and completed

### SupplierVerified(indexed address supplier)
Emitted when address is verified as supplier

### BuyerVerified(indexed address buyer)
Emitted when address is verified as buyer

---

## Integration Examples

### Using ethers.js

```typescript
import { ethers } from "ethers";

// Connect to contract
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const contract = new ethers.Contract(
  contractAddress,
  contractABI,
  signer
);

// List material
const tx = await contract.listMaterial(
  "Steel",
  0,
  1000,
  ethers.BigNumber.from("5000000"),
  100,
  "A1",
  14
);

const receipt = await tx.wait();
console.log("Material listed:", receipt.transactionHash);
```

### Event Monitoring

```typescript
// Listen for orders on specific material
contract.on("OrderPlaced", (orderId, buyer, materialId, event) => {
  if (materialId == 1) {
    console.log(`New order from ${buyer}:`, orderId);
  }
});

// Cleanup
contract.removeAllListeners("OrderPlaced");
```

---

## Gas Optimization

| Operation | Baseline | Notes |
|-----------|----------|-------|
| List Material | 85,000 | Includes encryption overhead |
| Place Order | 95,000 | Includes encryption overhead |
| Match Trade | 125,000 | Includes FHE arithmetic |
| Confirm Trade | 45,000 | State transition only |
| Cancel Order | 25,000 | Simple state change |
| Deactivate Material | 25,000 | Simple state change |

---

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Not authorized" | Caller is not owner | Use owner account |
| "Not verified supplier" | Caller not verified | Request verification |
| "Not verified buyer" | Caller not verified | Request verification |
| "Invalid quantity" | Zero quantity | Provide positive quantity |
| "Invalid price" | Zero price | Provide positive price |
| "Invalid minimum order" | Zero min order | Provide positive minimum |
| "Material not available" | Material inactive | Choose active material |
| "Order not pending" | Order already matched/completed | Use pending order |
| "Not material supplier" | Caller not supplier | Use supplier account |
| "Not order owner" | Caller not buyer | Use buyer account |
| "Cannot cancel" | Order already matched | Can only cancel pending |
| "Not material owner" | Caller not supplier | Use supplier account |

---

**Chapter**: access-control
**Last Updated**: December 2025
