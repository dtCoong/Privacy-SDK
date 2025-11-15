"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelayService = void 0;
const ethers_1 = require("ethers");
const GasPriceManager_1 = require("./GasPriceManager");
const logger_1 = __importDefault(require("../utils/logger"));
class RelayService {
    constructor(rpcUrl, privateKey, contractAddress, gasLimit = 500000, gasPriceMultiplier = 1.1, maxGasPrice = '100000000000') {
        this.nonce = null;
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
        this.contractAddress = contractAddress;
        this.gasLimit = gasLimit;
        this.gasPriceManager = new GasPriceManager_1.GasPriceManager(this.provider, gasPriceMultiplier, maxGasPrice);
    }
    async initialize() {
        this.nonce = await this.provider.getTransactionCount(this.wallet.address);
        logger_1.default.info('RelayService initialized', {
            address: this.wallet.address,
            nonce: this.nonce
        });
    }
    async relayTransaction(request, priority = 'standard') {
        try {
            logger_1.default.info('Relaying transaction', { request, priority });
            if (!this.validateRequest(request)) {
                return {
                    success: false,
                    error: 'Invalid request parameters',
                };
            }
            // Get gas price
            const gasPrice = await this.gasPriceManager.getGasPrice(priority);
            // Get nonce
            if (this.nonce === null) {
                await this.initialize();
            }
            const nonce = this.nonce;
            this.nonce++;
            // Build transaction
            const tx = await this.buildTransaction(request, gasPrice, nonce);
            // Send transaction
            const response = await this.wallet.sendTransaction(tx);
            logger_1.default.info('Transaction sent', {
                txHash: response.hash,
                nonce: response.nonce,
                gasPrice: gasPrice.maxFeePerGas.toString()
            });
            // Wait for confirmation (optional, can be done separately)
            // const receipt = await response.wait(1);
            return {
                success: true,
                txHash: response.hash,
            };
        }
        catch (error) {
            logger_1.default.error('Relay error', {
                error: error.message,
                code: error.code,
                request
            });
            // Handle nonce issues
            if (error.code === 'NONCE_EXPIRED' || error.code === 'REPLACEMENT_UNDERPRICED') {
                logger_1.default.warn('Nonce issue, resetting', { currentNonce: this.nonce });
                this.nonce = null;
            }
            return {
                success: false,
                error: this.formatError(error),
            };
        }
    }
    async buildTransaction(request, gasPrice, nonce) {
        const value = ethers_1.ethers.parseEther(request.amount);
        // Estimate gas if needed
        const gasLimit = await this.gasPriceManager.estimateGas(request.to, '0x', value);
        return {
            to: request.to,
            value,
            gasLimit,
            maxFeePerGas: gasPrice.maxFeePerGas,
            maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
            nonce,
            chainId: (await this.provider.getNetwork()).chainId,
        };
    }
    validateRequest(request) {
        if (!request.to || !ethers_1.ethers.isAddress(request.to)) {
            logger_1.default.warn('Invalid address', { to: request.to });
            return false;
        }
        const amount = parseFloat(request.amount);
        if (isNaN(amount) || amount <= 0) {
            logger_1.default.warn('Invalid amount', { amount: request.amount });
            return false;
        }
        if (amount > 10) {
            logger_1.default.warn('Amount exceeds maximum', { amount });
            return false;
        }
        return true;
    }
    formatError(error) {
        if (error.code === 'INSUFFICIENT_FUNDS') {
            return 'Relayer has insufficient funds';
        }
        if (error.code === 'NONCE_EXPIRED') {
            return 'Transaction nonce expired, please retry';
        }
        if (error.code === 'REPLACEMENT_UNDERPRICED') {
            return 'Gas price too low, please retry';
        }
        return error.message || 'Unknown error occurred';
    }
    async getBalance() {
        const balance = await this.provider.getBalance(this.wallet.address);
        return ethers_1.ethers.formatEther(balance);
    }
    getAddress() {
        return this.wallet.address;
    }
    async getNonce() {
        if (this.nonce === null) {
            await this.initialize();
        }
        return this.nonce;
    }
    resetNonce() {
        this.nonce = null;
    }
}
exports.RelayService = RelayService;
