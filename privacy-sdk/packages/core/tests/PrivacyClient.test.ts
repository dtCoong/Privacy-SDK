import { describe, it, expect, beforeEach } from 'vitest';
import { PrivacyClient } from '../src/PrivacyClient';

describe('PrivacyClient', () => {
  let client: PrivacyClient;

  beforeEach(() => {
    client = new PrivacyClient({
      rpcUrl: 'http://127.0.0.1:8545',
      contractAddress: '0x0000000000000000000000000000000000000000',
    });
  });

  describe('createWallet', () => {
    it('should create a new wallet', async () => {
      const wallet = await client.createWallet();
      
      expect(wallet).toBeDefined();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(wallet.mnemonic).toBeTruthy();
    });

    it('should create unique wallets', async () => {
      const wallet1 = await client.createWallet();
      const wallet2 = await client.createWallet();
      
      expect(wallet1.address).not.toBe(wallet2.address);
      expect(wallet1.privateKey).not.toBe(wallet2.privateKey);
    });
  });

  describe('importWallet', () => {
    it('should import wallet from private key', async () => {
      const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
      const address = await client.importWallet(privateKey);
      
      expect(address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    });
  });

  describe('transaction methods', () => {
    it('should throw error if wallet not initialized', async () => {
      await expect(client.deposit('1.0')).rejects.toThrow('Wallet not initialized');
      await expect(client.transfer('0x123', '1.0')).rejects.toThrow('Wallet not initialized');
      await expect(client.withdraw('0x123', '1.0')).rejects.toThrow('Wallet not initialized');
    });
  });
});