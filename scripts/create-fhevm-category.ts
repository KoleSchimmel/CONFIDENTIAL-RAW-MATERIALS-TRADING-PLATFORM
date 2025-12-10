/**
 * Create FHEVM Category Examples Script
 *
 * This script generates all examples for a specific category
 * (basic, encryption, user-decryption, public-decryption, access-control, etc.)
 *
 * Usage: ts-node scripts/create-fhevm-category.ts --category basic
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

interface CategoryExamples {
  category: string;
  description: string;
  examples: ExampleDefinition[];
}

interface ExampleDefinition {
  name: string;
  title: string;
  description: string;
  concepts: string[];
}

/**
 * Category definitions with example specifications
 */
const CATEGORIES: Record<string, CategoryExamples> = {
  basic: {
    category: "basic",
    description: "Basic FHEVM concepts and operations",
    examples: [
      {
        name: "fhe-counter",
        title: "FHE Counter",
        description: "Simple counter using encrypted values",
        concepts: ["euint32", "FHE.add", "FHE.sub", "Access Control"],
      },
      {
        name: "fhe-arithmetic",
        title: "FHE Arithmetic",
        description: "Encrypted arithmetic operations",
        concepts: ["euint32", "euint64", "FHE.add", "FHE.sub", "FHE.mul"],
      },
      {
        name: "fhe-equality",
        title: "FHE Equality",
        description: "Encrypted equality comparison",
        concepts: ["euint32", "FHE.eq", "ebool"],
      },
    ],
  },
  encryption: {
    category: "encryption",
    description: "Encryption patterns and data protection",
    examples: [
      {
        name: "encrypt-single-value",
        title: "Encrypt Single Value",
        description: "Encrypting a single plaintext value",
        concepts: ["FHE.asEuint32", "FHE.asEuint64", "Permission Grant"],
      },
      {
        name: "encrypt-multiple-values",
        title: "Encrypt Multiple Values",
        description: "Encrypting multiple values in one transaction",
        concepts: ["Batch Encryption", "Permission Management", "Gas Optimization"],
      },
    ],
  },
  "user-decryption": {
    category: "user-decryption",
    description: "User-controlled decryption patterns",
    examples: [
      {
        name: "user-decrypt-single",
        title: "User Decrypt Single Value",
        description: "Allow user to decrypt a single encrypted value",
        concepts: ["FHE.allow", "Async Decryption", "Access Control"],
      },
      {
        name: "user-decrypt-multiple",
        title: "User Decrypt Multiple Values",
        description: "Decrypt multiple values after specific conditions",
        concepts: [
          "Multi-value Decryption",
          "Permission Grants",
          "Conditional Access",
        ],
      },
    ],
  },
  "public-decryption": {
    category: "public-decryption",
    description: "Public decryption and result revelation",
    examples: [
      {
        name: "public-decrypt-single",
        title: "Public Decrypt Single Value",
        description: "Decrypt a single value publicly",
        concepts: ["Public Results", "Event Logging", "Result Revelation"],
      },
      {
        name: "public-decrypt-multiple",
        title: "Public Decrypt Multiple Values",
        description: "Decrypt multiple values publicly",
        concepts: ["Batch Decryption", "Public Results", "Transparency"],
      },
    ],
  },
  "access-control": {
    category: "access-control",
    description: "Access control and permission management",
    examples: [
      {
        name: "fhe-allow-pattern",
        title: "FHE Allow Pattern",
        description: "Using FHE.allow() for permission grants",
        concepts: ["FHE.allow", "FHE.allowThis", "Access Control"],
      },
      {
        name: "fhe-allow-transient",
        title: "FHE Allow Transient",
        description: "Transient permission grants",
        concepts: ["FHE.allowTransient", "Temporary Access", "Scope Limiting"],
      },
      {
        name: "input-proof",
        title: "Input Proof Verification",
        description: "Validating encrypted input proofs",
        concepts: ["Input Validation", "Proof Verification", "Security"],
      },
    ],
  },
  "anti-patterns": {
    category: "anti-patterns",
    description: "Common mistakes and how to avoid them",
    examples: [
      {
        name: "avoid-view-functions",
        title: "Avoid View Functions with Encrypted Values",
        description: "Why encrypted values cannot be used in view functions",
        concepts: [
          "View Functions",
          "Encrypted Values",
          "Limitations",
          "Workarounds",
        ],
      },
      {
        name: "avoid-permission-mistakes",
        title: "Avoid Permission Mistakes",
        description: "Common permission management errors",
        concepts: ["FHE.allowThis", "Access Control", "Security Pitfalls"],
      },
      {
        name: "avoid-type-casting",
        title: "Avoid Type Casting Encrypted Values",
        description: "Why casting encrypted values is unsafe",
        concepts: [
          "Type Safety",
          "euint Types",
          "Casting Pitfalls",
          "Best Practices",
        ],
      },
    ],
  },
  handles: {
    category: "handles",
    description: "Understanding and working with handles",
    examples: [
      {
        name: "handle-generation",
        title: "Handle Generation",
        description: "How FHE handles are created and managed",
        concepts: ["Handle Creation", "Symbolic Execution", "Type System"],
      },
      {
        name: "handle-lifecycle",
        title: "Handle Lifecycle",
        description: "Understanding handle lifecycle in transactions",
        concepts: ["Handle Scope", "Persistence", "Access Rights"],
      },
    ],
  },
};

/**
 * Parse command line arguments
 */
function parseArguments(): { category: string; outputDir: string } {
  const args = process.argv.slice(2);
  let category = "";
  let outputDir = "./examples";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--category" && i + 1 < args.length) {
      category = args[i + 1];
      i++;
    } else if (args[i] === "--output" && i + 1 < args.length) {
      outputDir = args[i + 1];
      i++;
    }
  }

  return { category, outputDir };
}

/**
 * Display available categories
 */
function displayCategories(): void {
  console.log("Available categories:\n");
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    console.log(`  ${key}: ${cat.description}`);
    console.log(`    Examples: ${cat.examples.length}`);
    for (const example of cat.examples) {
      console.log(`      - ${example.title}`);
    }
    console.log();
  }
}

/**
 * Create example using create-fhevm-example.ts
 */
function createExampleProject(
  example: ExampleDefinition,
  outputDir: string
): void {
  const exampleDir = path.join(outputDir, example.name);
  const cmd = `npx ts-node scripts/create-fhevm-example.ts --name "${example.name}" --category "${example.name}" --description "${example.description}" --output "${exampleDir}"`;

  console.log(`Creating: ${example.title}...`);
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`✓ Created ${example.title}\n`);
  } catch (error) {
    console.error(`✗ Failed to create ${example.title}`);
    console.error(error);
  }
}

/**
 * Generate category index file
 */
function generateCategoryIndex(
  categoryExamples: CategoryExamples,
  outputDir: string
): void {
  const categoryDir = path.join(outputDir, categoryExamples.category);
  if (!fs.existsSync(categoryDir)) {
    fs.mkdirSync(categoryDir, { recursive: true });
  }

  const index = `# ${categoryExamples.category.toUpperCase()} Examples

## Category Description

${categoryExamples.description}

## Examples Included

${categoryExamples.examples
  .map(
    (ex) => `
### ${ex.title}

**Directory**: \`./${ex.name}\`

**Description**: ${ex.description}

**Concepts Covered**:
${ex.concepts.map((c) => `- ${c}`).join("\n")}

\`\`\`bash
cd ${ex.name}
npm install
npm test
npm run deploy -- --network sepolia
\`\`\`
`
  )
  .join("\n")}

## Getting Started

1. Choose an example from the list above
2. Navigate to the example directory
3. Install dependencies: \`npm install\`
4. Review the contract and tests
5. Run tests: \`npm test\`
6. Deploy to testnet: \`npm run deploy -- --network sepolia\`

## Learning Path

Recommended learning progression:
1. Start with basic examples to understand FHE concepts
2. Move to encryption and decryption patterns
3. Explore access control and permissions
4. Study anti-patterns to avoid common mistakes
5. Understand handles and their lifecycle

## Resources

- [FHEVM Documentation](https://docs.zama.ai/)
- [Main Example Hub](../README.md)
- [Developer Guide](../docs/DEVELOPER_GUIDE.md)

---

**Category**: ${categoryExamples.category}
**Last Updated**: $(date +%Y-%m-%d)
`;

  const indexPath = path.join(
    categoryDir,
    "INDEX.md"
  );
  fs.writeFileSync(indexPath, index);
  console.log(`✓ Created category index: ${indexPath}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("🎯 Creating FHEVM Category Examples...\n");

  const { category, outputDir } = parseArguments();

  if (!category) {
    console.log("No category specified. Available categories:\n");
    displayCategories();
    console.log("Usage: ts-node scripts/create-fhevm-category.ts --category <category>\n");
    process.exit(1);
  }

  const categoryExamples = CATEGORIES[category.toLowerCase()];

  if (!categoryExamples) {
    console.error(`❌ Unknown category: ${category}`);
    console.log("\nAvailable categories:");
    displayCategories();
    process.exit(1);
  }

  console.log(
    `📚 Creating examples for category: ${categoryExamples.category}\n`
  );
  console.log(`Description: ${categoryExamples.description}\n`);
  console.log(
    `Total examples to create: ${categoryExamples.examples.length}\n`
  );

  // Create main output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create each example
  for (const example of categoryExamples.examples) {
    createExampleProject(example, outputDir);
  }

  // Generate category index
  generateCategoryIndex(categoryExamples, outputDir);

  console.log(`
✅ Category examples created successfully!

Location: ${outputDir}/${categoryExamples.category}/

Next steps:
1. Review the INDEX.md file for all examples
2. Choose an example to start with
3. Follow the getting started instructions
4. Explore the contract and tests
5. Deploy and test on Sepolia testnet

Category Index: ${outputDir}/${categoryExamples.category}/INDEX.md
  `);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
