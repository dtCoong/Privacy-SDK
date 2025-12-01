import { VotingManager } from './VotingManager';
import { VotingConfig, CastVoteParams } from './types';

export class AnonymousVoting {
  private manager: VotingManager;

  constructor(config: VotingConfig) {
    this.manager = new VotingManager(config);
  }

  // Delegate methods
  async createProposal(
    title: string,
    description: string,
    options: string[],
    durationHours: number = 24,
    eligibleVoters?: string[]
  ) {
    return this.manager.createProposal(title, description, options, durationHours, eligibleVoters);
  }

  async castVote(proposalId: string, option: number) {
    return this.manager.castVote({ proposalId, option, anonymous: true });
  }

  async getTally(proposalId: string) {
    return this.manager.getTally(proposalId);
  }

  getProposal(proposalId: string) {
    return this.manager.getProposal(proposalId);
  }

  getAllProposals() {
    return this.manager.getAllProposals();
  }

  isEnded(proposalId: string) {
    return this.manager.isEnded(proposalId);
  }

  endProposal(proposalId: string) {
    return this.manager.endProposal(proposalId);
  }

  getStatistics() {
    return this.manager.getStatistics();
  }
}
