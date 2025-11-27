import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';
import logger from '../utils/logger';

interface SpamRecord {
  addresses: Set<string>;
  amounts: number[];
  lastSeen: number;
}

export class SpamProtection {
  private records: Map<string, SpamRecord>;
  private readonly maxDuplicates: number;
  private readonly timeWindow: number;
  private readonly minAmount: string;
  private readonly maxAmount: string;

  constructor(
    maxDuplicates: number = 5,
    timeWindow: number = 300000, // 5 minutes
    minAmount: string = '0.001',
    maxAmount: string = '10.0'
  ) {
    this.records = new Map();
    this.maxDuplicates = maxDuplicates;
    this.timeWindow = timeWindow;
    this.minAmount = minAmount;
    this.maxAmount = maxAmount;
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const { to, amount, from } = req.body;
      const key = req.ip || 'unknown';

      // Validate addresses
      if (!this.validateAddress(to) || !this.validateAddress(from)) {
        logger.warn('Invalid address format', { to, from });
        res.status(400).json({
          success: false,
          error: 'Invalid address format'
        });
        return;
      }

      // Validate amount
      if (!this.validateAmount(amount)) {
        logger.warn('Invalid amount', { amount });
        res.status(400).json({
          success: false,
          error: `Amount must be between ${this.minAmount} and ${this.maxAmount} ETH`
        });
        return;
      }

      // Check for spam patterns
      if (this.isSpam(key, to, amount)) {
        logger.warn('Spam detected', { key, to, amount });
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

  private validateAddress(address: string): boolean {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  private validateAmount(amount: string): boolean {
    try {
      const value = parseFloat(amount);
      const min = parseFloat(this.minAmount);
      const max = parseFloat(this.maxAmount);
      return value >= min && value <= max && !isNaN(value);
    } catch {
      return false;
    }
  }

  private isSpam(key: string, address: string, amount: string): boolean {
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

  private recordRequest(key: string, address: string, amount: string): void {
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
