import { ethers } from 'ethers';
import { Wallet } from '../wallet/Wallet';
import fetch from 'node-fetch';

export class TransactionManager {
  private provider: ethers.Provider;
  private contractAddress?: string;
  private relayerUrl?: string;

  constructor(
    provider: ethers.Provider,
    contractAddress?: string,
    relayerUrl?: string
  ) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.relayerUrl = relayerUrl;
  }

  async deposit(wallet: Wallet, amount: string): Promise<string> {
    // TODO: Implement deposit logic with contract
    console.log(`Depositing ${amount} from ${wallet.address}`);
    
    // Tạo commitment
    const secret = Wallet.generateSecret();
    const nullifier = Wallet.generateNullifier();
    const commitment = wallet.createCommitment(secret, nullifier);

    // Lưu trữ secret và nullifier để sau này withdraw
    // (Trong thực tế cần lưu vào database hoặc encrypted storage)
    
    return `deposit_tx_${Date.now()}`;
  }

  async transfer(
    wallet: Wallet,
    to: string,
    amount: string,
    anonymitySet?: string[]
  ): Promise<string> {
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

  async withdraw(wallet: Wallet, to: string, amount: string): Promise<string> {
    // TODO: Implement withdraw logic
    console.log(`Withdrawing ${amount} to ${to}`);
    return `withdraw_tx_${Date.now()}`;
  }

  async getBalance(wallet: Wallet): Promise<string> {
    const balance = await this.provider.getBalance(wallet.address);
    return ethers.formatEther(balance);
  }

  private async sendViaRelayer(txData: any): Promise<string> {
    if (!this.relayerUrl) {
      throw new Error('Relayer URL not configured');
    }

    try {
      const response = await fetch(`${this.relayerUrl}/api/relay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(txData),
      });

      if (!response.ok) {
        throw new Error(`Relayer error: ${response.statusText}`);
      }

      const result = await response.json() as { txHash: string };
      return result.txHash;
    } catch (error: any) {
      throw new Error(`Failed to send via relayer: ${error.message}`);
    }
  }
}