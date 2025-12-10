# Architecture Overview - Confidential Raw Materials Trading

## System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Web Application                 │
│  (Materials Browse, Order Placement, Settlement Confirmation)│
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ ethers.js / Web3Provider
                     │
┌────────────────────▼────────────────────────────────────────┐
│                 Wallet Integration Layer                      │
│          (MetaMask, Ledger, Web3 Wallet Support)             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Transaction Signing
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Smart Contract Interface Layer                   │
│   (Contract ABI, Events, Function Calls, Gas Estimation)     │
└────────────────────┬────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      │              │              │
┌─────▼─────┐  ┌────▼───┐  ┌──────▼──────┐
│ Sepolia   │  │ Block  │  │ Event       │
│ RPC       │  │ Chain  │  │ Listeners   │
│ Endpoint  │  │ Index  │  │             │
└─────┬─────┘  └────┬───┘  └──────┬──────┘
      │             │             │
      └──────────────┼─────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│      ConfidentialRawMaterialsTrading Smart Contract          │
│                   (on Sepolia Testnet)                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow: Material Listing

```
Supplier (has plaintext: 1000 units @ $995)
    │
    ├─ Input: {name, category, quantity, price, minOrder, grade, delivery}
    │
    ├─ Encryption Phase (FHE):
    │  ├─ quantity: 1000 → euint32(1000)
    │  ├─ price: 995 → euint64(995)
    │  └─ minOrder: 100 → euint32(100)
    │
    ├─ Permission Phase:
    │  ├─ FHE.allowThis(encryptedQuantity)
    │  ├─ FHE.allow(encryptedQuantity, supplierAddress)
    │  └─ [Repeat for price and minOrder]
    │
    ├─ Storage Phase:
    │  └─ materials[nextMaterialId] = RawMaterial{...}
    │
    └─ Event: MaterialListed(materialId, supplier, category)
             │
             └─ Broadcast to Blockchain Network
                  │
                  ├─ Observers see: materialId, supplier, category
                  ├─ Competitors see: ENCRYPTED quantity & prices
                  └─ Contract sees: euint32 and euint64 handles
```

### Data Flow: Order Matching

```
Buyer Place Order
    │
    ├─ Input: {materialId, quantity, maxPrice, location, requirements}
    │
    ├─ Encryption Phase:
    │  ├─ quantity: 500 → euint32(500)
    │  └─ maxPrice: 1000 → euint64(1000)
    │
    ├─ Store Order:
    │  └─ orders[nextOrderId] = Order{...encrypted...}
    │
    └─ Event: OrderPlaced(orderId, buyer, materialId)


Supplier Match Trade
    │
    ├─ Retrieve Material: material[orderInfo.materialId]
    │  └─ Has: encryptedQuantity, encryptedPrice
    │
    ├─ Retrieve Order: orders[orderId]
    │  └─ Has: encryptedQuantity, encryptedMaxPrice
    │
    ├─ FHE Operations:
    │  ├─ Encrypted Subtraction:
    │  │  remaining = FHE.sub(
    │  │    material.encryptedQuantity,    // 1000
    │  │    order.encryptedQuantity        // 500
    │  │  ) → euint32(500) [encrypted!]
    │  │
    │  └─ [Contract operates on encrypted values]
    │     [Neither quantity is revealed to operator]
    │
    ├─ Grant Decryption Access:
    │  ├─ FHE.allow(finalPrice, buyerAddress)
    │  └─ FHE.allow(finalPrice, supplierAddress)
    │
    ├─ Create TradeMatch Record:
    │  └─ matches[orderId] = TradeMatch{...}
    │
    └─ Event: TradeMatched(orderId, materialId, buyer, supplier)
             │
             └─ Both parties can now request decryption
                 of negotiated terms from fhevmInstance
```

## Contract State Structure

### Mappings and Storage

```solidity
// Material Catalog
mapping(uint256 => RawMaterial) materials
├─ Key: materialId (sequential from 1)
├─ Value: Struct containing
│  ├─ name: string (public)
│  ├─ category: enum (public)
│  ├─ supplier: address (public)
│  ├─ encryptedQuantity: euint32 (private)
│  ├─ encryptedPricePerUnit: euint64 (private)
│  ├─ encryptedMinOrder: euint32 (private)
│  ├─ isActive: bool (public)
│  ├─ createdAt: uint256 (public)
│  ├─ qualityGrade: string (public)
│  └─ deliveryTimeframe: uint256 (public)

// Order Ledger
mapping(uint256 => Order) orders
├─ Key: orderId (sequential from 1)
├─ Value: Struct containing
│  ├─ buyer: address (public)
│  ├─ materialId: uint256 (public)
│  ├─ encryptedQuantity: euint32 (private)
│  ├─ encryptedMaxPrice: euint64 (private)
│  ├─ status: enum {PENDING, MATCHED, COMPLETED, CANCELLED}
│  ├─ createdAt: uint256 (public)
│  ├─ matchedAt: uint256 (public)
│  ├─ matchedSupplier: address (public)
│  ├─ encryptedFinalPrice: euint64 (private)
│  ├─ deliveryLocation: string (public)
│  └─ encryptedSpecialRequirements: bytes32 (private)

// Trade Records
mapping(uint256 => TradeMatch) matches
├─ Key: orderId (links to Orders)
├─ Value: Struct containing
│  ├─ orderId: uint256
│  ├─ materialId: uint256
│  ├─ buyer: address
│  ├─ supplier: address
│  ├─ encryptedQuantity: euint32 (private)
│  ├─ encryptedPrice: euint64 (private)
│  ├─ timestamp: uint256
│  └─ isConfirmed: bool

// Indexes for Efficient Querying
mapping(address => uint256[]) supplierMaterials
├─ Tracks all materials listed by supplier
└─ Used by supplier dashboard

mapping(address => uint256[]) buyerOrders
├─ Tracks all orders placed by buyer
└─ Used by buyer order history

// Access Control Registries
mapping(address => bool) verifiedSuppliers
├─ Whitelist for material listing
└─ Only verified addresses can call listMaterial()

mapping(address => bool) verifiedBuyers
├─ Whitelist for order placement
└─ Only verified addresses can call placeOrder()
```

## Permission Model (FHE.allow Architecture)

### Permission Grants Per Operation

#### Material Listing
```
Supplier: Alice lists 1000 units @ $995

Encrypted Values Created:
├─ encryptedQuantity (1000)
├─ encryptedPricePerUnit (995)
└─ encryptedMinOrder (100)

Permission Grants:
├─ FHE.allowThis(encryptedQuantity)
│  └─ Contract can operate in future transactions
├─ FHE.allow(encryptedQuantity, alice_address)
│  └─ Alice can decrypt her own listing
├─ FHE.allowThis(encryptedPricePerUnit)
│  └─ Contract can use in matching
├─ FHE.allow(encryptedPricePerUnit, alice_address)
│  └─ Alice can see negotiated price
└─ [Similar for encryptedMinOrder]

Result:
├─ Alice: Can decrypt quantities and prices
├─ Contract: Can operate on encrypted values
├─ Bob (competitor): Sees only encrypted handles
└─ Blockchain: Records immutable transaction
```

#### Order Placement
```
Buyer: Bob wants to buy 500 units for max $1000

Permission Grants:
├─ FHE.allowThis(encryptedQuantity)
│  └─ Contract can operate on order
├─ FHE.allow(encryptedQuantity, bob_address)
│  └─ Bob can decrypt his order quantity
├─ FHE.allowThis(encryptedMaxPrice)
│  └─ Contract can perform matching
└─ FHE.allow(encryptedMaxPrice, bob_address)
   └─ Bob can decrypt his price limit

Result:
├─ Bob: Privacy of his budget is maintained
├─ Suppliers: See only that order is pending
├─ Contract: Can match without revealing terms
└─ Blockchain: Public order record exists
```

#### Trade Matching
```
Supplier Alice matches with Buyer Bob

Encrypted Operations:
├─ remainingQuantity = FHE.sub(
│   material.encryptedQuantity,    // 1000 (Alice's encrypted)
│   order.encryptedQuantity         // 500 (Bob's encrypted)
│  ) → euint32(500) encrypted

Additional Permissions:
├─ FHE.allow(finalPrice, bob_address)
│  └─ Bob learns negotiated price after match
├─ FHE.allow(finalPrice, alice_address)
│  └─ Alice learns matched quantity
└─ FHE.allowThis(remainingQuantity)
   └─ Contract can use remainder in future

Result:
├─ Contract: Performed arithmetic without plaintext
├─ Both parties: Can decrypt matched terms
├─ Observers: See only "trade matched" event
└─ Competitors: Learn nothing about terms
```

## Event System

### Emitted Events for Monitoring

```solidity
// Material Management Events
MaterialListed(
  indexed uint256 materialId,
  indexed address supplier,
  MaterialCategory category
)
// Public: Anyone can see material added
// Hidden: Quantities and prices (encrypted)

// Order Management Events
OrderPlaced(
  indexed uint256 orderId,
  indexed address buyer,
  indexed uint256 materialId
)
// Public: Someone placed an order
// Hidden: Quantity and price preferences

// Trading Events
TradeMatched(
  indexed uint256 orderId,
  indexed uint256 materialId,
  indexed address buyer,
  address supplier
)
// Public: Trade matched between buyer and supplier
// Hidden: Matched terms (encrypted)

TradeCompleted(
  indexed uint256 orderId,
  indexed uint256 materialId
)
// Public: Trade settled and closed
// Hidden: Final settlement amount

// Access Control Events
SupplierVerified(indexed address supplier)
BuyerVerified(indexed address buyer)
// Public: Address verified to participate
```

### Event Indexing Strategy

```
Supplier Dashboard:
├─ Listen to: MaterialListed(_, supplier, _)
├─ Retrieve: Material details via materialId
└─ Show: Supplier's active listings

Buyer Dashboard:
├─ Listen to: OrderPlaced(_, buyer, _)
├─ Retrieve: Order details via orderId
└─ Show: Buyer's order history

Market Monitor:
├─ Listen to: All MaterialListed events
├─ Count: Active materials by category
└─ Show: Market activity (no price info)

Trade Monitor:
├─ Listen to: TradeMatched events
├─ Aggregate: Completed trades (no terms)
└─ Show: Transaction volume
```

## Security Architecture

### Access Control Layers

```
Layer 1: Wallet / EOA (External Owned Account)
├─ User must own private key
├─ Transaction must be signed
└─ Prevents unauthorized actions

Layer 2: Address Verification
├─ require(verifiedSuppliers[msg.sender])
├─ require(verifiedBuyers[msg.sender])
└─ Only whitelisted addresses can participate

Layer 3: Owner-Only Functions
├─ modifier onlyOwner() {require(msg.sender == owner)}
├─ Prevents unauthorized system administration
└─ Used for: verifySupplier(), verifyBuyer()

Layer 4: Encrypted Data Privacy
├─ FHE.allow() grants cryptographic access
├─ euint32/euint64 cannot be cast to plaintext
├─ Contract operations on encrypted values
└─ Prevents information leakage in logs
```

### Threat Prevention

```
Threat: Plaintext Leakage
├─ Risk: Sensitive values visible on blockchain
├─ Mitigation: All values encrypted before storage
│  └─ euint32 quantity cannot be downcast
│  └─ euint64 price encrypted with FHE
└─ Result: Competitors see only encrypted handles

Threat: Unauthorized Decryption
├─ Risk: Non-authorized party decrypts values
├─ Mitigation: FHE.allow() grants limited to parties
│  └─ Only supplier can decrypt own listing
│  └─ Buyer gets key only after match
└─ Result: No one learns terms without authorization

Threat: Replay Attacks
├─ Risk: Old transactions re-executed
├─ Mitigation: Order state transitions prevent
│  └─ PENDING → MATCHED → COMPLETED
│  └─ Cannot re-match completed order
└─ Result: Each trade settles exactly once

Threat: Front-Running
├─ Risk: Operator sees plaintext and acts
├─ Mitigation: All sensitive data encrypted
│  └─ No plaintext visible to block producers
│  └─ Matching happens with encrypted values
└─ Result: Block producers cannot extract value

Threat: Reentrancy
├─ Risk: Recursive calls during state change
├─ Mitigation: No external calls in state updates
│  └─ Order state updated before any call
│  └─ View functions never modify state
└─ Result: Cannot be exploited
```

## Gas Optimization

### Per-Operation Gas Breakdown

```
MATERIAL LISTING: ~85,000 gas
├─ Encryption overhead: 12,000
│  └─ FHE.asEuint32(quantity)
│  └─ FHE.asEuint64(price)
│  └─ FHE.asEuint32(minOrder)
├─ Permission grants: 8,000
│  └─ FHE.allowThis() × 3
│  └─ FHE.allow() × 3
├─ Storage writes: 22,000
│  └─ materials[id] creation
│  └─ supplierMaterials array push
├─ Event emission: 2,000
│  └─ MaterialListed event
└─ Overhead: 41,000 (base + calldata)

ORDER PLACEMENT: ~95,000 gas
├─ Encryption overhead: 12,000
├─ Permission grants: 8,000
├─ Storage writes: 28,000 (order struct larger)
├─ Event emission: 2,000
└─ Overhead: 45,000

TRADE MATCHING: ~125,000 gas
├─ Encrypted arithmetic: 15,000
│  └─ FHE.sub() operation
├─ Permission grants: 18,000 (more granular)
├─ Storage updates: 42,000
│  └─ Material quantity update
│  └─ Order status change
│  └─ TradeMatch creation
├─ Event emission: 2,000
└─ Overhead: 48,000

TRADE CONFIRMATION: ~45,000 gas
├─ State transition: 5,000
├─ TradeMatch update: 5,000
├─ Event emission: 2,000
└─ Overhead: 33,000
```

### Optimization Strategies

```
Current Optimizations:
├─ Mapping instead of arrays for O(1) lookups
├─ Event indexing instead of iterating storage
├─ Minimal data duplication
└─ Efficient struct packing

Potential Future Optimizations:
├─ Batch operations for multiple materials
│  └─ Reduce per-operation overhead
├─ Off-chain order matching
│  └─ Only settle matched orders on-chain
├─ Layer 2 scaling
│  └─ Use Arbitrum or Optimism for cheaper operations
└─ Batch verification
   └─ Multi-user verification in single transaction
```

## Integration Points

### External Dependencies

```
@fhevm/solidity
├─ FHE.sol: Core operations
├─ ZamaConfig.sol: Network configuration
├─ FHE.allow(), FHE.allowThis()
├─ euint32, euint64, ebool types
└─ Handles encrypted computation

Ethereum Network
├─ Sepolia Testnet: Current deployment
├─ ERC-4337 compatible (future: account abstraction)
└─ Standard Solidity 0.8.24+ compatible

Web3 Providers
├─ ethers.js: Contract interaction
├─ MetaMask: Wallet integration
├─ Sepolia RPC: State queries
└─ Event listeners: Real-time updates
```

### Extension Points

```
External Price Feeds:
├─ Could integrate Chainlink oracles
├─ Encrypted comparison with market prices
└─ Prevent price manipulation

Multi-Chain Settlement:
├─ Cross-chain swaps
├─ Atomic settlement
└─ Maintain privacy across chains

Additional ERC Standards:
├─ ERC-721: Unique trade certificates
├─ ERC-1155: Batch operations
└─ ERC-4626: Yield on locked materials

Advanced Features:
├─ Blind auctions with encrypted bids
├─ Options and futures on encrypted quantities
├─ Derivatives with privacy preservation
└─ Insurance products on trades
```

---

## Conclusion

This architecture demonstrates that FHE-based privacy is not just theoretically sound—it's practically implementable for complex business logic. The design maintains separation between public and private data, uses FHE operations safely, and integrates seamlessly with existing blockchain infrastructure.
