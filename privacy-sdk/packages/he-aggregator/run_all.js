const { generateInput } = require("./generate_input");
const { testLogic } = require("./test_logic");
const { execSync } = require("child_process");
const fs = require("fs");

async function runAll(options = {}) {
  const { 
    skipCompile = false,
    skipProof = false 
  } = options;

  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║         Privacy SDK - HE Aggregator Test Suite           ║");
  console.log("╚═══════════════════════════════════════════════════════════╝\n");

  try {
    // Step 1: Generate input
    console.log("📝 STEP 1: Generating test input data...");
    const input = await generateInput();
    
    // Step 2: Test logic
    console.log("\n" + "─".repeat(60));
    console.log("🧪 STEP 2: Testing logic (without ZK proof)...");
    const logicPassed = await testLogic(input);
    
    if (!logicPassed) {
      throw new Error("Logic test failed! Fix errors before compiling circuit.");
    }

    // Step 3: Check if circuit files exist
    console.log("\n" + "─".repeat(60));
    console.log("🔍 STEP 3: Checking circuit files...");
    
    const wasmExists = fs.existsSync("./circuits/transfer_js/transfer.wasm");
    const zkeyExists = fs.existsSync("./circuits/transfer_final.zkey");
    const vkeyExists = fs.existsSync("./circuits/verification_key.json");
    
    console.log("   WASM file:", wasmExists ? "✅" : "❌");
    console.log("   ZKey file:", zkeyExists ? "✅" : "❌");
    console.log("   VKey file:", vkeyExists ? "✅" : "❌");

    // Step 4: Compile if needed
    if (!wasmExists || !zkeyExists || !vkeyExists) {
      if (skipCompile) {
        console.log("\n⚠️  Circuit files missing but skipCompile=true");
        console.log("   Skipping ZK proof test...");
        skipProof = true;
      } else {
        console.log("\n⚙️  STEP 4: Compiling circuit...");
        console.log("   (This may take a few minutes...)");
        try {
          execSync("npm run build", { stdio: "inherit" });
          console.log("   ✅ Circuit compiled successfully!");
        } catch (error) {
          console.log("   ❌ Circuit compilation failed!");
          throw error;
        }
      }
    } else {
      console.log("\n✅ STEP 4: Circuit files ready!");
    }

    // Step 5: Test with actual ZK proof
    if (!skipProof && wasmExists && zkeyExists && vkeyExists) {
      console.log("\n" + "─".repeat(60));
      console.log("🔐 STEP 5: Testing with ZK proof...");
      
      try {
        execSync("node test_simple.js", { stdio: "inherit" });
        console.log("\n✅ ZK proof test completed!");
      } catch (error) {
        console.log("\n❌ ZK proof test failed!");
        throw error;
      }
    } else if (skipProof) {
      console.log("\n⏭️  STEP 5: Skipped ZK proof test");
    }

    // Final summary
    console.log("\n" + "═".repeat(60));
    console.log("📊 FINAL SUMMARY");
    console.log("═".repeat(60));
    console.log("✓ Input generated:  ./circuits/input.json");
    console.log("✓ Logic tested:     ✅ PASSED");
    
    if (!skipProof && wasmExists && zkeyExists && vkeyExists) {
      console.log("✓ ZK proof tested:  ✅ PASSED");
    } else {
      console.log("✓ ZK proof tested:  ⏭️  SKIPPED");
    }
    
    console.log("\n💡 Next steps:");
    if (!wasmExists || !zkeyExists) {
      console.log("   1. Run: npm run build (to compile circuit)");
      console.log("   2. Run: npm run test:all (to test with ZK proof)");
    } else {
      console.log("   1. Integrate with Solana program");
      console.log("   2. Deploy to devnet");
      console.log("   3. Test end-to-end flow");
    }
    console.log("═".repeat(60) + "\n");
    
    process.exit(0);
    
  } catch (error) {
    console.error("\n💥 FATAL ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Parse command line args
const args = process.argv.slice(2);
const options = {
  skipCompile: args.includes("--skip-compile"),
  skipProof: args.includes("--skip-proof")
};

runAll(options);