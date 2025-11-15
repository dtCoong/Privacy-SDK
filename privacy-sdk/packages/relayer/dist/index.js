"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const RelayService_1 = require("./services/RelayService");
const TransactionQueue_1 = require("./queue/TransactionQueue");
const rateLimiter_1 = require("./middleware/rateLimiter");
const spamProtection_1 = require("./middleware/spamProtection");
const routes_1 = require("./api/routes");
const config_1 = require("./config/config");
const logger_1 = __importDefault(require("./utils/logger"));
dotenv_1.default.config();
async function main() {
    const config = (0, config_1.loadConfig)();
    // Validate config
    if (!config.privateKey) {
        logger_1.default.error('PRIVATE_KEY environment variable is required');
        process.exit(1);
    }
    // Initialize services
    logger_1.default.info('Initializing Relayer Service...');
    const relayService = new RelayService_1.RelayService(config.rpcUrl, config.privateKey, config.contractAddress, config.gasLimit, config.gasPriceMultiplier, config.maxGasPrice);
    await relayService.initialize();
    const queue = new TransactionQueue_1.TransactionQueue(1000, 3, 3600000);
    // Initialize middleware
    const rateLimiter = new rateLimiter_1.RateLimiter(config.rateLimitPoints, config.rateLimitDuration * 1000);
    const spamProtection = new spamProtection_1.SpamProtection(5, 300000, '0.001', '10.0');
    logger_1.default.info('Relayer initialized', {
        address: relayService.getAddress(),
        balance: await relayService.getBalance() + ' ETH',
        nonce: await relayService.getNonce()
    });
    // Setup Express app
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'X-API-Key']
    }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true }));
    // Request logging
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger_1.default.info('HTTP Request', {
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
    app.use('/', (0, routes_1.createRoutes)(relayService, queue));
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: 'Endpoint not found'
        });
    });
    // Error handler
    app.use((err, req, res, next) => {
        logger_1.default.error('Unhandled error', {
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
        logger_1.default.info(`Relayer service running on port ${config.port}`);
        logger_1.default.info(`Health check: http://localhost:${config.port}/health`);
        logger_1.default.info(`Info endpoint: http://localhost:${config.port}/info`);
        logger_1.default.info(`Submit endpoint: http://localhost:${config.port}/api/v1/submit`);
        logger_1.default.info(`Status endpoint: http://localhost:${config.port}/api/v1/status/:txId`);
        logger_1.default.info(`Queue stats: http://localhost:${config.port}/api/v1/queue/stats`);
    });
    // Graceful shutdown
    const shutdown = async () => {
        logger_1.default.info('Shutting down gracefully...');
        server.close(() => {
            logger_1.default.info('HTTP server closed');
        });
        // Wait for pending transactions
        const stats = queue.getStats();
        if (stats.processing > 0) {
            logger_1.default.info(`Waiting for ${stats.processing} transactions to complete...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        logger_1.default.info('Shutdown complete');
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
                logger_1.default.warn('Low balance warning', { balance: balance + ' ETH' });
            }
            const stats = queue.getStats();
            logger_1.default.debug('Queue stats', stats);
        }
        catch (error) {
            logger_1.default.error('Health check failed', { error: error.message });
        }
    }, 60000); // Every minute
}
main().catch((error) => {
    logger_1.default.error('Failed to start relayer', { error: error.message, stack: error.stack });
    process.exit(1);
});
