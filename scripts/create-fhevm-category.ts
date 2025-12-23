#!/usr/bin/env ts-node

/**
 * create-fhevm-category - CLI tool to generate FHEVM projects with multiple examples from a category
 *
 * Usage: ts-node scripts/create-fhevm-category.ts <category> [output-dir]
 *
 * Example: ts-node scripts/create-fhevm-category.ts privacy-delivery ./output/privacy-delivery-examples
 */

import * as fs from 'fs';
import * as path from 'path';

// Color codes for terminal output
enum Color {
  Reset = '\x1b[0m',
  Green = '\x1b[32m',
  Blue = '\x1b[34m',
  Yellow = '\x1b[33m',
  Red = '\x1b[31m',
  Cyan = '\x1b[36m',
  Magenta = '\x1b[35m',
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

// Contract item interface
interface ContractItem {
  path: string;
  test: string;
  fixture?: string;
  additionalFiles?: string[];
}

// Category configuration interface
interface CategoryConfig {
  name: string;
  description: string;
  contracts: ContractItem[];
  additionalDeps?: Record<string, string>;
}

// Category definitions
const CATEGORIES: Record<string, CategoryConfig> = {
  'privacy-delivery': {
    name: 'Privacy-Preserving Delivery System',
    description: 'Complete suite of privacy-preserving delivery contracts using FHE for anonymous logistics',
    contracts: [
      { path: 'contracts/DeliveryManager.sol', test: 'test/DeliveryManager.test.ts' },
      { path: 'contracts/PaymentProcessor.sol', test: 'test/PaymentProcessor.test.ts' },
      { path: 'contracts/ReputationTracker.sol', test: 'test/ReputationTracker.test.ts' },
      { path: 'contracts/PrivacyLayer.sol', test: 'test/PrivacyLayer.test.ts' },
      { path: 'contracts/AnonymousDelivery.sol', test: 'test/AnonymousDelivery.test.ts' },
    ],
  },
  'basic': {
    name: 'Basic FHEVM Examples',
    description: 'Fundamental FHEVM operations including counter, encryption, decryption, and basic FHE operations',
    contracts: [
      { path: 'contracts/basic/FHECounter.sol', test: 'test/basic/FHECounter.test.ts' },
      { path: 'contracts/basic/fhe-operations/FHEAdd.sol', test: 'test/basic/fhe-operations/FHEAdd.test.ts' },
      { path: 'contracts/basic/fhe-operations/FHEComparison.sol', test: 'test/basic/fhe-operations/FHEComparison.test.ts' },
      { path: 'contracts/basic/fhe-operations/FHEIfThenElse.sol', test: 'test/basic/fhe-operations/FHEIfThenElse.test.ts' },
      { path: 'contracts/basic/encrypt/EncryptSingleValue.sol', test: 'test/basic/encrypt/EncryptSingleValue.test.ts' },
      { path: 'contracts/basic/encrypt/EncryptMultipleValues.sol', test: 'test/basic/encrypt/EncryptMultipleValues.test.ts' },
      { path: 'contracts/basic/decrypt/UserDecryptSingleValue.sol', test: 'test/basic/decrypt/UserDecryptSingleValue.test.ts' },
      { path: 'contracts/basic/decrypt/UserDecryptMultipleValues.sol', test: 'test/basic/decrypt/UserDecryptMultipleValues.test.ts' },
      { path: 'contracts/basic/decrypt/PublicDecryptSingleValue.sol', test: 'test/basic/decrypt/PublicDecryptSingleValue.test.ts' },
      { path: 'contracts/basic/decrypt/PublicDecryptMultipleValues.sol', test: 'test/basic/decrypt/PublicDecryptMultipleValues.test.ts' },
      { path: 'contracts/basic/AccessControl.sol', test: 'test/basic/AccessControl.test.ts' },
    ],
  },
  'auctions': {
    name: 'Auction Examples',
    description: 'Advanced auction implementations using confidential bids and encrypted prices',
    contracts: [
      { path: 'contracts/auctions/BlindAuction.sol', test: 'test/auctions/BlindAuction.test.ts' },
    ],
  },
};

function copyDirectoryRecursive(source: string, destination: string, excludeDirs: string[] = []): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const items = fs.readdirSync(source);

  items.forEach(item => {
    const sourcePath = path.join(source, item);
    const destPath = path.join(destination, item);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      if (excludeDirs.includes(item)) {
        return;
      }
      copyDirectoryRecursive(sourcePath, destPath, excludeDirs);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function getContractName(contractPath: string): string | null {
  const content = fs.readFileSync(contractPath, 'utf-8');
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : null;
}

function generateDeployScript(contractNames: string[]): string {
  return `import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

${contractNames.map(name => `  // Deploy ${name}
  const deployed${name} = await deploy("${name}", {
    from: deployer,
    log: true,
  });
  console.log(\`${name} contract: \${deployed${name}.address}\`);
`).join('\n')}
};

export default func;
func.id = "deploy_all";
func.tags = ["all", ${contractNames.map(n => `"${n}"`).join(', ')}];
`;
}

function generateReadme(category: string, contractNames: string[]): string {
  const categoryInfo = CATEGORIES[category];

  return `# FHEVM Examples: ${categoryInfo.name}

${categoryInfo.description}

## 📦 Included Examples

This project contains ${contractNames.length} example contract${contractNames.length > 1 ? 's' : ''}:

${contractNames.map((name, i) => `${i + 1}. **${name}**`).join('\n')}

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

## Contracts Overview

${contractNames.map((name, i) => `### ${i + 1}. ${name}

Located in \`contracts/${name}.sol\`

Tests: \`test/${name}.test.ts\`
`).join('\n')}

## Testing

Run all tests:

\`\`\`bash
npm run test
\`\`\`

Run specific contract tests:

\`\`\`bash
npm run test test/${contractNames[0]}.test.ts
\`\`\`

For Sepolia testnet testing:

\`\`\`bash
npm run test:sepolia
\`\`\`

## Deployment

Deploy all contracts to local network:

\`\`\`bash
npx hardhat node
npx hardhat deploy --network localhost
\`\`\`

Deploy to Sepolia:

\`\`\`bash
npx hardhat deploy --network sepolia
\`\`\`

## Project Structure

\`\`\`
.
├── contracts/              # Solidity smart contracts
${contractNames.map(name => `│   ├── ${name}.sol`).join('\n')}
│   ├── interfaces/         # Contract interfaces
│   └── libs/               # Shared libraries
├── test/                   # Test files
${contractNames.map(name => `│   ├── ${name}.test.ts`).join('\n')}
├── deploy/                 # Deployment scripts
│   └── deploy.ts
├── hardhat.config.ts       # Hardhat configuration
└── package.json            # Project dependencies
\`\`\`

## Key Features

- **Privacy-Preserving**: Uses Fully Homomorphic Encryption (FHE) for confidential operations
- **Zero-Knowledge Proofs**: Enables verification without revealing sensitive data
- **Decentralized**: Built on blockchain for transparency and immutability
- **Modular Design**: Each contract focuses on a specific functionality

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

function createCategory(categoryName: string, outputDir: string): void {
  const rootDir = path.resolve(__dirname, '..');
  const templateDir = path.join(rootDir, 'base-template');

  // Check if category exists
  if (!CATEGORIES[categoryName]) {
    error(`Unknown category: ${categoryName}\n\nAvailable categories:\n${Object.keys(CATEGORIES).map(k => `  - ${k}: ${CATEGORIES[k].name}`).join('\n')}`);
  }

  const category = CATEGORIES[categoryName];
  info(`Creating FHEVM category project: ${category.name}`);
  info(`Output directory: ${outputDir}`);

  // Step 1: Copy template
  log('\n📋 Step 1: Copying template...', Color.Cyan);
  if (fs.existsSync(outputDir)) {
    error(`Output directory already exists: ${outputDir}`);
  }

  // If template doesn't exist, create basic structure
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
    copyDirectoryRecursive(templateDir, outputDir, ['node_modules', 'artifacts', 'cache', 'coverage', 'types', 'dist']);
  }
  success('Template copied');

  // Step 2: Copy all contracts and tests
  log('\n📄 Step 2: Copying contracts and tests...', Color.Cyan);
  const contractNames: string[] = [];

  category.contracts.forEach((item, index) => {
    const contractPath = path.join(rootDir, item.path);
    const testPath = path.join(rootDir, item.test);

    if (!fs.existsSync(contractPath)) {
      error(`Contract not found: ${item.path}`);
    }

    const contractName = getContractName(contractPath);
    if (!contractName) {
      error(`Could not extract contract name from ${item.path}`);
    }

    contractNames.push(contractName);

    // Copy contract
    const destContractPath = path.join(outputDir, 'contracts', path.basename(contractPath));
    fs.copyFileSync(contractPath, destContractPath);
    success(`Contract ${index + 1}/${category.contracts.length}: ${contractName}.sol`);

    // Copy test
    if (fs.existsSync(testPath)) {
      const destTestPath = path.join(outputDir, 'test', path.basename(testPath));
      fs.copyFileSync(testPath, destTestPath);
      success(`Test ${index + 1}/${category.contracts.length}: ${path.basename(testPath)}`);
    }

    // Copy fixture if exists
    if (item.fixture) {
      const fixturePath = path.join(rootDir, item.fixture);
      if (fs.existsSync(fixturePath)) {
        const destFixturePath = path.join(outputDir, 'test', path.basename(item.fixture));
        fs.copyFileSync(fixturePath, destFixturePath);
        success(`Fixture ${index + 1}/${category.contracts.length}: ${path.basename(item.fixture)}`);
      }
    }

    // Copy additional files if exists
    if (item.additionalFiles) {
      item.additionalFiles.forEach(file => {
        const filePath = path.join(rootDir, file);
        if (fs.existsSync(filePath)) {
          const destPath = path.join(outputDir, file);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(filePath, destPath);
          success(`Additional file: ${path.basename(file)}`);
        }
      });
    }
  });

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

  // Step 3: Generate deployment script
  log('\n⚙️  Step 3: Generating deployment script...', Color.Cyan);
  const deployScript = generateDeployScript(contractNames);
  fs.writeFileSync(path.join(outputDir, 'deploy', 'deploy.ts'), deployScript);
  success('Deployment script generated');

  // Step 4: Update package.json
  log('\n📦 Step 4: Updating package.json...', Color.Cyan);
  const packageJsonPath = path.join(outputDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  packageJson.name = `fhevm-examples-${categoryName}`;
  packageJson.description = category.description;

  // Add additional dependencies if specified
  if (category.additionalDeps) {
    packageJson.dependencies = {
      ...packageJson.dependencies,
      ...category.additionalDeps,
    };
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  success('Package.json updated');

  // Step 5: Generate README
  log('\n📝 Step 5: Generating README...', Color.Cyan);
  const readme = generateReadme(categoryName, contractNames);
  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  success('README.md generated');

  // Final summary
  log('\n' + '='.repeat(60), Color.Green);
  success(`FHEVM category "${category.name}" created successfully!`);
  log('='.repeat(60), Color.Green);

  log(`\n📊 Summary:`, Color.Magenta);
  log(`  Category: ${category.name}`);
  log(`  Contracts: ${contractNames.length}`);
  log(`  Contracts: ${contractNames.join(', ')}`);

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
    log('FHEVM Category Project Generator', Color.Cyan);
    log('\nUsage: ts-node scripts/create-fhevm-category.ts <category> [output-dir]\n');
    log('Available categories:', Color.Yellow);
    Object.entries(CATEGORIES).forEach(([name, info]) => {
      log(`  ${name}`, Color.Green);
      log(`    ${info.name} - ${info.contracts.length} contracts`, Color.Reset);
      log(`    ${info.description}`, Color.Reset);
    });
    log('\nExample:', Color.Yellow);
    log('  ts-node scripts/create-fhevm-category.ts privacy-delivery ./output/privacy-delivery\n');
    process.exit(0);
  }

  const categoryName = args[0];
  const outputDir = args[1] || path.join(process.cwd(), 'output', `fhevm-examples-${categoryName}`);

  createCategory(categoryName, outputDir);
}

main();
