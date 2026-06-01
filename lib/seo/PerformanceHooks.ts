/**
 * Performance Safety Hooks Service
 * 
 * Purpose: Performance optimizations and safety checks
 * 
 * Features:
 * - Image size validation
 * - Pagination limits
 * - Basic API caching
 */

import { NextApiRequest, NextApiResponse } from 'next';

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  format?: string;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  maxLimit: number;
  defaultLimit: number;
}

export interface CacheOptions {
  key: string;
  ttl: number; // Time to live in seconds
  tags?: string[];
}

// In-memory cache (for development - use Redis in production)
const cache = new Map<string, { data: any; expires: number; tags: string[] }>();

/**
 * Image size validation
 */
export function validateImageSize(
  imageUrl: string,
  _maxSizeKB: number = 500,
  _maxWidth: number = 2000,
  _maxHeight: number = 2000,
  allowedFormats: string[] = ['jpg', 'jpeg', 'png', 'webp']
): ImageValidationResult {
  const result: ImageValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Extract file extension
    const urlParts = imageUrl.split('.');
    const extension = urlParts[urlParts.length - 1]?.toLowerCase();
    
    if (!extension || !allowedFormats.includes(extension)) {
      result.valid = false;
      result.errors.push(`Invalid image format: ${extension}. Allowed formats: ${allowedFormats.join(', ')}`);
      return result;
    }

    result.format = extension;

    // Note: For full validation, you would need to:
    // 1. Fetch the image
    // 2. Check actual file size
    // 3. Check actual dimensions
    // This is a basic validation - implement full validation in production

    // Basic URL validation
    if (!imageUrl || imageUrl.trim().length === 0) {
      result.valid = false;
      result.errors.push('Image URL is empty');
      return result;
    }

    // Check if URL is valid
    try {
      new URL(imageUrl);
    } catch {
      result.valid = false;
      result.errors.push('Invalid image URL format');
      return result;
    }

    // Add warnings for common issues
    if (imageUrl.includes(' ')) {
      result.warnings.push('Image URL contains spaces - consider URL encoding');
    }

    if (imageUrl.length > 2048) {
      result.warnings.push('Image URL is very long - consider using a CDN');
    }

  } catch (error: any) {
    result.valid = false;
    result.errors.push(`Validation error: ${error.message}`);
  }

  return result;
}

/**
 * Validate multiple images
 */
export function validateImages(
  imageUrls: string[],
  maxSizeKB: number = 500,
  maxWidth: number = 2000,
  maxHeight: number = 2000
): ImageValidationResult[] {
  return imageUrls.map((url) => validateImageSize(url, maxSizeKB, maxWidth, maxHeight));
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  req: NextApiRequest,
  options: Partial<PaginationOptions> = {}
): PaginationOptions {
  const {
    maxLimit = 100,
    defaultLimit = 20,
  } = options;

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  let limit = parseInt(req.query.limit as string) || defaultLimit;

  // Enforce max limit
  if (limit > maxLimit) {
    limit = maxLimit;
  }

  // Ensure limit is positive
  if (limit < 1) {
    limit = defaultLimit;
  }

  return {
    page,
    limit,
    maxLimit,
    defaultLimit,
  };
}

/**
 * Get pagination metadata
 */
export function getPaginationMeta(
  page: number,
  limit: number,
  total: number
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Basic API caching
 */
export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  
  if (!cached) {
    return null;
  }

  // Check if expired
  if (Date.now() > cached.expires) {
    cache.delete(key);
    return null;
  }

  return cached.data as T;
}

/**
 * Set cache data
 */
export function setCachedData<T>(
  key: string,
  data: T,
  ttl: number,
  tags: string[] = []
): void {
  const expires = Date.now() + (ttl * 1000);
  cache.set(key, { data, expires, tags });
}

/**
 * Invalidate cache by key
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate cache by tag
 */
export function invalidateCacheByTag(tag: string): void {
  for (const [key, value] of cache.entries()) {
    if (value.tags.includes(tag)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Cache middleware for API routes
 */
export function withCache(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  options: CacheOptions
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(req, res);
    }

    const cacheKey = `${options.key}:${JSON.stringify(req.query)}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    // Call original handler and cache response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      setCachedData(cacheKey, body, options.ttl, options.tags);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    return handler(req, res);
  };
}

/**
 * Rate limiting helper (basic implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Cleanup expired rate limit records
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimits, 5 * 60 * 1000);
}
