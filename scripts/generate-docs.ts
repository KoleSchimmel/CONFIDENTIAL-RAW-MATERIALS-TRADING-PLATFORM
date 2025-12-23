#!/usr/bin/env ts-node

/**
 * generate-docs - Generates GitBook-formatted documentation from contracts and tests
 *
 * Usage: ts-node scripts/generate-docs.ts <example-name> [options]
 *
 * Example: ts-node scripts/generate-docs.ts delivery-manager --output docs/
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
}

function log(message: string, color: Color = Color.Reset): void {
  console.log(`${color}${message}${Color.Reset}`);
}

function success(message: string): void {
  log(`✅ ${message}`, Color.Green);
}

function info(message: string): void {
  log(`ℹ️  ${message}`, Color.Blue);
}

function error(message: string): never {
  log(`❌ Error: ${message}`, Color.Red);
  process.exit(1);
}

// Documentation configuration interface
interface DocsConfig {
  title: string;
  description: string;
  contract: string;
  test: string;
  output: string;
  category: string;
}

// Generate documentation options
interface GenerateDocsOptions {
  noSummary?: boolean;
}

// Example configurations
const EXAMPLES_CONFIG: Record<string, DocsConfig> = {
  // Privacy-Preserving Delivery Examples
  'delivery-manager': {
    title: 'Delivery Manager',
    description: 'This example demonstrates core delivery management with encrypted addresses and privacy-preserving matching using FHEVM.',
    contract: 'contracts/DeliveryManager.sol',
    test: 'test/DeliveryManager.test.ts',
    output: 'docs/delivery-manager.md',
    category: 'Privacy-Preserving Delivery',
  },
  'payment-processor': {
    title: 'Payment Processor',
    description: 'This example demonstrates confidential payment processing with encrypted amounts and automatic escrow using FHE.',
    contract: 'contracts/PaymentProcessor.sol',
    test: 'test/PaymentProcessor.test.ts',
    output: 'docs/payment-processor.md',
    category: 'Privacy-Preserving Delivery',
  },
  'reputation-tracker': {
    title: 'Reputation Tracker',
    description: 'This example shows an anonymous reputation system with encrypted ratings and zero-knowledge verification.',
    contract: 'contracts/ReputationTracker.sol',
    test: 'test/ReputationTracker.test.ts',
    output: 'docs/reputation-tracker.md',
    category: 'Privacy-Preserving Delivery',
  },
  'privacy-layer': {
    title: 'Privacy Layer',
    description: 'This example demonstrates FHE utility functions for address encryption and privacy-preserving operations.',
    contract: 'contracts/PrivacyLayer.sol',
    test: 'test/PrivacyLayer.test.ts',
    output: 'docs/privacy-layer.md',
    category: 'Privacy-Preserving Delivery',
  },
  'anonymous-delivery': {
    title: 'Anonymous Delivery Network',
    description: 'This example demonstrates a complete anonymous delivery platform with full FHE integration for privacy-preserving logistics.',
    contract: 'contracts/AnonymousDelivery.sol',
    test: 'test/AnonymousDelivery.test.ts',
    output: 'docs/anonymous-delivery.md',
    category: 'Privacy-Preserving Delivery',
  },

  // Basic FHE Examples
  'fhe-counter': {
    title: 'FHE Counter',
    description: 'This example demonstrates a simple encrypted counter using FHEVM with increment and decrement operations.',
    contract: 'contracts/basic/FHECounter.sol',
    test: 'test/basic/FHECounter.test.ts',
    output: 'docs/fhe-counter.md',
    category: 'Basic',
  },
  'fhe-add': {
    title: 'FHE Addition',
    description: 'This example shows FHE addition operations on encrypted uint32 values without decryption.',
    contract: 'contracts/basic/fhe-operations/FHEAdd.sol',
    test: 'test/basic/fhe-operations/FHEAdd.test.ts',
    output: 'docs/fhe-add.md',
    category: 'Basic - FHE Operations',
  },
  'fhe-comparison': {
    title: 'FHE Comparison',
    description: 'This example demonstrates FHE comparison operations (eq, lt, gt, le, ge) on encrypted values.',
    contract: 'contracts/basic/fhe-operations/FHEComparison.sol',
    test: 'test/basic/fhe-operations/FHEComparison.test.ts',
    output: 'docs/fhe-comparison.md',
    category: 'Basic - FHE Operations',
  },
  'fhe-if-then-else': {
    title: 'FHE If-Then-Else',
    description: 'This example shows conditional operations on encrypted values using FHE.select without revealing the condition.',
    contract: 'contracts/basic/fhe-operations/FHEIfThenElse.sol',
    test: 'test/basic/fhe-operations/FHEIfThenElse.test.ts',
    output: 'docs/fhe-if-then-else.md',
    category: 'Basic - FHE Operations',
  },

  // Encryption Examples
  'encrypt-single-value': {
    title: 'Encrypt Single Value',
    description: 'This example demonstrates the FHE encryption mechanism and highlights common pitfalls developers may encounter.',
    contract: 'contracts/basic/encrypt/EncryptSingleValue.sol',
    test: 'test/basic/encrypt/EncryptSingleValue.test.ts',
    output: 'docs/encrypt-single-value.md',
    category: 'Basic - Encryption',
  },
  'encrypt-multiple-values': {
    title: 'Encrypt Multiple Values',
    description: 'This example shows how to encrypt and handle multiple encrypted values with proper permission management.',
    contract: 'contracts/basic/encrypt/EncryptMultipleValues.sol',
    test: 'test/basic/encrypt/EncryptMultipleValues.test.ts',
    output: 'docs/encrypt-multiple-values.md',
    category: 'Basic - Encryption',
  },

  // Decryption Examples
  'user-decrypt-single-value': {
    title: 'User Decrypt Single Value',
    description: 'This example demonstrates the FHE user decryption mechanism and permission requirements.',
    contract: 'contracts/basic/decrypt/UserDecryptSingleValue.sol',
    test: 'test/basic/decrypt/UserDecryptSingleValue.test.ts',
    output: 'docs/user-decrypt-single-value.md',
    category: 'Basic - Decryption',
  },
  'user-decrypt-multiple-values': {
    title: 'User Decrypt Multiple Values',
    description: 'This example shows how to decrypt multiple encrypted values for a specific user.',
    contract: 'contracts/basic/decrypt/UserDecryptMultipleValues.sol',
    test: 'test/basic/decrypt/UserDecryptMultipleValues.test.ts',
    output: 'docs/user-decrypt-multiple-values.md',
    category: 'Basic - Decryption',
  },
  'public-decrypt-single-value': {
    title: 'Public Decrypt Single Value',
    description: 'This example demonstrates public decryption mechanism for non-sensitive encrypted data.',
    contract: 'contracts/basic/decrypt/PublicDecryptSingleValue.sol',
    test: 'test/basic/decrypt/PublicDecryptSingleValue.test.ts',
    output: 'docs/public-decrypt-single-value.md',
    category: 'Basic - Decryption',
  },
  'public-decrypt-multiple-values': {
    title: 'Public Decrypt Multiple Values',
    description: 'This example shows public decryption of multiple encrypted values and aggregation.',
    contract: 'contracts/basic/decrypt/PublicDecryptMultipleValues.sol',
    test: 'test/basic/decrypt/PublicDecryptMultipleValues.test.ts',
    output: 'docs/public-decrypt-multiple-values.md',
    category: 'Basic - Decryption',
  },

  // Access Control Examples
  'access-control': {
    title: 'Access Control',
    description: 'This example demonstrates FHE access control patterns including FHE.allow and FHE.allowTransient.',
    contract: 'contracts/basic/AccessControl.sol',
    test: 'test/basic/AccessControl.test.ts',
    output: 'docs/access-control.md',
    category: 'Basic - Access Control',
  },

  // Auction Examples
  'blind-auction': {
    title: 'Blind Auction',
    description: 'This example demonstrates a sealed-bid auction where bids remain confidential until revealed using FHE.',
    contract: 'contracts/auctions/BlindAuction.sol',
    test: 'test/auctions/BlindAuction.test.ts',
    output: 'docs/blind-auction.md',
    category: 'Advanced - Auctions',
  },
};

function readFile(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function getContractName(content: string): string {
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : 'Contract';
}

function extractDescription(content: string): string {
  // Extract description from first multi-line comment or @notice
  const commentMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
  const noticeMatch = content.match(/@notice\s+(.+)/);

  return commentMatch ? commentMatch[1] : (noticeMatch ? noticeMatch[1] : '');
}

function generateGitBookMarkdown(config: DocsConfig, contractContent: string, testContent: string): string {
  const contractName = getContractName(contractContent);
  const description = config.description || extractDescription(contractContent);

  let markdown = `# ${config.title}\n\n${description}\n\n`;

  // Add hint block
  markdown += `{% hint style="info" %}\n`;
  markdown += `To run this example correctly, make sure the files are placed in the following directories:\n\n`;
  markdown += `- \`.sol\` file → \`<your-project-root-dir>/contracts/\`\n`;
  markdown += `- \`.ts\` file → \`<your-project-root-dir>/test/\`\n\n`;
  markdown += `This ensures Hardhat can compile and test your contracts as expected.\n`;
  markdown += `{% endhint %}\n\n`;

  // Add key features section
  markdown += `## Key Features\n\n`;
  markdown += `- **Privacy-Preserving**: Uses Fully Homomorphic Encryption (FHE) for confidential operations\n`;
  markdown += `- **Zero-Knowledge Proofs**: Enables verification without revealing sensitive data\n`;
  markdown += `- **Decentralized**: Built on blockchain for transparency and immutability\n\n`;

  // Add tabs for contract and test
  markdown += `{% tabs %}\n\n`;

  // Contract tab
  markdown += `{% tab title="${contractName}.sol" %}\n\n`;
  markdown += `\`\`\`solidity\n`;
  markdown += contractContent;
  markdown += `\n\`\`\`\n\n`;
  markdown += `{% endtab %}\n\n`;

  // Test tab
  const testFileName = path.basename(config.test);
  markdown += `{% tab title="${testFileName}" %}\n\n`;
  markdown += `\`\`\`typescript\n`;
  markdown += testContent;
  markdown += `\n\`\`\`\n\n`;
  markdown += `{% endtab %}\n\n`;

  markdown += `{% endtabs %}\n\n`;

  // Add usage section
  markdown += `## Usage\n\n`;
  markdown += `### Compile\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm run compile\n`;
  markdown += `\`\`\`\n\n`;
  markdown += `### Test\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npm run test\n`;
  markdown += `\`\`\`\n\n`;
  markdown += `### Deploy\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `npx hardhat deploy --network localhost\n`;
  markdown += `\`\`\`\n`;

  return markdown;
}

function updateSummary(exampleName: string, config: DocsConfig): void {
  const summaryPath = path.join(process.cwd(), 'docs', 'SUMMARY.md');

  if (!fs.existsSync(summaryPath)) {
    log('Creating new SUMMARY.md', Color.Yellow);
    const summary = `# Table of contents\n\n* [Introduction](README.md)\n\n`;
    fs.writeFileSync(summaryPath, summary);
  }

  const summary = fs.readFileSync(summaryPath, 'utf-8');
  const outputFileName = path.basename(config.output);
  const linkText = config.title;
  const link = `* [${linkText}](${outputFileName})`;

  // Check if already in summary
  if (summary.includes(outputFileName)) {
    info('Example already in SUMMARY.md');
    return;
  }

  // Add to appropriate category
  const categoryHeader = `## ${config.category}`;
  let updatedSummary: string;

  if (summary.includes(categoryHeader)) {
    // Add under existing category
    const lines = summary.split('\n');
    const categoryIndex = lines.findIndex(line => line.trim() === categoryHeader);

    // Find next category or end
    let insertIndex = categoryIndex + 1;
    while (insertIndex < lines.length && !lines[insertIndex].startsWith('##')) {
      if (lines[insertIndex].trim() === '') {
        break;
      }
      insertIndex++;
    }

    lines.splice(insertIndex, 0, link);
    updatedSummary = lines.join('\n');
  } else {
    // Add new category
    updatedSummary = summary.trim() + `\n\n${categoryHeader}\n\n${link}\n`;
  }

  fs.writeFileSync(summaryPath, updatedSummary);
  success('Updated SUMMARY.md');
}

function generateDocs(exampleName: string, options: GenerateDocsOptions = {}): void {
  const config = EXAMPLES_CONFIG[exampleName];

  if (!config) {
    error(`Unknown example: ${exampleName}\n\nAvailable examples:\n${Object.keys(EXAMPLES_CONFIG).map(k => `  - ${k}`).join('\n')}`);
  }

  info(`Generating documentation for: ${config.title}`);

  // Read contract and test files
  const contractContent = readFile(config.contract);
  const testContent = readFile(config.test);

  // Generate GitBook markdown
  const markdown = generateGitBookMarkdown(config, contractContent, testContent);

  // Write output file
  const outputPath = path.join(process.cwd(), config.output);
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown);
  success(`Documentation generated: ${config.output}`);

  // Update SUMMARY.md
  if (!options.noSummary) {
    updateSummary(exampleName, config);
  }
}

function generateAllDocs(options: GenerateDocsOptions = {}): void {
  info('Generating documentation for all examples...\n');

  const examples = Object.keys(EXAMPLES_CONFIG);
  examples.forEach((example, index) => {
    log(`[${index + 1}/${examples.length}] ${example}`, Color.Cyan);
    generateDocs(example, { ...options, noSummary: true });
  });

  // Update summary once at the end
  if (!options.noSummary) {
    examples.forEach(example => {
      updateSummary(example, EXAMPLES_CONFIG[example]);
    });
  }

  log('\n' + '='.repeat(60), Color.Green);
  success(`Generated documentation for ${examples.length} examples!`);
  log('='.repeat(60), Color.Green);
}

// Main execution
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    log('FHEVM Documentation Generator', Color.Cyan);
    log('\nUsage: ts-node scripts/generate-docs.ts <example-name|--all> [options]\n');
    log('Options:', Color.Yellow);
    log('  --all          Generate documentation for all examples');
    log('  --no-summary   Skip updating SUMMARY.md');
    log('\nAvailable examples:', Color.Yellow);
    Object.entries(EXAMPLES_CONFIG).forEach(([name, info]) => {
      log(`  ${name}`, Color.Green);
      log(`    ${info.title}`, Color.Reset);
    });
    log('\nExamples:', Color.Yellow);
    log('  ts-node scripts/generate-docs.ts delivery-manager');
    log('  ts-node scripts/generate-docs.ts --all\n');
    process.exit(0);
  }

  const options: GenerateDocsOptions = {
    noSummary: args.includes('--no-summary'),
  };

  if (args[0] === '--all') {
    generateAllDocs(options);
  } else {
    const exampleName = args[0];
    generateDocs(exampleName, options);

    log('\n' + '='.repeat(60), Color.Green);
    success('Documentation generation complete!');
    log('='.repeat(60), Color.Green);
  }
}

main();
