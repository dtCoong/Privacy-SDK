"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionQueue = exports.TransactionStatus = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "pending";
    TransactionStatus["PROCESSING"] = "processing";
    TransactionStatus["SUBMITTED"] = "submitted";
    TransactionStatus["CONFIRMED"] = "confirmed";
    TransactionStatus["FAILED"] = "failed";
    TransactionStatus["EXPIRED"] = "expired";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
class TransactionQueue {
    constructor(maxQueueSize = 1000, defaultMaxRetries = 3, txExpireTime = 3600000 // 1 hour
    ) {
        this.queue = new Map();
        this.processingQueue = new Set();
        this.maxQueueSize = maxQueueSize;
        this.defaultMaxRetries = defaultMaxRetries;
        this.txExpireTime = txExpireTime;
        // Cleanup expired transactions every 5 minutes
        setInterval(() => this.cleanupExpired(), 300000);
    }
    async enqueue(request, priority = 5) {
        if (this.queue.size >= this.maxQueueSize) {
            throw new Error(`Queue full (max: ${this.maxQueueSize})`);
        }
        const id = this.generateTxId();
        const tx = {
            id,
            request,
            timestamp: Date.now(),
            status: TransactionStatus.PENDING,
            priority: Math.max(0, Math.min(10, priority)),
            retryCount: 0,
            maxRetries: this.defaultMaxRetries,
        };
        this.queue.set(id, tx);
        logger_1.default.info('Transaction enqueued', {
            id,
            priority: tx.priority,
            queueSize: this.queue.size
        });
        return id;
    }
    getNext() {
        const pending = Array.from(this.queue.values())
            .filter(tx => tx.status === TransactionStatus.PENDING &&
            !this.processingQueue.has(tx.id))
            .sort((a, b) => {
            // Sort by priority (higher first), then by timestamp (older first)
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            return a.timestamp - b.timestamp;
        });
        return pending.length > 0 ? pending[0] : null;
    }
    markProcessing(id) {
        const tx = this.queue.get(id);
        if (tx) {
            tx.status = TransactionStatus.PROCESSING;
            this.processingQueue.add(id);
            logger_1.default.info('Transaction marked as processing', { id });
        }
    }
    markSubmitted(id, txHash, gasPrice, nonce) {
        const tx = this.queue.get(id);
        if (tx) {
            tx.status = TransactionStatus.SUBMITTED;
            tx.txHash = txHash;
            tx.gasPrice = gasPrice;
            tx.nonce = nonce;
            tx.submittedAt = Date.now();
            this.processingQueue.delete(id);
            logger_1.default.info('Transaction submitted', { id, txHash, gasPrice, nonce });
        }
    }
    markConfirmed(id) {
        const tx = this.queue.get(id);
        if (tx) {
            tx.status = TransactionStatus.CONFIRMED;
            tx.confirmedAt = Date.now();
            logger_1.default.info('Transaction confirmed', {
                id,
                txHash: tx.txHash,
                latency: tx.confirmedAt - tx.submittedAt
            });
        }
    }
    markFailed(id, error, shouldRetry = true) {
        const tx = this.queue.get(id);
        if (!tx)
            return;
        tx.error = error;
        this.processingQueue.delete(id);
        if (shouldRetry && tx.retryCount < tx.maxRetries) {
            tx.retryCount++;
            tx.status = TransactionStatus.PENDING;
            logger_1.default.warn('Transaction failed, will retry', {
                id,
                error,
                retryCount: tx.retryCount,
                maxRetries: tx.maxRetries
            });
        }
        else {
            tx.status = TransactionStatus.FAILED;
            logger_1.default.error('Transaction failed permanently', { id, error });
        }
    }
    getStatus(id) {
        return this.queue.get(id);
    }
    getQueueSize() {
        return Array.from(this.queue.values())
            .filter(tx => tx.status === TransactionStatus.PENDING)
            .length;
    }
    getProcessingCount() {
        return this.processingQueue.size;
    }
    getStats() {
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
                case TransactionStatus.PENDING:
                    stats.pending++;
                    break;
                case TransactionStatus.PROCESSING:
                    stats.processing++;
                    break;
                case TransactionStatus.SUBMITTED:
                    stats.submitted++;
                    break;
                case TransactionStatus.CONFIRMED:
                    stats.confirmed++;
                    break;
                case TransactionStatus.FAILED:
                    stats.failed++;
                    break;
                case TransactionStatus.EXPIRED:
                    stats.expired++;
                    break;
            }
        }
        return stats;
    }
    cleanupExpired() {
        const now = Date.now();
        let expiredCount = 0;
        for (const [id, tx] of this.queue.entries()) {
            if (now - tx.timestamp > this.txExpireTime) {
                if (tx.status === TransactionStatus.CONFIRMED) {
                    this.queue.delete(id);
                }
                else {
                    tx.status = TransactionStatus.EXPIRED;
                }
                expiredCount++;
            }
        }
        if (expiredCount > 0) {
            logger_1.default.info('Cleaned up expired transactions', { count: expiredCount });
        }
    }
    generateTxId() {
        return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    clear() {
        this.queue.clear();
        this.processingQueue.clear();
        logger_1.default.info('Queue cleared');
    }
}
exports.TransactionQueue = TransactionQueue;
