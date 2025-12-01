import { Proposal, VoteResult, CastVoteParams, VotingConfig } from './types';
export declare class VotingManager {
    private privacyClient;
    private proposals;
    private votes;
    private nullifiers;
    constructor(config: VotingConfig);
    /**
     * Tạo proposal mới
     */
    createProposal(title: string, description: string, options: string[], durationHours: number, eligibleVoters?: string[]): Promise<string>;
    /**
     * Cast vote ẩn danh
     */
    castVote(params: CastVoteParams): Promise<string>;
    /**
     * Lấy kết quả vote
     */
    getTally(proposalId: string): Promise<VoteResult>;
    /**
     * Lấy thông tin proposal
     */
    getProposal(proposalId: string): Proposal | undefined;
    /**
     * Lấy tất cả proposals
     */
    getAllProposals(): Proposal[];
    /**
     * Kiểm tra proposal đã kết thúc chưa
     */
    isEnded(proposalId: string): boolean;
    /**
     * End proposal sớm
     */
    endProposal(proposalId: string): void;
    /**
     * Verify vote commitment
     */
    verifyVote(proposalId: string, commitment: string): boolean;
    private generateProposalId;
    private generateSecret;
    private generateNullifier;
    private createCommitment;
    /**
     * Get voting statistics
     */
    getStatistics(): {
        totalProposals: number;
        activeProposals: number;
        totalVotes: number;
    };
}
