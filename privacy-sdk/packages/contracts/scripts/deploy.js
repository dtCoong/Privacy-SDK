const hre = require("hardhat");

async function main() {
  console.log("Deploying TransactionRegistry...");

  // 1) Deploy MockVerifier trước (dùng như Verifier giả)
  const Verifier = await hre.ethers.getContractFactory("MockVerifier");
  const verifier = await Verifier.deploy();
  await verifier.waitForDeployment();

  const verifierAddress = await verifier.getAddress();
  console.log("MockVerifier deployed to:", verifierAddress);

  // 2) Deploy TransactionRegistry với địa chỉ verifier ở trên
  const Registry = await hre.ethers.getContractFactory("TransactionRegistry");
  const registry = await Registry.deploy(verifierAddress);
  await registry.waitForDeployment();

  const registryAddress = await registry.getAddress();
  console.log("TransactionRegistry deployed to:", registryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
