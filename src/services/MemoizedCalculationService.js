/**
 * Memoized wrapper for CalculationService
 * Provides cached versions of expensive calculation methods
 * @module services/MemoizedCalculationService
 */

import { CalculationService, getCalculationService } from './CalculationService.js';
import { memoize, memoizeLRU } from '../utils/memoize.js';
import { logger } from '../utils/logger.js';

const log = logger.createChild('MemoizedCalculationService');

/**
 * Memoized wrapper for CalculationService
 * Wraps computationally expensive methods with caching
 * 
 * @class MemoizedCalculationService
 * @extends CalculationService
 */
export class MemoizedCalculationService extends CalculationService {
  constructor() {
    super();
    
    // Wrap pure functions with memoization
    // Use LRU cache for methods that may be called with many different inputs
    this.calculateRewards = memoize(super.calculateRewards.bind(this));
    this.calculateRefundRate = memoize(super.calculateRefundRate.bind(this));
    this.calculateAveragePurchase = memoize(super.calculateAveragePurchase.bind(this));
    this.calculateGasMetrics = memoize(super.calculateGasMetrics.bind(this));
    this.calculateDiscountEffectiveness = memoize(super.calculateDiscountEffectiveness.bind(this));
    this.calculateStandardDeviation = memoizeLRU(super.calculateStandardDeviation.bind(this), 100);
    this.calculatePercentile = memoizeLRU(super.calculatePercentile.bind(this), 100);
    
    log.info('MemoizedCalculationService initialized with cached methods');
  }

  /**
   * Clear all memoization caches
   * Call this when underlying data changes
   * 
   * @example
   * service.clearCaches(); // Clear after data upload
   */
  clearCaches() {
    log.debug('Clearing all memoization caches');
    
    this.calculateRewards.clear();
    this.calculateRefundRate.clear();
    this.calculateAveragePurchase.clear();
    this.calculateGasMetrics.clear();
    this.calculateDiscountEffectiveness.clear();
    this.calculateStandardDeviation.clear();
    this.calculatePercentile.clear();
    
    log.info('All caches cleared');
  }

  /**
   * Get cache statistics for monitoring
   * @returns {Object} Cache size information
   */
  getCacheStats() {
    return {
      calculateRewards: this.calculateRewards.size(),
      calculateRefundRate: this.calculateRefundRate.size(),
      calculateAveragePurchase: this.calculateAveragePurchase.size(),
      calculateGasMetrics: this.calculateGasMetrics.size(),
      calculateDiscountEffectiveness: this.calculateDiscountEffectiveness.size(),
      calculateStandardDeviation: this.calculateStandardDeviation.size(),
      calculatePercentile: this.calculatePercentile.size()
    };
  }
}

/**
 * Create a singleton instance of MemoizedCalculationService
 * @returns {MemoizedCalculationService} Shared memoized calculation service instance
 */
let _memoizedInstance = null;

export function getMemoizedCalculationService() {
  if (!_memoizedInstance) {
    _memoizedInstance = new MemoizedCalculationService();
  }
  return _memoizedInstance;
}

/**
 * Replace the default singleton with memoized version
 * Call this early in application initialization
 * 
 * @example
 * import { useMemoizedCalculations } from './services/MemoizedCalculationService.js';
 * useMemoizedCalculations(); // Enable memoization globally
 */
export function useMemoizedCalculations() {
  const memoized = getMemoizedCalculationService();
  log.info('Enabled memoized calculations globally');
  return memoized;
}
