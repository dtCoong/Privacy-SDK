# Anonymous Voting System Guide

## Overview

The Privacy SDK Anonymous Voting system provides a decentralized, privacy-preserving voting mechanism using cryptographic commitments and zero-knowledge proofs.

## Features

- ✅ **Anonymous Voting**: Voter identities are protected
- ✅ **Verifiable Results**: All votes can be verified
- ✅ **Double-Voting Prevention**: Cryptographic nullifiers prevent duplicate votes
- ✅ **Flexible Proposals**: Support for multiple-choice voting
- ✅ **Time-Limited**: Proposals have configurable duration
- ✅ **No Central Authority**: Fully decentralized

## Installation
```bash
npm install @privacy-sdk/voting
# or
pnpm add @privacy-sdk/voting
```

## Quick Start

### 1. Initialize Voting System
```typescript
import { AnonymousVoting } from '@privacy-sdk/voting';

const voting = new AnonymousVoting({
  rpcUrl: 'http://127.0.0.1:8545',
  contractAddress: '0x...', // optional
  relayerUrl: 'http://localhost:3001' // optional
});
```

### 2. Create a Proposal
```typescript
const proposalId = await voting.createProposal(
  'Should we upgrade to v2.0?',           // title
  'Vote on protocol upgrade',             // description
  ['Yes', 'No', 'Abstain'],              // options
  24                                      // duration in hours
);
```

### 3. Cast a Vote
```typescript
// Vote for option 0 (Yes)
const commitment = await voting.castVote(proposalId, 0);
console.log('Vote commitment:', commitment);
```

### 4. Get Results
```typescript
const result = await voting.getTally(proposalId);

console.log('Total votes:', result.totalVotes);
console.log('Winner:', result.winner);

result.options.forEach((option, index) => {
  console.log(`${option}: ${result.votes[index]} votes`);
});
```

## API Reference

### `createProposal()`

Creates a new voting proposal.
```typescript
async createProposal(
  title: string,
  description: string,
  options: string[],
  durationHours: number,
  eligibleVoters?: string[]
): Promise<string>
```

**Parameters:**
- `title`: Proposal title
- `description`: Detailed description
- `options`: Array of voting options (minimum 2)
- `durationHours`: How long voting is open
- `eligibleVoters`: Optional whitelist of voter addresses

**Returns:** Proposal ID

### `castVote()`

Cast an anonymous vote.
```typescript
async castVote(
  proposalId: string,
  option: number
): Promise<string>
```

**Parameters:**
- `proposalId`: ID of the proposal
- `option`: Index of the option to vote for (0-based)

**Returns:** Vote commitment hash

**Throws:**
- Error if proposal not found
- Error if voting period ended
- Error if invalid option
- Error if already voted

### `getTally()`

Get current vote results.
```typescript
async getTally(proposalId: string): Promise<VoteResult>
```

**Returns:**
```typescript
interface VoteResult {
  proposalId: string;
  options: string[];
  votes: number[];      // vote count for each option
  totalVotes: number;
  winner?: string;      // winning option
}
```

### `getProposal()`

Get proposal details.
```typescript
getProposal(proposalId: string): Proposal | undefined
```

### `getAllProposals()`

Get all proposals.
```typescript
getAllProposals(): Proposal[]
```

### `isEnded()`

Check if voting has ended.
```typescript
isEnded(proposalId: string): boolean
```

### `getStatistics()`

Get system statistics.
```typescript
getStatistics(): {
  totalProposals: number;
  activeProposals: number;
  totalVotes: number;
}
```

## Privacy Features

### Cryptographic Commitments

Each vote generates a cryptographic commitment:
```typescript
commitment = keccak256(secret, nullifier)
```

- **Secret**: Random 32-byte value (known only to voter)
- **Nullifier**: Random 32-byte value (prevents double-voting)
- **Commitment**: Public hash stored on-chain

### Anonymity Guarantees

1. **Voter Identity**: Hidden via cryptographic commitments
2. **Vote Unlinkability**: No link between voter and vote
3. **Double-Voting Prevention**: Nullifiers prevent reuse
4. **Verifiability**: Results can be independently verified

## Use Cases

### 1. DAO Governance
```typescript
// Create governance proposal
const proposalId = await voting.createProposal(
  'Treasury Allocation 2024',
  'How should we allocate 1M tokens?',
  [
    'Development (40%)',
    'Marketing (30%)',
    'Community (30%)'
  ],
  168 // 1 week
);
```

### 2. Community Polls
```typescript
// Quick community poll
const proposalId = await voting.createProposal(
  'Next Feature Priority',
  'What should we build next?',
  ['Feature A', 'Feature B', 'Feature C'],
  24
);
```

### 3. Board Elections
```typescript
// Board member election
const proposalId = await voting.createProposal(
  'Board Member Election 2024',
  'Vote for new board member',
  ['Candidate A', 'Candidate B', 'Candidate C'],
  72,
  eligibleVoterAddresses // whitelist
);
```

## Best Practices

### Security

1. **Keep Secrets Safe**: Never share your vote secret
2. **Verify Commitments**: Always verify your vote was recorded
3. **Check Eligibility**: Ensure you're eligible before voting
4. **Monitor Proposals**: Check proposal end times

### UX Recommendations

1. **Show Progress**: Display vote counts in real-time
2. **Confirm Actions**: Confirm before casting votes
3. **Display Status**: Show if user already voted
4. **Time Remaining**: Display countdown timers

## Error Handling
```typescript
try {
  await voting.castVote(proposalId, option);
} catch (error) {
  if (error.message.includes('Already voted')) {
    // Handle double-vote attempt
  } else if (error.message.includes('Voting period has ended')) {
    // Handle late vote
  } else {
    // Handle other errors
  }
}
```

## Testing
```typescript
import { describe, it, expect } from 'vitest';
import { AnonymousVoting } from '@privacy-sdk/voting';

describe('Voting System', () => {
  it('should create proposal', async () => {
    const voting = new AnonymousVoting({ rpcUrl: '...' });
    const id = await voting.createProposal(
      'Test',
      'Test proposal',
      ['A', 'B'],
      1
    );
    expect(id).toBeDefined();
  });

  it('should cast vote', async () => {
    const voting = new AnonymousVoting({ rpcUrl: '...' });
    const id = await voting.createProposal('Test', 'Test', ['A', 'B'], 1);
    const commitment = await voting.castVote(id, 0);
    expect(commitment).toBeDefined();
  });
});
```

## Advanced: Custom Integration

### With Smart Contracts
```solidity
// Your contract
contract MyDAO {
  IVotingSystem public voting;

  function createProposal(
    string memory title,
    string[] memory options
  ) external {
    bytes32 proposalId = voting.createProposal(
      title,
      options,
      block.timestamp + 7 days
    );
    // ... store proposalId
  }
}
```

### With Web3 Frontend
```typescript
import { ethers } from 'ethers';
import { AnonymousVoting } from '@privacy-sdk/voting';

// Connect to user's wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Initialize voting
const voting = new AnonymousVoting({
  rpcUrl: await provider.send('eth_chainId', []),
});

// Use with React
function VotingComponent() {
  const [proposals, setProposals] = useState([]);
  
  useEffect(() => {
    setProposals(voting.getAllProposals());
  }, []);
  
  // ... render UI
}
```

## Troubleshooting

### Issue: "Already voted"
**Solution**: Each address can only vote once per proposal. Use a different address or create a new proposal.

### Issue: "Voting period has ended"
**Solution**: Check proposal end time with `isEnded()` before voting.

### Issue: "Invalid option"
**Solution**: Ensure option index is within range (0 to options.length - 1).

## Roadmap

- [ ] On-chain vote storage
- [ ] zkSNARK proof generation
- [ ] Quadratic voting support
- [ ] Delegated voting
- [ ] Vote encryption
- [ ] Multi-sig proposals

## Support

- Documentation: https://docs.privacy-sdk.com
- GitHub: https://github.com/your-org/privacy-sdk
- Discord: https://discord.gg/privacy-sdk