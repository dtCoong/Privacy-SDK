"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymousVoting = void 0;
const VotingManager_1 = require("./VotingManager");
class AnonymousVoting {
    constructor(config) {
        this.manager = new VotingManager_1.VotingManager(config);
    }
    // Delegate methods
    async createProposal(title, description, options, durationHours = 24, eligibleVoters) {
        return this.manager.createProposal(title, description, options, durationHours, eligibleVoters);
    }
    async castVote(proposalId, option) {
        return this.manager.castVote({ proposalId, option, anonymous: true });
    }
    async getTally(proposalId) {
        return this.manager.getTally(proposalId);
    }
    getProposal(proposalId) {
        return this.manager.getProposal(proposalId);
    }
    getAllProposals() {
        return this.manager.getAllProposals();
    }
    isEnded(proposalId) {
        return this.manager.isEnded(proposalId);
    }
    endProposal(proposalId) {
        return this.manager.endProposal(proposalId);
    }
    getStatistics() {
        return this.manager.getStatistics();
    }
}
exports.AnonymousVoting = AnonymousVoting;
