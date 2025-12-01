const { expect } = require("chai");
const { ethers } = require("hardhat");

// describe("TransactionRegistry (bytes path)", function () {
//   let owner, other;
//   let registry;
//   let verifier;

//   beforeEach(async function () {
//     [owner, other] = await ethers.getSigners();

//     // MockVerifier luôn trả về true cho verifyProof
//     const MockVerifier = await ethers.getContractFactory("MockVerifier");
//     verifier = await MockVerifier.deploy();
//     await verifier.waitForDeployment();

//     const TransactionRegistry = await ethers.getContractFactory("TransactionRegistry");
//     registry = await TransactionRegistry.deploy(await verifier.getAddress());
//     await registry.waitForDeployment();
//   });

//   it("owner can register root and it is stored", async function () {
//     const { registry, owner } = await deployFixture();

//     const beforeCount = await registry.merkleRootCount();

//     const root = ethers.keccak256(ethers.toUtf8Bytes("bytes-path-root-1"));
//     await registry.connect(owner).registerRoot(root);

//     expect(await registry.currentMerkleRoot()).to.equal(root);

//     const afterCount = await registry.merkleRootCount();
//     expect(afterCount).to.equal(beforeCount + 1n);
//   });


//   it("applyTransactionBytes decodes proof + pubData and updates state", async function () {
//     // Giả lập public inputs:
//     // input[0] = newRoot
//     // input[1] = nullifier
//     // input[2] = dummy value
//     const newRoot = ethers.keccak256(ethers.toUtf8Bytes("root-2"));
//     const nullifier = 123n;
//     const dummy = 42n;

//     // proof (a, b, c) giả – giá trị cụ thể không quan trọng vì MockVerifier luôn true
//     const a = [1n, 2n];
//     const b = [
//       [3n, 4n],
//       [5n, 6n],
//     ];
//     const c = [7n, 8n];

//     const input = [newRoot, nullifier, dummy];

//     const proofBytes = ethers.AbiCoder.defaultAbiCoder().encode(
//       ["uint256[2]", "uint256[2][2]", "uint256[2]"],
//       [a, b, c]
//     );
//     const pubBytes = ethers.AbiCoder.defaultAbiCoder().encode(
//       ["uint256[3]"],
//       [input]
//     );

//     const tx = await registry.applyTransactionBytes(proofBytes, pubBytes);
//     await tx.wait();

//     // Kiểm tra state đã update
//     expect(await registry.currentMerkleRoot()).to.equal(newRoot);
//     expect(await registry.merkleRootCount()).to.equal(1n);
//     const storedRoot = await registry.merkleRootAt(0n);
//     expect(storedRoot).to.equal(newRoot);

//     // Nullifier đã đánh dấu dùng rồi
//     const used = await registry.nullifiersUsed(nullifier);
//     expect(used).to.equal(true);
//   });

//   it("reverts when nullifier is already used", async function () {
//     const newRoot = ethers.keccak256(ethers.toUtf8Bytes("root-3"));
//     const nullifier = 999n;
//     const dummy = 0n;

//     const a = [1n, 2n];
//     const b = [
//       [3n, 4n],
//       [5n, 6n],
//     ];
//     const c = [7n, 8n];

//     const input = [newRoot, nullifier, dummy];

//     const proofBytes = ethers.AbiCoder.defaultAbiCoder().encode(
//       ["uint256[2]", "uint256[2][2]", "uint256[2]"],
//       [a, b, c]
//     );
//     const pubBytes = ethers.AbiCoder.defaultAbiCoder().encode(
//       ["uint256[3]"],
//       [input]
//     );

//     // Lần 1 thành công
//     await (await registry.applyTransactionBytes(proofBytes, pubBytes)).wait();

//     // Lần 2 phải revert vì nullifier đã dùng
//     await expect(
//       registry.applyTransactionBytes(proofBytes, pubBytes)
//     ).to.be.revertedWith("Nullifier already spent");
//   });
// });
