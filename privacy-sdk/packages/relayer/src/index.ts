import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { RelayService } from './services/RelayService';
import { TransactionQueue } from './queue/TransactionQueue';
import { RateLimiter } from './middleware/rateLimiter';
import { SpamProtection } from './middleware/spamProtection';
import { createRoutes } from './api/routes';
import { loadConfig } from './config/config';
import logger from './utils/logger';

dotenv.config();

async function main() {
  const config = loadConfig();

  // Validate config
  if (!config.privateKey) {
    logger.error('PRIVATE_KEY environment variable is required');
    process.exit(1);
  }

  // Initialize services
  logger.info('Initializing Relayer Service...');

  const relayService = new RelayService(
    config.rpcUrl,
    config.privateKey,
    config.contractAddress,
    config.gasLimit,
    config.gasPriceMultiplier,
    config.maxGasPrice
  );

  await relayService.initialize();

  const queue = new TransactionQueue(1000, 3, 3600000);

  // Initialize middleware
  const rateLimiter = new RateLimiter(
    config.rateLimitPoints,
    config.rateLimitDuration * 1000
  );

  const spamProtection = new SpamProtection(5, 300000, '0.001', '10.0');

  logger.info('Relayer initialized', {
    address: relayService.getAddress(),
    balance: await relayService.getBalance() + ' ETH',
    nonce: await relayService.getNonce()
  });

  // Setup Express app
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-API-Key']
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: duration + 'ms',
        ip: req.ip
      });
    });
    next();
  });

  // Apply rate limiting to API endpoints
  app.use('/api/v1/submit', rateLimiter.middleware());
  app.use('/api/v1/submit', spamProtection.middleware());

  // Add routes
  app.use('/', createRoutes(relayService, queue));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found'
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', { 
      error: err.message, 
      stack: err.stack,
      path: req.path
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  // Start server
  const server = app.listen(config.port, () => {
    logger.info(`Relayer service running on port ${config.port}`);
    logger.info(`Health check: http://localhost:${config.port}/health`);
    logger.info(`Info endpoint: http://localhost:${config.port}/info`);
    logger.info(`Submit endpoint: http://localhost:${config.port}/api/v1/submit`);
    logger.info(`Status endpoint: http://localhost:${config.port}/api/v1/status/:txId`);
    logger.info(`Queue stats: http://localhost:${config.port}/api/v1/queue/stats`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Wait for pending transactions
    const stats = queue.getStats();
    if (stats.processing > 0) {
      logger.info(`Waiting for ${stats.processing} transactions to complete...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // Health monitoring
  setInterval(async () => {
    try {
      const balance = await relayService.getBalance();
      const balanceNum = parseFloat(balance);
      
      if (balanceNum < 0.1) {
        logger.warn('Low balance warning', { balance: balance + ' ETH' });
      }

      const stats = queue.getStats();
      logger.debug('Queue stats', stats);
    } catch (error: any) {
      logger.error('Health check failed', { error: error.message });
    }
  }, 60000); // Every minute
}

main().catch((error) => {
  logger.error('Failed to start relayer', { error: error.message, stack: error.stack });
  process.exit(1);
});
