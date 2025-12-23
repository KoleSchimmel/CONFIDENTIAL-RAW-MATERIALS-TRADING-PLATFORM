import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // This deployment script will be updated by the example generator
  console.log("Deploying contracts with the account:", deployer);

  // Deployment logic will be added here
};

export default func;
func.id = "deploy_example";
func.tags = ["example"];
