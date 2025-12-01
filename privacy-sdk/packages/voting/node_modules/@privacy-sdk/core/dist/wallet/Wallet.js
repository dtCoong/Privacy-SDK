"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const ethers_1 = require("ethers");
class Wallet {
    constructor(privateKey) {
        this.signer = new ethers_1.ethers.Wallet(privateKey);
        this.address = this.signer.address;
    }
    /**
     * Ký message
     */
    async signMessage(message) {
        return await this.signer.signMessage(message);
    }
    /**
     * Ký transaction
     */
    async signTransaction(transaction) {
        return await this.signer.signTransaction(transaction);
    }
    /**
     * Lấy signer để tương tác với contract
     */
    getSigner(provider) {
        return this.signer.connect(provider);
    }
    /**
     * Export private key
     */
    getPrivateKey() {
        return this.signer.privateKey;
    }
    /**
     * Tạo commitment (hash của note)
     */
    createCommitment(secret, nullifier) {
        return ethers_1.ethers.keccak256(ethers_1.ethers.solidityPacked(['bytes32', 'bytes32'], [secret, nullifier]));
    }
    /**
     * Generate random secret
     */
    static generateSecret() {
        return ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32));
    }
    /**
     * Generate random nullifier
     */
    static generateNullifier() {
        return ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32));
    }
}
exports.Wallet = Wallet;
