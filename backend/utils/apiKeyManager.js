/**
 * API Key Manager - Rotates between multiple Gemini API keys
 * to maximize daily quota (20 requests per key per day)
 */

class ApiKeyManager {
  constructor() {
    // Collect all API keys from environment
    this.keys = [];
    
    // Primary key
    if (process.env.GEMINI_API_KEY) {
      this.keys.push(process.env.GEMINI_API_KEY);
    }
    
    // Additional keys
    if (process.env.GEMINI_API_KEY_2) {
      this.keys.push(process.env.GEMINI_API_KEY_2);
    }
    if (process.env.GEMINI_API_KEY_3) {
      this.keys.push(process.env.GEMINI_API_KEY_3);
    }
    if (process.env.GEMINI_API_KEY_4) {
      this.keys.push(process.env.GEMINI_API_KEY_4);
    }
    
    // Track usage per key
    this.keyUsage = new Map();
    this.keys.forEach(key => {
      this.keyUsage.set(key, {
        count: 0,
        lastReset: new Date(),
        failed: false
      });
    });
    
    this.currentIndex = 0;
    
    console.log(`🔑 API Key Manager initialized with ${this.keys.length} key(s)`);
  }
  
  /**
   * Get the next available API key using round-robin rotation
   * @returns {string} API key
   */
  getNextKey() {
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys configured');
    }
    
    // If only one key, return it
    if (this.keys.length === 1) {
      return this.keys[0];
    }
    
    // Try to find a key that hasn't failed
    let attempts = 0;
    while (attempts < this.keys.length) {
      const key = this.keys[this.currentIndex];
      const usage = this.keyUsage.get(key);
      
      // Reset daily counter if it's a new day
      const now = new Date();
      const hoursSinceReset = (now - usage.lastReset) / (1000 * 60 * 60);
      if (hoursSinceReset >= 24) {
        usage.count = 0;
        usage.failed = false;
        usage.lastReset = now;
      }
      
      // Move to next key for next request
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      
      // If this key hasn't failed, use it
      if (!usage.failed) {
        usage.count++;
        console.log(`   🔑 Using API key #${this.currentIndex} (used ${usage.count} times today)`);
        return key;
      }
      
      attempts++;
    }
    
    // All keys failed, reset and try first key
    console.log('   ⚠️  All keys exhausted, resetting and using first key');
    this.keys.forEach(key => {
      this.keyUsage.get(key).failed = false;
    });
    return this.keys[0];
  }
  
  /**
   * Mark a key as failed (quota exceeded)
   * @param {string} key - The API key that failed
   */
  markKeyFailed(key) {
    const usage = this.keyUsage.get(key);
    if (usage) {
      usage.failed = true;
      console.log(`   ❌ API key marked as failed (quota exceeded)`);
    }
  }
  
  /**
   * Get statistics about key usage
   * @returns {Object} Usage statistics
   */
  getStats() {
    const stats = [];
    this.keys.forEach((key, index) => {
      const usage = this.keyUsage.get(key);
      stats.push({
        keyNumber: index + 1,
        keyPreview: key.substring(0, 10) + '...',
        usageCount: usage.count,
        failed: usage.failed,
        lastReset: usage.lastReset
      });
    });
    return stats;
  }
}

// Singleton instance
const apiKeyManager = new ApiKeyManager();

module.exports = apiKeyManager;
