// 1. Dùng 'require' thay vì 'import'
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Đang lấy ContractFactory (dùng hre.ethers)...");

  // 2. Lấy contract (tên "TransactionRegistry" phải khớp)
  // Deploy a mock verifier for local development/tests
  const MockVerifier = await hre.ethers.getContractFactory("MockVerifier");
  console.log("Đang deploy MockVerifier (local)...");
  const mock = await MockVerifier.deploy();
  await mock.deployed();
  console.log(`MockVerifier deployed at: ${mock.address}`);

  const RegistryFactory = await hre.ethers.getContractFactory(
    "TransactionRegistry"
  );
  console.log("Đang deploy contract TransactionRegistry with mock verifier...");
  const registry = await RegistryFactory.deploy(mock.address);
  await registry.deployed();
  console.log(
    `✅ Hoàn thành! TransactionRegistry deployed at: ${registry.address}`
  );
  // Write addresses to a file for integration tests
  const out = {
    verifier: mock.address,
    registry: registry.address,
  };
  // write to contracts package scripts folder
  fs.writeFileSync("packages/contracts/scripts/last-deploy.json", JSON.stringify(out, null, 2));
  console.log("Wrote packages/contracts/scripts/last-deploy.json with deployed addresses.");
}

// 5. Cú pháp chạy script chuẩn của v2
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
