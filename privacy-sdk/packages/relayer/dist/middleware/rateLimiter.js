"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class RateLimiter {
    constructor(maxPoints = 10, duration = 60000) {
        this.limits = new Map();
        this.maxPoints = maxPoints;
        this.duration = duration;
        // Cleanup old entries every minute
        setInterval(() => this.cleanup(), 60000);
    }
    middleware() {
        return (req, res, next) => {
            const key = this.getKey(req);
            const now = Date.now();
            let record = this.limits.get(key);
            if (!record || now > record.resetTime) {
                record = {
                    count: 0,
                    resetTime: now + this.duration
                };
                this.limits.set(key, record);
            }
            record.count++;
            if (record.count > this.maxPoints) {
                const resetIn = Math.ceil((record.resetTime - now) / 1000);
                logger_1.default.warn('Rate limit exceeded', {
                    key,
                    count: record.count,
                    resetIn
                });
                res.status(429).json({
                    success: false,
                    error: 'Too many requests',
                    retryAfter: resetIn
                });
                return;
            }
            // Add rate limit headers
            res.setHeader('X-RateLimit-Limit', this.maxPoints);
            res.setHeader('X-RateLimit-Remaining', this.maxPoints - record.count);
            res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
            next();
        };
    }
    getKey(req) {
        // Use IP address or API key if available
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const apiKey = req.headers['x-api-key'];
        return apiKey || ip;
    }
    cleanup() {
        const now = Date.now();
        let cleaned = 0;
        for (const [key, record] of this.limits.entries()) {
            if (now > record.resetTime) {
                this.limits.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            logger_1.default.debug('Rate limit cleanup', { cleaned });
        }
    }
    reset(key) {
        if (key) {
            this.limits.delete(key);
        }
        else {
            this.limits.clear();
        }
    }
}
exports.RateLimiter = RateLimiter;
