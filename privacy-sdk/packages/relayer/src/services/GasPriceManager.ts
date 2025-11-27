import { ethers } from 'ethers';
import logger from '../utils/logger';

export interface GasPrice {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  standard: bigint;
  fast: bigint;
  instant: bigint;
}

export class GasPriceManager {
  private provider: ethers.JsonRpcProvider;
  private multiplier: number;
  private maxGasPrice: bigint;
  private cachedGasPrice: GasPrice | null = null;
  private cacheExpiry: number = 0;
  private readonly cacheLifetime: number = 15000; // 15 seconds

  constructor(
    provider: ethers.JsonRpcProvider,
    multiplier: number = 1.1,
    maxGasPrice: string = '100000000000' // 100 gwei
  ) {
    this.provider = provider;
    this.multiplier = multiplier;
    this.maxGasPrice = BigInt(maxGasPrice);
  }

  async getGasPrice(priority: 'standard' | 'fast' | 'instant' = 'standard'): Promise<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    const gasPrice = await this.fetchGasPrice();
    
    let selectedPrice: bigint;
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

    logger.debug('Gas price calculated', {
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

  async estimateGas(
    to: string,
    data: string,
    value: bigint = 0n
  ): Promise<bigint> {
    try {
      const estimatedGas = await this.provider.estimateGas({
        to,
        data,
        value
      });

      // Add 20% buffer
      const gasWithBuffer = (estimatedGas * 120n) / 100n;
      
      logger.debug('Gas estimated', {
        estimated: estimatedGas.toString(),
        withBuffer: gasWithBuffer.toString()
      });

      return gasWithBuffer;
    } catch (error: any) {
      logger.error('Gas estimation failed', { error: error.message });
      // Return a safe default
      return 500000n;
    }
  }

  private async fetchGasPrice(): Promise<GasPrice> {
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

      logger.debug('Gas price fetched', {
        standard: this.cachedGasPrice.standard.toString(),
        fast: this.cachedGasPrice.fast.toString(),
        instant: this.cachedGasPrice.instant.toString()
      });

      return this.cachedGasPrice;
    } catch (error: any) {
      logger.error('Failed to fetch gas price', { error: error.message });
      
      // Return fallback prices
      const fallback: GasPrice = {
        maxFeePerGas: 20000000000n, // 20 gwei
        maxPriorityFeePerGas: 1500000000n, // 1.5 gwei
        standard: 20000000000n,
        fast: 24000000000n,
        instant: 30000000000n
      };
      
      return fallback;
    }
  }

  clearCache(): void {
    this.cachedGasPrice = null;
    this.cacheExpiry = 0;
  }
}
