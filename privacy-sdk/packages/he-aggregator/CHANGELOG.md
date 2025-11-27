# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-11-27

### ✨ Added
- Initial release of HE Aggregator module
- Circom circuit for private transfers with Merkle tree verification
- Poseidon hash-based commitments and nullifiers
- Groth16 proof generation and verification
- Merkle tree with depth 2 (4 leaves)
- Automated test suite (logic + ZK proof tests)
- Circuit setup automation script
- PowerShell helper script for Windows
- Complete test suite with `run_all.js`
- Performance benchmarking tools
- Comprehensive README documentation

### 🔧 Circuit Details
- **Constraints**: 1,213
- **Template instances**: 76
- **Merkle depth**: 2
- **Hash function**: Poseidon
- **Proving system**: Groth16

### 📝 Scripts
- `npm run setup` - One-time circuit setup
- `npm run generate` - Generate test inputs
- `npm run test:logic` - Test without ZK proofs
- `npm run test:proof` - Test with ZK proofs
- `npm run test:all` - Complete test suite
- `npm run test:quick` - Quick test (skip proofs)

### 🐛 Fixed
- Fixed duplicate `Num2Bits` template (use circomlib's version)
- Fixed Merkle path verification logic (left/right selection)
- Fixed circuit include paths for circomlib
- Fixed Powers of Tau download (use Google Cloud mirror)
- Fixed tree depth synchronization between circuit and input generator

### 🔐 Security
- Commitment hiding with Poseidon(amount, secret)
- Nullifier generation for double-spend prevention
- Merkle tree membership proofs
- Zero-knowledge property preserved
- No information leakage in public signals

### 📚 Dependencies
- `circomlibjs@^0.1.7` - Circom utilities for JavaScript
- `circomlib@^2.0.5` - Standard circuits library
- `snarkjs@^0.7.5` - ZK proof generation/verification
- `@noble/curves@^1.4.0` - Elliptic curve cryptography
- `ethers@^6.13.0` - Ethereum utilities

### 🎯 Performance
- Proof generation: ~1-2 seconds
- Verification: ~10-20 ms
- Witness generation: ~50 ms
- Proof size: 192 bytes

### 📖 Documentation
- Comprehensive README with setup instructions
- Circuit explanation and flow diagrams
- Troubleshooting guide
- Integration examples for Solana
- Contributing guidelines

### ⚠️ Known Limitations
- Tree depth limited to 2 (4 leaves max)
- Single asset support only
- No recipient verification yet
- Powers of Tau file required (~50MB)
- Windows requires manual Circom installation

## [Unreleased]

### 🔮 Planned Features
- [ ] Increase tree depth to 20+ for production use
- [ ] Add recipient public key verification
- [ ] Multi-asset support
- [ ] Optimize constraint count
- [ ] Add shielded pool functionality
- [ ] Gas optimization for Solana integration
- [ ] Browser-based proof generation
- [ ] Mobile SDK support

### 🧪 In Progress
- Performance optimization
- Extended test coverage
- Security audit preparation
- Documentation improvements

---

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards-compatible)
- **PATCH** version for backwards-compatible bug fixes

## Categories

- **✨ Added** - New features
- **🔧 Changed** - Changes in existing functionality
- **🗑️ Deprecated** - Soon-to-be removed features
- **❌ Removed** - Removed features
- **🐛 Fixed** - Bug fixes
- **🔐 Security** - Security improvements
- **📝 Documentation** - Documentation changes
- **🎯 Performance** - Performance improvements

---

[1.0.0]: https://github.com/your-org/privacy-sdk/releases/tag/v1.0.0
