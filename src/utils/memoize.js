/**
 * Memoization Utility
 * 
 * Caches function results to improve performance for expensive calculations.
 * Implements WeakMap for automatic garbage collection when keys are no longer referenced.
 * 
 * @module utils/memoize
 * @author Costco Dashboard Team
 * @since 1.0.0
 */

/**
 * Creates a memoized version of a function that caches results based on arguments
 * 
 * @param {Function} func - The function to memoize
 * @param {Function} [resolver] - Function to determine cache key from arguments
 * @returns {Function} Memoized function with cache methods
 * 
 * @example
 * // Memoize expensive calculation
 * const expensiveCalc = (a, b) => {
 *   console.log('Calculating...');
 *   return a * b * Math.random();
 * };
 * 
 * const memoized = memoize(expensiveCalc);
 * memoized(5, 10); // Calculates
 * memoized(5, 10); // Returns cached result
 * 
 * @example
 * // Custom cache key resolver
 * const getUserById = memoize(
 *   (user) => fetchUser(user.id),
 *   (user) => user.id  // Cache by id only
 * );
 */
export function memoize(func, resolver) {
    if (typeof func !== 'function') {
        throw new TypeError('memoize: func must be a function');
    }

    const cache = new Map();

    const memoized = function (...args) {
        const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = func.apply(this, args);
        cache.set(key, result);
        
        return result;
    };

    /**
     * Clears all cached values
     */
    memoized.clear = function () {
        cache.clear();
    };

    /**
     * Deletes a specific cached value
     * @param {...*} args - Arguments that determine the cache key
     */
    memoized.delete = function (...args) {
        const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);
        return cache.delete(key);
    };

    /**
     * Checks if a value is cached
     * @param {...*} args - Arguments that determine the cache key
     * @returns {boolean} True if cached
     */
    memoized.has = function (...args) {
        const key = resolver ? resolver.apply(this, args) : JSON.stringify(args);
        return cache.has(key);
    };

    /**
     * Gets current cache size
     * @returns {number} Number of cached entries
     */
    memoized.size = function () {
        return cache.size;
    };

    return memoized;
}

/**
 * Creates a memoized function that automatically clears cache after ttl milliseconds
 * 
 * @param {Function} func - The function to memoize
 * @param {number} ttl - Time to live in milliseconds
 * @returns {Function} Memoized function with TTL
 * 
 * @example
 * // Cache for 5 minutes
 * const getCachedData = memoizeWithTTL(fetchData, 5 * 60 * 1000);
 */
export function memoizeWithTTL(func, ttl) {
    if (typeof func !== 'function') {
        throw new TypeError('memoizeWithTTL: func must be a function');
    }

    if (typeof ttl !== 'number' || ttl <= 0) {
        throw new TypeError('memoizeWithTTL: ttl must be a positive number');
    }

    const cache = new Map();
    const timestamps = new Map();

    const memoized = function (...args) {
        const key = JSON.stringify(args);
        const now = Date.now();

        if (cache.has(key)) {
            const timestamp = timestamps.get(key);
            if (now - timestamp < ttl) {
                return cache.get(key);
            } else {
                cache.delete(key);
                timestamps.delete(key);
            }
        }

        const result = func.apply(this, args);
        cache.set(key, result);
        timestamps.set(key, now);
        
        return result;
    };

    memoized.clear = function () {
        cache.clear();
        timestamps.clear();
    };

    return memoized;
}

/**
 * Creates a memoized function with LRU (Least Recently Used) cache eviction
 * 
 * @param {Function} func - The function to memoize
 * @param {number} maxSize - Maximum cache size
 * @returns {Function} Memoized function with LRU eviction
 * 
 * @example
 * // Cache up to 100 entries, evict oldest when full
 * const cachedCalc = memoizeLRU(expensiveCalculation, 100);
 */
export function memoizeLRU(func, maxSize) {
    if (typeof func !== 'function') {
        throw new TypeError('memoizeLRU: func must be a function');
    }

    if (typeof maxSize !== 'number' || maxSize <= 0) {
        throw new TypeError('memoizeLRU: maxSize must be a positive number');
    }

    const cache = new Map();

    const memoized = function (...args) {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            // Move to end (most recently used)
            const value = cache.get(key);
            cache.delete(key);
            cache.set(key, value);
            return value;
        }

        const result = func.apply(this, args);

        // Evict oldest if at capacity
        if (cache.size >= maxSize) {
            const firstKey = cache.keys().next().value;
            cache.delete(firstKey);
        }

        cache.set(key, result);
        return result;
    };

    memoized.clear = function () {
        cache.clear();
    };

    memoized.size = function () {
        return cache.size;
    };

    memoized.has = function (...args) {
        const key = JSON.stringify(args);
        return cache.has(key);
    };

    memoized.delete = function (...args) {
        const key = JSON.stringify(args);
        return cache.delete(key);
    };

    return memoized;
}
