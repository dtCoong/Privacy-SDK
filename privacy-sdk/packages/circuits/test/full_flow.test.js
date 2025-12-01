const { expect } = require("chai");
const { generateFullTransactionPayload } = require("../scripts/generateProof.js");

describe("Full flow payload", function () {
  it("creates payload with zkProof, publicSignals, ringSignature", async function () {
    this.timeout(60000);

    const payload = await generateFullTransactionPayload();

    expect(payload).to.be.an("object");
    expect(payload.zkProof).to.be.a("string").and.not.equal("");
    expect(payload.rawProof).to.be.an("object");
    expect(payload.publicSignals).to.be.an("array");
    expect(payload.ringSignature).to.be.an("object");
    expect(payload.ringSignature.keyImage).to.be.a("string");
    expect(payload.ringSignature.c0).to.be.a("string");
    expect(payload.ringSignature.s).to.be.an("array").with.length.greaterThan(0);
    expect(payload.merkleRoot).to.be.a("string");
    expect(payload.nullifier).to.be.a("string");
  });
});
