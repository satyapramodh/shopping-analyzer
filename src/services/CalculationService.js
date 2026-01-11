/**
 * CalculationService - Business logic calculations
 * Pure functions for rewards, refunds, averages, and analytics
 * @module services/CalculationService
 */

import { logger } from '../utils/logger.js';
import { DataValidationError } from '../utils/errors.js';
import { CONSTANTS } from '../utils/constants.js';

const log = logger.createChild('CalculationService');

/**
 * Service for business logic calculations
 * All methods are pure functions with no side effects
 * 
 * @class CalculationService
 */
export class CalculationService {
  constructor() {
    log.info('CalculationService initialized');
  }

  /**
   * Calculate Executive Membership rewards based on subtotal
   * @param {number} subtotal - Total eligible spending (excludes gas, taxes)
   * @param {number} [rewardsRate=0.02] - Rewards rate (default 2%)
   * @param {number} [maxReward=1000] - Maximum annual reward
   * @returns {number} Calculated rewards amount
   * @throws {DataValidationError} If parameters are invalid
   * 
   * @example
   * const rewards = calc.calculateRewards(50000); // Returns 1000 (capped)
   * const rewards = calc.calculateRewards(25000); // Returns 500
   */
  calculateRewards(subtotal, rewardsRate = CONSTANTS.BUSINESS.REWARDS_RATE, maxReward = CONSTANTS.BUSINESS.MAX_REWARD) {
    if (typeof subtotal !== 'number' || subtotal < 0) {
      throw new DataValidationError('Subtotal must be a non-negative number', { subtotal });
    }

    const reward = subtotal * rewardsRate;
    const capped = Math.min(reward, maxReward);
    
    log.debug('Rewards calculated', { subtotal, reward, capped });
    return capped;
  }

  /**
   * Calculate refund rate (refunded amount / total spent)
   * @param {number} totalSpent - Total amount spent
   * @param {number} totalRefunded - Total amount refunded
   * @returns {number} Refund rate as percentage (0-100)
   * @throws {DataValidationError} If parameters are invalid
   * 
   * @example
   * const rate = calc.calculateRefundRate(10000, 500); // Returns 5.0
   */
  calculateRefundRate(totalSpent, totalRefunded) {
    if (typeof totalSpent !== 'number' || totalSpent < 0) {
      throw new DataValidationError('Total spent must be a non-negative number', { totalSpent });
    }
    if (typeof totalRefunded !== 'number' || totalRefunded < 0) {
      throw new DataValidationError('Total refunded must be a non-negative number', { totalRefunded });
    }

    if (totalSpent === 0) {
      return 0;
    }

    return (totalRefunded / totalSpent) * 100;
  }

  /**
   * Calculate average transaction value
   * @param {number} totalSpent - Total amount spent
   * @param {number} transactionCount - Number of transactions
   * @returns {number} Average transaction value
   * @throws {DataValidationError} If parameters are invalid
   * 
   * @example
   * const avg = calc.calculateAverageTransaction(5000, 20); // Returns 250
   */
  calculateAverageTransaction(totalSpent, transactionCount) {
    if (typeof totalSpent !== 'number' || totalSpent < 0) {
      throw new DataValidationError('Total spent must be a non-negative number', { totalSpent });
    }
    if (typeof transactionCount !== 'number' || transactionCount < 0) {
      throw new DataValidationError('Transaction count must be a non-negative number', { transactionCount });
    }

    if (transactionCount === 0) {
      return 0;
    }

    return totalSpent / transactionCount;
  }

  /**
   * Calculate average purchase amount (alias for calculateAverageTransaction)
   * @param {number} totalSpent - Total amount spent
   * @param {number} purchaseCount - Number of purchases
   * @returns {number} Average purchase value
   * @throws {DataValidationError} If parameters are invalid
   */
  calculateAveragePurchase(totalSpent, purchaseCount) {
    return this.calculateAverageTransaction(totalSpent, purchaseCount);
  }

  /**
   * Calculate average item price
   * @param {number} totalSpent - Total amount spent
   * @param {number} itemCount - Total number of items
   * @returns {number} Average item price
   * @throws {DataValidationError} If parameters are invalid
   */
  calculateAverageItemPrice(totalSpent, itemCount) {
    if (typeof totalSpent !== 'number' || totalSpent < 0) {
      throw new DataValidationError('Total spent must be a non-negative number', { totalSpent });
    }
    if (typeof itemCount !== 'number' || itemCount < 0) {
      throw new DataValidationError('Item count must be a non-negative number', { itemCount });
    }

    if (itemCount === 0) {
      return 0;
    }

    return totalSpent / itemCount;
  }

  /**
   * Calculate gas efficiency metrics
   * @param {Array<Object>|Object} transactionsOrParams - Array of transactions OR object with {totalSpent, totalGallons}
   * @returns {Object} Gas metrics
   * @throws {DataValidationError} If parameters are invalid
   * 
   * @example
   * // With transactions array
   * const metrics = calc.calculateGasMetrics([{totalPrice: 50}, {totalPrice: 60}]);
   * // With explicit params
   * const metrics = calc.calculateGasMetrics({totalSpent: 500, totalGallons: 125});
   */
  calculateGasMetrics(transactionsOrParams) {
    // Handle array of transactions
    if (Array.isArray(transactionsOrParams)) {
      const transactions = transactionsOrParams;
      const totalSpent = transactions.reduce((sum, t) => sum + (t.totalPrice || 0), 0);
      const totalGallons = transactions.reduce((sum, t) => sum + (t.gallons || 0), 0);
      const avgPricePerGallon = totalGallons > 0 ? totalSpent / totalGallons : 0;

      return {
        totalSpent,
        averageFillUp: transactions.length > 0 ? totalSpent / transactions.length : 0,
        transactionCount: transactions.length,
        avgPricePerGallon,
        totalGallons
      };
    }
    
    // Handle explicit parameters (backward compatibility)
    if (typeof transactionsOrParams === 'object' && transactionsOrParams !== null) {
      const { totalSpent, totalGallons } = transactionsOrParams;
      
      if (typeof totalSpent !== 'number' || totalSpent < 0) {
        throw new DataValidationError('Total spent must be a non-negative number', { totalSpent });
      }
      if (typeof totalGallons !== 'number' || totalGallons < 0) {
        throw new DataValidationError('Total gallons must be a non-negative number', { totalGallons });
      }

      const avgPricePerGallon = totalGallons > 0 ? totalSpent / totalGallons : 0;

      return {
        avgPricePerGallon,
        totalSpent,
        totalGallons
      };
    }
    
    throw new DataValidationError('Invalid parameters for calculateGasMetrics', { transactionsOrParams });
  }

  /**
   * Calculate monthly spending average
   * @param {Object} monthlySpend - Map of month keys to spending amounts
   * @returns {number} Average monthly spending
   * @throws {DataValidationError} If monthlySpend is invalid
   * 
   * @example
   * const avg = calc.calculateMonthlyAverage({
   *   '2023-01': 500,
   *   '2023-02': 600,
   *   '2023-03': 550
   * }); // Returns 550
   */
  calculateMonthlyAverage(monthlySpend) {
    if (!monthlySpend || typeof monthlySpend !== 'object') {
      throw new DataValidationError('Monthly spend must be an object', { monthlySpend });
    }

    const values = Object.values(monthlySpend);
    if (values.length === 0) {
      return 0;
    }

    const total = values.reduce((sum, val) => sum + val, 0);
    return total / values.length;
  }

  /**
   * Identify return vs price adjustment
   * Distinguishes between full item returns and price corrections
   * 
   * @param {Object} item - Item with negative amount
   * @param {Array<Object>} purchaseHistory - Previous purchases of this item
   * @returns {Object} Classification { isReturn, matchedPurchase }
   * 
   * @example
   * const result = calc.classifyRefundType(
   *   { amount: -25, unit: -1 },
   *   [{ price: 25.00, date: new Date('2023-01-15') }]
   * );
   * // Returns { isReturn: true, matchedPurchase: {...} }
   */
  classifyRefundType(item, purchaseHistory = []) {
    if (!item || typeof item !== 'object') {
      throw new DataValidationError('Item must be an object', { item });
    }

    if (!Array.isArray(purchaseHistory)) {
      throw new DataValidationError('Purchase history must be an array', { purchaseHistory });
    }

    const totalPrice = item.totalPrice || item.amount || 0;
    const quantity = item.quantity || item.unit || 0;
    const unitPrice = item.unitPrice || 0;

    // Not a refund if amount is positive
    if (totalPrice >= 0) {
      return null;
    }

    const absAmount = Math.abs(totalPrice);

    // If quantity is not negative, this is a price adjustment, not a return
    if (quantity >= 0) {
      return {
        type: 'PRICE_ADJUSTMENT',
        amount: absAmount,
        matchedPurchase: false
      };
    }

    // Unit is negative - this is likely a return
    // Try to match with a previous purchase
    let matchedPurchase = false;
    
    if (purchaseHistory.length > 0) {
      const productName = item.productName;
      const match = purchaseHistory.find(p => 
        p.productName === productName && Math.abs(p.unitPrice - unitPrice) < 0.02
      );
      matchedPurchase = !!match;
    }

    return {
      type: 'FULL_RETURN',
      amount: absAmount,
      matchedPurchase
    };
  }

  /**
   * Calculate days between purchase and return
   * @param {Date} purchaseDate - Purchase date
   * @param {Date} returnDate - Return date
   * @returns {number|null} Days kept, or null if dates invalid
   * 
   * @example
   * const days = calc.calculateDaysKept(
   *   new Date('2023-01-15'),
   *   new Date('2023-02-20')
   * ); // Returns 36
   */
  calculateDaysKept(purchaseDate, returnDate) {
    if (!(purchaseDate instanceof Date) || isNaN(purchaseDate.getTime())) {
      return null;
    }
    if (!(returnDate instanceof Date) || isNaN(returnDate.getTime())) {
      return null;
    }

    const diffMs = returnDate - purchaseDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    return Math.round(diffDays);
  }

  /**
   * Aggregate spending by category
   * @param {Array<Object>} items - Array of items with category and amount
   * @returns {Object} Map of category to total spending
   * @throws {DataValidationError} If items is not an array
   * 
   * @example
   * const spending = calc.aggregateByCategory([
   *   { category: 'Food', amount: 100 },
   *   { category: 'Food', amount: 50 },
   *   { category: 'Gas', amount: 75 }
   * ]);
   * // Returns { Food: 150, Gas: 75 }
   */
  aggregateByCategory(items) {
    if (!Array.isArray(items)) {
      throw new DataValidationError('Items must be an array', { items });
    }

    const aggregated = {};

    items.forEach(item => {
      const category = item.category || 'Other';
      const amount = item.amount || 0;

      if (!aggregated[category]) {
        aggregated[category] = 0;
      }

      aggregated[category] += amount;
    });

    return aggregated;
  }

  /**
   * Calculate year-over-year growth
   * @param {Object} yearlyData - Map of year to amount
   * @param {string} currentYear - Current year to compare
   * @param {string} previousYear - Previous year to compare against
   * @returns {Object} Growth metrics { growth, growthPercent, current, previous }
   * @throws {DataValidationError} If parameters are invalid
   * 
   * @example
   * const growth = calc.calculateYearOverYearGrowth(
   *   { '2022': 5000, '2023': 6000 },
   *   '2023',
   *   '2022'
   * );
   * // Returns { growth: 1000, growthPercent: 20, current: 6000, previous: 5000 }
   */
  calculateYearOverYearGrowth(yearlyData, currentYear, previousYear) {
    if (!yearlyData || typeof yearlyData !== 'object') {
      throw new DataValidationError('Yearly data must be an object', { yearlyData });
    }

    const current = yearlyData[currentYear] || 0;
    const previous = yearlyData[previousYear] || 0;

    if (previous === 0) {
      return {
        growth: current,
        growthPercent: current > 0 ? 100 : 0,
        current,
        previous
      };
    }

    const growth = current - previous;
    const growthPercent = (growth / previous) * 100;

    return {
      growth,
      growthPercent,
      current,
      previous
    };
  }

  /**
   * Calculate discount effectiveness
   * @param {number} regularPrice - Regular price without discount
   * @param {number} discountedPrice - Price after discount
   * @returns {Object} Discount metrics { saved, percentOff }
   * @throws {DataValidationError} If parameters are invalid
   * 
   * @example
   * const discount = calc.calculateDiscountEffectiveness(100, 75);
   * // Returns { saved: 25, percentOff: 25 }
   */
  calculateDiscountEffectiveness(regularPrice, discountedPrice) {
    if (typeof regularPrice !== 'number' || regularPrice < 0) {
      throw new DataValidationError('Regular price must be a non-negative number', { regularPrice });
    }
    if (typeof discountedPrice !== 'number' || discountedPrice < 0) {
      throw new DataValidationError('Discounted price must be a non-negative number', { discountedPrice });
    }

    if (regularPrice === 0) {
      return { saved: 0, percentOff: 0 };
    }

    const saved = regularPrice - discountedPrice;
    const percentOff = (saved / regularPrice) * 100;

    return {
      saved,
      percentOff
    };
  }

  /**
   * Calculate percentile of a value in a dataset
   * @param {number} value - Value to find percentile for
   * @param {Array<number>} dataset - Array of numbers
   * @returns {number} Percentile (0-100)
   * @throws {DataValidationError} If parameters are invalid
   * 
   * @example
   * const percentile = calc.calculatePercentile(75, [50, 60, 70, 80, 90, 100]);
   * // Returns ~50 (75 is at the 50th percentile)
   */
  calculatePercentile(value, dataset) {
    if (typeof value !== 'number') {
      throw new DataValidationError('Value must be a number', { value });
    }
    if (!Array.isArray(dataset) || dataset.length === 0) {
      throw new DataValidationError('Dataset must be a non-empty array', { dataset });
    }

    const sorted = [...dataset].sort((a, b) => a - b);
    const belowCount = sorted.filter(v => v < value).length;
    
    return (belowCount / sorted.length) * 100;
  }

  /**
   * Calculate standard deviation
   * @param {Array<number>} values - Array of numbers
   * @returns {Object} Statistics { mean, stdDev, variance }
   * @throws {DataValidationError} If values is invalid
   * 
   * @example
   * const stats = calc.calculateStandardDeviation([10, 20, 30, 40, 50]);
   * // Returns { mean: 30, stdDev: ~14.14, variance: 200 }
   */
  calculateStandardDeviation(values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new DataValidationError('Values must be a non-empty array', { values });
    }

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean,
      stdDev,
      variance
    };
  }
}

/**
 * Create a singleton instance of CalculationService
 * @returns {CalculationService} Shared calculation service instance
 */
let _instance = null;

export function getCalculationService() {
  if (!_instance) {
    _instance = new CalculationService();
  }
  return _instance;
}
