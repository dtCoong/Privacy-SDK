const circomlibjs = require("circomlibjs");
const fs = require("fs");
const crypto = require("crypto");

async function generateInput() {
  console.log("🔧 Generating test input data...\n");
  
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  // Random secret generation
  const secret = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  const outputSecret = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  
  // Transaction amounts
  const amount = 1000n;
  const outputAmount = 500n;

  // 1. Generate commitment
  const commitment = F.toObject(poseidon([amount, secret]));
  console.log("✓ Commitment:", commitment.toString());

  // 2. Generate nullifier
  const nullifier = F.toObject(poseidon([secret, 1n]));
  console.log("✓ Nullifier:", nullifier.toString());

  // 3. Build simple Merkle tree (depth 2)
  const treeDepth = 2;
  const leaves = [commitment];
  
  // Fill with dummy leaves
  for (let i = 1; i < Math.pow(2, treeDepth); i++) {
    leaves.push(0n);
  }

  // Build tree level by level
  let currentLevel = leaves;
  const tree = [currentLevel];
  
  for (let level = 0; level < treeDepth; level++) {
    const nextLevel = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1];
      const parent = F.toObject(poseidon([left, right]));
      nextLevel.push(parent);
    }
    tree.push(nextLevel);
    currentLevel = nextLevel;
  }

  const root = tree[tree.length - 1][0];
  console.log("✓ Merkle Root:", root.toString());

  // 4. Generate Merkle path for leaf 0 (our commitment)
  const pathElements = [];
  const pathIndices = [];
  let leafIndex = 0;

  for (let level = 0; level < treeDepth; level++) {
    const isLeft = leafIndex % 2 === 0;
    const siblingIndex = isLeft ? leafIndex + 1 : leafIndex - 1;
    
    pathElements.push(tree[level][siblingIndex].toString());
    pathIndices.push(isLeft ? 0 : 1);
    
    leafIndex = Math.floor(leafIndex / 2);
  }

  console.log("✓ Path Elements:", pathElements.length, "levels");
  console.log("✓ Path Indices:", pathIndices);

  // 5. Build input object
  const input = {
    amount: amount.toString(),
    secret: secret.toString(),
    nullifier: nullifier.toString(),
    root: root.toString(),
    pathElements: pathElements,
    pathIndices: pathIndices,
    outputAmount: outputAmount.toString(),
    outputSecret: outputSecret.toString()
  };

  // 6. Save to file
  const outputPath = "./circuits/input.json";
  fs.mkdirSync("./circuits", { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(input, null, 2));
  
  console.log("\n✅ Input file generated:", outputPath);
  console.log("📊 Summary:");
  console.log("   Input amount:", amount.toString());
  console.log("   Output amount:", outputAmount.toString());
  console.log("   Tree depth:", treeDepth);
  
  return input;
}

if (require.main === module) {
  generateInput().catch(console.error);
}

module.exports = { generateInput };