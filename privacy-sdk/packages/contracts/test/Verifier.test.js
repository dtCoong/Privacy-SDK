const { ethers } = require("hardhat");
const { expect } = require("chai");

const path = require("path");
const proof = require(path.join(__dirname, "test-data", "proof.json"));
const publicSignals = require(path.join(__dirname, "test-data", "public.json"));

describe("Verifier Contract (Real) Test (Nhiệm vụ 3)", () => {
  let verifier;

  before(async () => {
    const VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
    verifier = await VerifierFactory.deploy();
    await verifier.deployed();
  });

  it("Nên xác thực proof THẬT thành công", async () => {
    const pA = [proof.pi_a[0], proof.pi_a[1]];
    const pB = [
      [proof.pi_b[0][1], proof.pi_b[0][0]],
      [proof.pi_b[1][1], proof.pi_b[1][0]],
    ];
    const pC = [proof.pi_c[0], proof.pi_c[1]];
    const pSignals = publicSignals;

    const isProofValid = await verifier.verifyProof(pA, pB, pC, pSignals);
    expect(isProofValid).to.be.true;
  });
});
