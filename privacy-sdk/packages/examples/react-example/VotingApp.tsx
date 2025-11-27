import React, { useState, useEffect } from 'react';
import { AnonymousVoting } from '@privacy-sdk/voting';
import type { Proposal, VoteResult } from '@privacy-sdk/voting';

const VotingApp: React.FC = () => {
  const [voting] = useState(() => new AnonymousVoting({
    rpcUrl: 'http://127.0.0.1:8545',
    relayerUrl: 'http://localhost:3001',
  }));

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [results, setResults] = useState<VoteResult | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  // New proposal form
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    options: ['', ''],
    duration: 24
  });

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = () => {
    const allProposals = voting.getAllProposals();
    setProposals(allProposals);
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validOptions = newProposal.options.filter(opt => opt.trim() !== '');
      
      if (validOptions.length < 2) {
        alert('Please provide at least 2 options');
        return;
      }

      await voting.createProposal(
        newProposal.title,
        newProposal.description,
        validOptions,
        newProposal.duration
      );

      setNewProposal({
        title: '',
        description: '',
        options: ['', ''],
        duration: 24
      });

      loadProposals();
      alert('Proposal created successfully!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleVote = async (proposalId: string, option: number) => {
    try {
      await voting.castVote(proposalId, option);
      setVoted(new Set([...voted, proposalId]));
      alert('Vote cast successfully!');
      loadResults(proposalId);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const loadResults = async (proposalId: string) => {
    const result = await voting.getTally(proposalId);
    setResults(result);
    setSelectedProposal(proposalId);
  };

  const addOption = () => {
    setNewProposal({
      ...newProposal,
      options: [...newProposal.options, '']
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newProposal.options];
    newOptions[index] = value;
    setNewProposal({ ...newProposal, options: newOptions });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>🗳️ Anonymous Voting System</h1>
        <p style={{ color: '#666' }}>Privacy-preserving decentralized voting</p>
      </header>

      {/* Create Proposal Form */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '24px', 
        borderRadius: '8px',
        marginBottom: '32px'
      }}>
        <h2>Create New Proposal</h2>
        <form onSubmit={handleCreateProposal}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Title
            </label>
            <input
              type="text"
              value={newProposal.title}
              onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={newProposal.description}
              onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Options
            </label>
            {newProposal.options.map((option, index) => (
              <input
                key={index}
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${index + 1}`}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '4px', 
                  border: '1px solid #ddd',
                  marginBottom: '8px'
                }}
              />
            ))}
            <button type="button" onClick={addOption} style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              + Add Option
            </button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              Duration (hours)
            </label>
            <input
              type="number"
              value={newProposal.duration}
              onChange={(e) => setNewProposal({ ...newProposal, duration: parseInt(e.target.value) })}
              min="1"
              max="168"
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <button type="submit" style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            Create Proposal
          </button>
        </form>
      </div>

      {/* Active Proposals */}
      <div>
        <h2>Active Proposals ({proposals.length})</h2>
        <div style={{ display: 'grid', gap: '16px' }}>
          {proposals.map((proposal) => (
            <div key={proposal.id} style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '20px',
              backgroundColor: 'white'
            }}>
              <h3>{proposal.title}</h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>{proposal.description}</p>
              
              <div style={{ marginBottom: '16px' }}>
                {proposal.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleVote(proposal.id, index)}
                    disabled={voted.has(proposal.id) || voting.isEnded(proposal.id)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: voted.has(proposal.id) ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: voted.has(proposal.id) || voting.isEnded(proposal.id) ? 'not-allowed' : 'pointer',
                      opacity: voted.has(proposal.id) || voting.isEnded(proposal.id) ? 0.6 : 1
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <button
                onClick={() => loadResults(proposal.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                View Results
              </button>

              {voted.has(proposal.id) && (
                <span style={{ 
                  marginLeft: '12px', 
                  color: '#28a745',
                  fontWeight: 'bold'
                }}>
                  ✓ You voted
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Results Modal */}
      {results && selectedProposal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '8px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2>Vote Results</h2>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Total Votes: {results.totalVotes}
            </p>

            {results.options.map((option, index) => {
              const votes = results.votes[index];
              const percentage = results.totalVotes > 0 
                ? ((votes / results.totalVotes) * 100).toFixed(1) 
                : '0.0';

              return (
                <div key={index} style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{option}</span>
                    <span>{votes} votes ({percentage}%)</span>
                  </div>
                  <div style={{
                    height: '24px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${percentage}%`,
                      backgroundColor: '#007bff',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              );
            })}

            {results.winner && (
              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '4px',
                color: '#155724'
              }}>
                <strong>Winner:</strong> {results.winner}
              </div>
            )}

            <button
              onClick={() => {
                setResults(null);
                setSelectedProposal(null);
              }}
              style={{
                marginTop: '24px',
                padding: '12px 24px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingApp;
