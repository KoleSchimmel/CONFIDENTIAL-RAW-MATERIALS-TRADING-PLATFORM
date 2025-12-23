# FHEVM Fundamentals

**Understanding the Core Concepts Behind Fully Homomorphic Encryption**

## What is Fully Homomorphic Encryption?

Fully Homomorphic Encryption (FHE) is a cryptographic technique that allows computation on encrypted data without decryption. This revolutionary capability enables:

- **Privacy Preservation**: Data never exposed during processing
- **Untrusted Servers**: Compute on data while keeping it secret from the server
- **Smart Contracts**: Operations on encrypted blockchain data

## Traditional vs. Homomorphic Encryption

### Traditional Encryption

```
Plaintext → [Encrypt] → Ciphertext → [Store/Transmit]
              (locked)

To process: Ciphertext → [Decrypt] → Plaintext → [Process] → Result
```

**Problem**: Must decrypt to process, exposing sensitive data.

### Homomorphic Encryption

```
Plaintext → [Encrypt] → Ciphertext
                           ↓
                    [Compute on Ciphertext]
                           ↓
                    Encrypted Result → [Decrypt] → Result
```

**Benefit**: Never decrypt, maintain privacy throughout computation!

## Mathematical Foundation

### Basic Concept

FHE allows the following operations:

```
For encrypted values E(m₁) and E(m₂):

Addition:    E(m₁ + m₂) = E(m₁) ⊕ E(m₂)
Subtraction: E(m₁ - m₂) = E(m₁) ⊖ E(m₂)
Multiplication: E(m₁ × m₂) = E(m₁) ⊗ E(m₂)
Comparison:  E(m₁ > m₂) = E(m₁) ⊳ E(m₂)

The operations maintain encryption - result is also encrypted!
```

### Security Properties

FHE encryption is semantically secure:

1. **IND-CPA Security**: Same plaintext produces different ciphertexts
2. **Non-deterministic**: Cannot guess relationship between ciphertexts
3. **Quantum-Resistant**: Based on lattice cryptography

## FHEVM Architecture

### How FHEVM Works in Blockchain

```
┌─────────────────────────────────────────┐
│         Ethereum Chain                  │
├─────────────────────────────────────────┤
│                                         │
│  Smart Contract (EVM)                   │
│  ┌──────────────────────────────────┐  │
│  │ euint32 balance;                 │  │
│  │ FHE.add(a, b) → encrypted result │  │
│  │ FHE.gt(a, b) → ebool condition   │  │
│  └──────────────────────────────────┘  │
│           ↓                             │
│  ┌──────────────────────────────────┐  │
│  │ Threshold Encryption Library     │  │
│  │ (FHEVM Gateway Compatible)       │  │
│  └──────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
         ↓                    ↓
    ┌─────────────┐    ┌─────────────┐
    │   User      │    │  FHEVM      │
    │ Client-side │    │  Gateway    │
    │  fhevmjs    │    │ (Decrypt)   │
    └─────────────┘    └─────────────┘
```

### Key Components

1. **Smart Contract Layer**
   - Solidity code using FHE operations
   - Performs computation on encrypted values
   - Manages encrypted state

2. **Encryption Library (fhevmjs)**
   - Client-side encryption before transmission
   - Creates input proofs
   - Encrypts user secrets

3. **FHEVM Gateway**
   - Decrypts results when needed
   - Never stores private keys
   - Operates off-chain

## Encrypted Types

### Type System

FHEVM provides encrypted versions of common types:

| Type | Range | Gas Cost | Use Case |
|------|-------|----------|----------|
| **euint8** | 0-255 | ~3,000 | Small values (flags, counters) |
| **euint32** | 0-4.3B | ~5,000 | Standard integers (quantities, ages) |
| **euint64** | 0-18.4Q | ~7,000 | Large values (balances, prices) |
| **ebool** | true/false | ~3,000 | Conditions, comparisons |

### Type Conversions

```solidity
// Create encrypted values
euint32 a = FHE.asEuint32(plainValue);
euint64 b = FHE.asEuint64(plainValue);
ebool flag = FHE.asEbool(true);

// Convert between types
euint64 extended = FHE.asEuint64(a);  // euint32 → euint64
```

## FHE Operations

### Arithmetic Operations

#### Addition

```solidity
// Encrypted + Encrypted = Encrypted
euint32 sum = FHE.add(a, b);

// Result stays encrypted
FHE.allowThis(sum);
storedValue = sum;
```

**Properties:**
- Commutative: `add(a, b) = add(b, a)`
- Associative: `add(add(a, b), c) = add(a, add(b, c))`
- Overflow wraps around (modular arithmetic)

#### Subtraction

```solidity
euint32 difference = FHE.sub(a, b);
```

**Note**: Can underflow! Always validate before subtraction:

```solidity
ebool sufficient = FHE.gte(a, b);
FHE.req(sufficient);  // Require encrypted condition
euint32 difference = FHE.sub(a, b);
```

#### Multiplication

```solidity
// Requires upcasting for large results
euint64 product = FHE.mul(
    FHE.asEuint64(a),
    FHE.asEuint64(b)
);
```

**Cost**: Much more expensive than addition/subtraction (~25,000 gas for euint32)

### Comparison Operations

#### Equality

```solidity
ebool isEqual = FHE.eq(a, b);    // Equal
ebool notEqual = FHE.ne(a, b);   // Not equal
```

#### Ordering

```solidity
ebool isGreater = FHE.gt(a, b);  // Greater than
ebool isGreaterOrEqual = FHE.gte(a, b);
ebool isLess = FHE.lt(a, b);     // Less than
ebool isLessOrEqual = FHE.lte(a, b);
```

**Result**: `ebool` (encrypted boolean)

### Using Encrypted Conditions

```solidity
// Require encrypted boolean condition
FHE.req(FHE.gt(balance, amount));

// Code only executes if condition is true
// Transaction reverts if condition is false
```

**How it works:**
1. Contract passes encrypted boolean to FHE system
2. System decrypts ONLY to check true/false
3. No plaintext values revealed
4. Result either executes or reverts

## Access Control System

### Permission Model

FHEVM uses a permission-based access control:

```
encrypted value → contract permission → user permission
                  (FHE.allowThis)      (FHE.allow)
```

### Contract Permission (FHE.allowThis)

Allows the contract to read and use encrypted values:

```solidity
euint32 secret = FHE.asEuint32(userInput, proof);

// Grant contract permission
FHE.allowThis(secret);

// Now contract can:
euint32 doubled = FHE.add(secret, secret);
euint64 product = FHE.mul(secret, secret);
```

**Without permission**: Operations fail, contract cannot read value.

### User Permission (FHE.allow)

Allows specific user to decrypt value:

```solidity
// User can decrypt
FHE.allow(secret, msg.sender);

// User can later retrieve and decrypt value
function getMySecret() external view returns (euint32) {
    return mySecrets[msg.sender];  // User can decrypt this
}
```

**Without permission**: User cannot decrypt, sees only ciphertext.

### Permission Examples

#### Example 1: User's Private Data

```solidity
function storeMySecret(inEuint32 calldata secret, bytes calldata proof) external {
    euint32 encrypted = FHE.asEuint32(secret, proof);

    // Grant both permissions
    FHE.allowThis(encrypted);        // Contract can compute
    FHE.allow(encrypted, msg.sender); // User can decrypt

    mySecrets[msg.sender] = encrypted;
}
```

#### Example 2: Public Processing, Private Result

```solidity
function computeWithPrivacy(
    inEuint32 calldata a,
    inEuint32 calldata b,
    bytes calldata proof
) external {
    euint32 va = FHE.asEuint32(a, proof);
    euint32 vb = FHE.asEuint32(b, proof);

    // Intermediate computation - no user access
    euint32 sum = FHE.add(va, vb);
    FHE.allowThis(sum);  // Only contract can use

    // Final result - user gets access
    euint32 result = FHE.mul(sum, FHE.asEuint32(2));
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);  // User can decrypt

    results[msg.sender] = result;
}
```

## Input Proofs

### Why Proofs Matter

Users submit encrypted data to the contract:

```
User: "Here's my secret, encrypted"
```

**Problem**: How does contract know user encrypted it correctly?

**Solution**: Proofs!

### How Proofs Work

```solidity
function storeSecret(
    inEuint32 calldata encryptedValue,  // User's encrypted input
    bytes calldata proof                // Zero-knowledge proof
) external {
    // Proof verifies:
    // 1. encryptedValue is properly encrypted
    // 2. User has provided valid ciphertext
    // 3. No tampering occurred in transmission

    euint32 value = FHE.asEuint32(encryptedValue, proof);
    // Safe to use - encryption verified!
}
```

### Proof Properties

- **Zero-Knowledge**: Doesn't reveal plaintext
- **Non-Interactive**: Generated client-side, verified by contract
- **Deterministic**: Same input always produces same encryption+proof

### Creating Proofs (Client-side)

Using fhevmjs:

```typescript
import { FhevmInstance } from "fhevmjs";

const fhevmInstance = await FhevmInstance.create();

// Create encrypted input
const encryptedInput = fhevmInstance.createEncryptedInput(
    contractAddress,
    userAddress
);

// Add values to encrypt
encryptedInput.add32(secretValue);

// Create proof
const { handles, inputProof } = await encryptedInput.encrypt();

// Send to contract
await contract.storeSecret(handles[0], inputProof);
```

## Decryption Model

### When Decryption Happens

FHE values stay encrypted on-chain, but users can decrypt:

```
User wants result:
  1. Call view function → returns euint64 (encrypted)
  2. User decrypts locally using private key
  3. Gets plaintext result
```

### Decryption via Gateway

For complex scenarios:

```
User calls:  getBalance() → encrypted euint64
     ↓
Contract returns encrypted value
     ↓
User sends to FHEVM Gateway
     ↓
Gateway: "I have permission, decrypting..."
     ↓
User receives: plaintext result
```

### Client-side Decryption

```typescript
// After getting encrypted value from contract
const encryptedBalance = await contract.getBalance();

// Decrypt using private key
const plainBalance = await fhevmInstance.decrypt(encryptedBalance);

console.log("Your balance:", plainBalance);
```

## Privacy Properties

### What's Private

✅ Encrypted values on-chain
✅ Computation results (until decrypted)
✅ Data in storage
✅ Intermediate computations

### What's Not Private

❌ Transaction sender (public address)
❌ Function called (gas patterns may leak)
❌ Encrypted data size (ciphertext size visible)
❌ Access patterns (when decrypt is called)

## Performance Considerations

### Gas Costs

| Operation | Type | Gas |
|-----------|------|-----|
| Add | euint32 | ~5,000 |
| Sub | euint32 | ~5,000 |
| Mul | euint32 | ~25,000 |
| Eq | euint32 | ~8,000 |
| Gt | euint32 | ~12,000 |
| FHE.req | N/A | ~3,000 |

### Optimization Tips

1. **Minimize multiplications** - Most expensive operation
2. **Chain operations** - Compute multiple times faster than separately
3. **Choose appropriate types** - euint8 cheaper than euint64
4. **Batch operations** - Process multiple values in one transaction

## Security Assumptions

### Threat Model

FHEVM protects against:
- **Eavesdroppers**: Cannot read encrypted data
- **Passive Servers**: Cannot learn from data they store
- **Smart Contract Vulnerabilities**: Encryption still helps

FHEVM does NOT protect against:
- **Malicious Contracts**: Code controls computation
- **Transaction Analysis**: Amount of data visible
- **Side Channels**: Timing/access patterns may leak info

### Best Practices

1. **Always use proofs** for user input
2. **Grant permissions carefully** - think about who needs access
3. **Validate encrypted conditions** with FHE.req
4. **Test thoroughly** - encrypted code is harder to debug
5. **Document assumptions** - explain your privacy model

## Real-World Impact

### Use Cases Enabled by FHE

1. **Financial Services**
   - Private lending and borrowing
   - Encrypted trading platforms
   - Confidential auctions

2. **Healthcare**
   - Private patient data management
   - Encrypted medical records
   - Confidential diagnosis sharing

3. **Supply Chain**
   - Private inventory tracking
   - Encrypted price negotiation
   - Confidential shipment monitoring

4. **Governance**
   - Anonymous voting
   - Encrypted elections
   - Confidential decision-making

## Limitations & Future Directions

### Current Limitations

- Computation on encrypted data is slower than plaintext
- Larger ciphertext sizes than plaintext
- Limited to certain operations (no arbitrary loops)
- Decryption still centralized in FHEVM Gateway

### Future Improvements

- Faster encryption schemes
- More efficient operations
- Decentralized threshold decryption
- Better developer tooling
- Integration with ZK proofs

## Glossary

| Term | Definition |
|------|-----------|
| **euint** | Encrypted unsigned integer |
| **ebool** | Encrypted boolean |
| **Ciphertext** | Encrypted data |
| **Plaintext** | Unencrypted data |
| **Semantic Security** | Same plaintext produces different ciphertexts |
| **IND-CPA** | Indistinguishability under Chosen Plaintext Attack (security property) |
| **FHE.req()** | Require encrypted boolean condition |
| **Input Proof** | Zero-knowledge proof of valid encryption |
| **Threshold Encryption** | Secret shared among multiple parties |

## Next Steps

### Ready to Code?

1. **Start Simple**: [FHE Counter Example](basic/fhe-counter.md)
2. **Learn Patterns**: [Encryption Patterns](basic/encryption.md)
3. **Master Operations**: [FHE Operations](operations/overview.md)

### Dive Deeper

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Research Papers](https://zama.ai/research)
- [Academic Resources](https://scholar.google.com/scholar?q=fully+homomorphic+encryption)

---

**Understanding these fundamentals is key to building secure, privacy-preserving smart contracts with FHEVM!**
