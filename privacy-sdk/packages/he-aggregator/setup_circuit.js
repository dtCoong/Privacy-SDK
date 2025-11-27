const { execSync } = require("child_process");
const fs = require("fs");
const https = require("https");

async function downloadPtau() {
  const ptauPath = "./powersOfTau28_hez_final_12.ptau";
  
  if (fs.existsSync(ptauPath)) {
    const stats = fs.statSync(ptauPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    // Check if file is valid (should be around 50MB for power 12)
    if (stats.size > 1000000) {  // At least 1MB to be valid
      console.log(`   ✓ Powers of Tau file already exists (${sizeMB} MB)`);
      return ptauPath;
    } else {
      console.log("   ⚠️  Existing ptau file is too small, re-downloading...");
      fs.unlinkSync(ptauPath);
    }
  }

  console.log("   📥 Downloading Powers of Tau file (this may take 2-5 minutes)...");
  console.log("   Using alternative download method with PowerShell...");
  
  // Use PowerShell Invoke-WebRequest for reliable download
  const { execSync: exec } = require("child_process");
  try {
    // Try Google Cloud Storage mirror first (more reliable)
    exec(`powershell -Command "Invoke-WebRequest -Uri 'https://storage.googleapis.com/zkevm/ptau/powersOfTau28_hez_final_12.ptau' -OutFile '${ptauPath}'"`, {
      stdio: "inherit"
    });
    
    const stats = fs.statSync(ptauPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n   ✓ Download complete! (${sizeMB} MB)`);
    return ptauPath;
  } catch (error) {
    console.log("   ⚠️  Google Cloud download failed, trying Hermez...");
    try {
      exec(`powershell -Command "Invoke-WebRequest -Uri 'https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau' -OutFile '${ptauPath}'"`, {
        stdio: "inherit"
      });
      const stats = fs.statSync(ptauPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`\n   ✓ Download complete! (${sizeMB} MB)`);
      return ptauPath;
    } catch (err2) {
      throw new Error("Failed to download Powers of Tau file from all sources. Please download manually from: https://github.com/iden3/snarkjs#7-prepare-phase-2");
    }
  }
}

async function setupCircuit() {
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║          Circuit Setup - One-time Setup Process           ║");
  console.log("║   This will compile the circuit and generate ZK keys      ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  const startTime = Date.now();

  try {
    // Check if circom is installed
    console.log("🔍 Checking prerequisites...");
    try {
      execSync("circom --version", { stdio: "pipe" });
      console.log("   ✓ Circom installed");
    } catch {
      throw new Error("Circom not found! Install: https://docs.circom.io/getting-started/installation/");
    }

    try {
      const result = execSync("snarkjs --version", { stdio: "pipe", encoding: "utf8" });
      console.log("   ✓ SnarkJS installed");
    } catch (error) {
      // SnarkJS returns exit code 1 but still outputs version info
      if (error.stdout && error.stdout.includes("snarkjs")) {
        console.log("   ✓ SnarkJS installed");
      } else {
        throw new Error("SnarkJS not found! Run: npm install -g snarkjs");
      }
    }
    console.log();

    // Step 1: Create directories
    console.log("📁 STEP 1: Creating directories...");
    fs.mkdirSync("./circuits", { recursive: true });
    console.log("   ✓ Directories created\n");

    // Step 2: Compile circuit
    console.log("⚙️  STEP 2: Compiling circuit...");
    console.log("   This may take 30-60 seconds...");
    
    // Check if circuit file exists
    if (!fs.existsSync("circuits/transfer.circom")) {
      throw new Error("Circuit file not found: circuits/transfer.circom");
    }
    
    // Use local node_modules only (not workspace root to avoid duplicates)
    execSync(`circom circuits/transfer.circom --r1cs --wasm --sym -o ./circuits -l node_modules`, { 
      stdio: "inherit" 
    });
    console.log("   ✓ Circuit compiled successfully\n");

    // Step 3: Download Powers of Tau
    console.log("📥 STEP 3: Getting Powers of Tau file...");
    const ptauPath = await downloadPtau();
    console.log();

    // Step 4: Groth16 Setup
    console.log("🔐 STEP 4: Running Groth16 trusted setup...");
    console.log("   This may take 1-2 minutes...");
    execSync(
      `snarkjs groth16 setup circuits/transfer.r1cs ${ptauPath} circuits/transfer_0000.zkey`,
      { stdio: "inherit" }
    );
    console.log("   ✓ Setup complete\n");

    // Step 5: Contribute to ceremony
    console.log("🎲 STEP 5: Contributing to ceremony...");
    console.log("   Generating random entropy...");
    const entropy = require("crypto").randomBytes(32).toString("hex");
    execSync(
      `snarkjs zkey contribute circuits/transfer_0000.zkey circuits/transfer_final.zkey --name="First Contributor" -v -e="${entropy}"`,
      { stdio: "inherit" }
    );
    console.log("   ✓ Contribution complete\n");

    // Step 6: Export verification key
    console.log("🔑 STEP 6: Exporting verification key...");
    execSync(
      "snarkjs zkey export verificationkey circuits/transfer_final.zkey circuits/verification_key.json",
      { stdio: "inherit" }
    );
    console.log("   ✓ Verification key exported\n");

    // Step 7: Cleanup intermediate files
    console.log("🧹 STEP 7: Cleaning up...");
    try {
      fs.unlinkSync("circuits/transfer_0000.zkey");
      console.log("   ✓ Removed intermediate files\n");
    } catch (e) {
      console.log("   ⚠️  Could not remove intermediate files\n");
    }

    // Calculate time
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);

    // Final check
    console.log("═".repeat(60));
    console.log("✅ Circuit setup completed successfully!");
    console.log("═".repeat(60));
    console.log(`⏱️  Total time: ${elapsedTime} seconds\n`);
    console.log("📁 Generated files:");
    
    const files = [
      { path: "circuits/transfer.r1cs", desc: "R1CS constraints" },
      { path: "circuits/transfer_js/transfer.wasm", desc: "WASM witness generator" },
      { path: "circuits/transfer_final.zkey", desc: "Proving key" },
      { path: "circuits/verification_key.json", desc: "Verification key" }
    ];

    files.forEach(({ path, desc }) => {
      if (fs.existsSync(path)) {
        const size = (fs.statSync(path).size / 1024).toFixed(1);
        console.log(`   ✓ ${path} (${size} KB) - ${desc}`);
      }
    });

    console.log("\n💡 Next steps:");
    console.log("   1. Generate test input:  npm run generate");
    console.log("   2. Test logic:           npm run test:logic");
    console.log("   3. Test ZK proof:        npm run test:proof");
    console.log("   4. Run full test suite:  npm run test:all");
    console.log("═".repeat(60) + "\n");

  } catch (error) {
    console.error("\n" + "═".repeat(60));
    console.error("❌ Setup failed!");
    console.error("═".repeat(60));
    console.error("\nError:", error.message);
    
    if (error.message.includes("Circom not found")) {
      console.error("\n📖 Installation guide:");
      console.error("   Windows: https://docs.circom.io/getting-started/installation/#installing-dependencies");
      console.error("   Run: cargo install circom");
    } else if (error.message.includes("SnarkJS not found")) {
      console.error("\n📖 Installation:");
      console.error("   Run: npm install -g snarkjs");
    }
    
    console.error("\n💡 Troubleshooting:");
    console.error("   1. Make sure circuits/transfer.circom exists");
    console.error("   2. Check circom and snarkjs are installed");
    console.error("   3. Try running steps manually");
    console.error("═".repeat(60) + "\n");
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupCircuit();
}

module.exports = { setupCircuit };