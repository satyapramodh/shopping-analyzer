/**
 * Integration tests for data flow
 * Tests end-to-end data processing through the application
 * @module tests/integration/data-flow
 */

import { describe, it, expect, beforeEach } from '../setup.js';
import { StateManager } from '../../src/core/StateManager.js';
import { CalculationService } from '../../src/services/CalculationService.js';
import { FilterService, YearFilter, LocationFilter } from '../../src/services/FilterService.js';
import { formatMoney, formatPercent } from '../../src/utils/formatters.js';

describe('Integration: Data Flow', () => {

  let stateManager;
  let calcService;
  let filterService;

  beforeEach(() => {
    stateManager = new StateManager();
    calcService = new CalculationService();
    filterService = new FilterService();
  });

  afterEach(() => {
    stateManager.clear();
  });

  describe('Data processing pipeline', () => {
    it('should filter, calculate, and format data', () => {
      // Sample data
      const transactions = [
        { date: '2024-01-15', location: '123', amount: 100 },
        { date: '2024-02-20', location: '456', amount: 200 },
        { date: '2024-03-10', location: '123', amount: 150 },
        { date: '2023-12-31', location: '123', amount: 50 }
      ];

      // Filter by year and location
      const pipeline = filterService.createPipeline();
      pipeline.addFilter(new YearFilter(2024));
      pipeline.addFilter(new LocationFilter('123'));

      const filtered = pipeline.apply(transactions);
      expect(filtered).to.have.lengthOf(2);

      // Calculate total
      const total = filtered.reduce((sum, t) => sum + t.amount, 0);
      expect(total).to.equal(250);

      // Calculate rewards
      const rewards = calcService.calculateRewards(total);
      expect(rewards).to.equal(5); // 2% of 250

      // Format for display
      const formattedTotal = formatMoney(total);
      const formattedRewards = formatMoney(rewards);

      expect(formattedTotal).to.equal('$250.00');
      expect(formattedRewards).to.equal('$5.00');
    });
  });

  describe('State management integration', () => {
    it('should manage data through state', (done) => {
      // Store raw data
      const rawData = [
        { id: 1, value: 100 },
        { id: 2, value: 200 }
      ];

      stateManager.set('rawData', rawData);

      // Subscribe to processed data
      stateManager.subscribe('processedData', (newValue) => {
        expect(newValue).to.be.an('array');
        expect(newValue).to.have.lengthOf(2);
        expect(newValue[0].formatted).to.equal('$100.00');
        done();
      });

      // Process data
      const processed = rawData.map(item => ({
        ...item,
        formatted: formatMoney(item.value)
      }));

      stateManager.set('processedData', processed);
    });

    it('should handle data updates reactively', () => {
      let updateCount = 0;

      stateManager.subscribe('total', () => {
        updateCount++;
      });

      // Initial value
      stateManager.set('total', 100);
      expect(updateCount).to.equal(1);

      // Update
      stateManager.update('total', (current) => current + 50);
      expect(updateCount).to.equal(2);
      expect(stateManager.get('total')).to.equal(150);
    });
  });

  describe('Calculation chain', () => {
    it('should chain calculations correctly', () => {
      const purchases = [
        { amount: 1000 },
        { amount: 2000 },
        { amount: 3000 }
      ];

      // Calculate totals
      const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);
      expect(totalSpent).to.equal(6000);

      // Calculate rewards
      const rewards = calcService.calculateRewards(totalSpent);
      expect(rewards).to.equal(120); // 2% of 6000

      // Calculate average purchase
      const average = calcService.calculateAveragePurchase(totalSpent, purchases.length);
      expect(average).to.equal(2000);

      // Store in state
      stateManager.set('analytics', {
        totalSpent,
        rewards,
        average,
        rewardsPercent: formatPercent(rewards / totalSpent)
      });

      const analytics = stateManager.get('analytics');
      expect(analytics.rewardsPercent).to.equal('2%');
    });
  });

  describe('Error handling in pipeline', () => {
    it('should handle invalid data gracefully', () => {
      // Attempt calculation with invalid data
      expect(() => {
        calcService.calculateRewards(-100);
      }).to.throw();

      // Verify state remains consistent
      stateManager.set('total', 100);
      
      try {
        calcService.calculateRewards(-100);
      } catch (error) {
        // State should be unchanged
        expect(stateManager.get('total')).to.equal(100);
      }
    });

    it('should validate data before processing', () => {
      const invalidData = [
        { amount: 'invalid' },
        { amount: null },
        { amount: undefined }
      ];

      // Filter out invalid items
      const valid = invalidData.filter(item => 
        typeof item.amount === 'number' && !isNaN(item.amount)
      );

      expect(valid).to.have.lengthOf(0);
    });
  });

  describe('Real-world scenario: Purchase analysis', () => {
    it('should analyze purchases with refunds', () => {
      const purchases = [
        { date: '2024-01-15', amount: 100, type: 'purchase' },
        { date: '2024-02-01', amount: 200, type: 'purchase' },
        { date: '2024-02-15', amount: -50, type: 'refund' },
        { date: '2024-03-01', amount: 150, type: 'purchase' }
      ];

      // Separate purchases and refunds
      const purchaseTotal = purchases
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const refundTotal = Math.abs(purchases
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + t.amount, 0));

      expect(purchaseTotal).to.equal(450);
      expect(refundTotal).to.equal(50);

      // Calculate net and refund rate
      const netSpent = purchaseTotal - refundTotal;
      const refundRate = calcService.calculateRefundRate(purchaseTotal, refundTotal);

      expect(netSpent).to.equal(400);
      expect(refundRate).to.be.closeTo(11.11, 0.01);

      // Calculate rewards on net
      const rewards = calcService.calculateRewards(netSpent);
      expect(rewards).to.equal(8); // 2% of 400
    });
  });

});
