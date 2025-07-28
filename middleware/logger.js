/**
 * Request logging middleware
 */
const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log request body for non-GET requests (excluding sensitive data)
  if (req.method !== 'GET' && req.body) {
    const logBody = { ...req.body };
    
    // Remove sensitive fields from logs
    const sensitiveFields = ['password', 'otp', 'token', 'secret'];
    sensitiveFields.forEach(field => {
      if (logBody[field]) {
        logBody[field] = '[REDACTED]';
      }
    });
    
    console.log(`📝 Request Body:`, logBody);
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    // Log response
    console.log(`📤 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    // Log response data for errors or in development
    if (res.statusCode >= 400 || process.env.NODE_ENV === 'development') {
      const logData = { ...data };
      
      // Remove sensitive fields from response logs
      if (logData.token) {
        logData.token = '[REDACTED]';
      }
      
      console.log(`📋 Response:`, logData);
    }
    
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Security logging middleware
 */
const securityLogger = (req, res, next) => {
  // Log security-relevant events
  const securityEvents = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/request-otp',
    '/api/auth/verify-otp',
    '/api/auth/reset-password',
    '/api/auth/logout'
  ];

  if (securityEvents.some(event => req.originalUrl.includes(event))) {
    console.log(`🔒 Security Event: ${req.method} ${req.originalUrl} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
    
    // Log additional security context
    if (req.user) {
      console.log(`👤 Authenticated User: ${req.user.email} (${req.user.role})`);
    }
  }

  next();
};

/**
 * Performance logging middleware
 */
const performanceLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️ Slow Request: ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
    }
    
    // Log memory usage for long requests
    if (duration > 500) {
      const memUsage = process.memoryUsage();
      console.log(`💾 Memory Usage: RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB, Heap: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
  });

  next();
};

/**
 * API usage tracking middleware
 */
const apiUsageLogger = (req, res, next) => {
  // Track API endpoint usage
  const endpoint = req.route ? req.route.path : req.originalUrl;
  const method = req.method;
  
  // In production, this could be sent to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics service
    // analyticsService.track('api_usage', { endpoint, method, timestamp: new Date() });
  }
  
  next();
};

module.exports = {
  logger,
  securityLogger,
  performanceLogger,
  apiUsageLogger
};
