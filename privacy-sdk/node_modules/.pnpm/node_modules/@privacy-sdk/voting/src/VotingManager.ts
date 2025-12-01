import { PrivacyClient } from '@privacy-sdk/core';
import { ethers } from 'ethers';
import { Proposal, Vote, VoteResult, CastVoteParams, VotingConfig } from './types';

export class VotingManager {
  private privacyClient: PrivacyClient;
  private proposals: Map<string, Proposal>;
  private votes: Map<string, Vote[]>;
  private nullifiers: Set<string>;

  constructor(config: VotingConfig) {
    this.privacyClient = new PrivacyClient({
      rpcUrl: config.rpcUrl,
      contractAddress: config.contractAddress,
      relayerUrl: config.relayerUrl,
    });
    this.proposals = new Map();
    this.votes = new Map();
    this.nullifiers = new Set();
  }

  /**
   * Tạo proposal mới
   */
  async createProposal(
    title: string,
    description: string,
    options: string[],
    durationHours: number,
    eligibleVoters?: string[]
  ): Promise<string> {
    if (options.length < 2) {
      throw new Error('Proposal must have at least 2 options');
    }

    const id = this.generateProposalId();
    const now = Date.now();
    
    const proposal: Proposal = {
      id,
      title,
      description,
      options,
      startTime: now,
      endTime: now + (durationHours * 3600000),
      eligibleVoters,
      creator: 'anonymous', // In production, get from wallet
      status: 'active'
    };

    this.proposals.set(id, proposal);
    this.votes.set(id, []);

    console.log(`✓ Proposal created: ${id}`);
    console.log(`  Title: ${title}`);
    console.log(`  Options: ${options.join(', ')}`);
    console.log(`  Duration: ${durationHours} hours`);

    return id;
  }

  /**
   * Cast vote ẩn danh
   */
  async castVote(params: CastVoteParams): Promise<string> {
    const { proposalId, option, anonymous = true } = params;

    // Validate proposal
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    // Check if proposal is active
    const now = Date.now();
    if (now < proposal.startTime || now > proposal.endTime) {
      throw new Error('Voting period has ended or not started');
    }

    // Validate option
    if (option < 0 || option >= proposal.options.length) {
      throw new Error('Invalid option');
    }

    // Generate commitment and nullifier for privacy
    const secret = this.generateSecret();
    const nullifier = this.generateNullifier();
    const commitment = this.createCommitment(secret, nullifier);

    // Check if already voted (using nullifier)
    if (this.nullifiers.has(nullifier)) {
      throw new Error('Already voted');
    }

    // Create vote record
    const vote: Vote = {
      proposalId,
      option,
      voter: anonymous ? 'anonymous' : 'public',
      timestamp: now,
      commitment,
      nullifier
    };

    // Store vote
    const proposalVotes = this.votes.get(proposalId) || [];
    proposalVotes.push(vote);
    this.votes.set(proposalId, proposalVotes);
    this.nullifiers.add(nullifier);

    console.log(`✓ Vote cast for proposal: ${proposalId}`);
    console.log(`  Option: ${proposal.options[option]}`);
    console.log(`  Anonymous: ${anonymous}`);

    // In production: submit via relayer
    if (anonymous) {
      // await this.submitAnonymousVote(vote);
    }

    return commitment;
  }

  /**
   * Lấy kết quả vote
   */
  async getTally(proposalId: string): Promise<VoteResult> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }

    const proposalVotes = this.votes.get(proposalId) || [];
    const voteCounts = new Array(proposal.options.length).fill(0);

    // Count votes
    for (const vote of proposalVotes) {
      voteCounts[vote.option]++;
    }

    // Find winner
    const maxVotes = Math.max(...voteCounts);
    const winnerIndex = voteCounts.indexOf(maxVotes);

    const result: VoteResult = {
      proposalId,
      options: proposal.options,
      votes: voteCounts,
      totalVotes: proposalVotes.length,
      winner: voteCounts[winnerIndex] > 0 ? proposal.options[winnerIndex] : undefined
    };

    return result;
  }

  /**
   * Lấy thông tin proposal
   */
  getProposal(proposalId: string): Proposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Lấy tất cả proposals
   */
  getAllProposals(): Proposal[] {
    return Array.from(this.proposals.values());
  }

  /**
   * Kiểm tra proposal đã kết thúc chưa
   */
  isEnded(proposalId: string): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return false;
    return Date.now() > proposal.endTime;
  }

  /**
   * End proposal sớm
   */
  endProposal(proposalId: string): void {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error('Proposal not found');
    }
    proposal.status = 'ended';
    proposal.endTime = Date.now();
    console.log(`✓ Proposal ended: ${proposalId}`);
  }

  /**
   * Verify vote commitment
   */
  verifyVote(proposalId: string, commitment: string): boolean {
    const proposalVotes = this.votes.get(proposalId) || [];
    return proposalVotes.some(vote => vote.commitment === commitment);
  }

  // Helper methods
  private generateProposalId(): string {
    return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSecret(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  private generateNullifier(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  private createCommitment(secret: string, nullifier: string): string {
    return ethers.keccak256(
      ethers.solidityPacked(['bytes32', 'bytes32'], [secret, nullifier])
    );
  }

  /**
   * Get voting statistics
   */
  getStatistics(): {
    totalProposals: number;
    activeProposals: number;
    totalVotes: number;
  } {
    let totalVotes = 0;
    for (const votes of this.votes.values()) {
      totalVotes += votes.length;
    }

    const activeProposals = Array.from(this.proposals.values())
      .filter(p => p.status === 'active' && Date.now() < p.endTime).length;

    return {
      totalProposals: this.proposals.size,
      activeProposals,
      totalVotes
    };
  }
}
