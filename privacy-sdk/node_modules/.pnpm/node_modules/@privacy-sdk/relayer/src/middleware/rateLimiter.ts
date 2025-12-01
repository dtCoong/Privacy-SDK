
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitRecord>;
  private readonly maxPoints: number;
  private readonly duration: number; // milliseconds

  constructor(maxPoints: number = 10, duration: number = 60000) {
    this.limits = new Map();
    this.maxPoints = maxPoints;
    this.duration = duration;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
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
        
        logger.warn('Rate limit exceeded', {
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

  private getKey(req: Request): string {
    // Use IP address or API key if available
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const apiKey = req.headers['x-api-key'] as string;
    return apiKey || ip;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, record] of this.limits.entries()) {
      if (now > record.resetTime) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Rate limit cleanup', { cleaned });
    }
  }

  reset(key?: string): void {
    if (key) {
      this.limits.delete(key);
    } else {
      this.limits.clear();
    }
  }
}
