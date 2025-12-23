#!/usr/bin/env ts-node

/**
 * create-fhevm-example - CLI tool to generate standalone FHEVM example repositories
 *
 * Usage: ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]
 *
 * Example: ts-node scripts/create-fhevm-example.ts delivery-manager ./output/delivery-manager
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Color codes for terminal output
enum Color {
  Reset = '\x1b[0m',
  Green = '\x1b[32m',
  Blue = '\x1b[34m',
  Yellow = '\x1b[33m',
  Red = '\x1b[31m',
  Cyan = '\x1b[36m',
}

function log(message: string, color: Color = Color.Reset): void {
  console.log(`${color}${message}${Color.Reset}`);
}

function error(message: string): never {
  log(`❌ Error: ${message}`, Color.Red);
  process.exit(1);
}

function success(message: string): void {
  log(`✅ ${message}`, Color.Green);
}

function info(message: string): void {
  log(`ℹ️  ${message}`, Color.Blue);
}

// Example configuration interface
interface ExampleConfig {
  contract: string;
  test: string;
  testFixture?: string;
  description: string;
  category: string;
}

// Map of example names to their contract and test paths
const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  // Privacy-Preserving Delivery Examples
  'delivery-manager': {
    contract: 'contracts/DeliveryManager.sol',
    test: 'test/DeliveryManager.test.ts',
    description: 'Core delivery management with encrypted addresses and privacy-preserving matching',
    category: 'privacy-delivery',
  },
  'payment-processor': {
    contract: 'contracts/PaymentProcessor.sol',
    test: 'test/PaymentProcessor.test.ts',
    description: 'Confidential payment processing with encrypted amounts and automatic escrow',
    category: 'privacy-delivery',
  },
  'reputation-tracker': {
    contract: 'contracts/ReputationTracker.sol',
    test: 'test/ReputationTracker.test.ts',
    description: 'Anonymous reputation system with encrypted ratings and zero-knowledge verification',
    category: 'privacy-delivery',
  },
  'privacy-layer': {
    contract: 'contracts/PrivacyLayer.sol',
    test: 'test/PrivacyLayer.test.ts',
    description: 'FHE utility functions for address encryption and privacy-preserving operations',
    category: 'privacy-delivery',
  },
  'anonymous-delivery': {
    contract: 'contracts/AnonymousDelivery.sol',
    test: 'test/AnonymousDelivery.test.ts',
    description: 'Complete anonymous delivery platform demonstrating full FHE integration',
    category: 'privacy-delivery',
  },

  // Basic FHE Examples
  'fhe-counter': {
    contract: 'contracts/basic/FHECounter.sol',
    test: 'test/basic/FHECounter.test.ts',
    description: 'Simple FHE counter demonstrating basic encrypted operations (increment, decrement)',
    category: 'basic',
  },
  'fhe-add': {
    contract: 'contracts/basic/fhe-operations/FHEAdd.sol',
    test: 'test/basic/fhe-operations/FHEAdd.test.ts',
    description: 'FHE addition operations on encrypted values',
    category: 'basic-operations',
  },
  'fhe-comparison': {
    contract: 'contracts/basic/fhe-operations/FHEComparison.sol',
    test: 'test/basic/fhe-operations/FHEComparison.test.ts',
    description: 'FHE comparison operations (eq, lt, gt, le, ge) on encrypted values',
    category: 'basic-operations',
  },
  'fhe-if-then-else': {
    contract: 'contracts/basic/fhe-operations/FHEIfThenElse.sol',
    test: 'test/basic/fhe-operations/FHEIfThenElse.test.ts',
    description: 'Conditional operations on encrypted values without revealing the condition',
    category: 'basic-operations',
  },

  // Encryption Examples
  'encrypt-single-value': {
    contract: 'contracts/basic/encrypt/EncryptSingleValue.sol',
    test: 'test/basic/encrypt/EncryptSingleValue.test.ts',
    description: 'FHE encryption mechanism and common pitfalls',
    category: 'encryption',
  },
  'encrypt-multiple-values': {
    contract: 'contracts/basic/encrypt/EncryptMultipleValues.sol',
    test: 'test/basic/encrypt/EncryptMultipleValues.test.ts',
    description: 'Encryption and handling of multiple encrypted values',
    category: 'encryption',
  },

  // Decryption Examples
  'user-decrypt-single-value': {
    contract: 'contracts/basic/decrypt/UserDecryptSingleValue.sol',
    test: 'test/basic/decrypt/UserDecryptSingleValue.test.ts',
    description: 'User decryption with proper permission requirements',
    category: 'decryption',
  },
  'user-decrypt-multiple-values': {
    contract: 'contracts/basic/decrypt/UserDecryptMultipleValues.sol',
    test: 'test/basic/decrypt/UserDecryptMultipleValues.test.ts',
    description: 'User decryption of multiple encrypted values',
    category: 'decryption',
  },
  'public-decrypt-single-value': {
    contract: 'contracts/basic/decrypt/PublicDecryptSingleValue.sol',
    test: 'test/basic/decrypt/PublicDecryptSingleValue.test.ts',
    description: 'Public decryption mechanism for non-sensitive encrypted data',
    category: 'decryption',
  },
  'public-decrypt-multiple-values': {
    contract: 'contracts/basic/decrypt/PublicDecryptMultipleValues.sol',
    test: 'test/basic/decrypt/PublicDecryptMultipleValues.test.ts',
    description: 'Public decryption of multiple encrypted values',
    category: 'decryption',
  },

  // Access Control Examples
  'access-control': {
    contract: 'contracts/basic/AccessControl.sol',
    test: 'test/basic/AccessControl.test.ts',
    description: 'FHE access control patterns (FHE.allow, FHE.allowTransient)',
    category: 'access-control',
  },

  // Auction Examples
  'blind-auction': {
    contract: 'contracts/auctions/BlindAuction.sol',
    test: 'test/auctions/BlindAuction.test.ts',
    description: 'Sealed-bid auction with encrypted bids using FHE',
    category: 'auctions',
  },
};

function copyDirectoryRecursive(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      // Skip node_modules, artifacts, cache, etc.
      if (['node_modules', 'artifacts', 'cache', 'coverage', 'types', 'dist'].includes(item)) {
        return;
      }
      copyDirectoryRecursive(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function getContractName(contractPath: string): string | null {
  const content = fs.readFileSync(contractPath, 'utf-8');
  // Match contract declaration, ignoring comments and ensuring it's followed by 'is' or '{'
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : null;
}

function updateDeployScript(outputDir: string, contractName: string): void {
  const deployScriptPath = path.join(outputDir, 'deploy', 'deploy.ts');

  const deployScript = `import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployed${contractName} = await deploy("${contractName}", {
    from: deployer,
    log: true,
  });

  console.log(\`${contractName} contract: \`, deployed${contractName}.address);
};
export default func;
func.id = "deploy_${contractName.toLowerCase()}";
func.tags = ["${contractName}"];
`;

  fs.writeFileSync(deployScriptPath, deployScript);
}

function updatePackageJson(outputDir: string, exampleName: string, description: string): void {
  const packageJsonPath = path.join(outputDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = `fhevm-example-${exampleName}`;
  packageJson.description = description;
  packageJson.homepage = `https://github.com/your-username/fhevm-examples/${exampleName}`;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function generateReadme(exampleName: string, description: string, contractName: string, category: string): string {
  return `# FHEVM Example: ${exampleName}

${description}

## Category

${category}

## Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Package manager

### Installation

1. **Install dependencies**

   \`\`\`bash
   npm install
   \`\`\`

2. **Set up environment variables**

   \`\`\`bash
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   \`\`\`

3. **Compile and test**

   \`\`\`bash
   npm run compile
   npm run test
   \`\`\`

## Contract

The main contract is \`${contractName}\` located in \`contracts/${contractName}.sol\`.

### Key Features

- **Privacy-Preserving**: Uses Fully Homomorphic Encryption (FHE) for confidential operations
- **Zero-Knowledge Proofs**: Enables verification without revealing sensitive data
- **Decentralized**: Built on blockchain for transparency and immutability

## Testing

Run the test suite:

\`\`\`bash
npm run test
\`\`\`

For Sepolia testnet testing:

\`\`\`bash
npm run test:sepolia
\`\`\`

## Deployment

Deploy to local network:

\`\`\`bash
npx hardhat node
npx hardhat deploy --network localhost
\`\`\`

Deploy to Sepolia:

\`\`\`bash
npx hardhat deploy --network sepolia
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
\`\`\`

## Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Examples](https://docs.zama.org/protocol/examples)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## License

This project is licensed under the BSD-3-Clause-Clear License.

---

**Built with FHEVM by Zama**
`;
}

function createExample(exampleName: string, outputDir: string): void {
  const rootDir = path.resolve(__dirname, '..');
  const templateDir = path.join(rootDir, 'base-template');

  // Check if example exists
  if (!EXAMPLES_MAP[exampleName]) {
    error(`Unknown example: ${exampleName}\n\nAvailable examples:\n${Object.keys(EXAMPLES_MAP).map(k => `  - ${k}`).join('\n')}`);
  }

  const example = EXAMPLES_MAP[exampleName];
  const contractPath = path.join(rootDir, example.contract);
  const testPath = path.join(rootDir, example.test);

  // Validate paths exist
  if (!fs.existsSync(contractPath)) {
    error(`Contract not found: ${example.contract}`);
  }
  if (!fs.existsSync(testPath)) {
    error(`Test not found: ${example.test}`);
  }

  info(`Creating FHEVM example: ${exampleName}`);
  info(`Output directory: ${outputDir}`);

  // Step 1: Copy template
  log('\n📋 Step 1: Copying template...', Color.Cyan);
  if (fs.existsSync(outputDir)) {
    error(`Output directory already exists: ${outputDir}`);
  }

  // If template doesn't exist, use current directory structure
  if (!fs.existsSync(templateDir)) {
    info('Base template not found, creating from current structure...');
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(path.join(outputDir, 'contracts'), { recursive: true });
    fs.mkdirSync(path.join(outputDir, 'test'), { recursive: true });
    fs.mkdirSync(path.join(outputDir, 'deploy'), { recursive: true });

    // Copy essential files
    const essentialFiles = ['hardhat.config.ts', 'package.json', 'tsconfig.json', '.gitignore', '.solhintrc.json'];
    essentialFiles.forEach(file => {
      const src = path.join(rootDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(outputDir, file));
      }
    });
  } else {
    copyDirectoryRecursive(templateDir, outputDir);
  }
  success('Template copied');

  // Step 2: Copy contract and dependencies
  log('\n📄 Step 2: Copying contract...', Color.Cyan);
  const contractName = getContractName(contractPath);
  if (!contractName) {
    error('Could not extract contract name from contract file');
  }
  const destContractPath = path.join(outputDir, 'contracts', `${contractName}.sol`);

  fs.copyFileSync(contractPath, destContractPath);
  success(`Contract copied: ${contractName}.sol`);

  // Copy interfaces and libs if they exist
  const interfacesDir = path.join(rootDir, 'contracts', 'interfaces');
  const libsDir = path.join(rootDir, 'contracts', 'libs');

  if (fs.existsSync(interfacesDir)) {
    copyDirectoryRecursive(interfacesDir, path.join(outputDir, 'contracts', 'interfaces'));
    success('Interfaces copied');
  }

  if (fs.existsSync(libsDir)) {
    copyDirectoryRecursive(libsDir, path.join(outputDir, 'contracts', 'libs'));
    success('Libraries copied');
  }

  // Step 3: Copy test
  log('\n🧪 Step 3: Copying test...', Color.Cyan);
  const destTestPath = path.join(outputDir, 'test', path.basename(testPath));

  fs.copyFileSync(testPath, destTestPath);
  success(`Test copied: ${path.basename(testPath)}`);

  // Copy test fixture if it exists
  if (example.testFixture) {
    const fixtureSourcePath = path.join(rootDir, example.testFixture);
    if (fs.existsSync(fixtureSourcePath)) {
      const destFixturePath = path.join(outputDir, 'test', path.basename(example.testFixture));
      fs.copyFileSync(fixtureSourcePath, destFixturePath);
      success(`Test fixture copied: ${path.basename(example.testFixture)}`);
    }
  }

  // Step 4: Update configuration files
  log('\n⚙️  Step 4: Updating configuration...', Color.Cyan);
  updateDeployScript(outputDir, contractName);
  updatePackageJson(outputDir, exampleName, example.description);
  success('Configuration updated');

  // Step 5: Generate README
  log('\n📝 Step 5: Generating README...', Color.Cyan);
  const readme = generateReadme(exampleName, example.description, contractName, example.category);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  success('README.md generated');

  // Final summary
  log('\n' + '='.repeat(60), Color.Green);
  success(`FHEVM example "${exampleName}" created successfully!`);
  log('='.repeat(60), Color.Green);

  log('\n📦 Next steps:', Color.Yellow);
  log(`  cd ${path.relative(process.cwd(), outputDir)}`);
  log('  npm install');
  log('  npm run compile');
  log('  npm run test');

  log('\n🎉 Happy coding with FHEVM!', Color.Cyan);
}

// Main execution
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    log('FHEVM Example Generator', Color.Cyan);
    log('\nUsage: ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]\n');
    log('Available examples:', Color.Yellow);
    Object.entries(EXAMPLES_MAP).forEach(([name, info]) => {
      log(`  ${name}`, Color.Green);
      log(`    ${info.description}`, Color.Reset);
    });
    log('\nExample:', Color.Yellow);
    log('  ts-node scripts/create-fhevm-example.ts delivery-manager ./output/delivery-manager\n');
    process.exit(0);
  }

  const exampleName = args[0];
  const outputDir = args[1] || path.join(process.cwd(), 'output', `fhevm-example-${exampleName}`);

  createExample(exampleName, outputDir);
}

main();
