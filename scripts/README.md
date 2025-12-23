# FHEVM Example Generator Scripts

This directory contains automation scripts for generating standalone FHEVM example repositories and documentation for the Privacy-Preserving Delivery System.

## Scripts Overview

### 1. `create-fhevm-example.ts` - Single Example Generator

Generates a complete, standalone FHEVM example repository from the base template.

**Usage:**
```bash
ts-node scripts/create-fhevm-example.ts <example-name> [output-dir]
```

**Features:**
- Clones the `base-template/` directory or creates from current structure
- Copies specified contract from `contracts/`
- Copies corresponding test from `test/`
- Updates deployment scripts with correct contract name
- Generates example-specific README.md
- Updates package.json with example metadata
- Creates a ready-to-use, standalone repository

**Available Examples:**
- `delivery-manager` - Core delivery management with encrypted addresses
- `payment-processor` - Confidential payment processing with escrow
- `reputation-tracker` - Anonymous reputation system
- `privacy-layer` - FHE utility functions
- `anonymous-delivery` - Complete anonymous delivery platform

**Example:**
```bash
# Generate delivery-manager example
ts-node scripts/create-fhevm-example.ts delivery-manager ./output/delivery-manager-example

# Navigate to generated example
cd output/delivery-manager-example

# Install and test
npm install
npm run compile
npm run test
```

### 2. `create-fhevm-category.ts` - Category Project Generator

Generates a project containing all examples from the privacy-delivery category.

**Usage:**
```bash
ts-node scripts/create-fhevm-category.ts <category> [output-dir]
```

**Features:**
- Copies all contracts from the category
- Includes all corresponding tests
- Generates unified deployment script for all contracts
- Creates comprehensive README listing all examples
- Perfect for learning multiple related concepts at once

**Available Categories:**
- `privacy-delivery` - 5 contracts (Complete privacy-preserving delivery system)

**Example:**
```bash
# Generate privacy-delivery category project
ts-node scripts/create-fhevm-category.ts privacy-delivery ./output/privacy-delivery-examples

# Navigate and test
cd output/privacy-delivery-examples
npm install
npm run compile
npm run test
```

### 3. `generate-docs.ts` - Documentation Generator

Creates GitBook-formatted documentation from contract and test files.

**Usage:**
```bash
ts-node scripts/generate-docs.ts <example-name>
ts-node scripts/generate-docs.ts --all
```

**Features:**
- Extracts contract and test code
- Generates GitBook markdown with tabs
- Creates side-by-side contract/test view
- Auto-updates `docs/SUMMARY.md`
- Includes hints and proper formatting

**Example:**
```bash
# Generate docs for single example
ts-node scripts/generate-docs.ts delivery-manager

# Generate all documentation
ts-node scripts/generate-docs.ts --all
```

**Output Format:**
The generator creates GitBook-compatible markdown files in `docs/` with:
- Description and info hints
- Tabbed interface for contract and test code
- Proper syntax highlighting
- Organized by category in SUMMARY.md

## Development Workflow

### Creating a New Example

1. **Write the contract** in `contracts/`
   ```solidity
   // contracts/MyExample.sol
   contract MyExample is ZamaEthereumConfig {
       // Implementation with detailed comments
   }
   ```

2. **Write comprehensive tests** in `test/`
   ```typescript
   // test/MyExample.test.ts
   describe("MyExample", function () {
       // Tests with explanatory comments
       // Include both success and failure scenarios
   });
   ```

3. **Add to script configurations**
   - Update `EXAMPLES_MAP` in `create-fhevm-example.ts`
   - Update `EXAMPLES_CONFIG` in `generate-docs.ts`
   - Update `CATEGORIES` in `create-fhevm-category.ts` if needed

4. **Generate documentation**
   ```bash
   ts-node scripts/generate-docs.ts my-example
   ```

5. **Create standalone repo**
   ```bash
   ts-node scripts/create-fhevm-example.ts my-example ./output/my-example
   ```

### Testing Generated Examples

Always test that generated examples work:
```bash
cd output/my-example
npm install
npm run compile
npm run test
npm run lint
```

## File Structure

```
scripts/
├── README.md                    # This file
├── create-fhevm-example.ts     # Repository generator (TypeScript)
├── create-fhevm-category.ts    # Category project generator (TypeScript)
├── generate-docs.ts            # Documentation generator (TypeScript)
└── deploy.ts                   # Original deployment script
```

**Note:** All automation scripts are written in TypeScript for better type safety and maintainability.

## Configuration

All scripts use TypeScript configuration objects that map example names to their source files:

**create-fhevm-example.ts:**
```typescript
interface ExampleConfig {
  contract: string;
  test: string;
  testFixture?: string;
  description: string;
  category: string;
}

const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  'example-name': {
    contract: 'contracts/Example.sol',
    test: 'test/Example.test.ts',
    description: 'Short description',
    category: 'privacy-delivery',
  },
  // ...
};
```

**generate-docs.ts:**
```typescript
interface DocsConfig {
  title: string;
  description: string;
  contract: string;
  test: string;
  output: string;
  category: string;
}

const EXAMPLES_CONFIG: Record<string, DocsConfig> = {
  'example-name': {
    title: 'Display Title',
    description: 'Full description for docs',
    contract: 'contracts/Example.sol',
    test: 'test/Example.test.ts',
    output: 'docs/example.md',
    category: 'Privacy-Preserving Delivery',
  },
  // ...
};
```

## Contributing

When adding new examples:
1. Ensure contracts include detailed comments explaining FHE concepts
2. Tests should demonstrate both correct usage and common pitfalls
3. Update all three script configurations
4. Test the generated standalone repository
5. Verify documentation renders correctly in GitBook

## Maintenance

When updating `@fhevm/solidity` or other dependencies:
1. Update the base template (if it exists) or main `package.json`
2. Regenerate all examples to ensure compatibility
3. Update documentation if APIs have changed
4. Test all generated examples compile and pass tests

```bash
# Quick regeneration of all docs
ts-node scripts/generate-docs.ts --all
```

## Troubleshooting

**Contract name extraction fails:**
- Ensure contract declaration is on its own line
- Format: `contract ContractName is BaseContract {`

**Generated example doesn't compile:**
- Check that all dependencies are in base template or main package.json
- Verify import paths are correct
- Ensure no template-specific files are referenced

**Documentation missing in SUMMARY.md:**
- Check category name matches existing categories
- Verify output path is in `docs/` directory
- Run generator again without `--no-summary` flag

## NPM Scripts

The following npm scripts are available in `package.json` for convenience:

```bash
# Create examples
npm run create-example <example-name> <output-dir>
npm run create-category <category> <output-dir>

# Generate documentation
npm run generate-docs <example-name>
npm run generate-all-docs

# Show help
npm run help:example
npm run help:category
npm run help:docs
```

## License

BSD-3-Clause-Clear License - See LICENSE file for details.
