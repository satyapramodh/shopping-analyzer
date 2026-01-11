/**
 * Base Component class for tab components
 * Provides common functionality for all dashboard tabs
 * @module components/BaseComponent
 */

import { logger } from '../utils/logger.js';
import { getStateManager } from '../core/StateManager.js';
import { getChartService } from '../services/ChartService.js';
import { getTableService } from '../services/TableService.js';

const log = logger.createChild('BaseComponent');

/**
 * Abstract base class for dashboard tab components
 * Provides lifecycle methods and common utilities
 * 
 * @abstract
 * @class BaseComponent
 */
export class BaseComponent {
  /**
   * @param {string} name - Component name
   * @param {string} containerId - Container element ID
   */
  constructor(name, containerId) {
    if (new.target === BaseComponent) {
      throw new Error('BaseComponent is abstract and cannot be instantiated directly');
    }

    this.name = name;
    this.containerId = containerId;
    this.state = getStateManager();
    this.chartService = getChartService();
    this.tableService = getTableService();
    this.isInitialized = false;
    this.unsubscribers = [];

    log.debug(`${this.name} component created`);
  }

  /**
   * Get the container element
   * @protected
   * @returns {HTMLElement} Container element
   * @throws {Error} If container not found
   */
  getContainer() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      throw new Error(`Container not found: ${this.containerId}`);
    }
    return container;
  }

  /**
   * Initialize the component (called once)
   * @abstract
   * @returns {Promise<void>}
   */
  async init() {
    throw new Error(`${this.name}.init() must be implemented`);
  }

  /**
   * Render the component with current data
   * @abstract
   * @param {Object} data - Data to render
   * @returns {void}
   */
  render(data) {
    throw new Error(`${this.name}.render() must be implemented`);
  }

  /**
   * Show the component (called when tab becomes active)
   * @returns {void}
   */
  show() {
    const container = this.getContainer();
    container.classList.add('active');
    container.style.display = 'block';
    log.debug(`${this.name} shown`);
  }

  /**
   * Hide the component (called when tab becomes inactive)
   * @returns {void}
   */
  hide() {
    const container = this.getContainer();
    container.classList.remove('active');
    container.style.display = 'none';
    log.debug(`${this.name} hidden`);
  }

  /**
   * Cleanup component resources
   * @returns {void}
   */
  destroy() {
    // Unsubscribe from state changes
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    log.debug(`${this.name} destroyed`);
  }

  /**
   * Subscribe to state changes (automatically cleaned up on destroy)
   * Also immediately calls the callback with current value if it exists
   * @protected
   * @param {string} key - State key
   * @param {Function} callback - Callback function
   * @returns {void}
   */
  subscribeToState(key, callback) {
    const unsubscribe = this.state.subscribe(key, callback);
    this.unsubscribers.push(unsubscribe);
    
    // Immediately invoke callback with current value if it exists
    const currentValue = this.state.get(key);
    if (currentValue !== undefined) {
      callback(currentValue, undefined, key);
    }
  }
}
