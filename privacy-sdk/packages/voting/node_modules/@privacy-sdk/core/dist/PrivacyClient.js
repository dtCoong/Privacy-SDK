"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyClient = void 0;
const ethers_1 = require("ethers");
const Wallet_1 = require("./wallet/Wallet");
const TransactionManager_1 = require("./transaction/TransactionManager");
class PrivacyClient {
    constructor(config) {
        this.wallet = null;
        this.config = config;
        this.provider = new ethers_1.ethers.JsonRpcProvider(config.rpcUrl);
        this.transactionManager = new TransactionManager_1.TransactionManager(this.provider, config.contractAddress, config.relayerUrl);
    }
    /**
     * Tạo ví mới với keypair
     */
    async createWallet() {
        const ethersWallet = ethers_1.ethers.Wallet.createRandom();
        this.wallet = new Wallet_1.Wallet(ethersWallet.privateKey);
        return {
            address: ethersWallet.address,
            privateKey: ethersWallet.privateKey,
            mnemonic: ethersWallet.mnemonic?.phrase || '',
        };
    }
    /**
     * Import ví từ private key
     */
    async importWallet(privateKey) {
        this.wallet = new Wallet_1.Wallet(privateKey);
        const ethersWallet = new ethers_1.ethers.Wallet(privateKey);
        return ethersWallet.address;
    }
    /**
     * Deposit tiền vào privacy pool
     */
    async deposit(amount) {
        if (!this.wallet) {
            throw new Error('Wallet not initialized. Call createWallet() or importWallet() first.');
        }
        return await this.transactionManager.deposit(this.wallet, amount);
    }
    /**
     * Chuyển tiền ẩn danh
     */
    async transfer(to, amount, anonymitySet) {
        if (!this.wallet) {
            throw new Error('Wallet not initialized.');
        }
        return await this.transactionManager.transfer(this.wallet, to, amount, anonymitySet);
    }
    /**
     * Rút tiền từ privacy pool
     */
    async withdraw(to, amount) {
        if (!this.wallet) {
            throw new Error('Wallet not initialized.');
        }
        return await this.transactionManager.withdraw(this.wallet, to, amount);
    }
    /**
     * Lấy balance
     */
    async getBalance() {
        if (!this.wallet) {
            throw new Error('Wallet not initialized.');
        }
        return await this.transactionManager.getBalance(this.wallet);
    }
}
exports.PrivacyClient = PrivacyClient;
