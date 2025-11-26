const { execSync } = require("child_process");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", shell: true, ...opts });
  } catch (err) {
    console.error(`Command failed: ${cmd}`);
    process.exit(err.status || 1);
  }
}

// 1) Run Hardhat tests for contracts (from repo root)
// Use explicit test files to avoid issues with path resolution when invoked via npm scripts.
run(
  "npx hardhat test packages/contracts/test/TransactionRegistry.test.js packages/contracts/test/Verifier.test.js packages/contracts/test/ApplyTransaction.test.js",
  { cwd: repoRoot }
);

// 2) Run core package tests (npm test in packages/core)
run("npm test", { cwd: path.join(repoRoot, "packages", "core") });

console.log("\nAll package tests completed successfully.");
