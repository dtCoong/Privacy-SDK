# HE Aggregator - Privacy SDK

Homomorphic Encryption Aggregator với Zero-Knowledge Proofs cho Solana blockchain. Module này cung cấp các công cụ để tạo và verify các giao dịch riêng tư sử dụng ZK-SNARKs và Merkle tree commitments.

## 🌟 Tính năng

- ✅ **Zero-Knowledge Proofs** - Chứng minh giao dịch mà không tiết lộ thông tin
- ✅ **Poseidon Hash** - Hash function tối ưu cho ZK circuits
- ✅ **Merkle Tree** - Quản lý commitments hiệu quả (depth=2)
- ✅ **Nullifiers** - Ngăn chặn double-spending
- ✅ **Groth16** - Proving system nhanh và compact
- ✅ **Circom 2.x** - Circuit compiler hiện đại

## 📋 Yêu cầu

- **Node.js** >= 16.0.0
- **Circom** >= 2.1.6
- **SnarkJS** >= 0.7.0
- **Rust & Cargo** (để cài Circom)

## 🚀 Cài đặt

### 1. Clone và cài dependencies

```bash
cd privacy-sdk/packages/he-aggregator
pnpm install
```

### 2. Cài đặt Circom

**Windows (PowerShell):**
```powershell
# Cài Rust
winget install Rustlang.Rustup

# Restart terminal, sau đó download Circom binary
$circcomUrl = "https://github.com/iden3/circom/releases/download/v2.1.6/circom-windows-amd64.exe"
$outputPath = "$env:USERPROFILE\.cargo\bin\circom.exe"
Invoke-WebRequest -Uri $circcomUrl -OutFile $outputPath

# Thêm vào PATH
$env:Path += ";$env:USERPROFILE\.cargo\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\.cargo\bin", [EnvironmentVariableTarget]::User)

# Verify
circom --version
```

**Linux/Mac:**
```bash
# Cài Rust
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh

# Cài Circom từ source
git clone https://github.com/iden3/circom.git
cd circom
cargo build --release
cargo install --path circom

# Verify
circom --version
```

### 3. Cài đặt SnarkJS

```bash
npm install -g snarkjs
```

### 4. Setup Circuit (chỉ chạy 1 lần)

```bash
npm run setup
```

Quá trình này sẽ:
- ✅ Compile circuit Circom → WASM
- ✅ Download Powers of Tau ceremony file (~50MB)
- ✅ Generate proving key (~5MB)
- ✅ Generate verification key
- ⏱️ Mất khoảng 2-5 phút

## 📁 Cấu trúc Project

```
he-aggregator/
├── circuits/
│   ├── transfer.circom              # Circuit definition
│   ├── input.json                   # Test input (auto-generated)
│   ├── transfer.r1cs                # R1CS constraints (generated)
│   ├── transfer_js/
│   │   └── transfer.wasm            # WASM witness generator
│   ├── transfer_final.zkey          # Proving key (generated)
│   └── verification_key.json        # Verification key (generated)
├── src/
│   ├── aggregator.ts                # Main aggregator logic
│   ├── paillier.ts                  # Paillier encryption
│   ├── ringsig.ts                   # Ring signatures
│   └── benchmarks/                  # Performance benchmarks
├── generate_input.js                # Generate test inputs
├── test_logic.js                    # Test logic without ZK
├── test_simple.js                   # Test with ZK proofs
├── run_all.js                       # Complete test suite
├── setup_circuit.js                 # Circuit setup script
├── run-setup.ps1                    # PowerShell setup helper
└── README.md
```

## 🧪 Usage

### Quick Start

```bash
# Test toàn bộ (logic + ZK proof)
npm run test:all

# Test nhanh (chỉ logic, không ZK proof)
npm run test:quick
```

### Từng bước

```bash
# Bước 1: Generate input với random secrets
npm run generate

# Bước 2: Test logic (nhanh, không cần ZK proof)
npm run test:logic

# Bước 3: Test với ZK proof thật
npm run test:proof
```

### Programmatic Usage

```javascript
const circomlibjs = require("circomlibjs");
const { generateInput } = require("./generate_input");
const snarkjs = require("snarkjs");
const fs = require("fs");

async function createPrivateTransaction() {
  // 1. Generate input
  const input = await generateInput();
  
  // 2. Generate proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    "./circuits/transfer_js/transfer.wasm",
    "./circuits/transfer_final.zkey"
  );
  
  // 3. Verify proof
  const vKey = JSON.parse(fs.readFileSync("./circuits/verification_key.json"));
  const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
  
  console.log("Proof verified:", verified);
  return { proof, publicSignals };
}

createPrivateTransaction();
```

## 📝 Circuit Details

### Transfer Circuit

**Public Inputs:**
- `root` - Merkle tree root (256 bits)
- `nullifier` - Nullifier hash (256 bits)

**Private Inputs:**
- `amount` - Số tiền input
- `secret` - Secret key của người gửi
- `pathElements[2]` - Merkle path elements (2 levels)
- `pathIndices[2]` - Merkle path indices (0 or 1)
- `outputAmount` - Số tiền output
- `outputSecret` - Secret key của người nhận

**Constraints:** 1,213

**Merkle Tree Depth:** 2 (4 leaves max)

### How It Works

```
┌─────────────────────────────────────────────────┐
│  1. Commitment Generation                       │
│     commitment = Poseidon(amount, secret)       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  2. Nullifier Generation                        │
│     nullifier = Poseidon(secret, 1)             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  3. Merkle Tree Verification                    │
│     ✓ Verify commitment ∈ Merkle tree           │
│     ✓ Compute root from path                    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  4. Amount Consistency Check                    │
│     ✓ Verify amount >= outputAmount             │
│     ✓ Range proof với Num2Bits(252)             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  5. Output Commitment (implicit)                │
│     Người nhận sử dụng outputAmount +           │
│     outputSecret để tạo commitment mới          │
└─────────────────────────────────────────────────┘
```

## 🔧 Available Scripts

| Script | Mô tả |
|--------|-------|
| `npm run setup` | Setup circuit lần đầu (compile, download ptau, generate keys) |
| `npm run generate` | Tạo test input với random secrets |
| `npm run test:logic` | Test logic không cần ZK proof (nhanh ~100ms) |
| `npm run test:proof` | Test với ZK proof thật (~1-2s) |
| `npm run test:all` | Test đầy đủ (logic + ZK proof) |
| `npm run test:quick` | Test nhanh (skip ZK proof) |
| `npm run build` | Compile circuit manually |
| `npm run clean` | Xóa tất cả generated files |
| `npm run bench` | Chạy performance benchmarks |

## 🔐 Security Features

### Privacy Guarantees

1. **Amount Hiding** 🔒
   - Số tiền được ẩn trong commitment với Poseidon hash
   - Chỉ người biết secret mới tính được commitment

2. **Sender Anonymity** 👤
   - Secret không bao giờ được tiết lộ
   - Không ai biết ai là người gửi thật

3. **Double-Spend Prevention** 🚫
   - Nullifier đảm bảo mỗi commitment chỉ spend 1 lần
   - Nullifier = Poseidon(secret, 1)

4. **Membership Proof** ✅
   - Merkle tree chứng minh commitment hợp lệ
   - Không tiết lộ vị trí trong tree

5. **Zero-Knowledge** 🎭
   - Proof không tiết lộ bất kỳ thông tin private nào
   - Chỉ chứng minh tính hợp lệ

### Cryptographic Primitives

- **Poseidon Hash** - ZK-friendly hash function (optimal for SNARKs)
- **Groth16** - Succinct proof system (192 bytes proof size)
- **Merkle Tree** - Efficient set membership proof
- **Finite Field Arithmetic** - BN254 curve (Alt-BN128)
- **Num2Bits** - Range proof circuit từ circomlib

## 📊 Performance

### Proof Generation Time

| Metric | Value |
|--------|-------|
| Constraints | 1,213 |
| Template instances | 76 |
| Proving time | ~1-2 seconds |
| Verification time | ~10-20 ms |
| Proof size | 192 bytes |
| Public inputs | 2 |
| Wires | 1,220 |

### Benchmarks

```bash
npm run bench
```

Kết quả mẫu:
```
Commitment generation:     0.5ms
Nullifier generation:      0.5ms
Merkle tree (depth 2):     1ms
Witness generation:        50ms
Proof generation:          1500ms
Proof verification:        15ms
Total:                     ~1.5s
```

## 🐛 Troubleshooting

### ❌ Error: Circom not found

```bash
# Windows
$url = "https://github.com/iden3/circom/releases/download/v2.1.6/circom-windows-amd64.exe"
Invoke-WebRequest -Uri $url -OutFile "$env:USERPROFILE\.cargo\bin\circom.exe"
$env:Path += ";$env:USERPROFILE\.cargo\bin"

# Linux/Mac
cargo install circom
```

### ❌ Error: SnarkJS not found

```bash
npm install -g snarkjs
```

### ❌ Error: Circuit files missing

```bash
# Chạy lại setup
npm run setup

# Hoặc compile manually
circom circuits/transfer.circom --r1cs --wasm --sym -o ./circuits -l node_modules
```

### ❌ Error: Too many values for input signal pathElements

Circuit depth và input depth không khớp:

**Fix:**
1. Kiểm tra `circuits/transfer.circom` line cuối:
   ```circom
   component main {public [root, nullifier]} = Transfer(2); // depth phải = 2
   ```

2. Kiểm tra `generate_input.js` line ~27:
   ```javascript
   const treeDepth = 2; // phải khớp với circuit
   ```

3. Recompile:
   ```bash
   npm run build
   npm run test:all
   ```

### ❌ Error: Invalid ptau file

Download lại Powers of Tau:

```bash
Remove-Item powersOfTau28_hez_final_12.ptau -Force
npm run setup
```

### ❌ Error: Duplicate template Num2Bits

Circuit import circomlib's Num2Bits nhưng cũng define riêng:

**Fix:** Xóa custom Num2Bits template, chỉ dùng từ circomlib:
```circom
include "circomlib/circuits/bitify.circom"; // Đã có Num2Bits
// Không định nghĩa lại template Num2Bits
```

## 🔄 Development Workflow

### 1. Modify Circuit

```bash
# Edit circuit
code circuits/transfer.circom

# Recompile
npm run build

# Test logic (nhanh)
npm run test:logic

# Test full (với ZK proof)
npm run test:proof
```

### 2. Adjust Tree Depth

**Ví dụ: Thay đổi từ depth=2 sang depth=3**

**File: `circuits/transfer.circom`**
```circom
// Line cuối cùng
component main {public [root, nullifier]} = Transfer(3); // 8 leaves
```

**File: `generate_input.js`**
```javascript
// Line ~27
const treeDepth = 3; // Phải khớp với circuit
```

**Recompile:**
```bash
npm run build
npm run setup  # Nếu số constraints thay đổi nhiều
npm run test:all
```

### 3. Add More Constraints

**Ví dụ: Thêm recipient verification**

```circom
template Transfer(levels) {
    // ... existing signals ...
    signal input recipientPubKey;
    
    // Verify recipient
    component recipientHasher = Poseidon(1);
    recipientHasher.inputs[0] <== recipientPubKey;
    signal recipientHash <== recipientHasher.out;
    
    // ... rest of circuit ...
}
```

## 🧩 Integration với Solana

### 1. Generate Proof Off-chain (JavaScript/TypeScript)

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { generateProof } from './src/aggregator';

async function sendPrivateTransfer() {
  // Generate ZK proof
  const { proof, publicSignals } = await generateProof({
    amount: 1000,
    secret: userSecret,
    merkleRoot: await getMerkleRoot(),
    outputAmount: 500,
    recipientSecret: recipientSecret
  });
  
  // Send to Solana
  const tx = await program.methods
    .privateTransfer(proof, publicSignals)
    .accounts({
      sender: wallet.publicKey,
      merkleTree: merkleTreeAccount,
      nullifierSet: nullifierSetAccount,
    })
    .rpc();
    
  console.log("Transaction:", tx);
}
```

### 2. Verify On-chain (Solana Program - Rust)

```rust
use anchor_lang::prelude::*;
use groth16_solana::Groth16Verifier;

#[program]
pub mod privacy_transfer {
    use super::*;
    
    pub fn private_transfer(
        ctx: Context<PrivateTransfer>,
        proof: Vec<u8>,
        public_signals: Vec<u8>
    ) -> Result<()> {
        // 1. Verify ZK proof
        let verifier = Groth16Verifier::new(&VERIFICATION_KEY)?;
        require!(
            verifier.verify(&proof, &public_signals)?,
            ErrorCode::InvalidProof
        );
        
        // 2. Extract public signals
        let root = &public_signals[0..32];
        let nullifier = &public_signals[32..64];
        
        // 3. Verify Merkle root
        require!(
            ctx.accounts.merkle_tree.root == root,
            ErrorCode::InvalidRoot
        );
        
        // 4. Check nullifier not spent
        require!(
            !ctx.accounts.nullifier_set.contains(nullifier),
            ErrorCode::DoubleSpend
        );
        
        // 5. Mark nullifier as spent
        ctx.accounts.nullifier_set.insert(nullifier)?;
        
        msg!("Private transfer successful!");
        Ok(())
    }
}
```

## 📚 Resources

### Documentation

- [Circom Documentation](https://docs.circom.io/) - Circuit compiler docs
- [SnarkJS Guide](https://github.com/iden3/snarkjs) - Proof generation library
- [Poseidon Hash](https://www.poseidon-hash.info/) - ZK-friendly hash
- [Groth16 Paper](https://eprint.iacr.org/2016/260.pdf) - Original paper

### Learning Resources

- [Zero-Knowledge Proofs Tutorial](https://zkp.science/) - Interactive ZKP learning
- [Circom Workshop](https://www.youtube.com/watch?v=CTJ1JkYLiyw) - Video tutorial
- [ZK-SNARKs Explained](https://z.cash/technology/zksnarks/) - Beginner friendly
- [0xPARC Learning Resources](https://learn.0xparc.org/) - ZK courses

### Related Projects

- [Tornado Cash](https://github.com/tornadocash/tornado-core) - Private transactions on Ethereum
- [Semaphore](https://github.com/semaphore-protocol/semaphore) - Anonymous signaling
- [Aztec Network](https://aztec.network/) - Private smart contracts
- [Mina Protocol](https://minaprotocol.com/) - Succinct blockchain

## 🤝 Contributing

### Setup Development Environment

```bash
# Clone repo
git clone https://github.com/your-org/privacy-sdk.git
cd privacy-sdk/packages/he-aggregator

# Install dependencies
pnpm install

# Install circomlib
pnpm add -D circomlib

# Setup circuit
npm run setup

# Run tests
npm run test:all
```

### Testing Guidelines

1. ✅ Thêm test cho mọi thay đổi
2. ✅ Run `npm run test:all` trước khi commit
3. ✅ Benchmark performance impacts
4. ✅ Document breaking changes
5. ✅ Test với different tree depths

### Commit Convention

```
feat: Add new feature
fix: Bug fix  
docs: Documentation changes
test: Add tests
perf: Performance improvements
refactor: Code refactoring
chore: Build/tooling changes
```

### Pull Request Process

1. Fork repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details

## 🙏 Acknowledgments

- [iden3](https://github.com/iden3) - Circom & SnarkJS creators
- [Hermez Network](https://hermez.io/) - Powers of Tau ceremony
- [Polygon](https://polygon.technology/) - ZK research & funding
- [0xPARC](https://0xparc.org/) - ZK education & community
- [Tornado Cash](https://tornado.cash/) - Privacy protocol inspiration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/privacy-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/privacy-sdk/discussions)
- **Twitter**: [@your_handle](https://twitter.com/your_handle)
- **Discord**: [Join Discord](https://discord.gg/your-invite)
- **Email**: dev@privacy-sdk.io

## 🗺️ Roadmap

### v1.0 (Current)
- ✅ Basic private transfers
- ✅ Merkle tree commitments (depth 2)
- ✅ Groth16 proofs
- ✅ Test suite

### v1.1 (Next)
- 🔄 Increase tree depth to 20+
- 🔄 Add recipient verification
- 🔄 Optimize constraint count
- 🔄 Gas optimization on Solana

### v2.0 (Future)
- 📋 Multi-asset support
- 📋 Shielded pools
- 📋 Privacy-preserving voting
- 📋 Anonymous credentials



---

<div align="center">

**Made with ❤️ for Privacy on Solana**

🔒 **Privacy is a right, not a privilege**

[⭐ Star on GitHub](https://github.com/your-org/privacy-sdk) | [📖 Full Docs](https://docs.privacy-sdk.io) | [💬 Join Community](https://discord.gg/your-invite)

</div>
