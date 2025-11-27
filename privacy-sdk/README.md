# Privacy SDK

Monorepo cho Privacy SDK - Giải pháp giao dịch ẩn danh trên blockchain.

## Cấu trúc Dự án
```
privacy-sdk/
├── packages/
│   ├── core/          # SDK chính
│   ├── contracts/     # Smart contracts
│   ├── circuits/      # ZK circuits (TODO)
│   ├── relayer/       # Relayer service
│   └── examples/      # Ví dụ tích hợp
└── docs/              # Documentation
```

## Cài đặt
```bash
pnpm install
```

## Development

### Build tất cả packages
```bash
pnpm build
```

### Chạy tests
```bash
pnpm test
```

### Start local blockchain
```bash
cd packages/contracts
npx hardhat node
```

### Deploy contracts
```bash
cd packages/contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Start relayer
```bash
cd packages/relayer
pnpm dev
```

### Run examples
```bash
cd packages/examples
pnpm basic
```

## Packages

### @privacy-sdk/core

Core SDK cho privacy transactions.
```typescript
import { PrivacyClient } from '@privacy-sdk/core';

const client = new PrivacyClient({
  rpcUrl: 'http://127.0.0.1:8545',
  contractAddress: '0x...',
  relayerUrl: 'http://localhost:3001',
});
```

### @privacy-sdk/contracts

Smart contracts cho privacy transactions.

### @privacy-sdk/relayer

Relayer service để broadcast transactions ẩn danh.

### @privacy-sdk/examples

Ví dụ sử dụng SDK.

## Documentation

- [API Documentation](docs/API.md)
- [Relayer Protocol](docs/RELAYER_PROTOCOL.md)

## License

MIT
