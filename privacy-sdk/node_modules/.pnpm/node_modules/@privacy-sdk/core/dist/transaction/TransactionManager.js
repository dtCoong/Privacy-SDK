"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionManager = void 0;
const ethers_1 = require("ethers");
const Wallet_1 = require("../wallet/Wallet");
const node_fetch_1 = __importDefault(require("node-fetch"));
class TransactionManager {
    constructor(provider, contractAddress, relayerUrl) {
        this.provider = provider;
        this.contractAddress = contractAddress;
        this.relayerUrl = relayerUrl;
    }
    async deposit(wallet, amount) {
        // TODO: Implement deposit logic with contract
        console.log(`Depositing ${amount} from ${wallet.address}`);
        // Tạo commitment
        const secret = Wallet_1.Wallet.generateSecret();
        const nullifier = Wallet_1.Wallet.generateNullifier();
        const commitment = wallet.createCommitment(secret, nullifier);
        // Lưu trữ secret và nullifier để sau này withdraw
        // (Trong thực tế cần lưu vào database hoặc encrypted storage)
        return `deposit_tx_${Date.now()}`;
    }
    async transfer(wallet, to, amount, anonymitySet) {
        // TODO: Implement private transfer logic
        console.log(`Transferring ${amount} to ${to}`);
        if (this.relayerUrl) {
            // Gửi transaction qua relayer
            return await this.sendViaRelayer({
                type: 'transfer',
                from: wallet.address,
                to,
                amount,
                anonymitySet,
            });
        }
        return `transfer_tx_${Date.now()}`;
    }
    async withdraw(wallet, to, amount) {
        // TODO: Implement withdraw logic
        console.log(`Withdrawing ${amount} to ${to}`);
        return `withdraw_tx_${Date.now()}`;
    }
    async getBalance(wallet) {
        const balance = await this.provider.getBalance(wallet.address);
        return ethers_1.ethers.formatEther(balance);
    }
    async sendViaRelayer(txData) {
        if (!this.relayerUrl) {
            throw new Error('Relayer URL not configured');
        }
        try {
            const response = await (0, node_fetch_1.default)(`${this.relayerUrl}/api/relay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(txData),
            });
            if (!response.ok) {
                throw new Error(`Relayer error: ${response.statusText}`);
            }
            const result = await response.json();
            return result.txHash;
        }
        catch (error) {
            throw new Error(`Failed to send via relayer: ${error.message}`);
        }
    }
}
exports.TransactionManager = TransactionManager;
