import { PrivacyClient } from '@privacy-sdk/core';

async function main() {
  console.log('=== Privacy SDK Basic Usage Example ===\n');

  // 1. Khởi tạo client
  const client = new PrivacyClient({
    rpcUrl: 'http://127.0.0.1:8545',
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3', // Thay bằng địa chỉ thực
    relayerUrl: 'http://localhost:3001',
  });

  console.log('✓ Privacy client initialized\n');

  // 2. Tạo ví mới
  console.log('Creating new wallet...');
  const wallet = await client.createWallet();
  console.log('✓ Wallet created:');
  console.log('  Address:', wallet.address);
  console.log('  Private Key:', wallet.privateKey);
  console.log('  Mnemonic:', wallet.mnemonic);
  console.log('');

  // 3. Kiểm tra balance
  console.log('Checking balance...');
  const balance = await client.getBalance();
  console.log('✓ Balance:', balance, 'ETH\n');

  // 4. Deposit (cần có ETH trong ví)
  // Uncomment để test khi đã có ETH
  /*
  console.log('Making deposit...');
  const depositTx = await client.deposit('0.1');
  console.log('✓ Deposit transaction:', depositTx);
  console.log('');
  */

  console.log('=== Example completed ===');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });