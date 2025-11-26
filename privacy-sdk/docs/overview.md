# Privacy SDK - Overview

This repository is a monorepo for the Privacy SDK and related components. It contains source, tests and docs for running local development, testing, and (optionally) deploying to testnets.

Top-level packages

- `packages/core` — TypeScript SDK (`@yourproject/privacy-sdk`) with `ContractClient`, ring-signature demo helpers, and SDK tests.
- `packages/contracts` — Solidity contracts including `TransactionRegistry`, `Verifier` (Groth16 verifier generated from snarkjs), and mocks. Contains Hardhat tests and deploy scripts.
- `packages/relayer` — Minimal relayer demo server used in integration tests.
- `packages/examples` — Example applications (privacy-mixer, anonymous voting demos, etc.).

Quick start (Windows cmd.exe)

```cmd
cd f:\Privacy-SDK\privacy-sdk
pnpm install
pnpm -w -r install

# Run package tests (contracts + core)
npm run test:packages
```

Files of interest

- `packages/core/src/client.ts` — SDK `ContractClient` with `verifyProof`, `submitTransaction`, `storeAggregateResult`, and merkle history helpers.
- `packages/contracts/contracts/TransactionRegistry.sol` — Registry contract with typed and bytes proof submission APIs and merkle root history.
- `packages/contracts/scripts/generate-verifier.js` — Helper to generate Solidity verifier from snarkjs `.zkey`.
- `packages/contracts/scripts/deploy-sepolia.js` — Testnet deployment script (Sepolia).
- `scripts/run-packages-tests.js` — Wrapper that runs contract tests and core tests in sequence.

Generating a Solidity verifier (snarkjs)

Person 3 (ZK Circuit Lead) should produce snarkjs artifacts. To generate a Solidity verifier from the final `.zkey`:

```cmd
# from repo root
node packages\contracts\scripts\generate-verifier.js
cd packages\contracts
npx hardhat compile
```

Deployment (local & testnet)

- Local fast deploy (mock verifier):

```cmd
cd privacy-sdk
npm run deploy:local
```

- Sepolia deploy (requires secrets): set env vars then:

```cmd
set SEPOLIA_RPC=https://sepolia.infura.io/v3/<KEY>
set DEPLOYER_PRIVATE_KEY=0x<PRIVATE_KEY>
set ETHERSCAN_API_KEY=<ETHERSCAN_KEY>   # optional for verification
npm run deploy:sepolia
```

Where to find detailed docs

- Contracts design and APIs: `docs/contracts.md`
- Person 2 handoff and checklist: `docs/person2-handoff.md`
- This overview: `docs/overview.md`

If you'd like additional consolidation (e.g., single README in `docs/` instead of multiple files), tell me which docs you prefer preserved and I'll remove the rest.
