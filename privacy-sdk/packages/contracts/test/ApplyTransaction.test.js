const { ethers } = require("hardhat");
const { expect, use } = require("chai");
// Enable Waffle/Chai solidity matchers for `.emit` and `.reverted`
const { solidity } = require("ethereum-waffle");
use(solidity);

// For tests we construct simple proof arrays and public inputs compatible with verifier signature
const MOCK_NEW_ROOT =
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const MOCK_NULLIFIER = ethers.BigNumber.from(12345);

const a = [0, 0];
const b = [
  [0, 0],
  [0, 0],
];
const c = [0, 0];
const VALID_INPUT = [
  ethers.BigNumber.from(MOCK_NEW_ROOT),
  MOCK_NULLIFIER,
  ethers.BigNumber.from(0),
];
const INVALID_INPUT = [
  ethers.BigNumber.from(0),
  ethers.BigNumber.from(0),
  ethers.BigNumber.from(0),
];

describe("TransactionRegistry - ApplyTransaction Tests", () => {
  let registry, verifier;
  let owner, addr1;

  // Deploy cả 2 contract trước mỗi test
  beforeEach(async () => {
    [owner, addr1] = await ethers.getSigners();

    const VerifierFactory = await ethers.getContractFactory("MockVerifier");
    verifier = await VerifierFactory.deploy();
    await verifier.deployed();

    const RegistryFactory = await ethers.getContractFactory(
      "TransactionRegistry"
    );
    registry = await RegistryFactory.deploy(verifier.address);
    await registry.deployed();
  });

  it("Nên áp dụng giao dịch thành công với proof hợp lệ", async () => {
    // GỌI HÀM applyTransaction
    const tx = await registry.applyTransaction(a, b, c, VALID_INPUT);
    await expect(tx).to.emit(registry, "TransactionApplied");

    // Check state
    expect(await registry.currentMerkleRoot()).to.equal(MOCK_NEW_ROOT);
    expect(await registry.nullifiersUsed(MOCK_NULLIFIER)).to.be.true;
  });

  it("Nên revert nếu nullifier đã được sử dụng (double-spend)", async () => {
    // 1. First application
    await registry.applyTransaction(a, b, c, VALID_INPUT);

    // 2. Re-apply with same nullifier should revert (any revert is acceptable)
    await expect(registry.applyTransaction(a, b, c, VALID_INPUT)).to.be
      .reverted;
  });

  it("Nên revert nếu proof không hợp lệ", async () => {
    // Deploy a verifier which rejects proofs and a fresh registry
    const RejectFactory = await ethers.getContractFactory("MockVerifierFalse");
    const rejectVerifier = await RejectFactory.deploy();
    await rejectVerifier.deployed();

    const RegistryFactory = await ethers.getContractFactory(
      "TransactionRegistry"
    );
    const rejectRegistry = await RegistryFactory.deploy(rejectVerifier.address);
    await rejectRegistry.deployed();

    await expect(rejectRegistry.applyTransaction(a, b, c, VALID_INPUT)).to.be
      .reverted;
  });

  // Thêm các test case khác nếu cần (ví dụ: pubData sai định dạng...)
  it("Nên áp dụng giao dịch thành công thông qua applyTransactionBytes (ABI-encoded)", async () => {
    // Build proof bytes (same layout as applyTransaction expects when decoded)
    const proofBytes = ethers.utils.defaultAbiCoder.encode(
      ["uint256[2]", "uint256[2][2]", "uint256[2]"],
      [a, b, c]
    );

    // pubData encoded as uint256[3]
    const pubBytes = ethers.utils.defaultAbiCoder.encode(
      ["uint256[3]"],
      [VALID_INPUT]
    );

    const tx = await registry.applyTransactionBytes(proofBytes, pubBytes);
    await expect(tx).to.emit(registry, "TransactionApplied");

    // Check state updated
    expect(await registry.currentMerkleRoot()).to.equal(MOCK_NEW_ROOT);
    expect(await registry.nullifiersUsed(MOCK_NULLIFIER)).to.be.true;
    // Check merkle roots history updated
    const count = await registry.merkleRootCount();
    expect(count).to.be.at.least(1);
    const root0 = await registry.merkleRootAt(0);
    expect(root0).to.be.a("string");
  });

  it("Nên lưu aggregate result bằng storeAggregateResult", async () => {
    const meta = ethers.utils.toUtf8Bytes("agg-meta-v1");
    const tx = await registry.storeAggregateResult(
      ethers.utils.id("res1"),
      meta
    );
    await expect(tx).to.emit(registry, "AggregateResultStored");
  });
});
