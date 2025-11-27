const circomlibjs = require("circomlibjs");
const fs = require("fs");

async function testLogic(inputData = null) {
  console.log("\n🧪 Testing transfer logic without ZK proof...\n");
  
  try {
    // Load input from file or use provided data
    const input = inputData || JSON.parse(fs.readFileSync("./circuits/input.json", "utf8"));
    const poseidon = await circomlibjs.buildPoseidon();
    const F = poseidon.F;

    let allPassed = true;

    // 1. Verify commitment
    console.log("1️⃣  Testing Commitment Generation...");
    const commitment = F.toObject(poseidon([BigInt(input.amount), BigInt(input.secret)]));
    console.log("   Computed:", commitment.toString());
    console.log("   ✅ Commitment generated\n");

    // 2. Verify nullifier
    console.log("2️⃣  Testing Nullifier Generation...");
    const nullifier = F.toObject(poseidon([BigInt(input.secret), 1n]));
    const nullifierMatch = nullifier.toString() === input.nullifier;
    console.log("   Computed:", nullifier.toString());
    console.log("   Expected:", input.nullifier);
    console.log("   " + (nullifierMatch ? "✅ PASS" : "❌ FAIL") + "\n");
    if (!nullifierMatch) allPassed = false;

    // 3. Verify Merkle path (FIXED)
    console.log("3️⃣  Testing Merkle Path Verification...");
    let currentHash = commitment;
    for (let i = 0; i < input.pathElements.length; i++) {
      const sibling = BigInt(input.pathElements[i]);
      const index = input.pathIndices[i];
      
      // Fixed: Proper left/right logic
      const left = index === 0 ? currentHash : sibling;
      const right = index === 0 ? sibling : currentHash;
      
      currentHash = F.toObject(poseidon([left, right]));
      console.log(`   Level ${i}: index=${index}, hash=${currentHash.toString().substring(0, 20)}...`);
    }
    
    const rootMatch = currentHash.toString() === input.root;
    console.log("   Computed Root:", currentHash.toString());
    console.log("   Expected Root:", input.root);
    console.log("   " + (rootMatch ? "✅ PASS" : "❌ FAIL") + "\n");
    if (!rootMatch) allPassed = false;

    // 4. Verify amount consistency
    console.log("4️⃣  Testing Amount Consistency...");
    const amount = BigInt(input.amount);
    const outputAmount = BigInt(input.outputAmount);
    const amountCheck = amount >= outputAmount;
    console.log("   Input Amount:", amount.toString());
    console.log("   Output Amount:", outputAmount.toString());
    console.log("   " + (amountCheck ? "✅ PASS" : "❌ FAIL") + "\n");
    if (!amountCheck) allPassed = false;

    // 5. Output commitment
    console.log("5️⃣  Testing Output Commitment...");
    const outputCommitment = F.toObject(poseidon([outputAmount, BigInt(input.outputSecret)]));
    console.log("   Output Commitment:", outputCommitment.toString());
    console.log("   ✅ Generated\n");

    // Final result
    console.log("═".repeat(60));
    if (allPassed) {
      console.log("🎉 ALL TESTS PASSED!");
      console.log("   Circuit logic is correct and ready for ZK proof generation.");
    } else {
      console.log("❌ SOME TESTS FAILED");
      console.log("   Please check the input data or circuit logic.");
    }
    console.log("═".repeat(60));
    
    return allPassed;
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    return false;
  }
}

if (require.main === module) {
  testLogic().catch(console.error);
}

module.exports = { testLogic };