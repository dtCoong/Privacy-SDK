import { RelayRequest } from '../types';
import logger from '../utils/logger';

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export interface QueuedTransaction {
  id: string;
  request: RelayRequest;
  timestamp: number;
  status: TransactionStatus;
  priority: number; // 0-10, higher = more urgent
  retryCount: number;
  maxRetries: number;
  txHash?: string;
  error?: string;
  gasPrice?: string;
  nonce?: number;
  submittedAt?: number;
  confirmedAt?: number;
}

export class TransactionQueue {
  private queue: Map<string, QueuedTransaction>;
  private processingQueue: Set<string>;
  private readonly maxQueueSize: number;
  private readonly defaultMaxRetries: number;
  private readonly txExpireTime: number; // milliseconds

  constructor(
    maxQueueSize: number = 1000,
    defaultMaxRetries: number = 3,
    txExpireTime: number = 3600000 // 1 hour
  ) {
    this.queue = new Map();
    this.processingQueue = new Set();
    this.maxQueueSize = maxQueueSize;
    this.defaultMaxRetries = defaultMaxRetries;
    this.txExpireTime = txExpireTime;

    // Cleanup expired transactions every 5 minutes
    setInterval(() => this.cleanupExpired(), 300000);
  }

  async enqueue(request: RelayRequest, priority: number = 5): Promise<string> {
    if (this.queue.size >= this.maxQueueSize) {
      throw new Error(`Queue full (max: ${this.maxQueueSize})`);
    }

    const id = this.generateTxId();
    const tx: QueuedTransaction = {
      id,
      request,
      timestamp: Date.now(),
      status: TransactionStatus.PENDING,
      priority: Math.max(0, Math.min(10, priority)),
      retryCount: 0,
      maxRetries: this.defaultMaxRetries,
    };
    
    this.queue.set(id, tx);
    logger.info('Transaction enqueued', { 
      id, 
      priority: tx.priority,
      queueSize: this.queue.size 
    });
    
    return id;
  }

  getNext(): QueuedTransaction | null {
    const pending = Array.from(this.queue.values())
      .filter(tx => 
        tx.status === TransactionStatus.PENDING && 
        !this.processingQueue.has(tx.id)
      )
      .sort((a, b) => {
        // Sort by priority (higher first), then by timestamp (older first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

    return pending.length > 0 ? pending[0] : null;
  }

  markProcessing(id: string): void {
    const tx = this.queue.get(id);
    if (tx) {
      tx.status = TransactionStatus.PROCESSING;
      this.processingQueue.add(id);
      logger.info('Transaction marked as processing', { id });
    }
  }

  markSubmitted(id: string, txHash: string, gasPrice: string, nonce: number): void {
    const tx = this.queue.get(id);
    if (tx) {
      tx.status = TransactionStatus.SUBMITTED;
      tx.txHash = txHash;
      tx.gasPrice = gasPrice;
      tx.nonce = nonce;
      tx.submittedAt = Date.now();
      this.processingQueue.delete(id);
      logger.info('Transaction submitted', { id, txHash, gasPrice, nonce });
    }
  }

  markConfirmed(id: string): void {
    const tx = this.queue.get(id);
    if (tx) {
      tx.status = TransactionStatus.CONFIRMED;
      tx.confirmedAt = Date.now();
      logger.info('Transaction confirmed', { 
        id, 
        txHash: tx.txHash,
        latency: tx.confirmedAt! - tx.submittedAt!
      });
    }
  }

  markFailed(id: string, error: string, shouldRetry: boolean = true): void {
    const tx = this.queue.get(id);
    if (!tx) return;

    tx.error = error;
    this.processingQueue.delete(id);

    if (shouldRetry && tx.retryCount < tx.maxRetries) {
      tx.retryCount++;
      tx.status = TransactionStatus.PENDING;
      logger.warn('Transaction failed, will retry', { 
        id, 
        error, 
        retryCount: tx.retryCount,
        maxRetries: tx.maxRetries
      });
    } else {
      tx.status = TransactionStatus.FAILED;
      logger.error('Transaction failed permanently', { id, error });
    }
  }

  getStatus(id: string): QueuedTransaction | undefined {
    return this.queue.get(id);
  }

  getQueueSize(): number {
    return Array.from(this.queue.values())
      .filter(tx => tx.status === TransactionStatus.PENDING)
      .length;
  }

  getProcessingCount(): number {
    return this.processingQueue.size;
  }

  getStats(): {
    total: number;
    pending: number;
    processing: number;
    submitted: number;
    confirmed: number;
    failed: number;
    expired: number;
  } {
    const stats = {
      total: this.queue.size,
      pending: 0,
      processing: 0,
      submitted: 0,
      confirmed: 0,
      failed: 0,
      expired: 0
    };

    for (const tx of this.queue.values()) {
      switch (tx.status) {
        case TransactionStatus.PENDING: stats.pending++; break;
        case TransactionStatus.PROCESSING: stats.processing++; break;
        case TransactionStatus.SUBMITTED: stats.submitted++; break;
        case TransactionStatus.CONFIRMED: stats.confirmed++; break;
        case TransactionStatus.FAILED: stats.failed++; break;
        case TransactionStatus.EXPIRED: stats.expired++; break;
      }
    }

    return stats;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [id, tx] of this.queue.entries()) {
      if (now - tx.timestamp > this.txExpireTime) {
        if (tx.status === TransactionStatus.CONFIRMED) {
          this.queue.delete(id);
        } else {
          tx.status = TransactionStatus.EXPIRED;
        }
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.info('Cleaned up expired transactions', { count: expiredCount });
    }
  }

  private generateTxId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  clear(): void {
    this.queue.clear();
    this.processingQueue.clear();
    logger.info('Queue cleared');
  }
}
