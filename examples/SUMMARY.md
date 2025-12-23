# FHEVM Example Hub - Table of Contents

## Introduction

* [Welcome to FHEVM Examples](README.md)
* [Getting Started](getting-started.md)
* [FHEVM Fundamentals](fhevm-fundamentals.md)

## Basic Examples

* [FHE Counter](basic/fhe-counter.md)
  * Simple encrypted counter
  * Demonstrates euint32 and basic operations
  * Access control basics
* [Encryption Patterns](basic/encryption.md)
  * Single value encryption
  * Multiple values encryption
  * Input proofs explained
  * Common encryption pitfalls
* [Access Control](basic/access-control.md)
  * FHE.allow() patterns
  * FHE.allowThis() requirements
  * Permission management
  * Sharing encrypted data

## Arithmetic Operations

* [FHE Addition](operations/fhe-add.md)
* [FHE Subtraction](operations/fhe-sub.md)
* [FHE Multiplication](operations/fhe-mul.md)
* [FHE Comparison](operations/fhe-compare.md)
  * Equal (FHE.eq)
  * Greater than (FHE.gt, FHE.gte)
  * Less than (FHE.lt, FHE.lte)

## Decryption Patterns

* [User Decryption - Single Value](decryption/user-decrypt-single.md)
* [User Decryption - Multiple Values](decryption/user-decrypt-multiple.md)
* [Public Decryption](decryption/public-decrypt.md)
* [Gateway Integration](decryption/gateway.md)

## Advanced Examples

* [Confidential Raw Materials Trading](advanced/raw-materials-trading.md)
  * B2B marketplace
  * Multi-party encrypted matching
  * Complex business logic with FHE
  * Production-grade implementation
* [Blind Auction](advanced/blind-auction.md)
  * Sealed-bid auctions
  * Winner determination
  * Privacy-preserving bidding
* [Confidential Voting](advanced/voting.md)
  * Anonymous voting
  * Encrypted tallying
  * Result verification

## OpenZeppelin Integration

* [ERC7984 - Confidential Tokens](openzeppelin/erc7984.md)
* [Confidential ERC20 Wrapper](openzeppelin/erc20-wrapper.md)
* [Token Swaps](openzeppelin/swaps.md)
* [Vesting Wallet](openzeppelin/vesting.md)

## Common Pitfalls & Anti-Patterns

* [View Function Mistakes](pitfalls/view-functions.md)
* [Missing Permissions](pitfalls/permissions.md)
* [Input Proof Errors](pitfalls/input-proofs.md)
* [Type Mismatches](pitfalls/types.md)
* [Comparison Mistakes](pitfalls/comparisons.md)

## Best Practices

* [Smart Contract Patterns](best-practices/contract-patterns.md)
* [Testing FHE Contracts](best-practices/testing.md)
* [Gas Optimization](best-practices/gas-optimization.md)
* [Security Guidelines](best-practices/security.md)

## Developer Tools

* [Automation Scripts](tools/automation.md)
  * create-fhevm-example
  * create-fhevm-category
  * generate-docs
* [Deployment Guide](tools/deployment.md)
* [Testing Framework](tools/testing.md)
* [Documentation Generation](tools/documentation.md)

## Reference

* [API Reference](reference/api.md)
* [FHE Operations](reference/fhe-operations.md)
* [Type System](reference/types.md)
* [Configuration](reference/configuration.md)
* [FAQ](reference/faq.md)

## Resources

* [Zama Documentation](https://docs.zama.ai/fhevm)
* [FHEVM GitHub](https://github.com/zama-ai/fhevm)
* [Community Forum](https://community.zama.ai)
* [Discord Channel](https://discord.gg/zama)
