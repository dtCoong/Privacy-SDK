import { describe, it, expect, beforeEach } from 'vitest';
import { VotingManager } from '../src/VotingManager';

describe('VotingManager', () => {
  let voting: VotingManager;

  beforeEach(() => {
    voting = new VotingManager({
      rpcUrl: 'http://127.0.0.1:8545'
    });
  });

  describe('createProposal', () => {
    it('should create a proposal', async () => {
      const id = await voting.createProposal(
        'Test Proposal',
        'Description',
        ['Option A', 'Option B'],
        24
      );

      expect(id).toBeDefined();
      expect(id).toMatch(/^prop_/);

      const proposal = voting.getProposal(id);
      expect(proposal).toBeDefined();
      expect(proposal?.title).toBe('Test Proposal');
      expect(proposal?.options).toEqual(['Option A', 'Option B']);
    });

    it('should reject proposal with less than 2 options', async () => {
      await expect(
        voting.createProposal('Test', 'Desc', ['Only One'], 24)
      ).rejects.toThrow('at least 2 options');
    });
  });

  describe('castVote', () => {
    it('should cast vote successfully', async () => {
      const id = await voting.createProposal(
        'Test',
        'Desc',
        ['A', 'B'],
        24
      );

      const commitment = await voting.castVote({
        proposalId: id,
        option: 0,
        anonymous: true
      });

      expect(commitment).toBeDefined();
      expect(commitment).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should reject invalid option', async () => {
      const id = await voting.createProposal(
        'Test',
        'Desc',
        ['A', 'B'],
        24
      );

      await expect(
        voting.castVote({ proposalId: id, option: 5 })
      ).rejects.toThrow('Invalid option');
    });

    it('should reject vote for non-existent proposal', async () => {
      await expect(
        voting.castVote({ proposalId: 'invalid', option: 0 })
      ).rejects.toThrow('Proposal not found');
    });
  });

  describe('getTally', () => {
    it('should return correct vote counts', async () => {
      const id = await voting.createProposal(
        'Test',
        'Desc',
        ['A', 'B', 'C'],
        24
      );

      // Cast 3 votes
      await voting.castVote({ proposalId: id, option: 0 });
      await voting.castVote({ proposalId: id, option: 0 });
      await voting.castVote({ proposalId: id, option: 1 });

      const result = await voting.getTally(id);

      expect(result.totalVotes).toBe(3);
      expect(result.votes[0]).toBe(2);
      expect(result.votes[1]).toBe(1);
      expect(result.votes[2]).toBe(0);
      expect(result.winner).toBe('A');
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics', async () => {
      await voting.createProposal('P1', 'D1', ['A', 'B'], 24);
      await voting.createProposal('P2', 'D2', ['A', 'B'], 24);

      const stats = voting.getStatistics();

      expect(stats.totalProposals).toBe(2);
      expect(stats.activeProposals).toBe(2);
    });
  });
});
