import { ethers } from "hardhat";

/**
 * Gets test signers with consistent naming
 */
export async function getSigners() {
  const [owner, user1, user2, user3, user4] = await ethers.getSigners();

  return {
    owner,
    user1,
    user2,
    user3,
    user4,
  };
}
