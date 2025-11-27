import { Vote } from "../aggregator"

export type MockBatch = {
  anonymitySet: number
  votes: Vote[]
}

export function generateMockVotes(anonymitySet: number, trueVoters: number): MockBatch {
  const votes: Vote[] = []
  const maxTrue = Math.min(trueVoters, anonymitySet)
  for (let i = 0; i < maxTrue; i++) {
    votes.push(1)
  }
  for (let i = votes.length; i < anonymitySet; i++) {
    votes.push(0)
  }
  for (let i = votes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = votes[i]
    votes[i] = votes[j]
    votes[j] = tmp
  }
  return { anonymitySet, votes }
}