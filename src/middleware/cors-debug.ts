import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

/**
 * Middleware to debug CORS requests
 */
export const corsDebugMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.get('Origin');
  const method = req.method;
  
  // Log all CORS-related headers
  if (origin) {
    logger.info('🌐 CORS Request Debug:', {
      method,
      origin,
      path: req.path,
      headers: {
        'Access-Control-Request-Method': req.get('Access-Control-Request-Method'),
        'Access-Control-Request-Headers': req.get('Access-Control-Request-Headers'),
        'User-Agent': req.get('User-Agent'),
      }
    });
  }

  // Log preflight requests specifically
  if (method === 'OPTIONS') {
    logger.info('✈️ CORS Preflight Request:', {
      origin,
      path: req.path,
      requestMethod: req.get('Access-Control-Request-Method'),
      requestHeaders: req.get('Access-Control-Request-Headers'),
    });
  }

  next();
};

/**
 * Add CORS debug headers to response
 */
export const addCorsDebugHeaders = (req: Request, res: Response, next: NextFunction) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];
  
  // Add debug headers in development
  if (process.env.NODE_ENV !== 'production') {
    res.setHeader('X-CORS-Debug-Allowed-Origins', allowedOrigins.join(', '));
    res.setHeader('X-CORS-Debug-Request-Origin', req.get('Origin') || 'none');
  }

  next();
};
