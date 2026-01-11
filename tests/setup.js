/**
 * Test Setup Module
 * Exports Mocha and Chai functions for use in ES6 module tests
 * @module tests/setup
 */

// Export Mocha BDD functions from global scope
export const describe = window.describe;
export const it = window.it;
export const before = window.before;
export const after = window.after;
export const beforeEach = window.beforeEach;
export const afterEach = window.afterEach;

// Export Chai assertion library
export const expect = window.expect;
export const assert = window.assert;
