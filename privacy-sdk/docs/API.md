# Privacy SDK API Documentation

## Installation
```bash
pnpm add @privacy-sdk/core
```

## Quick Start
```typescript
import { PrivacyClient } from '@privacy-sdk/core';

const client = new PrivacyClient({
  rpcUrl: 'http://127.0.0.1:8545',
  contractAddress: '0x...',
  relayerUrl: 'http://localhost:3001',
});
```

## API Reference

### PrivacyClient

#### Constructor
```typescript
new PrivacyClient(config: PrivacyClientConfig)
```

**Parameters:**
- `config.rpcUrl` (string): RPC URL của blockchain node
- `config.contractAddress` (string, optional): Địa chỉ contract
- `config.relayerUrl` (string, optional): URL của relayer service

#### Methods

##### createWallet()

Tạo ví mới với keypair ngẫu nhiên.
```typescript
async createWallet(): Promise<{
  address: string;
  privateKey: string;
  mnemonic: string;
}>
```

**Returns:** Object chứa address, private key và mnemonic phrase

**Example:**
```typescript
const wallet = await client.createWallet();
console.log(wallet.address); // 0x...
```

##### importWallet(privateKey)

Import ví từ private key.
```typescript
async importWallet(privateKey: string): Promise<string>
```

**Parameters:**
- `privateKey` (string): Private key ở dạng hex (0x...)

**Returns:** Địa chỉ ví

**Example:**
```typescript
const address = await client.importWallet('0xabc...');
```

##### deposit(amount)

Deposit ETH vào privacy pool.
```typescript
async deposit(amount: string): Promise<string>
```

**Parameters:**
- `amount` (string): Số lượng ETH (ví dụ: "1.0")

**Returns:** Transaction hash

**Example:**
```typescript
const txHash = await client.deposit('1.0');
```

##### transfer(to, amount, anonymitySet?)

Chuyển ETH ẩn danh qua relayer.
```typescript
async transfer(
  to: string,
  amount: string,
  anonymitySet?: string[]
): Promise<string>
```

**Parameters:**
- `to` (string): Địa chỉ nhận
- `amount` (string): Số lượng ETH
- `anonymitySet` (string[], optional): Tập các địa chỉ để ẩn danh

**Returns:** Transaction hash

**Example:**
```typescript
const txHash = await client.transfer('0x123...', '0.5');
```

##### withdraw(to, amount)

Rút ETH từ privacy pool.
```typescript
async withdraw(to: string, amount: string): Promise<string>
```

**Parameters:**
- `to` (string): Địa chỉ nhận
- `amount` (string): Số lượng ETH

**Returns:** Transaction hash

**Example:**
```typescript
const txHash = await client.withdraw('0x123...', '0.5');
```

##### getBalance()

Lấy số dư ví hiện tại.
```typescript
async getBalance(): Promise<string>
```

**Returns:** Số dư (ETH)

**Example:**
```typescript
const balance = await client.getBalance();
console.log(balance); // "10.5"
```

---

## Relayer API

### Base URL
```
http://localhost:3001
```

### Endpoints

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-02T10:00:00.000Z",
  "relayerAddress": "0x..."
}
```

#### GET /balance

Lấy balance của relayer.

**Response:**
```json
{
  "success": true,
  "balance": "100.0",
  "address": "0x..."
}
```

#### POST /api/relay

Relay transaction.

**Request Body:**
```json
{
  "type": "transfer",
  "from": "0x...",
  "to": "0x...",
  "amount": "1.0",
  "anonymitySet": ["0x...", "0x..."]
}
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x..."
}
```

#### GET /api/tx/:hash

Lấy trạng thái transaction.

**Response:**
```json
{
  "success": true,
  "hash": "0x...",
  "status": "pending"
}
```

---

## Smart Contract Interface

### TransactionRegistry

#### Events
```solidity
event Deposit(
    bytes32 indexed commitment,
    uint256 leafIndex,
    uint256 timestamp
);

event Withdrawal(
    bytes32 indexed nullifier,
    address indexed recipient,
    uint256 amount,
    bytes32 root
);

event RootUpdated(
    bytes32 indexed oldRoot,
    bytes32 indexed newRoot,
    uint256 timestamp
);
```

#### Functions
```solidity
function deposit(bytes32 commitment) external payable

function withdraw(
    bytes32 nullifier,
    address payable recipient,
    uint256 amount,
    bytes32 root
) external

function isKnownRoot(bytes32 root) public view returns (bool)

function getBalance() external view returns (uint256)
```

---

## Error Handling

All SDK methods throw errors on failure:
```typescript
try {
  await client.deposit('1.0');
} catch (error) {
  console.error('Deposit failed:', error.message);
}
```

Common errors:
- `"Wallet not initialized"` - Chưa tạo hoặc import ví
- `"Insufficient balance"` - Không đủ tiền
- `"Relayer error"` - Lỗi từ relayer service
- `"Invalid address"` - Địa chỉ không hợp lệ