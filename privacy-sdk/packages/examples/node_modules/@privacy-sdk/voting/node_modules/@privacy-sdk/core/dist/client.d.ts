import { JsonRpcProvider, Wallet, Contract, TransactionReceipt } from "ethers";
export type Proof = {
    pi_a: [string, string];
    pi_b: [[string, string], [string, string]];
    pi_c: [string, string];
};
export declare class ContractClient {
    provider: JsonRpcProvider;
    signer: Wallet;
    registryContract: Contract;
    verifierContract: Contract;
    constructor(rpcUrl: string, privateKey: string, registryAddress: string, verifierAddress: string);
    verifyProof(proof: Proof, pubData: string[]): Promise<boolean>;
    submitTransaction(proof: Proof | null, pubData: string[]): Promise<TransactionReceipt | null>;
    merkleRootCount(): Promise<number>;
    merkleRootAt(idx: number): Promise<string | null>;
    storeAggregateResult(resultHash: string, metadata: Uint8Array): Promise<TransactionReceipt | null>;
}
