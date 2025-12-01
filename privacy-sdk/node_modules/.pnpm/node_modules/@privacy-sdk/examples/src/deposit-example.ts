import { PrivacyClient } from '@privacy-sdk/core';

async function main() {
  console.log('=== Deposit Example ===\n');

  const client = new PrivacyClient({
    rpcUrl: 'http://127.0.0.1:8545',
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3', 
    relayerUrl: 'http://localhost:3001',
  });

  // Import ví từ private key (Account #0 từ Hardhat)
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const address = await client.importWallet(privateKey);
  console.log('Using wallet:', address);

  // Kiểm tra balance
  const balance = await client.getBalance();
  console.log('Balance:', balance, 'ETH\n');

  // Thực hiện deposit
  console.log('Depositing 1 ETH...');
  try {
    const txHash = await client.deposit('1.0');
    console.log('✓ Deposit successful!');
    console.log('Transaction hash:', txHash);
  } catch (error: any) {
    console.error('Deposit failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });