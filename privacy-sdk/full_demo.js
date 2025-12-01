const { execSync } = require("child_process");
const path = require("path");

function runStep(name, cwd, cmd) {
  console.log("\n======================================");
  console.log("▶ " + name);
  console.log("======================================\n");
  console.log(`$ (cwd=${cwd}) ${cmd}\n`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

const root = __dirname;

try {
  // PERSON 3: Circuits + ZK Proof + Ring Signature
  runStep(
    "Person3 – Circuits + ZK Proof + Ring Signature",
    path.join(root, "packages", "circuits", "scripts"),
    "node generateProof.js"
  );

  // PERSON 5: HE Aggregator (logic + ZK proof)
  runStep(
    "Person5 – HE Aggregator (logic + ZK proof)",
    path.join(root, "packages", "he-aggregator"),
    "node run_all.js"
  );

  // PERSON 4: Privacy Mixer – Security Test Suite
  runStep(
    "Person4 – Privacy Mixer Security Tests",
    path.join(root, "packages", "privacy-mixer"),
    "node src/test_security.js"
  );

  // PERSON 2: Smart Contracts – TransactionRegistry Tests
  runStep(
    "Person2 – Smart Contracts (TransactionRegistry)",
    path.join(root, "packages", "contracts"),
    "npx hardhat test"
  );

  console.log("\n✅ FULL DEMO HOÀN TẤT – TẤT CẢ PACKAGE ĐÃ CHẠY XONG.\n");
} catch (e) {
  console.error("\n❌ FULL DEMO DỪNG DO LỖI:\n");
  console.error(e.message);
  console.error("\n");
}
