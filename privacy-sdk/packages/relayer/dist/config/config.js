"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
function loadConfig() {
    return {
        port: parseInt(process.env.PORT || '3001'),
        rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
        privateKey: process.env.PRIVATE_KEY || '',
        contractAddress: process.env.CONTRACT_ADDRESS || '',
        gasLimit: parseInt(process.env.GAS_LIMIT || '500000'),
        logLevel: process.env.LOG_LEVEL || 'info',
        rateLimitPoints: parseInt(process.env.RATE_LIMIT_POINTS || '10'),
        rateLimitDuration: parseInt(process.env.RATE_LIMIT_DURATION || '60'),
        gasPriceMultiplier: parseFloat(process.env.GAS_PRICE_MULTIPLIER || '1.1'),
        maxGasPrice: process.env.MAX_GAS_PRICE || '100000000000',
    };
}
