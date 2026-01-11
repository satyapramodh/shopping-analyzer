/**
 * Unit tests for memoize utility
 * @module tests/utils/memoize
 */

import { describe, it, expect, beforeEach } from '../setup.js';
import { memoize, memoizeWithTTL, memoizeLRU } from '../../src/utils/memoize.js';

describe('Memoize', () => {

  describe('memoize', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const fn = (a, b) => {
        callCount++;
        return a + b;
      };

      const memoized = memoize(fn);
      
      expect(memoized(1, 2)).to.equal(3);
      expect(memoized(1, 2)).to.equal(3);
      expect(callCount).to.equal(1); // Called only once
    });

    it('should cache different argument combinations separately', () => {
      let callCount = 0;
      const fn = (a, b) => {
        callCount++;
        return a * b;
      };

      const memoized = memoize(fn);
      
      expect(memoized(2, 3)).to.equal(6);
      expect(memoized(3, 4)).to.equal(12);
      expect(memoized(2, 3)).to.equal(6);
      expect(callCount).to.equal(2);
    });

    it('should support custom cache key resolver', () => {
      let callCount = 0;
      const fn = (obj) => {
        callCount++;
        return obj.id;
      };

      const memoized = memoize(fn, (obj) => obj.id);
      
      memoized({ id: 1, name: 'A' });
      memoized({ id: 1, name: 'B' }); // Different object, same id
      
      expect(callCount).to.equal(1);
    });

    it('should have clear method', () => {
      const fn = (x) => x * 2;
      const memoized = memoize(fn);
      
      memoized(5);
      expect(memoized.size()).to.equal(1);
      
      memoized.clear();
      expect(memoized.size()).to.equal(0);
    });

    it('should have delete method', () => {
      const fn = (x) => x * 2;
      const memoized = memoize(fn);
      
      memoized(5);
      memoized(10);
      expect(memoized.size()).to.equal(2);
      
      memoized.delete(5);
      expect(memoized.size()).to.equal(1);
    });

    it('should have has method', () => {
      const fn = (x) => x * 2;
      const memoized = memoize(fn);
      
      memoized(5);
      expect(memoized.has(5)).to.be.true;
      expect(memoized.has(10)).to.be.false;
    });
  });

  describe('memoizeWithTTL', () => {
    it('should cache results with time-to-live', (done) => {
      let callCount = 0;
      const fn = () => {
        callCount++;
        return Date.now();
      };

      const memoized = memoizeWithTTL(fn, 100); // 100ms TTL
      
      const first = memoized();
      const second = memoized();
      expect(first).to.equal(second);
      expect(callCount).to.equal(1);

      setTimeout(() => {
        const third = memoized(); // Should recalculate
        expect(third).to.not.equal(first);
        expect(callCount).to.equal(2);
        done();
      }, 150);
    });

    it('should throw TypeError for invalid ttl', () => {
      const fn = () => 42;
      expect(() => memoizeWithTTL(fn, -1)).to.throw(TypeError);
      expect(() => memoizeWithTTL(fn, 'invalid')).to.throw(TypeError);
    });
  });

  describe('memoizeLRU', () => {
    it('should evict oldest entry when at capacity', () => {
      const fn = (x) => x * 2;
      const memoized = memoizeLRU(fn, 3); // Max 3 entries
      
      memoized(1);
      memoized(2);
      memoized(3);
      expect(memoized.size()).to.equal(3);
      
      memoized(4); // Should evict entry for 1
      expect(memoized.size()).to.equal(3);
      
      // Access to 1 should recalculate
      let callCount = 0;
      const countingFn = (x) => {
        callCount++;
        return x * 2;
      };
      const countingMemoized = memoizeLRU(countingFn, 2);
      
      countingMemoized(1);
      countingMemoized(2);
      countingMemoized(1); // Move to end (recently used)
      countingMemoized(3); // Should evict 2, not 1
      
      expect(countingMemoized.has(1)).to.be.true;
    });

    it('should throw TypeError for invalid maxSize', () => {
      const fn = () => 42;
      expect(() => memoizeLRU(fn, 0)).to.throw(TypeError);
      expect(() => memoizeLRU(fn, -1)).to.throw(TypeError);
    });
  });

});
