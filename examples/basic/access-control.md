# Access Control Patterns

**Master Permission Management in FHEVM**

## Overview

Access control in FHEVM determines who can read (decrypt) encrypted values and which operations the contract can perform on them. This guide covers:

- Basic permission grant patterns
- User-specific access
- Temporary computation windows
- Secret sharing patterns
- Permission revocation

## Fundamental Concepts

### Two Types of Permissions

```solidity
// Contract-level: Allows contract to read this encrypted value
FHE.allowThis(encryptedValue);

// User-level: Allows specific address to decrypt
FHE.allow(encryptedValue, userAddress);
```

Without permissions, encrypted values cannot be used or decrypted.

## Pattern 1: Basic Access Grant

### Single User Access

```solidity
function storeSecret(inEuint32 calldata secret, bytes calldata proof) external {
    euint32 encrypted = FHE.asEuint32(secret, proof);

    // Grant contract access
    FHE.allowThis(encrypted);

    // Grant user access
    FHE.allow(encrypted, msg.sender);

    userSecrets[msg.sender] = encrypted;
}
```

**Access Matrix:**
- Contract: Can compute on encrypted value ✓
- User: Can decrypt encrypted value ✓
- Others: Cannot access ✗

### Multi-User Sharing

```solidity
function shareSecret(address recipient, euint32 secret) external onlyOwner {
    // Allow multiple users to decrypt
    FHE.allowThis(secret);
    FHE.allow(secret, msg.sender);      // Original owner
    FHE.allow(secret, recipient);        // Recipient
}
```

## Pattern 2: Temporary Computation

### Ephemeral Values

Create temporary encrypted values for intermediate computation without granting user access.

```solidity
function computePrivately(
    inEuint32 calldata value1,
    inEuint32 calldata value2,
    bytes calldata proof
) external {
    euint32 v1 = FHE.asEuint32(value1, proof);
    euint32 v2 = FHE.asEuint32(value2, proof);

    // Temporary computation - no user access
    euint32 intermediate = FHE.add(v1, v2);
    FHE.allowThis(intermediate);  // Contract can use
    // NO FHE.allow() - user cannot decrypt intermediate

    // Continue computation
    euint32 result = FHE.mul(intermediate, FHE.asEuint32(2));
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);  // User gets final result

    results[msg.sender] = result;
}
```

**Benefits:**
- User doesn't see intermediate values
- Only final result is decryptable
- Provides computation privacy

## Pattern 3: Conditional Permission Grant

### Grant Access After Verification

```solidity
function grantAccessAfterVerification(
    address user,
    bytes32 passwordHash,
    bytes32 providedPasswordHash
) external onlyOwner {
    require(providedPasswordHash == passwordHash, "Wrong password");

    // Only grant after verification
    euint32 secret = secretData[user];
    FHE.allow(secret, user);
}
```

## Pattern 4: Role-Based Access

```solidity
contract RoleBasedAccess is SepoliaZamaFHEVMConfig {
    enum Role { None, Viewer, Editor, Owner }

    mapping(address => Role) public roles;
    mapping(address => euint32) private secrets;

    modifier hasRole(Role requiredRole) {
        require(roles[msg.sender] >= requiredRole, "Insufficient role");
        _;
    }

    function viewSecret() external hasRole(Role.Viewer) view returns (euint32) {
        return secrets[msg.sender];
    }

    function setSecret(inEuint32 calldata newSecret, bytes calldata proof) external hasRole(Role.Editor) {
        euint32 encrypted = FHE.asEuint32(newSecret, proof);

        FHE.allowThis(encrypted);
        FHE.allow(encrypted, msg.sender);

        secrets[msg.sender] = encrypted;
    }

    function grantRole(address user, Role newRole) external hasRole(Role.Owner) {
        roles[user] = newRole;
    }
}
```

## Pattern 5: Threshold-Based Secrets

### Multi-Party Authorization

```solidity
contract MultiPartySecret is SepoliaZamaFHEVMConfig {
    address[3] public guardians;
    uint256 public revealThreshold = 2;
    mapping(address => bool) public approved;
    euint32 private secret;
    bool public revealed;

    function approveReveal() external {
        require(isGuardian(msg.sender), "Not guardian");
        require(!approved[msg.sender], "Already approved");

        approved[msg.sender] = true;

        // Check if threshold reached
        uint256 approvalCount = 0;
        for (uint i = 0; i < guardians.length; i++) {
            if (approved[guardians[i]]) approvalCount++;
        }

        if (approvalCount >= revealThreshold) {
            // Grant access to all guardians
            for (uint i = 0; i < guardians.length; i++) {
                FHE.allow(secret, guardians[i]);
            }
            revealed = true;
        }
    }

    function isGuardian(address user) private view returns (bool) {
        for (uint i = 0; i < guardians.length; i++) {
            if (guardians[i] == user) return true;
        }
        return false;
    }
}
```

## Implementation Example

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

contract AccessControlExample is SepoliaZamaFHEVMConfig {
    mapping(address => euint32) private balances;
    mapping(address => address[]) private allowedUsers;

    event BalanceUpdated(address indexed user);
    event AccessGranted(address indexed owner, address indexed grantee);

    function setBalance(inEuint32 calldata amount, bytes calldata proof) external {
        euint32 encrypted = FHE.asEuint32(amount, proof);

        FHE.allowThis(encrypted);
        FHE.allow(encrypted, msg.sender);

        balances[msg.sender] = encrypted;
        emit BalanceUpdated(msg.sender);
    }

    function getMyBalance() external view returns (euint32) {
        return balances[msg.sender];
    }

    function grantAccess(address grantee) external {
        euint32 balance = balances[msg.sender];
        FHE.allow(balance, grantee);
        allowedUsers[msg.sender].push(grantee);

        emit AccessGranted(msg.sender, grantee);
    }

    function revokeAccess(address revokee) external {
        // Note: Current FHE implementation doesn't have revoke
        // This pattern shows intended behavior
        // Workaround: Re-create encrypted value without permission
    }

    function getAllowedUsers(address owner) external view returns (address[] memory) {
        return allowedUsers[owner];
    }
}
```

## Common Mistakes

### ❌ Missing FHE.allowThis()

```solidity
// WRONG - Contract cannot use this value
function badStore(inEuint32 calldata value, bytes calldata proof) external {
    euint32 encrypted = FHE.asEuint32(value, proof);
    data[msg.sender] = encrypted;  // No FHE.allowThis()
}
```

### ✅ Always Grant Contract Access

```solidity
// CORRECT
function goodStore(inEuint32 calldata value, bytes calldata proof) external {
    euint32 encrypted = FHE.asEuint32(value, proof);
    FHE.allowThis(encrypted);      // Contract permission
    FHE.allow(encrypted, msg.sender);  // User permission
    data[msg.sender] = encrypted;
}
```

### ❌ Forgetting User Permission

```solidity
// WRONG - User cannot decrypt result
function badCompute(inEuint32 calldata a, inEuint32 calldata b, bytes calldata proof) external {
    euint32 va = FHE.asEuint32(a, proof);
    euint32 vb = FHE.asEuint32(b, proof);

    euint32 result = FHE.add(va, vb);
    FHE.allowThis(result);  // Only contract can use
    results[msg.sender] = result;  // User cannot decrypt!
}
```

### ✅ Grant User Permission for Results

```solidity
// CORRECT
function goodCompute(inEuint32 calldata a, inEuint32 calldata b, bytes calldata proof) external {
    euint32 va = FHE.asEuint32(a, proof);
    euint32 vb = FHE.asEuint32(b, proof);

    euint32 result = FHE.add(va, vb);
    FHE.allowThis(result);
    FHE.allow(result, msg.sender);  // User can decrypt
    results[msg.sender] = result;
}
```

## Testing Access Control

```typescript
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Access Control", function () {
    let contract: any;
    let owner: any;
    let other: any;

    before(async function () {
        [owner, other] = await ethers.getSigners();
        const Factory = await ethers.getContractFactory("AccessControlExample");
        contract = await Factory.deploy();
    });

    it("Should grant user access", async function () {
        const tx = await contract.setBalance("0x00", "0x00");
        expect(tx).to.not.be.reverted;
    });

    it("Should allow access grant", async function () {
        await contract.setBalance("0x00", "0x00");
        const tx = await contract.grantAccess(other.address);
        expect(tx).to.not.be.reverted;
    });

    it("Should return allowed users", async function () {
        const users = await contract.getAllowedUsers(owner.address);
        expect(users).to.include(other.address);
    });
});
```

## Related Patterns

- [Encryption Patterns](encryption.md) - Creating encrypted values
- [FHE Counter](fhe-counter.md) - Simple permission example
- [Blind Auction](../advanced/blind-auction.md) - Complex access patterns

## References

- [FHEVM Access Control Docs](https://docs.zama.ai/fhevm/concepts/access-control)
- [FHE Permissions Guide](https://docs.zama.ai/fhevm/concepts/fhe-allow)
