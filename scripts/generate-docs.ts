/**
 * Generate Documentation Script
 *
 * Automatically generates GitBook-compatible documentation from:
 * - JSDoc comments in test files
 * - Chapter tags in contracts
 * - Code examples
 *
 * Usage: ts-node scripts/generate-docs.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as glob from "glob";

interface DocSection {
  title: string;
  chapter: string;
  content: string;
  examples: CodeExample[];
}

interface CodeExample {
  language: string;
  code: string;
  description: string;
}

/**
 * Extract chapter tag from contract or test file
 * @example @chapter: access-control
 */
function extractChapter(content: string): string | null {
  const match = content.match(/@chapter:\s*(\w+)/);
  return match ? match[1] : null;
}

/**
 * Extract JSDoc comments with code examples
 */
function extractJSDocComments(
  content: string
): Array<{ comment: string; example?: string }> {
  const jsdocRegex = /\/\*\*([\s\S]*?)\*\//g;
  const comments: Array<{ comment: string; example?: string }> = [];

  let match;
  while ((match = jsdocRegex.exec(content)) !== null) {
    const comment = match[1]
      .split("\n")
      .map((line) => line.trim().replace(/^\*\s?/, ""))
      .join("\n");

    comments.push({ comment });
  }

  return comments;
}

/**
 * Extract code examples from comments
 */
function extractCodeExamples(
  comment: string
): Array<{ language: string; code: string }> {
  const exampleRegex = /```(\w+)\n([\s\S]*?)```/g;
  const examples: Array<{ language: string; code: string }> = [];

  let match;
  while ((match = exampleRegex.exec(comment)) !== null) {
    examples.push({
      language: match[1],
      code: match[2].trim(),
    });
  }

  return examples;
}

/**
 * Generate documentation for a single file
 */
function generateFileDocumentation(filePath: string): DocSection | null {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const chapter = extractChapter(content);

    if (!chapter) {
      return null;
    }

    const fileName = path.basename(filePath);
    const jsDocComments = extractJSDocComments(content);

    const examples: CodeExample[] = [];
    for (const jsdoc of jsDocComments) {
      const codeExamples = extractCodeExamples(jsdoc.comment);
      for (const example of codeExamples) {
        examples.push({
          language: example.language,
          code: example.code,
          description: jsdoc.comment.split("\n")[0],
        });
      }
    }

    return {
      title: fileName.replace(/\.(sol|ts)$/, ""),
      chapter,
      content: jsDocComments.map((j) => j.comment).join("\n\n"),
      examples,
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Group documentation sections by chapter
 */
function groupByChapter(sections: DocSection[]): Map<string, DocSection[]> {
  const grouped = new Map<string, DocSection[]>();

  for (const section of sections) {
    if (!grouped.has(section.chapter)) {
      grouped.set(section.chapter, []);
    }
    grouped.get(section.chapter)!.push(section);
  }

  return grouped;
}

/**
 * Generate markdown documentation for a chapter
 */
function generateChapterMarkdown(
  chapter: string,
  sections: DocSection[]
): string {
  let markdown = `# ${chapter.charAt(0).toUpperCase() + chapter.slice(1)} Chapter\n\n`;

  for (const section of sections) {
    markdown += `## ${section.title}\n\n`;
    markdown += section.content + "\n\n";

    if (section.examples.length > 0) {
      markdown += "### Examples\n\n";
      for (const example of section.examples) {
        markdown += `\`\`\`${example.language}\n`;
        markdown += example.code + "\n";
        markdown += "```\n\n";
      }
    }

    markdown += "---\n\n";
  }

  return markdown;
}

/**
 * Generate SUMMARY.md for GitBook
 */
function generateGitBookSummary(chapters: Set<string>): string {
  let summary = "# Summary\n\n";
  summary += "* [Introduction](README.md)\n";
  summary += "* [Overview](overview.md)\n\n";

  for (const chapter of Array.from(chapters).sort()) {
    summary += `* [${chapter.charAt(0).toUpperCase() + chapter.slice(1)}](./${chapter}.md)\n`;
  }

  summary += "\n* [Conclusion](conclusion.md)\n";

  return summary;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log("📖 Generating Documentation...\n");

  const docsDir = path.join(process.cwd(), "docs");
  const contractsDir = path.join(process.cwd(), "contracts");
  const testDir = path.join(process.cwd(), "test");

  // Create docs directory if it doesn't exist
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const sections: DocSection[] = [];

  // Process contract files
  console.log("Scanning contracts...");
  const contractFiles = glob.sync(path.join(contractsDir, "**/*.sol"));
  for (const file of contractFiles) {
    const section = generateFileDocumentation(file);
    if (section) {
      sections.push(section);
      console.log(`  ✓ Processed: ${path.basename(file)}`);
    }
  }

  // Process test files
  console.log("Scanning tests...");
  const testFiles = glob.sync(path.join(testDir, "**/*.ts"));
  for (const file of testFiles) {
    const section = generateFileDocumentation(file);
    if (section) {
      sections.push(section);
      console.log(`  ✓ Processed: ${path.basename(file)}`);
    }
  }

  // Group by chapter
  const groupedSections = groupByChapter(sections);
  console.log(`\nGenerated ${groupedSections.size} chapters\n`);

  // Generate markdown files for each chapter
  for (const [chapter, chapterSections] of groupedSections) {
    const markdown = generateChapterMarkdown(chapter, chapterSections);
    const outputPath = path.join(docsDir, `${chapter}.md`);
    fs.writeFileSync(outputPath, markdown);
    console.log(`✓ Created chapter: ${chapter}.md`);
  }

  // Generate SUMMARY.md for GitBook
  const summary = generateGitBookSummary(groupedSections.keys());
  const summaryPath = path.join(docsDir, "SUMMARY.md");
  fs.writeFileSync(summaryPath, summary);
  console.log(`✓ Created SUMMARY.md`);

  // Generate overview
  const overview = `# Documentation Overview

This documentation is auto-generated from code comments and JSDoc annotations.

## Chapters

${Array.from(groupedSections.keys())
  .sort()
  .map((ch) => `- [${ch.charAt(0).toUpperCase() + ch.slice(1)}](./${ch}.md)`)
  .join("\n")}

## How to Read

1. Start with the introduction
2. Follow the chapters in order
3. Review code examples for each concept
4. Refer to the API documentation

## GitBook Integration

This documentation is compatible with GitBook:

\`\`\`bash
npm install -g gitbook-cli
gitbook serve ./docs
\`\`\`

Then open http://localhost:4000 in your browser.

---

**Generated**: $(date)
`;

  const overviewPath = path.join(docsDir, "overview.md");
  fs.writeFileSync(overviewPath, overview);
  console.log(`✓ Created overview.md`);

  console.log(`
✅ Documentation generated successfully!

Generated files:
  - docs/SUMMARY.md (GitBook index)
  - docs/overview.md (Overview)
  - docs/*.md (Chapter files)

To view with GitBook:
  npm install -g gitbook-cli
  gitbook serve ./docs

Open http://localhost:4000 in your browser
  `);
}

main().catch((error) => {
  console.error("❌ Error generating documentation:", error);
  process.exit(1);
});
