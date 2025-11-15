const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransactionRegistry", function () {
  let registry;
  let owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const TransactionRegistry = await ethers.getContractFactory("TransactionRegistry");
    registry = await TransactionRegistry.deploy();
    await registry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set initial root to zero", async function () {
      const root = await registry.currentRoot();
      expect(root).to.equal(ethers.ZeroHash);
    });

    it("Should set next leaf index to 0", async function () {
      expect(await registry.nextLeafIndex()).to.equal(0);
    });
  });

  describe("Deposit", function () {
    it("Should accept deposit and update root", async function () {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test commitment"));
      const depositAmount = ethers.parseEther("1.0");

      await expect(registry.deposit(commitment, { value: depositAmount }))
        .to.emit(registry, "Deposit")
        .to.emit(registry, "RootUpdated");

      expect(await registry.nextLeafIndex()).to.equal(1);
      expect(await registry.hasCommitment(commitment)).to.be.true;
    });

    it("Should reject deposit without value", async function () {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await expect(registry.deposit(commitment)).to.be.revertedWith("Must deposit some ETH");
    });

    it("Should reject duplicate commitment", async function () {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("test"));
      await registry.deposit(commitment, { value: ethers.parseEther("1.0") });
      
      await expect(
        registry.deposit(commitment, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Commitment already exists");
    });
  });

  describe("Withdrawal", function () {
    it("Should allow withdrawal with valid nullifier", async function () {
      // First deposit
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("commitment"));
      await registry.deposit(commitment, { value: ethers.parseEther("1.0") });
      
      const root = await registry.currentRoot();
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("nullifier"));
      const withdrawAmount = ethers.parseEther("0.5");

      await expect(
        registry.withdraw(nullifier, addr1.address, withdrawAmount, root)
      ).to.emit(registry, "Withdrawal");

      expect(await registry.nullifierUsed(nullifier)).to.be.true;
    });

    it("Should reject double-spending with same nullifier", async function () {
      const commitment = ethers.keccak256(ethers.toUtf8Bytes("commitment"));
      await registry.deposit(commitment, { value: ethers.parseEther("1.0") });
      
      const root = await registry.currentRoot();
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("nullifier"));
      const withdrawAmount = ethers.parseEther("0.5");

      await registry.withdraw(nullifier, addr1.address, withdrawAmount, root);
      
      await expect(
        registry.withdraw(nullifier, addr2.address, withdrawAmount, root)
      ).to.be.revertedWith("Nullifier already used");
    });

    it("Should reject withdrawal with invalid root", async function () {
      const nullifier = ethers.keccak256(ethers.toUtf8Bytes("nullifier"));
      const fakeRoot = ethers.keccak256(ethers.toUtf8Bytes("fake root"));
      
      await expect(
        registry.withdraw(nullifier, addr1.address, ethers.parseEther("0.5"), fakeRoot)
      ).to.be.revertedWith("Invalid root");
    });
  });

  describe("Root History", function () {
    it("Should maintain root history", async function () {
      const commitment1 = ethers.keccak256(ethers.toUtf8Bytes("commitment1"));
      const commitment2 = ethers.keccak256(ethers.toUtf8Bytes("commitment2"));

      await registry.deposit(commitment1, { value: ethers.parseEther("1.0") });
      const root1 = await registry.currentRoot();

      await registry.deposit(commitment2, { value: ethers.parseEther("1.0") });
      const root2 = await registry.currentRoot();

      expect(await registry.isKnownRoot(root1)).to.be.true;
      expect(await registry.isKnownRoot(root2)).to.be.true;
      expect(await registry.getRootHistoryLength()).to.equal(3); // initial + 2 deposits
    });
  });
});