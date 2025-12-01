const { execSync } = require("child_process");
const path = require("path");

// Usage: node generate-verifier.js path/to/circuit_final.zkey output/Verifier.sol
const zkey = process.argv[2];
const out =
  process.argv[3] || path.join(process.cwd(), "contracts", "Verifier.sol");

if (!zkey) {
  console.error("Provide path to .zkey");
  process.exit(1);
}

// ensure snarkjs is available (global or local node_modules/.bin)
const cmd = `npx snarkjs zkey export solidityverifier ${zkey} ${out}`;
console.log("Running:", cmd);
execSync(cmd, { stdio: "inherit" });
console.log("Wrote verifier to", out);
