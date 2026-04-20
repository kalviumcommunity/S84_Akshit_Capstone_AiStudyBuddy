/**
 * Simple in-memory cache with TTL (Time To Live)
 * Falls back to memory if Redis is not available
 * 
 * Redis enabled! Install with: npm install redis
 * Set REDIS_URL in .env to use Redis cache
 */

class Cache {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
    this.useRedis = false;
    
    // Enable Redis if URL is provided
    if (process.env.REDIS_URL) {
      try {
        const redis = require('redis');
        
        // Configure Redis client with TLS for Upstash
        const redisConfig = {
          url: process.env.REDIS_URL,
          socket: {
            tls: true,
            rejectUnauthorized: false
          }
        };
        
        this.client = redis.createClient(redisConfig);
        
        this.client.on('error', (err) => {
          console.log('⚠️  Redis error:', err.message);
          this.useRedis = false;
        });
        
        this.client.on('connect', () => {
          console.log('✅ Redis cache connected successfully');
          this.useRedis = true;
        });
        
        this.client.on('ready', () => {
          console.log('✅ Redis is ready to use');
        });
        
        this.client.connect().catch(err => {
          console.log('⚠️  Redis connection failed, using memory cache');
          console.log('   Error:', err.message);
          this.useRedis = false;
        });
      } catch (error) {
        console.log('⚠️  Redis package not installed, using memory cache');
        console.log('   Install with: npm install redis');
      }
    } else {
      console.log('ℹ️  Using in-memory cache (set REDIS_URL for Redis)');
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (this.useRedis) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Redis get error:', error);
        return null;
      }
    }

    // Memory cache
    const ttl = this.ttls.get(key);
    if (ttl && Date.now() > ttl) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  /**
   * Set value in cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (default: 3600 = 1 hour)
   */
  async set(key, value, ttl = 3600) {
    if (this.useRedis) {
      try {
        await this.client.setEx(key, ttl, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Redis set error:', error);
        return false;
      }
    }

    // Memory cache
    this.store.set(key, value);
    this.ttls.set(key, Date.now() + (ttl * 1000));
    return true;
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   */
  async delete(key) {
    if (this.useRedis) {
      try {
        await this.client.del(key);
        return true;
      } catch (error) {
        console.error('Redis delete error:', error);
        return false;
      }
    }

    // Memory cache
    this.store.delete(key);
    this.ttls.delete(key);
    return true;
  }

  /**
   * Clear all cache
   */
  async clear() {
    if (this.useRedis) {
      try {
        await this.client.flushAll();
        return true;
      } catch (error) {
        console.error('Redis clear error:', error);
        return false;
      }
    }

    // Memory cache
    this.store.clear();
    this.ttls.clear();
    return true;
  }

  /**
   * Generate cache key for embeddings
   * @param {string} text - Text to hash
   * @returns {string} Cache key
   */
  embeddingKey(text) {
    // Simple hash function for cache key
    const hash = text.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return `embedding:${hash}`;
  }

  /**
   * Generate cache key for RAG queries
   * @param {string} query - User query
   * @param {string} noteId - Note ID
   * @returns {string} Cache key
   */
  ragKey(query, noteId) {
    const hash = (query + noteId).split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return `rag:${hash}`;
  }
}

// Singleton instance
const cache = new Cache();

module.exports = cache;
