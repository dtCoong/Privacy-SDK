import { ethers } from 'ethers';
import { RelayRequest, RelayResponse } from '../types';
import { GasPriceManager } from './GasPriceManager';
import logger from '../utils/logger';

export class RelayService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contractAddress: string;
  private gasLimit: number;
  private gasPriceManager: GasPriceManager;
  private nonce: number | null = null;

  constructor(
    rpcUrl: string,
    privateKey: string,
    contractAddress: string,
    gasLimit: number = 500000,
    gasPriceMultiplier: number = 1.1,
    maxGasPrice: string = '100000000000'
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.contractAddress = contractAddress;
    this.gasLimit = gasLimit;
    this.gasPriceManager = new GasPriceManager(
      this.provider,
      gasPriceMultiplier,
      maxGasPrice
    );
  }

  async initialize(): Promise<void> {
    this.nonce = await this.provider.getTransactionCount(this.wallet.address);
    logger.info('RelayService initialized', {
      address: this.wallet.address,
      nonce: this.nonce
    });
  }

  async relayTransaction(
    request: RelayRequest,
    priority: 'standard' | 'fast' | 'instant' = 'standard'
  ): Promise<RelayResponse> {
    try {
      logger.info('Relaying transaction', { request, priority });

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
      const nonce = this.nonce!;
      this.nonce!++;

      // Build transaction
      const tx = await this.buildTransaction(request, gasPrice, nonce);

      // Send transaction
      const response = await this.wallet.sendTransaction(tx);
      
      logger.info('Transaction sent', {
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
    } catch (error: any) {
      logger.error('Relay error', { 
        error: error.message,
        code: error.code,
        request
      });

      // Handle nonce issues
      if (error.code === 'NONCE_EXPIRED' || error.code === 'REPLACEMENT_UNDERPRICED') {
        logger.warn('Nonce issue, resetting', { currentNonce: this.nonce });
        this.nonce = null;
      }

      return {
        success: false,
        error: this.formatError(error),
      };
    }
  }

  private async buildTransaction(
    request: RelayRequest,
    gasPrice: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint },
    nonce: number
  ): Promise<ethers.TransactionRequest> {
    const value = ethers.parseEther(request.amount);

    // Estimate gas if needed
    const gasLimit = await this.gasPriceManager.estimateGas(
      request.to,
      '0x',
      value
    );

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

  private validateRequest(request: RelayRequest): boolean {
    if (!request.to || !ethers.isAddress(request.to)) {
      logger.warn('Invalid address', { to: request.to });
      return false;
    }

    const amount = parseFloat(request.amount);
    if (isNaN(amount) || amount <= 0) {
      logger.warn('Invalid amount', { amount: request.amount });
      return false;
    }

    if (amount > 10) {
      logger.warn('Amount exceeds maximum', { amount });
      return false;
    }

    return true;
  }

  private formatError(error: any): string {
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

  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }

  getAddress(): string {
    return this.wallet.address;
  }

  async getNonce(): Promise<number> {
    if (this.nonce === null) {
      await this.initialize();
    }
    return this.nonce!;
  }

  resetNonce(): void {
    this.nonce = null;
  }
}

