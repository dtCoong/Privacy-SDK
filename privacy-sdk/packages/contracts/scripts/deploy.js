const hre = require("hardhat");

async function main() {
  console.log("Deploying TransactionRegistry...");

  const TransactionRegistry = await hre.ethers.getContractFactory("TransactionRegistry");
  const registry = await TransactionRegistry.deploy();

  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("TransactionRegistry deployed to:", address);
  console.log("Current root:", await registry.currentRoot());
  console.log("Next leaf index:", await registry.nextLeafIndex());

  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });