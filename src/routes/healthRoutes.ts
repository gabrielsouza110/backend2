import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../models/database';
import { CacheService } from '../services/cacheService';
import { appConfig } from '../config/environment';
import { logger } from '../utils/logger';
import os from 'os';

const router = Router();

// Basic health check
router.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    const health = {
      status: dbHealth.status === 'healthy' ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: appConfig.server.env,
      version: process.env.npm_package_version || '1.0.0',
      database: dbHealth
    };
    
    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Health check failed');
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check with system metrics
router.get('/health/detailed', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    // System metrics
    const memUsage = process.memoryUsage();
    const systemLoad = os.loadavg();
    const cpuUsage = process.cpuUsage();
    
    // Cache statistics
    const cacheService = CacheService.getInstance();
    const cacheStats = cacheService.getStats();
    
    const health = {
      status: dbHealth.status === 'healthy' ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      uptime: {
        process: process.uptime(),
        system: os.uptime()
      },
      environment: appConfig.server.env,
      version: process.env.npm_package_version || '1.0.0',
      
      // Database health
      database: dbHealth,
      
      // System metrics
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        nodeVersion: process.version,
        cpuCount: os.cpus().length,
        loadAverage: systemLoad,
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        }
      },
      
      // Process metrics
      process: {
        pid: process.pid,
        memory: {
          rss: memUsage.rss,
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          arrayBuffers: memUsage.arrayBuffers
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        }
      },
      
      // Cache statistics
      cache: {
        main: cacheStats
      },
      
      // Configuration summary
      config: {
        port: appConfig.server.port,
        logLevel: appConfig.logging.level,
        features: appConfig.features
      }
    };
    
    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Detailed health check failed');
    res.status(503).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

// Readiness probe (for Kubernetes/Docker)
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    
    if (dbHealth.status === 'healthy') {
      res.status(200).json({
        status: 'READY',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'NOT_READY',
        timestamp: new Date().toISOString(),
        reason: 'Database not healthy'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'NOT_READY',
      timestamp: new Date().toISOString(),
      reason: 'Readiness check failed'
    });
  }
});

// Liveness probe (for Kubernetes/Docker)
router.get('/live', (req: Request, res: Response) => {
  // Simple liveness check - if the process is running, it's alive
  res.status(200).json({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint (Prometheus format)
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const memUsage = process.memoryUsage();
    const cacheService = CacheService.getInstance();
    const cacheStats = cacheService.getStats();
    
    // Generate Prometheus-style metrics
    const metrics = [
      '# HELP nodejs_process_uptime_seconds Process uptime in seconds',
      '# TYPE nodejs_process_uptime_seconds gauge',
      `nodejs_process_uptime_seconds ${process.uptime()}`,
      '',
      '# HELP nodejs_memory_usage_bytes Memory usage in bytes',
      '# TYPE nodejs_memory_usage_bytes gauge',
      `nodejs_memory_usage_bytes{type=\"rss\"} ${memUsage.rss}`,
      `nodejs_memory_usage_bytes{type=\"heapTotal\"} ${memUsage.heapTotal}`,
      `nodejs_memory_usage_bytes{type=\"heapUsed\"} ${memUsage.heapUsed}`,
      '',
      '# HELP database_health Database health status (1 = healthy, 0 = unhealthy)',
      '# TYPE database_health gauge',
      `database_health ${dbHealth.status === 'healthy' ? 1 : 0}`,
      '',
      '# HELP database_latency_milliseconds Database query latency',
      '# TYPE database_latency_milliseconds gauge',
      `database_latency_milliseconds ${dbHealth.latency || 0}`,
      '',
      '# HELP cache_size_items Number of items in cache',
      '# TYPE cache_size_items gauge',
      `cache_size_items{cache=\"main\"} ${cacheStats.size}`,
      ''
    ].join('\n');
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Metrics endpoint failed');
    res.status(500).send('# Metrics collection failed');
  }
});

export default router;