"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpamProtection = void 0;
const ethers_1 = require("ethers");
const logger_1 = __importDefault(require("../utils/logger"));
class SpamProtection {
    constructor(maxDuplicates = 5, timeWindow = 300000, // 5 minutes
    minAmount = '0.001', maxAmount = '10.0') {
        this.records = new Map();
        this.maxDuplicates = maxDuplicates;
        this.timeWindow = timeWindow;
        this.minAmount = minAmount;
        this.maxAmount = maxAmount;
    }
    middleware() {
        return (req, res, next) => {
            const { to, amount, from } = req.body;
            const key = req.ip || 'unknown';
            // Validate addresses
            if (!this.validateAddress(to) || !this.validateAddress(from)) {
                logger_1.default.warn('Invalid address format', { to, from });
                res.status(400).json({
                    success: false,
                    error: 'Invalid address format'
                });
                return;
            }
            // Validate amount
            if (!this.validateAmount(amount)) {
                logger_1.default.warn('Invalid amount', { amount });
                res.status(400).json({
                    success: false,
                    error: `Amount must be between ${this.minAmount} and ${this.maxAmount} ETH`
                });
                return;
            }
            // Check for spam patterns
            if (this.isSpam(key, to, amount)) {
                logger_1.default.warn('Spam detected', { key, to, amount });
                res.status(429).json({
                    success: false,
                    error: 'Suspicious activity detected'
                });
                return;
            }
            // Record the request
            this.recordRequest(key, to, amount);
            next();
        };
    }
    validateAddress(address) {
        try {
            return ethers_1.ethers.isAddress(address);
        }
        catch {
            return false;
        }
    }
    validateAmount(amount) {
        try {
            const value = parseFloat(amount);
            const min = parseFloat(this.minAmount);
            const max = parseFloat(this.maxAmount);
            return value >= min && value <= max && !isNaN(value);
        }
        catch {
            return false;
        }
    }
    isSpam(key, address, amount) {
        const now = Date.now();
        let record = this.records.get(key);
        if (!record || now - record.lastSeen > this.timeWindow) {
            return false;
        }
        // Check for duplicate addresses
        if (record.addresses.has(address) && record.addresses.size < this.maxDuplicates) {
            const duplicateCount = Array.from(record.addresses.values())
                .filter(addr => addr === address).length;
            if (duplicateCount >= this.maxDuplicates) {
                return true;
            }
        }
        // Check for suspicious patterns (same amount multiple times)
        const amountFloat = parseFloat(amount);
        const sameAmountCount = record.amounts.filter(a => a === amountFloat).length;
        if (sameAmountCount >= this.maxDuplicates) {
            return true;
        }
        return false;
    }
    recordRequest(key, address, amount) {
        const now = Date.now();
        let record = this.records.get(key);
        if (!record || now - record.lastSeen > this.timeWindow) {
            record = {
                addresses: new Set(),
                amounts: [],
                lastSeen: now
            };
            this.records.set(key, record);
        }
        record.addresses.add(address);
        record.amounts.push(parseFloat(amount));
        record.lastSeen = now;
        // Keep only recent data
        if (record.addresses.size > this.maxDuplicates * 2) {
            record.addresses.clear();
            record.amounts = [];
        }
    }
}
exports.SpamProtection = SpamProtection;
