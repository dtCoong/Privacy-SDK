import { ethers } from 'ethers';
import { Wallet } from '../wallet/Wallet';
export declare class TransactionManager {
    private provider;
    private contractAddress?;
    private relayerUrl?;
    constructor(provider: ethers.Provider, contractAddress?: string, relayerUrl?: string);
    deposit(wallet: Wallet, amount: string): Promise<string>;
    transfer(wallet: Wallet, to: string, amount: string, anonymitySet?: string[]): Promise<string>;
    withdraw(wallet: Wallet, to: string, amount: string): Promise<string>;
    getBalance(wallet: Wallet): Promise<string>;
    private sendViaRelayer;
}
