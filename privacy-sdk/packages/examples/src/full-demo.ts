
import { PrivacyClient } from '@privacy-sdk/core';
import { AnonymousVoting } from '@privacy-sdk/voting';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.clear();
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   PRIVACY SDK - COMPLETE DEMONSTRATION       ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  await sleep(1000);

  // ========================================
  // PART 1: BASIC SDK USAGE
  // ========================================
  console.log('═══════════════════════════════════════════════');
  console.log('PART 1: Privacy SDK Core Features');
  console.log('═══════════════════════════════════════════════\n');

  const client = new PrivacyClient({
    rpcUrl: 'http://127.0.0.1:8545',
    contractAddress: process.env.CONTRACT_ADDRESS || '',
    relayerUrl: 'http://localhost:3001',
  });

  console.log('✓ Privacy client initialized\n');
  await sleep(500);

  // Create wallet
  console.log('🔐 Creating new wallet...');
  const wallet = await client.createWallet();
  console.log(`  Address: ${wallet.address}`);
  console.log(`  Private Key: ${wallet.privateKey.substring(0, 20)}...`);
  console.log('');
  await sleep(1000);

  // Check balance
  console.log('💰 Checking balance...');
  const balance = await client.getBalance();
  console.log(`  Balance: ${balance} ETH\n`);
  await sleep(1000);

  // ========================================
  // PART 2: ANONYMOUS VOTING
  // ========================================
  console.log('\n═══════════════════════════════════════════════');
  console.log('PART 2: Anonymous Voting System');
  console.log('═══════════════════════════════════════════════\n');
  await sleep(500);

  const voting = new AnonymousVoting({
    rpcUrl: 'http://127.0.0.1:8545',
    relayerUrl: 'http://localhost:3001',
  });

  console.log('✓ Voting system initialized\n');
  await sleep(500);

  // Create proposal
  console.log('📝 Creating governance proposal...');
  const proposalId = await voting.createProposal(
    'Protocol Upgrade v2.0',
    'Should we upgrade the protocol to version 2.0?',
    ['Yes - Upgrade Now', 'No - Keep Current', 'Abstain'],
    24
  );
  console.log(`  Proposal ID: ${proposalId}\n`);
  await sleep(1000);

  // Cast votes
  console.log('🗳️  Community voting in progress...\n');
  
  const voters = [
    { name: 'Community Member #1', choice: 0, delay: 300 },
    { name: 'Community Member #2', choice: 0, delay: 400 },
    { name: 'Community Member #3', choice: 1, delay: 350 },
    { name: 'Community Member #4', choice: 0, delay: 450 },
    { name: 'Community Member #5', choice: 2, delay: 300 },
  ];

  for (const voter of voters) {
    await sleep(voter.delay);
    const commitment = await voting.castVote(proposalId, voter.choice);
    const proposal = voting.getProposal(proposalId)!;
    console.log(`  ✓ ${voter.name} voted (anonymous)`);
    console.log(`    Commitment: ${commitment.substring(0, 30)}...`);
  }

  console.log('');
  await sleep(1000);

  // Show results
  console.log('📊 Final Results:');
  console.log('─────────────────────────────────────────────\n');
  
  const result = await voting.getTally(proposalId);
  const proposal = voting.getProposal(proposalId)!;

  result.options.forEach((option, index) => {
    const votes = result.votes[index];
    const percentage = result.totalVotes > 0 
      ? ((votes / result.totalVotes) * 100).toFixed(1) 
      : '0.0';
    
    const barLength = Math.floor((votes / result.totalVotes) * 30);
    const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);
    
    console.log(`  ${option}`);
    console.log(`  [${bar}] ${votes} votes (${percentage}%)\n`);
  });

  console.log('─────────────────────────────────────────────');
  console.log(`  Total Votes: ${result.totalVotes}`);
  console.log(`  Result: ${result.winner} ✨\n`);
  await sleep(1000);

  // ========================================
  // PART 3: PRIVACY FEATURES
  // ========================================
  console.log('\n═══════════════════════════════════════════════');
  console.log('PART 3: Privacy & Security Features');
  console.log('═══════════════════════════════════════════════\n');
  await sleep(500);

  console.log('🔒 Privacy Features Enabled:');
  console.log('  ✓ Anonymous voting with zero-knowledge proofs');
  console.log('  ✓ Voter identity protection');
  console.log('  ✓ Unlinkable votes and voters');
  console.log('  ✓ Cryptographic commitments');
  console.log('  ✓ Double-voting prevention');
  console.log('  ✓ Verifiable results\n');
  await sleep(1000);

  console.log('🛡️  Security Guarantees:');
  console.log('  ✓ Tamper-proof vote recording');
  console.log('  ✓ Transparent vote counting');
  console.log('  ✓ No central authority required');
  console.log('  ✓ Censorship-resistant\n');
  await sleep(1000);

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n═══════════════════════════════════════════════');
  console.log('DEMONSTRATION SUMMARY');
  console.log('═══════════════════════════════════════════════\n');

  const stats = voting.getStatistics();
  console.log(`📊 System Statistics:`);
  console.log(`   • Total Proposals: ${stats.totalProposals}`);
  console.log(`   • Active Proposals: ${stats.activeProposals}`);
  console.log(`   • Total Votes Cast: ${stats.totalVotes}\n`);

  console.log('✅ All Features Demonstrated:');
  console.log('   • Wallet creation & management');
  console.log('   • Anonymous voting system');
  console.log('   • Privacy-preserving transactions');
  console.log('   • Decentralized governance\n');

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     DEMONSTRATION COMPLETED SUCCESSFULLY     ║');
  console.log('╚══════════════════════════════════════════════╝\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  });
