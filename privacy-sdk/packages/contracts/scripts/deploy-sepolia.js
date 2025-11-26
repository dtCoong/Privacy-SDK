const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Starting deployment to Sepolia...");

  // 1. Deploy Verifier
  const Verifier = await hre.ethers.getContractFactory("Groth16Verifier");
  const verifier = await Verifier.deploy();
  await verifier.deployed();
  console.log("Verifier deployed to:", verifier.address);

  // 2. Deploy Registry
  const Registry = await hre.ethers.getContractFactory("TransactionRegistry");
  const registry = await Registry.deploy(verifier.address);
  await registry.deployed();
  console.log("TransactionRegistry deployed to:", registry.address);

  // write addresses to file for integration tests / tracking
  const out = { verifier: verifier.address, registry: registry.address };
  try {
    fs.writeFileSync("packages/contracts/scripts/last-deploy.json", JSON.stringify(out, null, 2));
    console.log("Wrote packages/contracts/scripts/last-deploy.json");
  } catch (e) {
    console.warn("Could not write packages/contracts/scripts/last-deploy.json", e.message || e);
  }

  // 3. Optional: verify contracts on Etherscan (requires ETHERSCAN_API_KEY env var)
  const etherscanKey =
    process.env.ETHERSCAN_API_KEY || process.env.SEPOLIA_ETHERSCAN_API_KEY;
  if (etherscanKey) {
    console.log(
      "ETHERSCAN_API_KEY detected — attempting contract verification (may take a few minutes)..."
    );
    try {
      // verify verifier first
      await hre.run("verify:verify", {
        address: verifier.address,
        constructorArguments: [],
      });
      // verify registry with constructor args
      await hre.run("verify:verify", {
        address: registry.address,
        constructorArguments: [verifier.address],
      });
      console.log("✅ Verification submitted to Etherscan");
    } catch (err) {
      console.warn(
        "Verification failed or timed out (you can retry manually):",
        err.message || err
      );
    }
  } else {
    console.log(
      "No ETHERSCAN_API_KEY found — skipping Etherscan verification."
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
