const { expect } = require("chai");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");
const { generateFullTransactionPayload } = require("../scripts/generateProof.js");

describe("Security tests", function () {
  it("same secret produces same nullifier", async function () {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    const secret = 123456n;
    const n1 = poseidon([secret, 1n]);
    const n2 = poseidon([secret, 1n]);

    expect(F.toString(n1)).to.equal(F.toString(n2));
  });

  it("tampered merkle root fails verification", async function () {
    this.timeout(60000);

    const vKeyPath = path.join(__dirname, "../artifacts/verification_key.json");
    const vKey = JSON.parse(fs.readFileSync(vKeyPath));

    const payload = await generateFullTransactionPayload();

    const ok = await snarkjs.groth16.verify(
      vKey,
      payload.publicSignals,
      payload.rawProof
    );
    expect(ok).to.equal(true);

    const badSignals = [...payload.publicSignals];
    const originalRoot = BigInt(badSignals[0]);
    badSignals[0] = (originalRoot + 1n).toString();

    const bad = await snarkjs.groth16.verify(
      vKey,
      badSignals,
      payload.rawProof
    );

    expect(bad).to.equal(false);
  });
});
