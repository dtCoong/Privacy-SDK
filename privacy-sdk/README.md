# Privacy SDK - Monorepo

This repository has been reorganized into a packages-oriented monorepo.

Packages:

Notes:

Quick start (Windows cmd.exe):
pnpm -w -r install

# Run core tests (from package)

````markdown
# Privacy SDK - Monorepo

This repository is organized as a packages-oriented monorepo for the Privacy SDK.

Packages:

- `packages/core` - SDK package (`@yourproject/privacy-sdk`) with `ContractClient`, ring-sig demo, and SDK tests.
- `packages/contracts` - On-chain contracts (`TransactionRegistry`, `Verifier`, mocks) and contract tests.
- `packages/relayer` - Minimal relayer demo/service used in integration tests.
- `packages/examples` - Example apps (privacy-mixer, etc.).

Docs: see the `docs/` folder for package-specific guides and the contracts overview:

- `docs/contracts.md` - contracts design, deployment and testing notes.
- `docs/core.md` - SDK usage and client examples. (new)
- `docs/relayer.md` - relayer design and running the demo. (new)
- `docs/examples.md` - example packages and how to run them. (new)
- `docs/release.md` - release scripts and safe release checklist. (new)

Notes:

- The old top-level `sdk/` folder was migrated into `packages/core`. If you still see an `sdk/` directory, it may be a duplicate — verify and remove if unnecessary.

Quick start (Windows `cmd.exe`):

```cmd
cd f:\Privacy-SDK\privacy-sdk
pnpm install
pnpm -w -r install

# Run core tests (from package)
cd packages\core
npm install
npm test
```

If you use `pnpm`, the workspace is configured in `pnpm-workspace.yaml` and includes `packages/*`.

Development tips:

- Use `node`/`pnpm` commands from package directories when working on individual packages.
- For Docker builds, the repository includes a `.dockerignore` to keep build context small.
- Use the `docs/` folder for up-to-date package-specific instructions.

# @yourproject/privacy-sdk

Privacy SDK is a monorepo providing an on-chain privacy primitives stack and an accompanying TypeScript SDK. It contains smart contracts (ZK verifier + registry), an SDK for dApps to interact with the contracts, a minimal relayer demo, and example packages.

Repository layout

- `packages/core` — TypeScript SDK package (main client library).
- `packages/contracts` — Solidity contracts, tests, and Hardhat deploy scripts.
- `packages/relayer` — Example relayer service used in integration tests.
- `packages/examples` — Example applications demonstrating use of the SDK.
- `docs/` — Project documentation and handoff notes.

Key tasks implemented

- `TransactionRegistry.sol` with typed and bytes-based proof submission, append-only merkle history, and aggregate result API.
- SDK `ContractClient` in `packages/core/src/client.ts` with `verifyProof`, `submitTransaction` (bytes path), `storeAggregateResult`, and merkle history helpers.
- Test orchestration: `scripts/run-packages-tests.js` and GitHub Actions `test-packages.yml` to run package tests.
- Helper script: `packages/contracts/scripts/generate-verifier.js` to produce a Solidity verifier from snarkjs `.zkey`.

Quick start (Windows `cmd.exe`)

```cmd
cd f:\\Privacy-SDK\\privacy-sdk
pnpm install
pnpm -w -r install

# Run all package tests (contracts then core)
npm run test:packages
```

Generate Solidity verifier from snarkjs

Person 3 (circuit lead) should produce circuit outputs in `packages/circuits/build`. To generate a verifier contract from a final zkey:

```cmd
node packages\\contracts\\scripts\\generate-verifier.js
cd packages\\contracts
npx hardhat compile
```

Deployment

- Local (fast, uses `MockVerifier`):

```cmd
cd privacy-sdk
npm run deploy:local
```

- Sepolia (testnet): set environment variables and run deploy script

```cmd
set SEPOLIA_RPC=https://sepolia.infura.io/v3/<KEY>
set DEPLOYER_PRIVATE_KEY=0x<PRIVATE_KEY>
set ETHERSCAN_API_KEY=<ETHERSCAN_KEY>   # optional
npm run deploy:sepolia
```

Documentation

- Contracts design: `docs/contracts.md`
- Handoff / checklist for Person 2: `docs/person2-handoff.md`
- Project overview: `docs/overview.md`

Contributing

If you want me to open a PR for the current changes, remove duplicate `sdk/` folders, or prepare a release workflow (CI secrets required), tell me which action to take next.
````
