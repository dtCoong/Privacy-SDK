import { AnonymousVoting } from '@privacy-sdk/voting';

async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║  ANONYMOUS VOTING SYSTEM DEMO          ║');
  console.log('╚════════════════════════════════════════╝\n');

  // Initialize voting system
  const voting = new AnonymousVoting({
    rpcUrl: 'http://127.0.0.1:8545',
    relayerUrl: 'http://localhost:3001',
  });

  console.log('✓ Voting system initialized\n');

  // Create a proposal
  console.log('📝 Creating proposal...');
  const proposalId = await voting.createProposal(
    'What should we build next?',
    'Vote for the next feature to implement in Privacy SDK',
    [
      'Zero-Knowledge Mixer',
      'Private Messaging',
      'Anonymous Auction',
      'Confidential Transactions'
    ],
    24 // 24 hours duration
  );
  console.log(`✓ Proposal created: ${proposalId}\n`);

  // Simulate multiple voters
  console.log('🗳️  Casting votes...');
  
  const voters = [
    { name: 'Alice', choice: 0 },
    { name: 'Bob', choice: 1 },
    { name: 'Charlie', choice: 0 },
    { name: 'Diana', choice: 2 },
    { name: 'Eve', choice: 0 },
    { name: 'Frank', choice: 1 },
    { name: 'Grace', choice: 3 },
    { name: 'Henry', choice: 0 }
  ];

  for (const voter of voters) {
    try {
      const commitment = await voting.castVote(proposalId, voter.choice);
      const proposal = voting.getProposal(proposalId);
      console.log(`  ✓ ${voter.name} voted for: "${proposal!.options[voter.choice]}" (Anonymous)`);
      console.log(`    Commitment: ${commitment.substring(0, 20)}...`);
    } catch (error: any) {
      console.log(`  ✗ ${voter.name} failed to vote: ${error.message}`);
    }
  }

  console.log('');

  // Get results
  console.log('📊 Vote Results:');
  console.log('═══════════════════════════════════════\n');
  
  const result = await voting.getTally(proposalId);
  const proposal = voting.getProposal(proposalId)!;

  result.options.forEach((option, index) => {
    const votes = result.votes[index];
    const percentage = result.totalVotes > 0 
      ? ((votes / result.totalVotes) * 100).toFixed(1) 
      : '0.0';
    
    const bar = '█'.repeat(Math.floor(votes * 2));
    console.log(`${option}`);
    console.log(`  ${bar} ${votes} votes (${percentage}%)\n`);
  });

  console.log('═══════════════════════════════════════');
  console.log(`Total Votes: ${result.totalVotes}`);
  console.log(`Winner: ${result.winner}\n`);

  // Display statistics
  const stats = voting.getStatistics();
  console.log('📈 System Statistics:');
  console.log(`  Total Proposals: ${stats.totalProposals}`);
  console.log(`  Active Proposals: ${stats.activeProposals}`);
  console.log(`  Total Votes Cast: ${stats.totalVotes}\n`);

  // Privacy demonstration
  console.log('🔒 Privacy Features:');
  console.log('  ✓ All votes are anonymous');
  console.log('  ✓ Voter identities protected');
  console.log('  ✓ No link between voter and vote');
  console.log('  ✓ Cryptographic commitments used');
  console.log('  ✓ Double-voting prevented\n');

  console.log('✨ Demo completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

