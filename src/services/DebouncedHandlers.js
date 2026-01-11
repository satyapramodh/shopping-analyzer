/**
 * Debounced event handlers for filters and search
 * Improves performance by reducing unnecessary recomputations
 * @module services/DebouncedHandlers
 */

import { debounce } from '../utils/debounce.js';
import { logger } from '../utils/logger.js';

const log = logger.createChild('DebouncedHandlers');

/**
 * Default debounce delays (in milliseconds)
 */
const DEBOUNCE_DELAYS = {
  SEARCH: 300,       // Quick feedback for search
  FILTER: 150,       // Immediate feedback for filters
  HEAVY_CALC: 500    // Longer delay for expensive operations
};

/**
 * Creates debounced handlers for common UI interactions
 * 
 * @class DebouncedHandlers
 */
export class DebouncedHandlers {
  constructor() {
    this.handlers = new Map();
    log.info('DebouncedHandlers initialized');
  }

  /**
   * Create a debounced search handler
   * @param {Function} searchFn - Function to execute after debounce
   * @param {number} [delay=300] - Delay in milliseconds
   * @returns {Function} Debounced search function
   * 
   * @example
   * const search = handlers.createSearchHandler((query) => {
   *   console.log('Searching for:', query);
   * });
   * 
   * searchInput.addEventListener('input', (e) => search(e.target.value));
   */
  createSearchHandler(searchFn, delay = DEBOUNCE_DELAYS.SEARCH) {
    if (typeof searchFn !== 'function') {
      throw new TypeError('searchFn must be a function');
    }

    const debounced = debounce(searchFn, delay);
    this.handlers.set('search', debounced);
    
    log.debug('Search handler created', { delay });
    return debounced;
  }

  /**
   * Create a debounced filter handler
   * @param {Function} filterFn - Function to execute after debounce
   * @param {number} [delay=150] - Delay in milliseconds
   * @returns {Function} Debounced filter function
   * 
   * @example
   * const filter = handlers.createFilterHandler((filters) => {
   *   console.log('Applying filters:', filters);
   * });
   * 
   * filterSelect.addEventListener('change', (e) => filter({ year: e.target.value }));
   */
  createFilterHandler(filterFn, delay = DEBOUNCE_DELAYS.FILTER) {
    if (typeof filterFn !== 'function') {
      throw new TypeError('filterFn must be a function');
    }

    const debounced = debounce(filterFn, delay);
    this.handlers.set('filter', debounced);
    
    log.debug('Filter handler created', { delay });
    return debounced;
  }

  /**
   * Create a debounced handler for expensive calculations
   * @param {Function} calcFn - Function to execute after debounce
   * @param {number} [delay=500] - Delay in milliseconds
   * @returns {Function} Debounced calculation function
   * 
   * @example
   * const calculate = handlers.createHeavyCalcHandler(() => {
   *   console.log('Running expensive calculation...');
   * });
   */
  createHeavyCalcHandler(calcFn, delay = DEBOUNCE_DELAYS.HEAVY_CALC) {
    if (typeof calcFn !== 'function') {
      throw new TypeError('calcFn must be a function');
    }

    const debounced = debounce(calcFn, delay);
    this.handlers.set('heavyCalc', debounced);
    
    log.debug('Heavy calculation handler created', { delay });
    return debounced;
  }

  /**
   * Create a custom debounced handler
   * @param {string} key - Identifier for this handler
   * @param {Function} fn - Function to execute after debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  createCustomHandler(key, fn, delay) {
    if (typeof fn !== 'function') {
      throw new TypeError('fn must be a function');
    }

    const debounced = debounce(fn, delay);
    this.handlers.set(key, debounced);
    
    log.debug('Custom handler created', { key, delay });
    return debounced;
  }

  /**
   * Get a registered handler by key
   * @param {string} key - Handler identifier
   * @returns {Function|undefined} The debounced handler
   */
  getHandler(key) {
    return this.handlers.get(key);
  }

  /**
   * Cancel all pending debounced operations
   */
  cancelAll() {
    log.debug('Cancelling all pending operations');
    
    for (const [key, handler] of this.handlers.entries()) {
      if (handler && handler.cancel) {
        handler.cancel();
      }
    }
    
    log.info('All pending operations cancelled');
  }

  /**
   * Flush all pending debounced operations (execute immediately)
   */
  flushAll() {
    log.debug('Flushing all pending operations');
    
    for (const [key, handler] of this.handlers.entries()) {
      if (handler && handler.flush) {
        handler.flush();
      }
    }
    
    log.info('All pending operations flushed');
  }

  /**
   * Remove a handler
   * @param {string} key - Handler identifier to remove
   */
  removeHandler(key) {
    const handler = this.handlers.get(key);
    if (handler && handler.cancel) {
      handler.cancel();
    }
    this.handlers.delete(key);
    log.debug('Handler removed', { key });
  }

  /**
   * Clear all handlers
   */
  clear() {
    this.cancelAll();
    this.handlers.clear();
    log.info('All handlers cleared');
  }
}

/**
 * Create a singleton instance of DebouncedHandlers
 * @returns {DebouncedHandlers} Shared debounced handlers instance
 */
let _instance = null;

export function getDebouncedHandlers() {
  if (!_instance) {
    _instance = new DebouncedHandlers();
  }
  return _instance;
}

/**
 * Export delay constants for customization
 */
export { DEBOUNCE_DELAYS };
