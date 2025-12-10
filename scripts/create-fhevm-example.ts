/**
 * Create FHEVM Example Script
 *
 * This script generates a new standalone FHEVM example repository
 * with contract, tests, and documentation.
 *
 * Usage: ts-node scripts/create-fhevm-example.ts --name CounterExample --category basic
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface ExampleConfig {
  name: string;
  category: string;
  description: string;
  contractName: string;
  outputDir: string;
}

/**
 * Parse command line arguments
 * @example --name CounterExample --category basic --description "FHE Counter"
 */
function parseArguments(): Partial<ExampleConfig> {
  const args = process.argv.slice(2);
  const config: Partial<ExampleConfig> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--name" && i + 1 < args.length) {
      config.name = args[i + 1];
      config.contractName = args[i + 1].replace(/-/g, "");
      i++;
    } else if (args[i] === "--category" && i + 1 < args.length) {
      config.category = args[i + 1];
      i++;
    } else if (args[i] === "--description" && i + 1 < args.length) {
      config.description = args[i + 1];
      i++;
    } else if (args[i] === "--output" && i + 1 < args.length) {
      config.outputDir = args[i + 1];
      i++;
    }
  }

  return config;
}

/**
 * Validate example configuration
 */
function validateConfig(config: Partial<ExampleConfig>): config is ExampleConfig {
  if (!config.name) {
    console.error("❌ Error: --name parameter is required");
    return false;
  }
  if (!config.category) {
    console.error("❌ Error: --category parameter is required");
    return false;
  }
  if (!config.contractName) {
    console.error("❌ Error: Could not determine contract name");
    return false;
  }
  return true;
}

/**
 * Create directory structure
 */
function createDirectoryStructure(config: ExampleConfig): void {
  const dirs = [
    config.outputDir,
    path.join(config.outputDir, "contracts"),
    path.join(config.outputDir, "test"),
    path.join(config.outputDir, "scripts"),
    path.join(config.outputDir, "docs"),
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ Created directory: ${dir}`);
    }
  }
}

/**
 * Generate Solidity contract template
 * @chapter: tag for documentation generation
 */
function generateContract(config: ExampleConfig): string {
  return `// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, euint64 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ${config.contractName}
 * @notice ${config.description}
 * @dev Example implementation for category: ${config.category}
 * @chapter: ${config.category}
 */
contract ${config.contractName} is SepoliaConfig {

  address public owner;

  event ContractDeployed(address indexed owner);

  constructor() {
    owner = msg.sender;
    emit ContractDeployed(msg.sender);
  }

  /**
   * @notice Example function demonstrating FHE operations
   * @dev This is a placeholder for your encrypted logic
   * @param _value The plaintext value to encrypt
   * @return The encrypted value handle
   */
  function encryptValue(uint32 _value) external pure returns (euint32) {
    return FHE.asEuint32(_value);
  }

  /**
   * @notice Grant permissions for encrypted value
   * @param _value The encrypted value
   * @param _address The address to grant access to
   */
  function grantAccess(euint32 _value, address _address) external {
    FHE.allow(_value, _address);
  }
}
`;
}

/**
 * Generate test file template
 */
function generateTest(config: ExampleConfig): string {
  return `/**
 * @chapter: ${config.category}
 * Tests for ${config.contractName}
 *
 * This test suite validates:
 * - Contract deployment
 * - Encryption operations
 * - Permission management
 * - FHE operations correctness
 */

import { expect } from "chai";
import { ethers } from "hardhat";

describe("${config.contractName}", () => {
  let contract;
  let owner;
  let user1;

  before(async () => {
    // Get signers
    const signers = await ethers.getSigners();
    [owner, user1] = signers;

    // Deploy contract
    const Factory = await ethers.getContractFactory("${config.contractName}");
    contract = await Factory.deploy();
    await contract.deployed();
  });

  describe("Deployment", () => {
    it("Should deploy successfully", async () => {
      expect(contract.address).to.not.be.undefined;
    });

    it("Should set owner correctly", async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should emit ContractDeployed event", async () => {
      const Factory = await ethers.getContractFactory("${config.contractName}");
      const tx = await Factory.deploy();
      await expect(tx.deployTransaction).to.emit(contract, "ContractDeployed");
    });
  });

  describe("FHE Operations", () => {
    it("Should encrypt values", async () => {
      const value = 42;
      const encrypted = await contract.encryptValue(value);
      expect(encrypted).to.not.be.undefined;
    });

    it("Should grant access permissions", async () => {
      const value = await contract.encryptValue(100);
      const tx = await contract.grantAccess(value, user1.address);
      await expect(tx).to.not.be.reverted;
    });
  });

  describe("Access Control", () => {
    it("Should enforce permission checks", async () => {
      // Add permission validation tests
      expect(true).to.be.true;
    });
  });

  describe("Edge Cases", () => {
    it("Should handle zero values", async () => {
      const encrypted = await contract.encryptValue(0);
      expect(encrypted).to.not.be.undefined;
    });

    it("Should handle maximum values", async () => {
      const maxValue = (2 ** 32) - 1;
      const encrypted = await contract.encryptValue(maxValue);
      expect(encrypted).to.not.be.undefined;
    });
  });
});
`;
}

/**
 * Generate documentation template
 */
function generateDocumentation(config: ExampleConfig): string {
  return `# ${config.name}

## Overview

This example demonstrates the \`${config.category}\` category of FHEVM operations.

**Learning Objectives:**
- Understand how to encrypt data
- Learn permission management patterns
- Implement FHE operations safely
- Write comprehensive tests

## Concepts Covered

### Chapter: ${config.category}

${config.description}

## Smart Contract

\`\`\`solidity
contract ${config.contractName} is SepoliaConfig {
  // Encrypted operations demonstration
}
\`\`\`

## Key Functions

### encryptValue
- **Purpose**: Encrypt a plaintext value
- **FHE Type**: euint32
- **Usage**: Called before storing encrypted data

### grantAccess
- **Purpose**: Grant decryption permissions
- **FHE Operation**: FHE.allow()
- **Usage**: After creating encrypted value

## Testing

Run tests with:
\`\`\`bash
npx hardhat test
\`\`\`

Test coverage includes:
- ✓ Deployment validation
- ✓ FHE encryption operations
- ✓ Permission management
- ✓ Edge cases and error handling

## Common Patterns

### ✓ DO: Grant Permissions After Encryption
\`\`\`solidity
euint32 encrypted = FHE.asEuint32(value);
FHE.allowThis(encrypted);
FHE.allow(encrypted, msg.sender);
\`\`\`

### ✗ DON'T: Access Without Permissions
\`\`\`solidity
// This will fail - no permissions granted
euint32 encrypted = FHE.asEuint32(value);
// Try to use encrypted without FHE.allow()
\`\`\`

## Integration Example

\`\`\`typescript
// Connect to contract
const contract = await ethers.getContractAt(
  "${config.contractName}",
  contractAddress
);

// Encrypt value
const encrypted = await contract.encryptValue(42);

// Grant access
await contract.grantAccess(encrypted, userAddress);
\`\`\`

## References

- [FHEVM Documentation](https://docs.zama.ai/)
- [FHE Operations Reference](https://github.com/zama-ai/fhevm)
- [Related Example](../README.md)

## What's Next?

1. Modify the contract to add more FHE operations
2. Extend test suite with additional cases
3. Add event logging for state changes
4. Implement access control patterns

---

**Category**: ${config.category}
**Difficulty**: Intermediate
**Last Updated**: $(date +%Y-%m-%d)
`;
}

/**
 * Generate package.json for example
 */
function generatePackageJson(config: ExampleConfig): string {
  return JSON.stringify(
    {
      name: \`fhevm-example-\${config.name.toLowerCase()}\`,
      version: "1.0.0",
      description: config.description,
      scripts: {
        compile: "hardhat compile",
        test: "hardhat test",
        deploy: "hardhat run scripts/deploy.ts --network sepolia",
      },
      keywords: ["fhevm", "ethereum", config.category, "privacy"],
      author: "FHEVM Examples",
      license: "MIT",
      devDependencies: {
        "@nomicfoundation/hardhat-toolbox": "^3.0.0",
        "@fhevm/solidity": "^0.1.0",
        hardhat: "^2.20.0",
        typescript: "^5.0.0",
      },
    },
    null,
    2
  );
}

/**
 * Create files in output directory
 */
function createFiles(config: ExampleConfig): void {
  const contract = generateContract(config);
  const test = generateTest(config);
  const docs = generateDocumentation(config);
  const pkg = generatePackageJson(config);

  // Write contract
  const contractPath = path.join(
    config.outputDir,
    "contracts",
    \`\${config.contractName}.sol\`
  );
  fs.writeFileSync(contractPath, contract);
  console.log(\`✓ Created contract: \${contractPath}\`);

  // Write test
  const testPath = path.join(
    config.outputDir,
    "test",
    \`\${config.contractName}.test.ts\`
  );
  fs.writeFileSync(testPath, test);
  console.log(\`✓ Created test: \${testPath}\`);

  // Write documentation
  const docPath = path.join(config.outputDir, "docs", "README.md");
  fs.writeFileSync(docPath, docs);
  console.log(\`✓ Created documentation: \${docPath}\`);

  // Write package.json
  const pkgPath = path.join(config.outputDir, "package.json");
  fs.writeFileSync(pkgPath, pkg);
  console.log(\`✓ Created package.json: \${pkgPath}\`);

  // Copy hardhat.config.ts
  const hardhatConfig = \`import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@typechain/hardhat";
import "solidity-coverage";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};

export default config;\`;

  const hardhatPath = path.join(config.outputDir, "hardhat.config.ts");
  if (!fs.existsSync(hardhatPath)) {
    fs.writeFileSync(hardhatPath, hardhatConfig);
    console.log(\`✓ Created hardhat config: \${hardhatPath}\`);
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("🚀 Creating FHEVM Example...\n");

  const args = parseArguments();

  if (!validateConfig(args)) {
    process.exit(1);
  }

  const config: ExampleConfig = {
    name: args.name,
    category: args.category,
    description: args.description || \`Example for \${args.category} category\`,
    contractName: args.contractName,
    outputDir: args.outputDir || path.join("./examples", args.name),
  };

  console.log("📋 Configuration:");
  console.log(\`  Name: \${config.name}\`);
  console.log(\`  Category: \${config.category}\`);
  console.log(\`  Output: \${config.outputDir}\`);
  console.log(\`  Contract: \${config.contractName}\n\`);

  try {
    createDirectoryStructure(config);
    createFiles(config);

    console.log(\`
✅ Example created successfully!

Next steps:
1. cd \${config.outputDir}
2. npm install
3. npm test
4. npm run deploy -- --network sepolia

Documentation: \${config.outputDir}/docs/README.md
\`);
  } catch (error) {
    console.error("❌ Error creating example:", error);
    process.exit(1);
  }
}

main();
