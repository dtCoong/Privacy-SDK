import { ethers } from 'ethers';
export declare class Wallet {
    private signer;
    address: string;
    constructor(privateKey: string);
    /**
     * Ký message
     */
    signMessage(message: string): Promise<string>;
    /**
     * Ký transaction
     */
    signTransaction(transaction: ethers.TransactionRequest): Promise<string>;
    /**
     * Lấy signer để tương tác với contract
     */
    getSigner(provider: ethers.Provider): ethers.Wallet;
    /**
     * Export private key
     */
    getPrivateKey(): string;
    /**
     * Tạo commitment (hash của note)
     */
    createCommitment(secret: string, nullifier: string): string;
    /**
     * Generate random secret
     */
    static generateSecret(): string;
    /**
     * Generate random nullifier
     */
    static generateNullifier(): string;
}
