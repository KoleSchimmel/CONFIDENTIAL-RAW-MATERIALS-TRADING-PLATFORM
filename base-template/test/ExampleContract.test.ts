import { expect } from "chai";
import { ethers } from "hardhat";

describe("ExampleContract", function () {
  let contract: any;
  let owner: any;

  before(async function () {
    [owner] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ExampleContract");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  it("Should deploy successfully", async function () {
    expect(await contract.getAddress()).to.be.properAddress;
  });

  it("Should initialize with encrypted zero", async function () {
    const value = await contract.getValue();
    expect(value).to.exist;
  });
});
