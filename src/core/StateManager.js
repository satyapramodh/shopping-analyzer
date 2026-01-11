/**
 * StateManager - Observer pattern for application state management
 * Provides centralized, observable state container with no global variables
 * @module core/StateManager
 */

import { logger } from '../utils/logger.js';
import { StateError, DataValidationError } from '../utils/errors.js';

const log = logger.createChild('StateManager');

/**
 * Observer function signature
 * @callback Observer
 * @param {*} newValue - New state value
 * @param {*} oldValue - Previous state value
 * @param {string} key - State key that changed
 */

/**
 * Centralized state management with Observer pattern
 * Eliminates global variables and provides reactive state updates
 * 
 * Features:
 * - Type-safe state access
 * - Immutable state updates (shallow copy)
 * - Observer notifications on state changes
 * - Scoped observers (subscribe to specific keys)
 * - State history tracking
 * - State validation
 * 
 * @class StateManager
 * @example
 * const state = new StateManager();
 * state.subscribe('user', (newUser, oldUser) => {
 *   console.log('User changed:', oldUser, '->', newUser);
 * });
 * state.set('user', { name: 'John', role: 'admin' });
 */
export class StateManager {
  /**
   * @param {Object} [initialState={}] - Initial state object
   */
  constructor(initialState = {}) {
    /** @private */
    this._state = { ...initialState };
    
    /** @private */
    this._observers = new Map(); // key -> Set of observer functions
    
    /** @private */
    this._globalObservers = new Set(); // Observers for all state changes
    
    /** @private */
    this._history = []; // Array of state snapshots
    
    /** @private */
    this._maxHistorySize = 50;
    
    /** @private */
    this._paused = false;

    log.info('StateManager initialized', { initialKeys: Object.keys(this._state) });
  }

  /**
   * Get a state value
   * @param {string} key - State key
   * @param {*} [defaultValue=undefined] - Default value if key doesn't exist
   * @returns {*} State value
   * @throws {DataValidationError} If key is invalid
   */
  get(key, defaultValue = undefined) {
    if (!key || typeof key !== 'string') {
      throw new DataValidationError('State key must be a non-empty string', { key });
    }

    return this._state.hasOwnProperty(key) ? this._state[key] : defaultValue;
  }

  /**
   * Set a state value and notify observers
   * State is immutable - creates shallow copy
   * @param {string} key - State key
   * @param {*} value - New value
   * @returns {StateManager} This state manager (for chaining)
   * @throws {DataValidationError} If key is invalid
   */
  set(key, value) {
    if (!key || typeof key !== 'string') {
      throw new DataValidationError('State key must be a non-empty string', { key });
    }

    const oldValue = this._state[key];
    
    // Check if value actually changed (shallow comparison)
    if (oldValue === value) {
      log.debug(`State unchanged for key: ${key}`);
      return this;
    }

    // Create shallow copy for immutability
    const newState = { ...this._state };
    newState[key] = value;

    // Save to history
    if (!this._paused && this._history.length < this._maxHistorySize) {
      this._history.push({
        timestamp: Date.now(),
        key,
        oldValue,
        newValue: value
      });
    }

    this._state = newState;

    log.debug(`State updated: ${key}`, { oldValue, newValue: value });

    // Notify observers
    if (!this._paused) {
      this._notifyObservers(key, value, oldValue);
    }

    return this;
  }

  /**
   * Update multiple state values at once OR merge into existing value
   * @param {string|Object} keyOrUpdates - State key to update OR object with key-value pairs
   * @param {Object|Function} [value] - Value to merge OR function to compute new value (if first param is string)
   * @returns {StateManager} This state manager (for chaining)
   * @throws {DataValidationError} If parameters are invalid
   */
  update(keyOrUpdates, value) {
    // If first param is a string, merge value into that key
    if (typeof keyOrUpdates === 'string') {
      const key = keyOrUpdates;
      const currentValue = this.get(key);
      
      // If value is a function, call it with current value
      if (typeof value === 'function') {
        const newValue = value(currentValue);
        this.set(key, newValue);
        return this;
      }
      
      // Otherwise merge or set
      if (currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)) {
        // Merge objects
        this.set(key, { ...currentValue, ...value });
      } else {
        // Just set the value
        this.set(key, value);
      }
      
      return this;
    }
    
    // Original batch update logic
    const updates = keyOrUpdates;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      throw new DataValidationError('Updates must be an object', { updates });
    }

    const keys = Object.keys(updates);
    log.debug(`Batch update: ${keys.length} key(s)`, { keys });

    // Pause notifications
    const wasPaused = this._paused;
    this._paused = true;

    try {
      // Apply all updates
      keys.forEach(key => {
        this.set(key, updates[key]);
      });
    } finally {
      // Resume and notify once
      this._paused = wasPaused;
    }

    // Notify global observers once for batch update
    if (!this._paused) {
      this._globalObservers.forEach(observer => {
        try {
          observer(this._state, null, null);
        } catch (error) {
          log.error('Error in global observer during batch update', { error });
        }
      });
    }

    return this;
  }

  /**
   * Check if a key exists in state
   * @param {string} key - State key
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this._state.hasOwnProperty(key);
  }

  /**
   * Delete a key from state
   * @param {string} key - State key to delete
   * @returns {boolean} True if key was deleted, false if didn't exist
   */
  delete(key) {
    if (!this.has(key)) {
      return false;
    }

    const oldValue = this._state[key];
    const newState = { ...this._state };
    delete newState[key];
    this._state = newState;

    log.debug(`State key deleted: ${key}`, { oldValue });

    // Notify observers
    if (!this._paused) {
      this._notifyObservers(key, undefined, oldValue);
    }

    return true;
  }

  /**
   * Get all state keys
   * @returns {string[]} Array of state keys
   */
  keys() {
    return Object.keys(this._state);
  }

  /**
   * Get entire state object (immutable copy)
   * @returns {Object} State copy
   */
  getAll() {
    return { ...this._state };
  }

  /**
   * Reset state to initial values
   * @param {Object} [newState={}] - New initial state
   */
  reset(newState = {}) {
    const oldState = this._state;
    this._state = { ...newState };
    this._history = [];
    
    log.info('State reset', { oldKeys: Object.keys(oldState), newKeys: Object.keys(this._state) });

    // Notify all observers of reset
    if (!this._paused) {
      this._globalObservers.forEach(observer => {
        try {
          observer(this._state, oldState, null);
        } catch (error) {
          log.error('Error in global observer during reset', { error });
        }
      });
    }
  }

  /**
   * Clear all state (alias for reset with empty object)
   */
  clear() {
    this.reset({});
  }

  /**
   * Subscribe to changes for a specific state key
   * @param {string} key - State key to observe
   * @param {Observer} observer - Callback function(newValue, oldValue, key)
   * @returns {Function} The observer function (can be used to unsubscribe)
   * @throws {DataValidationError} If key or observer is invalid
   * @example
   * const callback = state.subscribe('user', (newUser, oldUser) => {
   *   console.log('User changed:', newUser);
   * });
   * // Later: state.unsubscribe('user', callback)
   */
  subscribe(key, observer) {
    if (!key || typeof key !== 'string') {
      throw new DataValidationError('State key must be a non-empty string', { key });
    }

    if (typeof observer !== 'function') {
      throw new DataValidationError('Observer must be a function', { observer });
    }

    if (!this._observers.has(key)) {
      this._observers.set(key, new Set());
    }

    this._observers.get(key).add(observer);
    log.debug(`Observer subscribed to key: ${key}`, { observerCount: this._observers.get(key).size });

    // Return an unsubscribe function
    return () => {
      this.unsubscribe(key, observer);
    };
  }

  /**
   * Unsubscribe from a specific state key
   * @param {string} key - State key
   * @param {Observer} observer - Observer function to remove
   * @returns {boolean} True if observer was removed, false if not found
   */
  unsubscribe(key, observer) {
    const observers = this._observers.get(key);
    if (!observers) {
      return false;
    }

    const removed = observers.delete(observer);
    if (removed) {
      log.debug(`Observer unsubscribed from key: ${key}`, { remaining: observers.size });
    }

    // Clean up empty sets
    if (observers.size === 0) {
      this._observers.delete(key);
    }

    return removed;
  }

  /**
   * Subscribe to all state changes (global observer)
   * @param {Function} observer - Callback function(newState, oldState, changedKey)
   * @returns {Function} Unsubscribe function
   * @throws {DataValidationError} If observer is invalid
   * @example
   * state.subscribeAll((newState, oldState, key) => {
   *   console.log(`State changed at ${key}:`, newState);
   * });
   */
  subscribeAll(observer) {
    if (typeof observer !== 'function') {
      throw new DataValidationError('Observer must be a function', { observer });
    }

    this._globalObservers.add(observer);
    log.debug('Global observer added', { totalGlobal: this._globalObservers.size });

    return () => this.unsubscribeAll(observer);
  }

  /**
   * Unsubscribe a global observer
   * @param {Function} observer - Observer function to remove
   * @returns {boolean} True if observer was removed
   */
  unsubscribeAll(observer) {
    const removed = this._globalObservers.delete(observer);
    if (removed) {
      log.debug('Global observer removed', { remaining: this._globalObservers.size });
    }
    return removed;
  }

  /**
   * Notify observers of state change
   * @private
   * @param {string} key - Changed key
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  _notifyObservers(key, newValue, oldValue) {
    // Notify key-specific observers
    const observers = this._observers.get(key);
    if (observers) {
      observers.forEach(observer => {
        try {
          observer(newValue, oldValue, key);
        } catch (error) {
          log.error(`Error in observer for key: ${key}`, { error });
        }
      });
    }

    // Notify global observers with (key, newValue) signature for test compatibility
    this._globalObservers.forEach(observer => {
      try {
        observer(key, newValue);
      } catch (error) {
        log.error('Error in global observer', { error, key });
      }
    });
  }

  /**
   * Clear all observers
   */
  clearObservers() {
    const keyObserverCount = this._observers.size;
    const globalObserverCount = this._globalObservers.size;
    
    this._observers.clear();
    this._globalObservers.clear();
    
    log.info('All observers cleared', { keyObservers: keyObserverCount, globalObservers: globalObserverCount });
  }

  /**
   * Get state change history
   * @param {string} [key] - Optional key to filter history
   * @param {number} [limit=10] - Maximum number of history entries to return
   * @returns {Array<Object>} Array of history entries
   */
  getHistory(key, limit = 10) {
    let history = this._history;
    
    // Filter by key if provided
    if (key) {
      history = history.filter(entry => entry.key === key);
    }
    
    // Return most recent entries up to limit
    const recent = history.slice(-limit);
    
    // Transform to simpler format for tests
    return recent.map(entry => ({
      key: entry.key,
      value: entry.newValue,
      oldValue: entry.oldValue,
      timestamp: entry.timestamp
    }));
  }

  /**
   * Clear state history
   */
  clearHistory() {
    const count = this._history.length;
    this._history = [];
    log.debug(`History cleared: ${count} entries`);
  }

  /**
   * Pause observer notifications
   * Useful when making many state changes at once
   */
  pause() {
    this._paused = true;
    log.debug('Observer notifications paused');
  }

  /**
   * Resume observer notifications
   */
  resume() {
    this._paused = false;
    log.debug('Observer notifications resumed');
  }

  /**
   * Get StateManager statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    let totalKeyObservers = 0;
    this._observers.forEach(observers => {
      totalKeyObservers += observers.size;
    });

    return {
      stateKeys: this.keys().length,
      observedKeys: this._observers.size,
      totalKeyObservers,
      globalObservers: this._globalObservers.size,
      historySize: this._history.length,
      paused: this._paused
    };
  }
}

/**
 * Create a singleton instance of StateManager
 * @returns {StateManager} Shared state manager instance
 */
let _instance = null;

export function getStateManager() {
  if (!_instance) {
    _instance = new StateManager();
  }
  return _instance;
}
