import { ethers } from 'ethers';
import { Wallet } from './wallet/Wallet';
import { TransactionManager } from './transaction/TransactionManager';

export interface PrivacyClientConfig {
  rpcUrl: string;
  contractAddress?: string;
  relayerUrl?: string;
}

export class PrivacyClient {
  private provider: ethers.JsonRpcProvider;
  private wallet: Wallet | null = null;
  private transactionManager: TransactionManager;
  private config: PrivacyClientConfig;

  constructor(config: PrivacyClientConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.transactionManager = new TransactionManager(
      this.provider,
      config.contractAddress,
      config.relayerUrl
    );
  }

  /**
   * Tạo ví mới với keypair
   */
  async createWallet(): Promise<{
    address: string;
    privateKey: string;
    mnemonic: string;
  }> {
    const ethersWallet = ethers.Wallet.createRandom();
    this.wallet = new Wallet(ethersWallet.privateKey);
    
    return {
      address: ethersWallet.address,
      privateKey: ethersWallet.privateKey,
      mnemonic: ethersWallet.mnemonic?.phrase || '',
    };
  }

  /**
   * Import ví từ private key
   */
  async importWallet(privateKey: string): Promise<string> {
    this.wallet = new Wallet(privateKey);
    const ethersWallet = new ethers.Wallet(privateKey);
    return ethersWallet.address;
  }

  /**
   * Deposit tiền vào privacy pool
   */
  async deposit(amount: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized. Call createWallet() or importWallet() first.');
    }

    return await this.transactionManager.deposit(this.wallet, amount);
  }

  /**
   * Chuyển tiền ẩn danh
   */
  async transfer(
    to: string,
    amount: string,
    anonymitySet?: string[]
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized.');
    }

    return await this.transactionManager.transfer(
      this.wallet,
      to,
      amount,
      anonymitySet
    );
  }

  /**
   * Rút tiền từ privacy pool
   */
  async withdraw(to: string, amount: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized.');
    }

    return await this.transactionManager.withdraw(this.wallet, to, amount);
  }

  /**
   * Lấy balance
   */
  async getBalance(): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized.');
    }

    return await this.transactionManager.getBalance(this.wallet);
  }
}