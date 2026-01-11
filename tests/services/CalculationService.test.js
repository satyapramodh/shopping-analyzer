/**
 * Unit tests for CalculationService
 * @module tests/services/CalculationService
 */

import { describe, it, expect, beforeEach } from '../setup.js';
import { CalculationService } from '../../src/services/CalculationService.js';

describe('CalculationService', () => {
  let service;

  beforeEach(() => {
    service = new CalculationService();
  });

  describe('calculateRewards', () => {
    it('should calculate rewards at 2% rate', () => {
      expect(service.calculateRewards(10000)).to.equal(200);
      expect(service.calculateRewards(25000)).to.equal(500);
    });

    it('should cap rewards at $1000', () => {
      expect(service.calculateRewards(50000)).to.equal(1000);
      expect(service.calculateRewards(100000)).to.equal(1000);
    });

    it('should handle zero and small amounts', () => {
      expect(service.calculateRewards(0)).to.equal(0);
      expect(service.calculateRewards(100)).to.equal(2);
    });

    it('should throw DataValidationError for invalid input', () => {
      expect(() => service.calculateRewards(-100)).to.throw();
      expect(() => service.calculateRewards('invalid')).to.throw();
    });

    it('should support custom rewards rate', () => {
      expect(service.calculateRewards(10000, 0.03)).to.equal(300);
    });

    it('should support custom max reward', () => {
      expect(service.calculateRewards(100000, 0.02, 500)).to.equal(500);
    });
  });

  describe('calculateRefundRate', () => {
    it('should calculate refund percentage', () => {
      expect(service.calculateRefundRate(10000, 500)).to.equal(5);
      expect(service.calculateRefundRate(5000, 1000)).to.equal(20);
    });

    it('should handle zero refunds', () => {
      expect(service.calculateRefundRate(10000, 0)).to.equal(0);
    });

    it('should handle zero spent', () => {
      expect(service.calculateRefundRate(0, 0)).to.equal(0);
    });

    it('should throw error for negative values', () => {
      expect(() => service.calculateRefundRate(-1000, 500)).to.throw();
      expect(() => service.calculateRefundRate(1000, -500)).to.throw();
    });
  });

  describe('calculateAveragePurchase', () => {
    it('should calculate average correctly', () => {
      expect(service.calculateAveragePurchase(10000, 50)).to.equal(200);
      expect(service.calculateAveragePurchase(5000, 25)).to.equal(200);
    });

    it('should handle single transaction', () => {
      expect(service.calculateAveragePurchase(150, 1)).to.equal(150);
    });

    it('should return 0 for zero transactions', () => {
      expect(service.calculateAveragePurchase(1000, 0)).to.equal(0);
    });

    it('should throw error for negative values', () => {
      expect(() => service.calculateAveragePurchase(-1000, 10)).to.throw();
      expect(() => service.calculateAveragePurchase(1000, -10)).to.throw();
    });
  });

  describe('classifyRefundType', () => {
    it('should classify full returns (negative quantity)', () => {
      const result = service.classifyRefundType({
        unitPrice: 50,
        totalPrice: -50,
        quantity: -1
      }, []);
      
      expect(result.type).to.equal('FULL_RETURN');
      expect(result.amount).to.equal(50);
    });

    it('should classify price adjustments (positive quantity)', () => {
      const result = service.classifyRefundType({
        unitPrice: 50,
        totalPrice: -10,
        quantity: 1
      }, []);
      
      expect(result.type).to.equal('PRICE_ADJUSTMENT');
      expect(result.amount).to.equal(10);
    });

    it('should match with purchase history', () => {
      const refund = {
        productName: 'Widget',
        unitPrice: 50,
        totalPrice: -50,
        quantity: -1
      };

      const history = [{
        productName: 'Widget',
        unitPrice: 50,
        quantity: 1
      }];

      const result = service.classifyRefundType(refund, history);
      expect(result.matchedPurchase).to.be.true;
    });
  });

  describe('calculateGasMetrics', () => {
    it('should calculate gas statistics', () => {
      const transactions = [
        { totalPrice: 50, date: '2024-01-01' },
        { totalPrice: 60, date: '2024-01-15' },
        { totalPrice: 55, date: '2024-01-30' }
      ];

      const result = service.calculateGasMetrics(transactions);
      
      expect(result.totalSpent).to.equal(165);
      expect(result.averageFillUp).to.equal(55);
      expect(result.transactionCount).to.equal(3);
    });

    it('should handle empty transactions', () => {
      const result = service.calculateGasMetrics([]);
      
      expect(result.totalSpent).to.equal(0);
      expect(result.averageFillUp).to.equal(0);
      expect(result.transactionCount).to.equal(0);
    });
  });

  describe('calculateDiscountEffectiveness', () => {
    it('should calculate discount savings', () => {
      const result = service.calculateDiscountEffectiveness(100, 75);
      
      expect(result.saved).to.equal(25);
      expect(result.percentOff).to.equal(25);
    });

    it('should handle no discount', () => {
      const result = service.calculateDiscountEffectiveness(50, 50);
      
      expect(result.saved).to.equal(0);
      expect(result.percentOff).to.equal(0);
    });

    it('should handle zero regular price', () => {
      const result = service.calculateDiscountEffectiveness(0, 0);
      
      expect(result.saved).to.equal(0);
      expect(result.percentOff).to.equal(0);
    });
  });

  describe('calculateStandardDeviation', () => {
    it('should calculate statistics correctly', () => {
      const values = [10, 20, 30, 40, 50];
      const result = service.calculateStandardDeviation(values);
      
      expect(result.mean).to.equal(30);
      expect(result.variance).to.equal(200);
      expect(result.stdDev).to.be.closeTo(14.14, 0.01);
    });

    it('should handle single value', () => {
      const result = service.calculateStandardDeviation([42]);
      
      expect(result.mean).to.equal(42);
      expect(result.variance).to.equal(0);
      expect(result.stdDev).to.equal(0);
    });

    it('should throw error for empty array', () => {
      expect(() => service.calculateStandardDeviation([])).to.throw();
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentile correctly', () => {
      const dataset = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      
      expect(service.calculatePercentile(50, dataset)).to.be.closeTo(40, 5);
      expect(service.calculatePercentile(100, dataset)).to.be.closeTo(90, 5);
      expect(service.calculatePercentile(10, dataset)).to.be.closeTo(0, 5);
    });

    it('should handle value below all data', () => {
      const dataset = [10, 20, 30];
      expect(service.calculatePercentile(5, dataset)).to.equal(0);
    });

    it('should handle value above all data', () => {
      const dataset = [10, 20, 30];
      expect(service.calculatePercentile(40, dataset)).to.equal(100);
    });

    it('should throw error for empty dataset', () => {
      expect(() => service.calculatePercentile(50, [])).to.throw();
    });
  });

});
