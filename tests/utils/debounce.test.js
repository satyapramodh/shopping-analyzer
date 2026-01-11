/**
 * Unit tests for debounce utility
 * @module tests/utils/debounce
 */

import { describe, it, expect } from '../setup.js';
import { debounce } from '../../src/utils/debounce.js';

describe('Debounce', () => {

  it('should delay function execution', (done) => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debounced = debounce(fn, 50);

    debounced();
    expect(callCount).to.equal(0); // Not called immediately

    setTimeout(() => {
      expect(callCount).to.equal(1); // Called after delay
      done();
    }, 100);
  });

  it('should cancel previous calls on rapid invocation', (done) => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debounced = debounce(fn, 50);

    debounced();
    debounced();
    debounced();

    setTimeout(() => {
      expect(callCount).to.equal(1); // Only last call executed
      done();
    }, 100);
  });

  it('should pass arguments correctly', (done) => {
    let result = null;
    const fn = (a, b) => { result = a + b; };
    const debounced = debounce(fn, 50);

    debounced(5, 10);

    setTimeout(() => {
      expect(result).to.equal(15);
      done();
    }, 100);
  });

  it('should have cancel method', (done) => {
    let called = false;
    const fn = () => { called = true; };
    const debounced = debounce(fn, 50);

    debounced();
    debounced.cancel(); // Cancel pending call

    setTimeout(() => {
      expect(called).to.be.false; // Should not be called
      done();
    }, 100);
  });

  it('should have flush method', () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debounced = debounce(fn, 50);

    debounced();
    debounced.flush(); // Execute immediately

    expect(callCount).to.equal(1); // Called synchronously
  });

  it('should handle immediate option', () => {
    let callCount = 0;
    const fn = () => { callCount++; };
    const debounced = debounce(fn, 50, true); // Immediate execution

    debounced();
    expect(callCount).to.equal(1); // Called immediately

    debounced();
    expect(callCount).to.equal(1); // Subsequent calls debounced
  });

  it('should preserve this context', (done) => {
    const obj = {
      value: 42,
      method: debounce(function() {
        expect(this.value).to.equal(42);
        done();
      }, 50)
    };

    obj.method();
  });

  it('should throw TypeError for invalid function', () => {
    expect(() => debounce(null, 100)).to.throw(TypeError);
    expect(() => debounce('not a function', 100)).to.throw(TypeError);
  });

  it('should throw TypeError for invalid delay', () => {
    const fn = () => {};
    expect(() => debounce(fn, -1)).to.throw(TypeError);
    expect(() => debounce(fn, 'invalid')).to.throw(TypeError);
  });

});
