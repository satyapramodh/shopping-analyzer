/**
 * Unit tests for formatters utility
 * @module tests/utils/formatters
 */

import { describe, it, expect } from '../setup.js';
import { 
  formatMoney, 
  formatDate, 
  formatYearMonth,
  formatPercent,
  formatNumber,
  formatRelativeTime,
  normalizeLocation,
  truncateText
} from '../../src/utils/formatters.js';

describe('Formatters', () => {
  
  describe('formatMoney', () => {
    it('should format positive amounts correctly', () => {
      expect(formatMoney(1234.56)).to.equal('$1,234.56');
      expect(formatMoney(0)).to.equal('$0.00');
      expect(formatMoney(999999.99)).to.equal('$999,999.99');
    });

    it('should format negative amounts correctly', () => {
      expect(formatMoney(-50.25)).to.equal('-$50.25');
      expect(formatMoney(-1234.56)).to.equal('-$1,234.56');
    });

    it('should handle edge cases', () => {
      expect(formatMoney(0.01)).to.equal('$0.01');
      expect(formatMoney(0.001)).to.equal('$0.00');
    });

    it('should throw TypeError for invalid input', () => {
      expect(() => formatMoney('invalid')).to.throw(TypeError);
      expect(() => formatMoney(null)).to.throw(TypeError);
      expect(() => formatMoney(undefined)).to.throw(TypeError);
    });
  });

  describe('formatDate', () => {
    it('should format Date objects correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      const formatted = formatDate(date);
      expect(formatted).to.match(/1\/15\/2024/);
    });

    it('should format date strings correctly', () => {
      const formatted = formatDate('2024-12-25');
      expect(formatted).to.match(/12\/25\/2024/);
    });

    it('should format timestamps correctly', () => {
      const timestamp = new Date('2024-06-30').getTime();
      const formatted = formatDate(timestamp);
      expect(formatted).to.match(/6\/30\/2024/);
    });

    it('should throw TypeError for invalid input', () => {
      expect(() => formatDate('invalid')).to.throw(TypeError);
      expect(() => formatDate(null)).to.throw(TypeError);
    });
  });

  describe('formatYearMonth', () => {
    it('should format Date objects as YYYY-MM', () => {
      const date = new Date('2024-03-15');
      expect(formatYearMonth(date)).to.equal('2024-03');
    });

    it('should format date strings as YYYY-MM', () => {
      expect(formatYearMonth('2024-12-25')).to.equal('2024-12');
    });

    it('should handle single-digit months correctly', () => {
      expect(formatYearMonth('2024-01-15')).to.equal('2024-01');
    });
  });

  describe('formatPercent', () => {
    it('should format decimal percentages correctly', () => {
      expect(formatPercent(0.1234)).to.equal('12.34%');
      expect(formatPercent(0.5)).to.equal('50%');
      expect(formatPercent(1)).to.equal('100%');
    });

    it('should format with custom decimal places', () => {
      expect(formatPercent(0.12345, 3)).to.equal('12.345%');
      expect(formatPercent(0.5, 0)).to.equal('50%');
    });

    it('should handle negative percentages', () => {
      expect(formatPercent(-0.25)).to.equal('-25%');
    });

    it('should throw TypeError for invalid input', () => {
      expect(() => formatPercent('invalid')).to.throw(TypeError);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1234567)).to.equal('1,234,567');
      expect(formatNumber(1000)).to.equal('1,000');
    });

    it('should format decimals correctly', () => {
      expect(formatNumber(1234.56, 2)).to.equal('1,234.56');
      expect(formatNumber(999.999, 1)).to.equal('1,000');
    });

    it('should handle zero and negative numbers', () => {
      expect(formatNumber(0)).to.equal('0');
      expect(formatNumber(-5000)).to.equal('-5,000');
    });
  });

  describe('normalizeLocation', () => {
    it('should normalize standard warehouse format', () => {
      expect(normalizeLocation('Warehouse 123 - City Name')).to.equal('123');
    });

    it('should normalize numeric strings', () => {
      expect(normalizeLocation('456')).to.equal('456');
    });

    it('should handle missing or invalid input', () => {
      expect(normalizeLocation(null)).to.equal('Unknown');
      expect(normalizeLocation(undefined)).to.equal('Unknown');
      expect(normalizeLocation('')).to.equal('Unknown');
    });

    it('should extract warehouse number from various formats', () => {
      expect(normalizeLocation('WH 789')).to.equal('789');
      expect(normalizeLocation('Location #321')).to.equal('321');
    });
  });

  describe('truncateText', () => {
    it('should truncate long text correctly', () => {
      const long = 'This is a very long text that needs truncation';
      expect(truncateText(long, 20)).to.equal('This is a very long...');
    });

    it('should not truncate short text', () => {
      const short = 'Short text';
      expect(truncateText(short, 20)).to.equal('Short text');
    });

    it('should handle custom suffix', () => {
      const text = 'Long text here';
      expect(truncateText(text, 10, '...')).to.equal('Long text ...');
    });

    it('should throw TypeError for invalid input', () => {
      expect(() => truncateText(123, 10)).to.throw(TypeError);
      expect(() => truncateText(null, 10)).to.throw(TypeError);
    });
  });

});
