export interface PrivacyClientConfig {
    rpcUrl: string;
    contractAddress?: string;
    relayerUrl?: string;
}
export declare class PrivacyClient {
    private provider;
    private wallet;
    private transactionManager;
    private config;
    constructor(config: PrivacyClientConfig);
    /**
     * Tạo ví mới với keypair
     */
    createWallet(): Promise<{
        address: string;
        privateKey: string;
        mnemonic: string;
    }>;
    /**
     * Import ví từ private key
     */
    importWallet(privateKey: string): Promise<string>;
    /**
     * Deposit tiền vào privacy pool
     */
    deposit(amount: string): Promise<string>;
    /**
     * Chuyển tiền ẩn danh
     */
    transfer(to: string, amount: string, anonymitySet?: string[]): Promise<string>;
    /**
     * Rút tiền từ privacy pool
     */
    withdraw(to: string, amount: string): Promise<string>;
    /**
     * Lấy balance
     */
    getBalance(): Promise<string>;
}
