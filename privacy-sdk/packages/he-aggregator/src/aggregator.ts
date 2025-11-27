import { PaillierPublicKey, PaillierPrivateKey, createDemoKeypair, encrypt, decrypt, addCiphertexts } from "./paillier"

export type Vote = 0 | 1

export type EncryptedVote = {
  ciphertext: bigint
}

export type AggregationResult = {
  anonymitySet: number
  voterCount: number
  encryptedTally: bigint
  decryptedTally: number
}

export class HEAggregator {
  pub: PaillierPublicKey
  priv: PaillierPrivateKey

  constructor(pub: PaillierPublicKey, priv: PaillierPrivateKey) {
    this.pub = pub
    this.priv = priv
  }

  static createDemo(): HEAggregator {
    const { pub, priv } = createDemoKeypair()
    return new HEAggregator(pub, priv)
  }

  encryptVote(vote: Vote): EncryptedVote {
    const v = BigInt(vote)
    const c = encrypt(v, this.pub)
    return { ciphertext: c }
  }

  aggregateVotes(ciphertexts: EncryptedVote[]): bigint {
    const list = ciphertexts.map(c => c.ciphertext)
    return addCiphertexts(list, this.pub)
  }

  decryptTally(cipher: bigint): number {
    const m = decrypt(cipher, this.priv)
    return Number(m)
  }

  runAggregation(votes: Vote[], anonymitySet: number): AggregationResult {
    const paddedVotes = [...votes]
    while (paddedVotes.length < anonymitySet) {
      paddedVotes.push(0)
    }
    const encrypted = paddedVotes.map(v => this.encryptVote(v))
    const encTally = this.aggregateVotes(encrypted)
    const tally = this.decryptTally(encTally)
    return {
      anonymitySet,
      voterCount: votes.length,
      encryptedTally: encTally,
      decryptedTally: tally
    }
  }
}