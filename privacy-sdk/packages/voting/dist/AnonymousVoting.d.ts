import { VotingConfig } from './types';
export declare class AnonymousVoting {
    private manager;
    constructor(config: VotingConfig);
    createProposal(title: string, description: string, options: string[], durationHours?: number, eligibleVoters?: string[]): Promise<string>;
    castVote(proposalId: string, option: number): Promise<string>;
    getTally(proposalId: string): Promise<import("./types").VoteResult>;
    getProposal(proposalId: string): import("./types").Proposal | undefined;
    getAllProposals(): import("./types").Proposal[];
    isEnded(proposalId: string): boolean;
    endProposal(proposalId: string): void;
    getStatistics(): {
        totalProposals: number;
        activeProposals: number;
        totalVotes: number;
    };
}
