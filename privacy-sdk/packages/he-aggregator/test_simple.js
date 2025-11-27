const snarkjs = require("snarkjs");
const fs = require("fs");

async function main() {
  console.log("Reading input...");
  const input = JSON.parse(fs.readFileSync("./circuits/input.json", "utf8"));
  
  console.log("\nInput:", input);
  
  console.log("\n=== Generating proof ===");
  try {
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "./circuits/transfer_js/transfer.wasm",
      "./circuits/transfer_final.zkey"
    );
    
    console.log("✅ Proof generated!");
    console.log("Public signals:", publicSignals);
    
    console.log("\n=== Verifying proof ===");
    const vKey = JSON.parse(fs.readFileSync("./circuits/verification_key.json", "utf8"));
    const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    
    if (verified) {
      console.log("✅ Proof verified successfully!");
    } else {
      console.log("❌ Proof verification failed!");
    }
  } catch (error) {
    console.error("Error:", error.message);
    console.error("\nMake sure these files exist:");
    console.error("- ./circuits/transfer_js/transfer.wasm");
    console.error("- ./circuits/transfer_final.zkey");
    console.error("- ./circuits/verification_key.json");
  }
}

main().catch(console.error);