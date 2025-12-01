"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VotingManager = void 0;
const core_1 = require("@privacy-sdk/core");
const ethers_1 = require("ethers");
class VotingManager {
    constructor(config) {
        this.privacyClient = new core_1.PrivacyClient({
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
    async createProposal(title, description, options, durationHours, eligibleVoters) {
        if (options.length < 2) {
            throw new Error('Proposal must have at least 2 options');
        }
        const id = this.generateProposalId();
        const now = Date.now();
        const proposal = {
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
    async castVote(params) {
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
        const vote = {
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
    async getTally(proposalId) {
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
        const result = {
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
    getProposal(proposalId) {
        return this.proposals.get(proposalId);
    }
    /**
     * Lấy tất cả proposals
     */
    getAllProposals() {
        return Array.from(this.proposals.values());
    }
    /**
     * Kiểm tra proposal đã kết thúc chưa
     */
    isEnded(proposalId) {
        const proposal = this.proposals.get(proposalId);
        if (!proposal)
            return false;
        return Date.now() > proposal.endTime;
    }
    /**
     * End proposal sớm
     */
    endProposal(proposalId) {
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
    verifyVote(proposalId, commitment) {
        const proposalVotes = this.votes.get(proposalId) || [];
        return proposalVotes.some(vote => vote.commitment === commitment);
    }
    // Helper methods
    generateProposalId() {
        return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSecret() {
        return ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32));
    }
    generateNullifier() {
        return ethers_1.ethers.hexlify(ethers_1.ethers.randomBytes(32));
    }
    createCommitment(secret, nullifier) {
        return ethers_1.ethers.keccak256(ethers_1.ethers.solidityPacked(['bytes32', 'bytes32'], [secret, nullifier]));
    }
    /**
     * Get voting statistics
     */
    getStatistics() {
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
exports.VotingManager = VotingManager;
