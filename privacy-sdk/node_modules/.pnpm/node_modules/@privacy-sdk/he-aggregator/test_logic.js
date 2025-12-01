const assert = require("assert");
const { generateInput } = require("./generate_input");

async function run() {
  console.log("=== LOGIC TEST (he-aggregator) ===");
  const input = await generateInput();

  const amount = BigInt(input.amount);
  const outputAmount = BigInt(input.outputAmount);

  assert(amount >= outputAmount, "amount must be >= outputAmount");
  assert(Array.isArray(input.pathElements), "pathElements must be array");
  assert(input.pathElements.length === 2, "pathElements length must be 2");
  assert(Array.isArray(input.pathIndices), "pathIndices must be array");
  assert(input.pathIndices.length === 2, "pathIndices length must be 2");

  console.log("✓ Logic tests passed.");
}

run().catch((err) => {
  console.error("Logic test failed:", err);
  process.exit(1);
});
