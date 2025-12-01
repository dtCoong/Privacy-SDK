const circomlibjs = require("circomlibjs");
const fs = require("fs");
const path = require("path");

async function generateInput() {
  const poseidon = await circomlibjs.buildPoseidon();
  const F = poseidon.F;

  function hashLeftRight(left, right) {
    return poseidon([left, right]);
  }

  function toFieldStr(x) {
    return F.toString(x);
  }

  const secret = 123456n;
  const amount = 10n;

  const commitment = poseidon([amount, secret]);

  const leaf1 = F.e(1111n);
  const leaf2 = F.e(2222n);
  const leaf3 = F.e(3333n);

  const h1 = hashLeftRight(commitment, leaf1);
  const h2 = hashLeftRight(leaf2, leaf3);
  const root = hashLeftRight(h1, h2);

  const nullifier = poseidon([secret, 1n]);

  const input = {
    root: toFieldStr(root),
    nullifier: toFieldStr(nullifier),
    secret: secret.toString(),
    amount: amount.toString(),
    pathElements: [toFieldStr(leaf1), toFieldStr(h2)],
    pathIndices: ["0", "0"],
    outputAmount: amount.toString(),
    outputSecret: "987654"
  };

  const outPath = path.join(__dirname, "circuits", "input.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(input, null, 2), "utf8");
  console.log("Saved input to", outPath);

  return input;
}

module.exports = { generateInput };

if (require.main === module) {
  generateInput().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
