export interface Proposal {
    id: string;
    title: string;
    description: string;
    options: string[];
    startTime: number;
    endTime: number;
    eligibleVoters?: string[];
    creator: string;
    status: 'pending' | 'active' | 'ended';
}
export interface Vote {
    proposalId: string;
    option: number;
    voter: string;
    timestamp: number;
    commitment: string;
    nullifier: string;
}
export interface VoteResult {
    proposalId: string;
    options: string[];
    votes: number[];
    totalVotes: number;
    winner?: string;
}
export interface CastVoteParams {
    proposalId: string;
    option: number;
    anonymous?: boolean;
}
export interface VotingConfig {
    rpcUrl: string;
    contractAddress?: string;
    relayerUrl?: string;
}
