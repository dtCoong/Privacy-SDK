const { ethers } = require("hardhat");
const { expect } = require("chai");

// ==================== MOCK DATA (bám theo Person 2) ====================

// bytes32 root giả
const MOCK_NEW_ROOT =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

// nullifier giả
const MOCK_NULLIFIER = 12345n; // BigInt, thay cho BigNumber.from(12345)

// proof rỗng (giá trị chỉ là placeholder)
const PROOF_A = [0n, 0n];
const PROOF_B = [
  [0n, 0n],
  [0n, 0n],
];
const PROOF_C = [0n, 0n];

// public input hợp lệ (newRoot, nullifier, dummy = 0)
const VALID_INPUT = [
  BigInt(MOCK_NEW_ROOT), // cast từ chuỗi hex -> BigInt
  MOCK_NULLIFIER,
  0n,
];

// public input không hợp lệ (dùng cho verifier false)
const INVALID_INPUT = [0n, 0n, 0n];

// ==================== TEST SUITE ====================

describe("TransactionRegistry - ApplyTransaction Tests", function () {
  let registry;
  let verifier;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();

    // deploy MockVerifier (trả về true)
    const VerifierFactory = await ethers.getContractFactory("MockVerifier");
    verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();
    const verifierAddress = await verifier.getAddress();

    // deploy TransactionRegistry với địa chỉ verifier
    const RegistryFactory = await ethers.getContractFactory(
      "TransactionRegistry"
    );
    registry = await RegistryFactory.deploy(verifierAddress);
    await registry.waitForDeployment();
  });

  it("applyTransaction: cập nhật root + nullifier với proof hợp lệ", async function () {
    const tx = await registry.applyTransaction(
      PROOF_A,
      PROOF_B,
      PROOF_C,
      VALID_INPUT
    );

    await expect(tx).to.emit(registry, "TransactionApplied");

    // kiểm tra state
    const currentRoot = await registry.currentMerkleRoot();
    expect(currentRoot).to.equal(MOCK_NEW_ROOT);

    const used = await registry.nullifiersUsed(MOCK_NULLIFIER);
    expect(used).to.equal(true);
  });

  it("applyTransaction: double-spend với cùng nullifier phải revert", async function () {
    await registry.applyTransaction(PROOF_A, PROOF_B, PROOF_C, VALID_INPUT);

    await expect(
      registry.applyTransaction(PROOF_A, PROOF_B, PROOF_C, VALID_INPUT)
    ).to.be.revertedWith("Nullifier already spent");
  });

  it("applyTransaction: verifier trả về false phải revert", async function () {
    // deploy verifier luôn trả về false
    const RejectFactory = await ethers.getContractFactory("MockVerifierFalse");
    const rejectVerifier = await RejectFactory.deploy();
    await rejectVerifier.waitForDeployment();
    const rejectVerifierAddress = await rejectVerifier.getAddress();

    const RegistryFactory = await ethers.getContractFactory(
      "TransactionRegistry"
    );
    const rejectRegistry = await RegistryFactory.deploy(rejectVerifierAddress);
    await rejectRegistry.waitForDeployment();

    await expect(
      rejectRegistry.applyTransaction(PROOF_A, PROOF_B, PROOF_C, VALID_INPUT)
    ).to.be.revertedWith("Invalid ZK proof");
  });

  it("applyTransactionBytes: decode proof + pubData và cập nhật state", async function () {
    // ethers v6: dùng AbiCoder.defaultAbiCoder()
    const abiCoder = ethers.AbiCoder.defaultAbiCoder();

    const proofBytes = abiCoder.encode(
      ["uint256[2]", "uint256[2][2]", "uint256[2]"],
      [PROOF_A, PROOF_B, PROOF_C]
    );

    const pubBytes = abiCoder.encode(["uint256[3]"], [VALID_INPUT]);

    const beforeCount = await registry.merkleRootCount();

    const tx = await registry.applyTransactionBytes(proofBytes, pubBytes);
    await expect(tx).to.emit(registry, "TransactionApplied");

    const currentRoot = await registry.currentMerkleRoot();
    expect(currentRoot).to.equal(MOCK_NEW_ROOT);

    const used = await registry.nullifiersUsed(MOCK_NULLIFIER);
    expect(used).to.equal(true);

    const afterCount = await registry.merkleRootCount();
    expect(afterCount).to.equal(beforeCount + 1n);
  });

  it("storeAggregateResult: emit event AggregateResultStored", async function () {
    const metaBytes = ethers.toUtf8Bytes("agg-meta-v1");
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes("agg-result-1"));

    await expect(
      registry.storeAggregateResult(resultHash, metaBytes)
    ).to.emit(registry, "AggregateResultStored");
  });
});
