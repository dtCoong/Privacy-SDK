# Privacy SDK

Monorepo cho Privacy SDK - Giải pháp giao dịch ẩn danh trên blockchain.

## Cấu trúc Dự án
```
privacy-sdk/
├── packages/
│   ├── core/          # SDK chính
│   ├── contracts/     # Smart contracts
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

## Documentation

- [API Documentation](docs/API.md)
- [Getting Started](docs/GETTING_STARTED.md)

## License

MIT