import { PrivacyClient } from '@privacy-sdk/core';

async function main() {
  console.log('=== Private Transfer Example ===\n');

  const client = new PrivacyClient({
    rpcUrl: 'http://127.0.0.1:8545',
    contractAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3', 
    relayerUrl: 'http://localhost:3001',
  });

  // Import ví
  const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  await client.importWallet(privateKey);

  // Địa chỉ nhận (Account #1 từ Hardhat)
  const recipientAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

  // Thực hiện transfer
  console.log('Transferring 0.5 ETH privately...');
  try {
    const txHash = await client.transfer(recipientAddress, '0.5');
    console.log('✓ Transfer successful!');
    console.log('Transaction hash:', txHash);
  } catch (error: any) {
    console.error('Transfer failed:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });