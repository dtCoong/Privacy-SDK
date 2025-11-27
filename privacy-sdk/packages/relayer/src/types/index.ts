export interface RelayRequest {
  type: 'transfer' | 'withdraw';
  from: string;
  to: string;
  amount: string;
  anonymitySet?: string[];
  proof?: any;
  nullifier?: string;
  root?: string;
}

export interface RelayResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface RelayerConfig {
  port: number;
  rpcUrl: string;
  privateKey: string;
  contractAddress: string;
  gasLimit: number;
}