# Person 2 Handoff — Chi tiết (Embedded source included)

Mục tiêu: cung cấp hướng dẫn đầy đủ, tuần tự và nhúng toàn bộ mã nguồn các file chính để Person 2 có thể tiếp nhận và làm việc trực tiếp trên repository.

**Tóm tắt ngắn:**

- **Stack:** Solidity (Hardhat), Node.js, TypeScript, pnpm, ethers.js, snarkjs
- **Packages chính:** `packages/contracts`, `packages/core`, `packages/relayer`, `packages/circuits`, `packages/examples`

---

## Tuần 1 — Làm quen & thiết lập môi trường

- Cài đặt: `pnpm install` ở root (workspace pnpm).
- Chạy test contracts cục bộ: `cd packages/contracts && pnpm install && npx hardhat test`.
- Chạy SDK unit tests: `cd packages/core && pnpm test`.

## Tuần 2 — Hiểu contract API và SDK

- Contract chính: `packages/contracts/contracts/TransactionRegistry.sol` — (đã nhúng dưới đây).
- SDK client: `packages/core/src/client.ts` — (đã nhúng dưới đây). SDK này ưu tiên ABI từ artifact biên dịch sẵn.
- Kiểm tra luồng: SDK -> registry.applyTransactionBytes(...) (bytes wrapper) hoặc applyTransaction(...).

## Tuần 3 — Relayer và ví dụ

- Relayer đơn giản: `packages/relayer/server.js` (đã nhúng dưới đây). Có endpoint `/api/v1/submit` và `/api/v1/status/:id`.
- Tạo example scripts để gọi SDK và relayer.

## Tuần 4 — CI, verifier và phát hành

- CI: file mẫu GitHub Actions `./.github/workflows/test-packages.yml` (đã nhúng dưới đây).
- Verifier: Nếu cần tạo Solidity verifier từ `.zkey`, thêm script helper `packages/contracts/scripts/generate-verifier.js` (mẫu cũng có trong tài liệu này).

---

## Embedded Sources

### `packages/contracts/contracts/TransactionRegistry.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IVerifier.sol";

contract TransactionRegistry is Ownable {
    bytes32 public currentMerkleRoot;
    bytes32[] public merkleRoots;
    mapping(uint256 => bool) public nullifiersUsed;
    IVerifier public immutable verifier;

    event MerkleRootRegistered(bytes32 indexed root, uint256 timestamp);
    event AggregateResultStored(bytes32 indexed resultHash, bytes metadata, uint256 timestamp);
    event TransactionApplied(bytes32 indexed newRoot, uint256 indexed nullifierHash);

    constructor(address _verifierAddress) {
        require(_verifierAddress != address(0), "Invalid verifier address");
        verifier = IVerifier(_verifierAddress);
    }

    function registerRoot(bytes32 _root) public onlyOwner {
        currentMerkleRoot = _root;
        merkleRoots.push(_root);
        emit MerkleRootRegistered(_root, block.timestamp);
    }

    function storeAggregateResult(bytes32 resultHash, bytes calldata metadata) public onlyOwner {
        emit AggregateResultStored(resultHash, metadata, block.timestamp);
    }

    function applyTransaction(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[3] calldata input
    ) external {
        _applyTransaction(a, b, c, input);
    }

    /// @notice Compatibility wrapper: accepts ABI-encoded proof and public inputs as bytes
    /// @dev `proofBytes` must be `abi.encode(a, b, c)` where a: uint256[2], b: uint256[2][2], c: uint256[2]
    ///      `pubData` must be `abi.encode(uint256[3])` matching the verifier public signals
    function applyTransactionBytes(bytes calldata proofBytes, bytes calldata pubData) external {
        (uint256[2] memory a, uint256[2][2] memory b, uint256[2] memory c) = abi.decode(
            proofBytes,
            (uint256[2], uint256[2][2], uint256[2])
        );

        uint256[3] memory inputDecoded = abi.decode(pubData, (uint256[3]));

        _applyTransaction(a, b, c, inputDecoded);
    }

    function _applyTransaction(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) internal {
        bytes32 newRoot = bytes32(input[0]);
        uint256 nullifier = input[1];

        require(!nullifiersUsed[nullifier], "Nullifier already spent");

        bool ok = verifier.verifyProof(a, b, c, input);
        require(ok, "Invalid ZK proof");

        nullifiersUsed[nullifier] = true;
        currentMerkleRoot = newRoot;
        merkleRoots.push(newRoot);

        emit TransactionApplied(newRoot, nullifier);
    }

    /// @notice Return number of stored merkle roots
    function merkleRootCount() external view returns (uint256) {
        return merkleRoots.length;
    }

    /// @notice Return merkle root at index (0-based)
    function merkleRootAt(uint256 idx) external view returns (bytes32) {
        require(idx < merkleRoots.length, "Index out of bounds");
        return merkleRoots[idx];
    }
}
```

---

### `packages/core/src/client.ts`

```typescript
import { ethers } from "ethers";
import fs from "fs";
import path from "path";

// Import ABI từ các file JSON trong thư mục abi
import RegistryABI from "../abi/TransactionRegistry.json";
import VerifierABI from "../abi/Verifier.json"; // ABI của Groth16Verifier

export type Proof = {
  pi_a: [string, string];
  pi_b: [[string, string], [string, string]];
  pi_c: [string, string];
};

export class ContractClient {
  public registryContract!: ethers.Contract;
  public verifierContract!: ethers.Contract;
  public signer!: ethers.Signer;
  public provider!: ethers.providers.JsonRpcProvider;

  constructor(
    providerUrl: string,
    signerOrPrivateKey: string | ethers.Signer,
    registryAddress: string,
    verifierAddress: string,
    options?: {
      registryContract?: ethers.Contract;
      verifierContract?: ethers.Contract;
    }
  ) {
    this.provider = new ethers.providers.JsonRpcProvider(providerUrl);
    if (typeof signerOrPrivateKey === "string") {
      this.signer = new ethers.Wallet(signerOrPrivateKey, this.provider);
    } else {
      this.signer = signerOrPrivateKey;
      try {
        // @ts-ignore
        if (!this.signer.provider) {
          // @ts-ignore
          this.signer = (this.signer as ethers.Signer).connect(this.provider);
        }
      } catch (e) {}
    }

    if (options?.registryContract) {
      this.registryContract = options.registryContract;
    } else {
      // Prefer compiled artifact ABI from packages/contracts if available
      try {
        const repoRoot = path.resolve(__dirname, "..", "..", "..");
        const artifactPath = path.resolve(
          repoRoot,
          "packages",
          "contracts",
          "artifacts",
          "packages",
          "contracts",
          "contracts",
          "TransactionRegistry.sol",
          "TransactionRegistry.json"
        );
        if (fs.existsSync(artifactPath)) {
          const art = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
          this.registryContract = new ethers.Contract(
            registryAddress,
            art.abi,
            this.signer
          );
        } else {
          this.registryContract = new ethers.Contract(
            registryAddress,
            RegistryABI.abi,
            this.signer
          );
        }
      } catch (e) {
        this.registryContract = new ethers.Contract(
          registryAddress,
          RegistryABI.abi,
          this.signer
        );
      }
    }

    if (options?.verifierContract) {
      this.verifierContract = options.verifierContract;
    } else {
      this.verifierContract = new ethers.Contract(
        verifierAddress,
        VerifierABI.abi,
        this.signer
      );
    }

    (async () => {
      try {
        const addr = await this.signer.getAddress();
        console.log(`SDK Client initialized. Signer address: ${addr}`);
      } catch (e) {
        console.log(`SDK Client initialized. Signer configured.`);
      }
      console.log(
        ` - Connected to Registry at: ${this.registryContract.address}`
      );
      console.log(
        ` - Connected to Verifier at: ${this.verifierContract.address}`
      );
    })();
  }

  async verifyProof(
    proof: Proof,
    publicInputs: Array<string | number>
  ): Promise<boolean> {
    console.log("SDK: Calling verifyProof on contract...");
    try {
      const pA: [string, string] = [proof.pi_a[0], proof.pi_a[1]];
      const pB: [[string, string], [string, string]] = [
        [proof.pi_b[0][1], proof.pi_b[0][0]],
        [proof.pi_b[1][1], proof.pi_b[1][0]],
      ];
      const pC: [string, string] = [proof.pi_c[0], proof.pi_c[1]];
      const pSignals = publicInputs as any[];

      const result: boolean = await this.verifierContract.verifyProof(
        pA,
        pB,
        pC,
        pSignals
      );
      console.log("SDK: verifyProof result from contract:", result);
      return result;
    } catch (error) {
      console.error("SDK: Error calling verifyProof:", error);
      return false;
    }
  }

  async submitTransaction(
    proof: any,
    pubData: any
  ): Promise<ethers.providers.TransactionReceipt | null> {
    console.log(
      "SDK: Calling submitTransaction (currently calls registerRoot)..."
    );
    try {
      // If a proof and public inputs are provided, ABI-encode and call the bytes wrapper
      const hasProof = proof && proof.pi_a && proof.pi_b && proof.pi_c;
      const hasPub = Array.isArray(pubData) && pubData.length >= 1;

      if (hasProof && hasPub) {
        console.log(
          "SDK: Encoding proof + public inputs and calling applyTransactionBytes..."
        );

        // Prepare a,b,c in the same orientation used by verifyProof
        const pA: [string, string] = [proof.pi_a[0], proof.pi_a[1]];
        const pB: [[string, string], [string, string]] = [
          [proof.pi_b[0][1], proof.pi_b[0][0]],
          [proof.pi_b[1][1], proof.pi_b[1][0]],
        ];
        const pC: [string, string] = [proof.pi_c[0], proof.pi_c[1]];

        // Encode as expected by `applyTransactionBytes` wrapper: abi.encode(a,b,c) and abi.encode(uint256[3])
        const proofBytes = ethers.utils.defaultAbiCoder.encode(
          ["uint256[2]", "uint256[2][2]", "uint256[2]"],
          [pA, pB, pC]
        );

        // Ensure pubData is length 3; if not, pad with zeros
        const pubArr = pubData.slice(0, 3);
        while (pubArr.length < 3) pubArr.push("0");
        const pubBytes = ethers.utils.defaultAbiCoder.encode(
          ["uint256[3]"],
          [pubArr]
        );

        const txResponse: ethers.providers.TransactionResponse =
          await this.registryContract.applyTransactionBytes(
            proofBytes,
            pubBytes
          );
        console.log(
          `SDK: Transaction sent, hash: ${txResponse.hash}. Waiting for confirmation...`
        );
        const receipt: ethers.providers.TransactionReceipt =
          await txResponse.wait(1);
        console.log(
          `SDK: Transaction confirmed in block ${
            receipt.blockNumber
          }. Status: ${receipt.status === 1 ? "Success" : "Failed"}`
        );
        return receipt;
      }

      // Fallback behavior (existing): register a random test root
      const testRoot = ethers.utils.id(
        "testRoot_" + Math.random().toString(36).substring(7)
      );
      console.log(
        `SDK: Calling registryContract.registerRoot with root: ${testRoot}`
      );
      const txResponse: ethers.providers.TransactionResponse =
        await this.registryContract.registerRoot(testRoot);
      console.log(
        `SDK: Transaction sent, hash: ${txResponse.hash}. Waiting for confirmation...`
      );
      const receipt: ethers.providers.TransactionReceipt =
        await txResponse.wait(1);
      console.log(
        `SDK: Transaction confirmed in block ${receipt.blockNumber}. Status: ${
          receipt.status === 1 ? "Success" : "Failed"
        }`
      );
      return receipt;
    } catch (error) {
      console.error(
        "SDK: Error calling submitTransaction (registerRoot):",
        error
      );
      return null;
    }
  }

  async getTransactionEvents(
    fromBlock: number | string = 0,
    toBlock: number | string = "latest"
  ): Promise<any[]> {
    console.log(
      `SDK: Querying MerkleRootRegistered events from block ${fromBlock} to ${toBlock}...`
    );
    try {
      const filter = this.registryContract.filters.MerkleRootRegistered();
      const events: ethers.Event[] = await this.registryContract.queryFilter(
        filter,
        fromBlock,
        toBlock
      );

      console.log(`SDK: Found ${events.length} MerkleRootRegistered event(s).`);
      return events.map((event) => ({
        root: event.args?.root,
        blockNumber: event.blockNumber,
        timestamp: event.args?.timestamp
          ? new Date(event.args.timestamp.toNumber() * 1000).toLocaleString(
              "vi-VN"
            )
          : undefined,
        txHash: event.transactionHash,
      }));
    } catch (error) {
      console.error("SDK: Error querying events:", error);
      return [];
    }
  }

  async storeAggregateResult(
    resultHash: string,
    metadata: string | Uint8Array
  ): Promise<ethers.providers.TransactionReceipt | null> {
    try {
      const data =
        typeof metadata === "string"
          ? ethers.utils.toUtf8Bytes(metadata)
          : metadata;
      const tx: ethers.providers.TransactionResponse =
        await this.registryContract.storeAggregateResult(resultHash, data);
      const receipt = await tx.wait(1);
      return receipt;
    } catch (error) {
      console.error("SDK: Error calling storeAggregateResult:", error);
      return null;
    }
  }

  async merkleRootCount(): Promise<number> {
    try {
      const n: ethers.BigNumber = await this.registryContract.merkleRootCount();
      return n.toNumber();
    } catch (error) {
      console.error("SDK: Error calling merkleRootCount:", error);
      return 0;
    }
  }

  async merkleRootAt(idx: number): Promise<string | null> {
    try {
      const r: string = await this.registryContract.merkleRootAt(idx);
      return r;
    } catch (error) {
      console.error("SDK: Error calling merkleRootAt:", error);
      return null;
    }
  }
}
```

---

### `packages/contracts/test/ApplyTransaction.test.js`

```javascript
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
```

---

### `packages/relayer/server.js` (simple example)

```javascript
import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const queue = [];
const status = {};

app.post("/api/v1/submit", (req, res) => {
  const id = `tx_${Date.now()}`;
  queue.push({ id, payload: req.body });
  status[id] = { state: "queued", receivedAt: Date.now() };
  res.json({ id, status: "queued" });
});

app.get("/api/v1/status/:id", (req, res) => {
  const s = status[req.params.id] || { state: "unknown" };
  res.json(s);
});

app.get("/api/v1/anonymity-set", (req, res) => {
  res.json({ set: ["pk_demo_1", "pk_demo_2", "pk_demo_3", "pk_demo_4"] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Relayer listening on ${PORT}`));
```

---

### `./.github/workflows/test-packages.yml`

```yaml
name: Test packages

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: "pnpm"

      - name: Install pnpm
        run: |
          npm install -g pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run package tests
        run: pnpm -w test:packages
```

---

## Gợi ý tiếp theo

- Nếu muốn, tôi có thể:
  - A) Thực tế chèn `generate-verifier.js` vào `packages/contracts/scripts` và commit (tôi sẽ tạo file với nội dung mẫu).
  - B) Tạo branch và PR mẫu với các thay đổi nhỏ (ví dụ: thêm bytes wrapper nếu thiếu).
  - C) Chạy (hoặc hướng dẫn chạy) test cục bộ.

Vui lòng cho biết bạn muốn tôi tiếp tục bước nào. Nếu OK, tôi sẽ đánh dấu task `Embed full source` là hoàn tất.

# Person 2 — Smart Contracts: Handoff & Task List

Tài liệu này dành cho Person 2 (Smart Contract Lead). Nội dung trình bày mục tiêu, bước thực hiện, kiểm thử và hướng chuyển giao tương tự phong cách Person 1 nhưng tập trung vào việc hoàn thiện hợp đồng, API bytes, lịch sử Merkle, và tích hợp verifier.

**Mục tiêu chính**:

# Person 2 Handoff — Full Detailed Guide

Phiên bản mở rộng này dành cho Person 2. Tài liệu này mô tả mục tiêu, bối cảnh, yêu cầu, hướng dẫn chi tiết triển khai, ví dụ mã, tập lệnh tiện ích, cấu hình CI, kiểm thử và checklist bàn giao. Mục tiêu là để bạn có thể tiếp nhận, phát triển và chuyển giao phần việc (bytes-based transaction API, merkle history, aggregate results, SDK integration) một cách tự tin.

**Tóm tắt mục tiêu:**

- **Thêm API hợp đồng:** `applyTransactionBytes(bytes proofBytes, bytes pubData)` cho `TransactionRegistry` để nhận proof dưới dạng bytes và xử lý nội bộ.
- **Lưu lịch sử merkle roots:** lưu mảng `merkleRoots` kèm index và thời gian.
- **API lưu kết quả aggregate:** `storeAggregateResult(bytes32 resultHash, bytes metadata)` dành cho owner.
- **SDK:** đảm bảo `packages/core` sử dụng ABI biên dịch sẵn (artifact) để tránh mismatch; hỗ trợ gọi `applyTransactionBytes` bằng cách encode proof/publicData thành bytes.
- **Helper:** script `packages/contracts/scripts/generate-verifier.js` để xuất Solidity verifier từ `.zkey` (sử dụng `snarkjs`).

Prerequisites

- Node.js >= 18, pnpm hoặc npm/yarn (repo dùng pnpm in many flows).
- Hardhat (dev-dependency in `packages/contracts`).
- `snarkjs` (globally or locally) to generate verifier from `.zkey` files.
- Test chain: local Hardhat node or an RPC URL (HARDHAT_URL).

Important file paths (quick reference)

- `packages/contracts/contracts/TransactionRegistry.sol` — hợp đồng cần chỉnh sửa.
- `packages/contracts/test/ApplyTransaction.test.js` — nơi thêm test cho bytes flow.
- `packages/contracts/scripts/generate-verifier.js` — helper để export Solidity verifier.
- `packages/core/src/client.ts` — SDK client; đã có đường dẫn để ưu tiên artifact ABI và encode bytes.
- `packages/relayer/server.js` — relayer HTTP API (mở rộng để support bytes payload nếu cần).

Strategy & High-level plan

- Week 0: Chuẩn bị môi trường, cài dependencies, đọc tests hiện có.
- Week 1: Implement contract API (`applyTransactionBytes`, `_applyTransaction`, merkle history), add unit tests.
- Week 2: SDK + relayer updates, run integration tests end-to-end with mock verifier.
- Week 3: Add verifier generator script (snarkjs flow), generate real verifier if `.zkey` available, update CI.
- Week 4: Polish docs, examples, open PR, and hand off.

==== WEEK-BY-WEEK DETAILED TASKS ====

Week 0 — Setup & discovery

- Clone repo and install:

```bash
cd f:/Privacy-SDK/privacy-sdk
pnpm install
```

- Verify packages exist and tests run locally (fast smoke):

```bash
pnpm run -w test:packages
```

- Open these files and read them carefully:
  - `packages/contracts/contracts/TransactionRegistry.sol`
  - `packages/core/src/client.ts`
  - `packages/relayer/server.js`
  - `packages/contracts/test/*.js`

Week 1 — Contract: bytes API + merkle history

1. Design decisions

- The contract should keep typed internal function `_applyTransaction(...)` to process decoded inputs. `applyTransactionBytes` simply decodes bytes arguments and calls `_applyTransaction`.
- We must maintain backward compatibility with existing API `registerRoot` or `applyTransaction` (if present).

2. Solidity changes (example snippet)

Below is a concise example to guide implementation. Insert this into `TransactionRegistry.sol` in the right place — adapt types/names to the real contract layout.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TransactionRegistry is Ownable {
    bytes32[] public merkleRoots;

    event MerkleRootRegistered(bytes32 root, uint256 index, uint256 timestamp);

    // New bytes-based entry point
    function applyTransactionBytes(bytes calldata proofBytes, bytes calldata pubData) external {
        // decode, validate, and call internal apply
        // decoding depends on how proofs & pubData are structured
        _applyTransaction(proofBytes, pubData, msg.sender);
    }

    // internal common logic
    function _applyTransaction(bytes calldata proofBytes, bytes calldata pubData, address sender) internal {
        // 1) decode pubData to extract new root or other public inputs
        bytes32 newRoot = abi.decode(pubData, (bytes32));
        // 2) append to history
        merkleRoots.push(newRoot);
        uint256 idx = merkleRoots.length - 1;
        emit MerkleRootRegistered(newRoot, idx, block.timestamp);
        // 3) (optional) verify proof using Verifier contract by calling verifyProof with parsed arguments
        // 4) other business logic
    }

    function merkleRootCount() external view returns (uint256) {
        return merkleRoots.length;
    }

    function merkleRootAt(uint256 idx) external view returns (bytes32) {
        require(idx < merkleRoots.length, "index OOB");
        return merkleRoots[idx];
    }

    mapping(bytes32 => bytes) public aggregateResults;

    function storeAggregateResult(bytes32 resultHash, bytes calldata metadata) external onlyOwner {
        aggregateResults[resultHash] = metadata;
    }
}
```

3. Unit tests to add

- Add `ApplyTransaction.test.js` with tests covering:
  - calling `applyTransactionBytes` with correct pubData pushes merkle root and emits event
  - `merkleRootCount` and `merkleRootAt` reflect new entries
  - `storeAggregateResult` callable only by owner

Example test snippet (Mocha/Chai style):

```js
const { expect } = require("chai");

describe("TransactionRegistry bytes API", function () {
  it("registers a root via bytes", async function () {
    const tx = await registry.applyTransactionBytes(
      ethers.utils.hexlify([0x00]),
      ethers.utils.defaultAbiCoder.encode(["bytes32"], [root])
    );
    await tx.wait();
    expect(await registry.merkleRootCount()).to.equal(1);
  });
});
```

Week 2 — SDK + Relayer + Integration

1. SDK (`packages/core/src/client.ts`)

- Ensure the client prefers compiled artifact ABI if available. That is already implemented, but verify it finds the new function name `applyTransactionBytes` in `artifacts`.
- Add a helper method to encode proof/public inputs into bytes and call `applyTransactionBytes`.

Example TypeScript helper:

```ts
async submitTransactionBytes(proof: any, publicSignals: any) {
  // compact/serialize proof & publicSignals
  const proofBytes = Buffer.from(JSON.stringify({ proof, publicSignals }));
  const pubData = ethers.utils.defaultAbiCoder.encode(["bytes32"],[pubRoot]);
  const tx = await this.registryContract.applyTransactionBytes(proofBytes, pubData, { from: this.signer });
  return tx.wait();
}
```

2. Relayer

- Extend `packages/relayer/server.js` to accept proof and public inputs in POST payload and forward to SDK or directly to contract via a signer. Validate size limits and queue.

3. Integration tests

- Add or update `packages/core/test/integration.test.ts` to spin up a local Hardhat node (or use existing) and run an end-to-end flow: generate a mock proof, call SDK `submitTransactionBytes`, wait for event, assert merkle history length.

Week 3 — Verifier generator & real proofs

1. `generate-verifier.js` (example)

Create `packages/contracts/scripts/generate-verifier.js` with the following logic:

```js
const { execSync } = require("child_process");
const path = require("path");

// Usage: node generate-verifier.js path/to/circuit_final.zkey output/Verifier.sol
const zkey = process.argv[2];
const out =
  process.argv[3] || path.join(process.cwd(), "contracts", "Verifier.sol");

if (!zkey) {
  console.error("Provide path to .zkey");
  process.exit(1);
}

// ensure snarkjs is available (global or local node_modules/.bin)
const cmd = `npx snarkjs zkey export solidityverifier ${zkey} ${out}`;
console.log("Running:", cmd);
execSync(cmd, { stdio: "inherit" });
console.log("Wrote verifier to", out);
```

Notes:

- `snarkjs` must be installed; prefer to `pnpm add -Dw snarkjs` in `packages/contracts` or use `npx`.
- The generated `Verifier.sol` might need small edits (pragma solidity version, import paths) to compile with the repo's Solidity settings.

Week 4 — CI, examples, PR, handoff

1. CI example (GitHub Actions)

Create `.github/workflows/test-packages.yml` with a simple pipeline that installs dependencies and runs `pnpm -w test:packages`. Example snippet:

```yaml
name: Test packages
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      - name: Run tests
        run: pnpm -w test:packages
```

2. PR checklist

- Small, focused commits (contract change + tests, SDK change + tests, relayer, docs).
- Run tests locally before pushing.
- Update `packages/contracts/artifacts` only via build pipeline — don't commit manual changes to ABI unless necessary.

Troubleshooting & common pitfalls

- ABI mismatch: If SDK doesn't see `applyTransactionBytes`, it will fail at runtime with "function not found". Fix: ensure `artifacts` folder contains the new ABI or `client.ts` is pointed at compiled build output.
- Verifier compile errors: Adjust pragma and imported helper libraries in the generated `Verifier.sol` from `snarkjs`; snarkjs may generate `pragma solidity >=0.6.0` and use helper libraries — make them compatible with your Hardhat compiler settings.
- Proof encoding: agree a deterministic encoding schema in both verifier generation and SDK. Prefer using ABI encoding when possible.

Deliverables checklist (for final handoff)

- [ ] `TransactionRegistry.sol` modified and compiled.
- [ ] Unit tests added and passing (`ApplyTransaction.test.js`).
- [ ] SDK helper added and integration test passes.
- [ ] `generate-verifier.js` helper added and documented.
- [ ] CI workflow added to `.github/workflows`.
- [ ] Example scripts updated in `packages/examples` showing end-to-end flow.
- [ ] PR opened with clear description and reviewers assigned.

Appendix — Useful commands

- Install

```bash
pnpm install
```

- Compile contracts

```bash
cd packages/contracts
pnpm run compile
```

- Run contracts tests

```bash
cd packages/contracts
pnpm test
```

- Run all packages tests (root)

```bash
pnpm -w test:packages
```

Appendix — Contact & context notes

- Person 3 will supply `.zkey`, `proof.json`, `public.json` for the actual Groth16 verifier flow. Without these, you can mock proofs in tests.
- If you need me to implement any of the code changes above (contract edits, tests, scripts, CI), tell me which item to pick and I'll open a focused branch and implement it.

---

End of full handoff.

If you want, I can now implement one of the following next: (A) actually edit `TransactionRegistry.sol` and add unit tests, (B) add `generate-verifier.js` under `packages/contracts/scripts`, or (C) add the GitHub Actions workflow file. Tell me which and I'll start (I'll update the todo list and apply the changes).

**Tuần 1 — Thiết kế & impl cơ bản**

1. Mục: chuẩn hoá interface contract và thêm wrapper bytes

- Sửa `packages/contracts/contracts/TransactionRegistry.sol`:
  - Thêm `bytes32[] public merkleRoots;` hoặc `merkleRoots` tương tự, hàm `merkleRootCount()` và `merkleRootAt(uint256)`.
  - Thêm hàm public `applyTransactionBytes(bytes memory proofBytes, bytes memory pubData)` — giải mã `abi.decode` bên trong và gọi `_applyTransaction(...)`.
  - Định nghĩa `_applyTransaction(...)` internal để chứa logic cộng root, kiểm thử nullifier, emit event.
  - Thêm `storeAggregateResult(bytes32 resultHash, bytes memory metadata)` với `onlyOwner` (hoặc admin modifier) và event tương ứng.

2. Hành động (tệp/đường dẫn):

- `packages/contracts/contracts/TransactionRegistry.sol` — cập nhật hợp đồng.
- `packages/contracts/test/ApplyTransaction.test.js` — thêm test cho đường bytes path (gọi `applyTransactionBytes`).

3. Lệnh compile/test:

```bash
npx hardhat compile
npx hardhat test test/ApplyTransaction.test.js
```

---

**Tuần 2 — Tests, artifact ABI và SDK integration**

1. Mục: đảm bảo SDK có ABI mới và gửi proof dưới dạng bytes

- SDK (packages/core/src/client.ts):
  - Khi `proof` + `pubData` có, ABI-encode arrays giống contract và gọi `registry.applyTransactionBytes(proofBytes, pubBytes)`.
  - Nếu không tìm thấy wrapper trong ABI, fallback tới `registerRoot` hoặc thông báo rõ.
  - Thêm helper: `merkleRootCount()`, `merkleRootAt(idx)` và `storeAggregateResult(resultHash, metadata)`.

2. Tests tích hợp:

- `packages/core/test/integration.test.ts` — start một local Hardhat node khi `HARDHAT_URL` không cung cấp; deploy MockVerifier + TransactionRegistry; gọi SDK `submitTransaction(proofObj, pubArr)` để cover bytes path.

3. Lệnh kiểm tra:

```bash
# Từ repo root
node scripts/run-packages-tests.js
# (hoặc) cd packages/contracts && npx hardhat test
# cd packages/core && pnpm test
```

---

**Tuần 3 — Verifier generation & test data**

1. Mục: cung cấp công cụ để chuyển snarkjs artifacts sang Verifier.sol và tích hợp

- Thêm script: `packages/contracts/scripts/generate-verifier.js`
  - Nhận đường dẫn `.zkey` và chạy `npx snarkjs zkey export solidityverifier <zkey> Verifier.sol` (thực hiện via spawn/child_process)
  - Copy/sửa header, đặt vào `packages/contracts/contracts/Verifier.sol`.

2. Test vectors

- Yêu cầu Person 3 cung cấp `proof.json` và `public.json` vào `packages/contracts/test/test-data/`.
- Chạy test full verify bằng Groth16 Verifier thật (nếu có artifacts).

3. Lệnh ví dụ:

```bash
node packages/contracts/scripts/generate-verifier.js --zkey packages/circuits/build/circuit_final.zkey --out packages/contracts/contracts/Verifier.sol
npx hardhat compile --project packages/contracts
npx hardhat test --project packages/contracts
```

---

**Tuần 4 — CI, deploy helpers, docs & handoff**

1. Mục: CI + deploy template + tài liệu chuyển giao

- Thêm workflow CI: `.github/workflows/test-packages.yml` chạy `node scripts/run-packages-tests.js`.
- Thêm template deploy `deploy-sepolia.yml` (manual/dispatch) — cần secrets `SEPOLIA_RPC`, `DEPLOYER_PRIVATE_KEY`, `ETHERSCAN_API_KEY`.

2. Tài liệu handoff (tập trung vào Person 2):

- Ghi rõ: file cần chỉnh sửa, lệnh test/compile, cách chạy integration tests, nơi đặt zkey/proof/public artifacts.
- Thêm checklist nhỏ:
  - [ ] generate verifier từ zkey
  - [ ] compile contracts
  - [ ] chạy unit tests contracts
  - [ ] chạy integration SDK tests
  - [ ] push branch & mở PR

3. File để thêm/cập nhật:

- `docs/person2-handoff.md` (file này)
- `packages/contracts/scripts/generate-verifier.js` (nếu chưa có)
- `.github/workflows/test-packages.yml` và `deploy-sepolia.yml` (template)

---

**Các notes quan trọng / debugging tips**

- Nếu SDK gọi `applyTransactionBytes` nhưng ABI dùng bởi SDK chưa có hàm đó -> SDK sẽ ném lỗi. Giải pháp: SDK nên ưu tiên ABI từ `packages/contracts/artifacts/.../TransactionRegistry.json` nếu tồn tại (đoạn code đã sẵn có trong `packages/core/src/client.ts`).
- Khi viết `applyTransactionBytes`, hãy chắc rằng orientation của `pi_b` tương thích (snarkjs chiều đôi khi đảo phần tử). Kiểm tra từng phần tử khi ABI-encode.
- Tránh hardcode chiều dài public input — pad hoặc truncate tới kích thước hợp đồng mong muốn.

---

**Checklist triển khai nhanh (copy-paste)**

1. Compile contracts

```bash
cd packages/contracts
npx hardhat compile
```

2. Run contract unit tests

```bash
npx hardhat test test/ApplyTransaction.test.js
```

3. Generate Verifier (khi có `.zkey`)

```bash
node packages/contracts/scripts/generate-verifier.js --zkey packages/circuits/build/circuit_final.zkey
```

4. Run core integration tests (spawns local node if needed)

```bash
cd packages/core
pnpm test
```

5. Run full packages test wrapper

```bash
cd <repo-root>
node scripts/run-packages-tests.js
```
