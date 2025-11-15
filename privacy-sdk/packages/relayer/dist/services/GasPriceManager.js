"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GasPriceManager = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class GasPriceManager {
    constructor(provider, multiplier = 1.1, maxGasPrice = '100000000000' // 100 gwei
    ) {
        this.cachedGasPrice = null;
        this.cacheExpiry = 0;
        this.cacheLifetime = 15000; // 15 seconds
        this.provider = provider;
        this.multiplier = multiplier;
        this.maxGasPrice = BigInt(maxGasPrice);
    }
    async getGasPrice(priority = 'standard') {
        const gasPrice = await this.fetchGasPrice();
        let selectedPrice;
        switch (priority) {
            case 'instant':
                selectedPrice = gasPrice.instant;
                break;
            case 'fast':
                selectedPrice = gasPrice.fast;
                break;
            default:
                selectedPrice = gasPrice.standard;
        }
        // Apply multiplier
        const adjustedPrice = BigInt(Math.floor(Number(selectedPrice) * this.multiplier));
        // Cap at max gas price
        const finalPrice = adjustedPrice > this.maxGasPrice ? this.maxGasPrice : adjustedPrice;
        logger_1.default.debug('Gas price calculated', {
            priority,
            raw: selectedPrice.toString(),
            adjusted: adjustedPrice.toString(),
            final: finalPrice.toString(),
            capped: adjustedPrice > this.maxGasPrice
        });
        return {
            maxFeePerGas: finalPrice,
            maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas
        };
    }
    async estimateGas(to, data, value = 0n) {
        try {
            const estimatedGas = await this.provider.estimateGas({
                to,
                data,
                value
            });
            // Add 20% buffer
            const gasWithBuffer = (estimatedGas * 120n) / 100n;
            logger_1.default.debug('Gas estimated', {
                estimated: estimatedGas.toString(),
                withBuffer: gasWithBuffer.toString()
            });
            return gasWithBuffer;
        }
        catch (error) {
            logger_1.default.error('Gas estimation failed', { error: error.message });
            // Return a safe default
            return 500000n;
        }
    }
    async fetchGasPrice() {
        const now = Date.now();
        // Return cached price if still valid
        if (this.cachedGasPrice && now < this.cacheExpiry) {
            return this.cachedGasPrice;
        }
        try {
            const feeData = await this.provider.getFeeData();
            if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
                throw new Error('Fee data not available');
            }
            const basePrice = feeData.maxFeePerGas;
            const priorityFee = feeData.maxPriorityFeePerGas;
            this.cachedGasPrice = {
                maxFeePerGas: basePrice,
                maxPriorityFeePerGas: priorityFee,
                standard: basePrice,
                fast: (basePrice * 120n) / 100n, // 20% higher
                instant: (basePrice * 150n) / 100n // 50% higher
            };
            this.cacheExpiry = now + this.cacheLifetime;
            logger_1.default.debug('Gas price fetched', {
                standard: this.cachedGasPrice.standard.toString(),
                fast: this.cachedGasPrice.fast.toString(),
                instant: this.cachedGasPrice.instant.toString()
            });
            return this.cachedGasPrice;
        }
        catch (error) {
            logger_1.default.error('Failed to fetch gas price', { error: error.message });
            // Return fallback prices
            const fallback = {
                maxFeePerGas: 20000000000n, // 20 gwei
                maxPriorityFeePerGas: 1500000000n, // 1.5 gwei
                standard: 20000000000n,
                fast: 24000000000n,
                instant: 30000000000n
            };
            return fallback;
        }
    }
    clearCache() {
        this.cachedGasPrice = null;
        this.cacheExpiry = 0;
    }
}
exports.GasPriceManager = GasPriceManager;
