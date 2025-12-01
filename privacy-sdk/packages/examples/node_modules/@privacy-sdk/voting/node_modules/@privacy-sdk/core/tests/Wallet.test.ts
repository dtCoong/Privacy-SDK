import { describe, it, expect } from 'vitest';
import { Wallet } from '../src/wallet/Wallet';
import { ethers } from 'ethers';

describe('Wallet', () => {
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

  describe('constructor', () => {
    it('should create wallet from private key', () => {
      const wallet = new Wallet(testPrivateKey);
      
      expect(wallet).toBeDefined();
      expect(wallet.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    });
  });

  describe('signMessage', () => {
    it('should sign message correctly', async () => {
      const wallet = new Wallet(testPrivateKey);
      const message = 'Hello, World!';
      
      const signature = await wallet.signMessage(message);
      
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
      
      // Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      expect(recoveredAddress).toBe(wallet.address);
    });
  });

  describe('createCommitment', () => {
    it('should create commitment from secret and nullifier', () => {
      const wallet = new Wallet(testPrivateKey);
      const secret = Wallet.generateSecret();
      const nullifier = Wallet.generateNullifier();
      
      const commitment = wallet.createCommitment(secret, nullifier);
      
      expect(commitment).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should create different commitments for different inputs', () => {
      const wallet = new Wallet(testPrivateKey);
      const secret1 = Wallet.generateSecret();
      const secret2 = Wallet.generateSecret();
      const nullifier = Wallet.generateNullifier();
      
      const commitment1 = wallet.createCommitment(secret1, nullifier);
      const commitment2 = wallet.createCommitment(secret2, nullifier);
      
      expect(commitment1).not.toBe(commitment2);
    });
  });

  describe('static methods', () => {
    it('should generate random secret', () => {
      const secret = Wallet.generateSecret();
      
      expect(secret).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should generate random nullifier', () => {
      const nullifier = Wallet.generateNullifier();
      
      expect(nullifier).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should generate unique values', () => {
      const secret1 = Wallet.generateSecret();
      const secret2 = Wallet.generateSecret();
      const nullifier1 = Wallet.generateNullifier();
      const nullifier2 = Wallet.generateNullifier();
      
      expect(secret1).not.toBe(secret2);
      expect(nullifier1).not.toBe(nullifier2);
    });
  });
});
