import { ethers } from 'ethers';

export class Wallet {
  private signer: ethers.Wallet;
  public address: string;

  constructor(privateKey: string) {
    this.signer = new ethers.Wallet(privateKey);
    this.address = this.signer.address;
  }

  /**
   * Ký message
   */
  async signMessage(message: string): Promise<string> {
    return await this.signer.signMessage(message);
  }

  /**
   * Ký transaction
   */
  async signTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    return await this.signer.signTransaction(transaction);
  }

  /**
   * Lấy signer để tương tác với contract
   */
  getSigner(provider: ethers.Provider): ethers.Wallet {
    return this.signer.connect(provider);
  }

  /**
   * Export private key
   */
  getPrivateKey(): string {
    return this.signer.privateKey;
  }

  /**
   * Tạo commitment (hash của note)
   */
  createCommitment(secret: string, nullifier: string): string {
    return ethers.keccak256(
      ethers.solidityPacked(['bytes32', 'bytes32'], [secret, nullifier])
    );
  }

  /**
   * Generate random secret
   */
  static generateSecret(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  /**
   * Generate random nullifier
   */
  static generateNullifier(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }
}