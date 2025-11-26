// File: scripts/deploy-all.js
const hre = require("hardhat");

async function main() {
  // 1. Deploy Verifier trước
  console.log("Đang deploy Groth16Verifier.sol...");
  const VerifierFactory = await hre.ethers.getContractFactory(
    "Groth16Verifier"
  );
  const verifier = await VerifierFactory.deploy();
  await verifier.deployed();
  const verifierAddress = verifier.address; // Lấy địa chỉ
  console.log(`✅ Groth16Verifier deployed tại: ${verifierAddress}`);

  // 2. Deploy TransactionRegistry, truyền địa chỉ Verifier vào constructor
  console.log("Đang deploy TransactionRegistry.sol (liên kết với Verifier)...");
  const RegistryFactory = await hre.ethers.getContractFactory(
    "TransactionRegistry"
  );
  const registry = await RegistryFactory.deploy(verifierAddress); // <--- Truyền địa chỉ vào đây
  await registry.deployed();
  const registryAddress = registry.address; // Lấy địa chỉ
  console.log(`✅ TransactionRegistry deployed tại: ${registryAddress}`);

  console.log("\n--- HOÀN THÀNH DEPLOY ---");
  console.log("Verifier Address:", verifierAddress);
  console.log("Registry Address:", registryAddress);
}

main().catch((error) => console.error(error) && process.exit(1));
