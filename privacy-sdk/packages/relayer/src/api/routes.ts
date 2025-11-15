import { Router, Request, Response } from 'express';
import { RelayService } from '../services/RelayService';
import { TransactionQueue } from '../queue/TransactionQueue';
import { RelayRequest } from '../types';
import logger from '../utils/logger';

export function createRoutes(
  relayService: RelayService,
  queue: TransactionQueue
): Router {
  const router = Router();

  // Health check
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const balance = await relayService.getBalance();
      const stats = queue.getStats();

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        relayer: {
          address: relayService.getAddress(),
          balance: balance + ' ETH',
          nonce: await relayService.getNonce()
        },
        queue: stats
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        error: error.message
      });
    }
  });

  // Get relayer info
  router.get('/info', async (req: Request, res: Response) => {
    try {
      const balance = await relayService.getBalance();
      
      res.json({
        success: true,
        relayer: {
          address: relayService.getAddress(),
          balance: balance + ' ETH'
        },
        queue: queue.getStats(),
        limits: {
          maxQueueSize: 1000,
          maxAmount: '10.0 ETH',
          minAmount: '0.001 ETH'
        }
      });
    } catch (error: any) {
      logger.error('Failed to get info', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Submit transaction (enhanced)
  router.post('/api/v1/submit', async (req: Request, res: Response) => {
    try {
      const request: RelayRequest = req.body;
      const priority = (req.body.priority || 'standard') as 'standard' | 'fast' | 'instant';

      logger.info('Received relay request', { request, priority });

      // Enqueue transaction
      const txId = await queue.enqueue(request, priority === 'instant' ? 10 : priority === 'fast' ? 7 : 5);
      
      // Process immediately
      queue.markProcessing(txId);
      const result = await relayService.relayTransaction(request, priority);
      
      if (result.success && result.txHash) {
        queue.markSubmitted(txId, result.txHash, '0', 0);
        
        res.json({
          success: true,
          transactionId: txId,
          txHash: result.txHash,
          status: 'submitted'
        });
      } else {
        queue.markFailed(txId, result.error || 'Unknown error', false);
        
        res.status(400).json({
          success: false,
          transactionId: txId,
          error: result.error
        });
      }
    } catch (error: any) {
      logger.error('Failed to submit', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get transaction status
  router.get('/api/v1/status/:txId', async (req: Request, res: Response) => {
    try {
      const { txId } = req.params;
      const status = queue.getStatus(txId);
      
      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        });
      }
      
      res.json({
        success: true,
        transaction: {
          id: status.id,
          status: status.status,
          txHash: status.txHash,
          timestamp: status.timestamp,
          submittedAt: status.submittedAt,
          confirmedAt: status.confirmedAt,
          retryCount: status.retryCount,
          error: status.error
        }
      });
    } catch (error: any) {
      logger.error('Failed to get status', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get anonymity set
  router.get('/api/v1/anonymity-set', async (req: Request, res: Response) => {
    try {
      // In production, this would fetch from contract
      const anonymitySet = [
        '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
        '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
        '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955'
      ];

      res.json({
        success: true,
        anonymitySet,
        size: anonymitySet.length,
        lastUpdated: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('Failed to get anonymity set', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Queue statistics
  router.get('/api/v1/queue/stats', (req: Request, res: Response) => {
    try {
      const stats = queue.getStats();
      
      res.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      logger.error('Failed to get queue stats', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Get next transaction in queue (admin endpoint)
  router.get('/admin/queue/next', (req: Request, res: Response) => {
    try {
      const next = queue.getNext();
      
      if (!next) {
        return res.json({
          success: true,
          message: 'Queue is empty'
        });
      }

      res.json({
        success: true,
        transaction: {
          id: next.id,
          priority: next.priority,
          timestamp: next.timestamp,
          status: next.status
        }
      });
    } catch (error: any) {
      logger.error('Failed to get next transaction', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Reset nonce (admin endpoint)
  router.post('/admin/nonce/reset', async (req: Request, res: Response) => {
    try {
      relayService.resetNonce();
      const newNonce = await relayService.getNonce();
      
      logger.info('Nonce reset', { newNonce });
      
      res.json({
        success: true,
        message: 'Nonce reset successfully',
        nonce: newNonce
      });
    } catch (error: any) {
      logger.error('Failed to reset nonce', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return router;
}
