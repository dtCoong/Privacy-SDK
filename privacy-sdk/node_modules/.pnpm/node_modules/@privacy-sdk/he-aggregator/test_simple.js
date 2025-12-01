const { generateInput } = require("./generate_input");
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function createPrivateTransaction() {
  console.log("=== ZK PROOF TEST (he-aggregator) ===");

  const input = await generateInput();

  const wasmPath = path.join(__dirname, "circuits", "transfer_js", "transfer.wasm");
  const zkeyPath = path.join(__dirname, "circuits", "transfer_final.zkey");

  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    wasmPath,
    zkeyPath
  );

  const vKeyPath = path.join(__dirname, "circuits", "verification_key.json");
  const vKey = JSON.parse(fs.readFileSync(vKeyPath, "utf8"));

  const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  console.log("Proof verified:", verified);

  if (!verified) {
    throw new Error("Proof verification failed");
  }

  return { proof, publicSignals };
}

createPrivateTransaction()
  .then(() => {
    console.log("✓ ZK proof test passed.");
  })
  .catch((err) => {
    console.error("ZK proof test failed:", err);
    process.exit(1);
  });
