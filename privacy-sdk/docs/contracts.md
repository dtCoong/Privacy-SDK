# Contracts Overview

This document summarizes the on-chain contracts for the Privacy SDK (Person 2 deliverables).

## `TransactionRegistry.sol`

- Purpose: store the latest Merkle root, prevent double-spend using nullifiers, and act as the on-chain integration point for zkSNARK verification.
- Key state:
  - `bytes32 public currentMerkleRoot` — latest Merkle root
  - `mapping(uint256 => bool) public nullifiersUsed` — used nullifier tracker
  - `IVerifier public immutable verifier` — verifier contract address
- Key functions:

  - `constructor(address verifierAddress)` — provide the verifier contract address at deploy time
  - `registerRoot(bytes32 root)` — owner-only helper to register a root
  - `storeAggregateResult(bytes32 resultHash, bytes calldata metadata)` — owner-only store meta results
  - `applyTransaction(uint256[2] a, uint256[2][2] b, uint256[2] c, uint256[3] input)` — verify proof and apply transaction

  ### Bytes-based submission API: `applyTransactionBytes`

  - Purpose: Accept a generic bytes-encoded proof and bytes-encoded public inputs so SDKs or relayers that already have ABI-encoded proofs can submit without reconstructing typed arrays in JS.
  - Solidity signature: `function applyTransactionBytes(bytes calldata proofBytes, bytes calldata pubData)` — this wrapper decodes `proofBytes` as `(uint256[2], uint256[2][2], uint256[2])` and `pubData` as `uint256[3]` and then runs the same verification + state update flow as `applyTransaction`.
  - SDK usage (example in `packages/core/src/client.ts`):

    - ABI-encode proof: `ethers.utils.defaultAbiCoder.encode(["uint256[2]","uint256[2][2]","uint256[2]"], [a,b,c])`
    - ABI-encode public inputs: `ethers.utils.defaultAbiCoder.encode(["uint256[3]"], [pubArray])`
    - Call: `registry.applyTransactionBytes(proofBytes, pubBytes)`

  This API makes integration simpler for external relayers or SDKs that manage proofs as raw bytes.

  Merkle root history

  - `TransactionRegistry` now keeps an append-only array of registered merkle roots: `bytes32[] public merkleRoots`.
  - Helpers: `merkleRootCount()` returns the number of stored roots and `merkleRootAt(uint256)` returns the root at index (0-based).
  - `registerRoot` and `applyTransaction`/`applyTransactionBytes` push new roots into the history in addition to updating `currentMerkleRoot`.

  Aggregate results

  - `storeAggregateResult(bytes32 resultHash, bytes calldata metadata)` is owner-only and emits `AggregateResultStored` with the provided metadata. The SDK exposes a `storeAggregateResult` helper to submit results.

Notes:

- `applyTransaction` expects public inputs encoded as a `uint256` array with at least 3 elements: `[newRoot, nullifier, ...]`.
- Nullifier is checked and set on successful verification to prevent double-spend.

Merkle helper note

- `packages/contracts/scripts/merkle.js` duplicates an odd leaf when hashing an unmatched pair (common padding strategy). Ensure this matches the Merkle construction expected by verifier circuits and tests.

See also `docs/release.md` for release script guidance and `docs/core.md` for SDK usage.

Stubs and local helpers (new locations)

- `packages/core/libs/ringsig/index.ts`: demo ring-signature helpers used for local tests. This is NOT production-grade and should be replaced by Person 4's implementation.
- `packages/contracts/scripts/merkle.js`: helper to build leaf hashes and compute a Merkle root for local testing. Example (run from repo root):

```cmd
node packages/contracts/scripts/merkle.js alice bob carol
```

Use these helpers only for local/integration testing. Replace with production implementations/artifacts when available.

## `IVerifier.sol`

- Interface matching generated `Groth16Verifier` from `snarkjs`.
- `verifyProof` signature matches the verifier contract and is used by `TransactionRegistry`.

## `MockVerifier.sol`

- Simple testing-only verifier that always returns `true`. Used in local tests and `scripts/deploy.js`.

## Deployment

Deployment

- Local (fast): `node scripts/deploy.js` (deploys `MockVerifier` + `TransactionRegistry` and writes `scripts/last-deploy.json`).
- Testnet: `scripts/deploy-sepolia.js` deploys `Groth16Verifier` (generated) and `TransactionRegistry` with the real verifier address.

Windows (cmd.exe) example for testnet (set env vars):

```cmd
set SEPOLIA_RPC=https://sepolia.infura.io/v3/<KEY>
set DEPLOYER_PRIVATE_KEY=0x...
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

Local integration test (SDK ↔ Contracts)

The integration test has been updated to be self-contained. Tests now expect code to live under `packages/` by default and will look for artifacts / helper scripts there.

1. Run tests from the repo root or from `packages/core`:

```cmd
cd f:\Privacy-SDK\privacy-sdk\packages\core
npm install
npm test
```

Notes:

- `packages/contracts/scripts/deploy.js` (if present) or top-level `scripts/deploy.js` will write deployed addresses to `scripts/last-deploy.json` so tests can pick them up automatically. If you use the package-local deploy scripts, run them from the package or pass absolute paths.
- You can set `REGISTRY_ADDRESS` and `VERIFIER_ADDRESS` environment variables to use pre-deployed contracts.
- The integration test may transfer ownership of `TransactionRegistry` to the test relayer key so that `registerRoot` can be called during the test.

## Security & Gas Notes

- Use `calldata` on external inputs (already used for `applyTransaction` via calldata arrays).
- Keep storage writes minimal (only nullifier and current root are stored).
- Run `npx hardhat test` and gas reporter (if configured) before mainnet deployments.

Gas reporting

- To enable gas reporting, install the dev dependency and run tests with the env var:

```cmd
cd e:\hieu\hieu\DuAnZKP
npm install --save-dev hardhat-gas-reporter
set GAS_REPORTER=true
npx hardhat test
```

If you want USD cost estimates, set `COINMARKETCAP_API_KEY` env var before running.
