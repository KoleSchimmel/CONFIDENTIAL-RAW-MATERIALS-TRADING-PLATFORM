import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Creates a mock FHEVM instance for testing
 * In production, this would use the actual FHEVM instance from @fhevm/hardhat-plugin
 */
export async function createInstance(contractAddress: string, signer: HardhatEthersSigner) {
  // Mock implementation for testing
  // In real tests with FHEVM, use: await createFhevmInstance()
  return {
    createEncryptedInput: (address: string, userAddress: string) => {
      const values: any[] = [];
      return {
        add32: (value: number) => {
          values.push({ type: 'uint32', value });
          return this;
        },
        add64: (value: number | bigint) => {
          values.push({ type: 'uint64', value });
          return this;
        },
        addAddress: (value: string) => {
          values.push({ type: 'address', value });
          return this;
        },
        encrypt: async () => {
          // Mock encryption - returns handles and proof
          return {
            handles: values.map((_, i) => ethers.randomBytes(32)),
            inputProof: ethers.randomBytes(100),
          };
        },
      };
    },
  };
}
