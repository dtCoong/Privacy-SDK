const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("TransactionRegistry Unit Tests", () => {
  let registry;
  let owner;
  let mockVerifier;

  beforeEach(async () => {
    [owner] = await ethers.getSigners();

    const MockVerifier = await ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifier.deploy();
    await mockVerifier.deployed();

    const RegistryFactory = await ethers.getContractFactory(
      "TransactionRegistry"
    );
    registry = await RegistryFactory.deploy(mockVerifier.address);
    await registry.deployed();
  });

  it("Nên cập nhật Merkle root chính xác (Should update the Merkle root correctly)", async () => {
    const testRoot =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    await registry.registerRoot(testRoot);

    expect(await registry.currentMerkleRoot()).to.equal(testRoot);
  });

  it("Nên phát ra Event khi root được đăng ký (Should emit an event on root registration)", async () => {
    const testRoot =
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd";

    const tx = await registry.registerRoot(testRoot);
    const receipt = await tx.wait();
    const events = receipt.events.filter(
      (e) => e.event === "MerkleRootRegistered"
    );
    expect(events.length).to.be.greaterThan(0);
  });

  it("Nên cập nhật root nhiều lần (Should allow root to be updated)", async () => {
    const testRoot1 =
      "0x1111111111111111111111111111111111111111111111111111111111111111";
    const testRoot2 =
      "0x2222222222222222222222222222222222222222222222222222222222222222";

    await registry.registerRoot(testRoot1);
    expect(await registry.currentMerkleRoot()).to.equal(testRoot1);

    await registry.registerRoot(testRoot2);
    expect(await registry.currentMerkleRoot()).to.equal(testRoot2);
  });

  it("applyTransaction verifies, sets nullifier and emits event", async () => {
    const testRoot =
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const nullifier = ethers.BigNumber.from("0x02");

    const a = [0, 0];
    const b = [
      [0, 0],
      [0, 0],
    ];
    const c = [0, 0];
    const input = [
      ethers.BigNumber.from(testRoot),
      nullifier,
      ethers.BigNumber.from(0),
    ];

    const tx = await registry.applyTransaction(a, b, c, input);
    const receipt = await tx.wait();
    const events = receipt.events.filter(
      (e) => e.event === "TransactionApplied"
    );
    expect(events.length).to.be.greaterThan(0);
    const ev = events[0];
    // args: newRoot (bytes32) and nullifier (uint256)
    expect(ev.args[0]).to.equal(testRoot);
    expect(ev.args[1].toString()).to.equal(nullifier.toString());

    let reverted = false;
    try {
      await registry.applyTransaction(a, b, c, input);
    } catch (err) {
      reverted = true;
    }
    expect(reverted).to.equal(true);
  });
});
