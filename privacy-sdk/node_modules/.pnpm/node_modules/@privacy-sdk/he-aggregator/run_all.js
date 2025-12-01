const { spawn } = require("child_process");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function main() {
  console.log("=== RUN ALL (he-aggregator: logic + ZK proof) ===");
  await run("node", ["test_logic.js"]);
  await run("node", ["test_simple.js"]);
  console.log("✓ All tests passed.");
}

main().catch((err) => {
  console.error("run_all failed:", err);
  process.exit(1);
});
