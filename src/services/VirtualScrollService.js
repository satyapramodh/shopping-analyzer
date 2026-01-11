/**
 * VirtualScrollService - Virtual scrolling for large tables
 * Renders only visible rows for optimal performance with large datasets
 * @module services/VirtualScrollService
 */

import { logger } from '../utils/logger.js';
import { DataValidationError } from '../utils/errors.js';

const log = logger.createChild('VirtualScrollService');

/**
 * Default configuration for virtual scrolling
 */
const DEFAULT_CONFIG = {
  rowHeight: 40,           // Default row height in pixels
  bufferRows: 10,          // Extra rows to render above/below viewport
  containerHeight: 600,    // Default container height
  enableStickyHeader: true // Keep header fixed while scrolling
};

/**
 * Service for implementing virtual scrolling on large tables
 * Only renders rows visible in viewport + buffer
 * 
 * @class VirtualScrollService
 * @example
 * const virtualScroll = new VirtualScrollService();
 * virtualScroll.initialize('#myTable', data, { rowHeight: 50 });
 */
export class VirtualScrollService {
  constructor() {
    /** @private */
    this.instances = new Map(); // tableId -> instance state
    
    log.info('VirtualScrollService initialized');
  }

  /**
   * Initialize virtual scrolling for a table
   * @param {string|HTMLElement} tableOrSelector - Table element or selector
   * @param {Array<Object>} data - Full dataset
   * @param {Object} [config={}] - Configuration options
   * @param {number} [config.rowHeight=40] - Height of each row in pixels
   * @param {number} [config.bufferRows=10] - Extra rows to render for smooth scrolling
   * @param {number} [config.containerHeight=600] - Container height
   * @param {boolean} [config.enableStickyHeader=true] - Keep header fixed
   * @param {Function} [config.renderRow] - Custom row renderer function
   * @returns {string} Instance ID for this virtual scroll table
   * 
   * @example
   * const instanceId = virtualScroll.initialize('#products', products, {
   *   rowHeight: 50,
   *   renderRow: (item) => `<td>${item.name}</td><td>${item.price}</td>`
   * });
   */
  initialize(tableOrSelector, data, config = {}) {
    const table = typeof tableOrSelector === 'string' 
      ? document.querySelector(tableOrSelector) 
      : tableOrSelector;

    if (!table) {
      throw new DataValidationError('Table element not found', { tableOrSelector });
    }

    if (!Array.isArray(data)) {
      throw new DataValidationError('Data must be an array', { data });
    }

    const fullConfig = { ...DEFAULT_CONFIG, ...config };
    const instanceId = table.id || `virtual-table-${Date.now()}`;
    
    // Create container structure
    const container = this._createContainer(table, fullConfig);
    
    // Store instance state
    const instance = {
      table,
      container,
      data,
      config: fullConfig,
      state: {
        scrollTop: 0,
        startIndex: 0,
        endIndex: 0,
        visibleRows: 0
      }
    };

    this.instances.set(instanceId, instance);
    
    // Initial render
    this._render(instanceId);
    
    // Attach scroll listener
    this._attachScrollListener(instanceId);
    
    log.info('Virtual scroll initialized', { 
      instanceId, 
      totalRows: data.length,
      config: fullConfig 
    });

    return instanceId;
  }

  /**
   * Create container structure for virtual scrolling
   * @private
   */
  _createContainer(table, config) {
    const wrapper = document.createElement('div');
    wrapper.className = 'virtual-scroll-wrapper';
    wrapper.style.cssText = `
      height: ${config.containerHeight}px;
      overflow-y: auto;
      position: relative;
    `;

    const innerContainer = document.createElement('div');
    innerContainer.className = 'virtual-scroll-inner';
    
    // Wrap table
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(innerContainer);
    innerContainer.appendChild(table);

    if (config.enableStickyHeader) {
      const thead = table.querySelector('thead');
      if (thead) {
        thead.style.cssText = `
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        `;
      }
    }

    return wrapper;
  }

  /**
   * Attach scroll event listener
   * @private
   */
  _attachScrollListener(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const scrollHandler = () => {
      const scrollTop = instance.container.scrollTop;
      instance.state.scrollTop = scrollTop;
      this._render(instanceId);
    };

    instance.container.addEventListener('scroll', scrollHandler, { passive: true });
    
    // Store handler for cleanup
    instance.scrollHandler = scrollHandler;
  }

  /**
   * Render visible rows
   * @private
   */
  _render(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    const { data, config, state, table } = instance;
    const { rowHeight, bufferRows } = config;

    // Calculate visible range
    const totalRows = data.length;
    const containerHeight = instance.container.clientHeight;
    const visibleRows = Math.ceil(containerHeight / rowHeight);

    const startIndex = Math.max(0, Math.floor(state.scrollTop / rowHeight) - bufferRows);
    const endIndex = Math.min(totalRows, startIndex + visibleRows + (bufferRows * 2));

    // Only re-render if range changed
    if (startIndex === state.startIndex && endIndex === state.endIndex) {
      return;
    }

    state.startIndex = startIndex;
    state.endIndex = endIndex;
    state.visibleRows = endIndex - startIndex;

    // Render rows
    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    // Clear existing rows
    tbody.innerHTML = '';

    // Set total height for scrollbar
    const totalHeight = totalRows * rowHeight;
    const spacerTop = startIndex * rowHeight;
    const spacerBottom = (totalRows - endIndex) * rowHeight;

    // Add top spacer
    if (spacerTop > 0) {
      const topSpacer = document.createElement('tr');
      topSpacer.className = 'virtual-scroll-spacer';
      topSpacer.style.height = `${spacerTop}px`;
      tbody.appendChild(topSpacer);
    }

    // Render visible rows
    const fragment = document.createDocumentFragment();
    for (let i = startIndex; i < endIndex; i++) {
      const row = this._renderRow(data[i], i, config);
      fragment.appendChild(row);
    }
    tbody.appendChild(fragment);

    // Add bottom spacer
    if (spacerBottom > 0) {
      const bottomSpacer = document.createElement('tr');
      bottomSpacer.className = 'virtual-scroll-spacer';
      bottomSpacer.style.height = `${spacerBottom}px`;
      tbody.appendChild(bottomSpacer);
    }

    log.debug('Rendered virtual rows', { 
      instanceId, 
      startIndex, 
      endIndex, 
      visible: state.visibleRows 
    });
  }

  /**
   * Render a single row
   * @private
   */
  _renderRow(item, index, config) {
    const tr = document.createElement('tr');
    tr.style.height = `${config.rowHeight}px`;
    tr.dataset.index = index;

    if (config.renderRow) {
      // Custom renderer
      tr.innerHTML = config.renderRow(item, index);
    } else {
      // Default renderer - create cells from object values
      Object.values(item).forEach(value => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
    }

    return tr;
  }

  /**
   * Update data and re-render
   * @param {string} instanceId - Virtual scroll instance ID
   * @param {Array<Object>} newData - Updated dataset
   * 
   * @example
   * virtualScroll.updateData(instanceId, filteredProducts);
   */
  updateData(instanceId, newData) {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new DataValidationError('Instance not found', { instanceId });
    }

    if (!Array.isArray(newData)) {
      throw new DataValidationError('Data must be an array', { newData });
    }

    instance.data = newData;
    instance.state.scrollTop = 0;
    instance.container.scrollTop = 0;
    
    this._render(instanceId);
    
    log.info('Data updated', { instanceId, newRowCount: newData.length });
  }

  /**
   * Scroll to a specific row index
   * @param {string} instanceId - Virtual scroll instance ID
   * @param {number} index - Row index to scroll to
   * @param {string} [behavior='smooth'] - Scroll behavior
   * 
   * @example
   * virtualScroll.scrollToRow(instanceId, 500, 'smooth');
   */
  scrollToRow(instanceId, index, behavior = 'smooth') {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new DataValidationError('Instance not found', { instanceId });
    }

    const scrollTop = index * instance.config.rowHeight;
    instance.container.scrollTo({
      top: scrollTop,
      behavior
    });

    log.debug('Scrolled to row', { instanceId, index });
  }

  /**
   * Destroy virtual scroll instance and cleanup
   * @param {string} instanceId - Virtual scroll instance ID
   */
  destroy(instanceId) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;

    // Remove scroll listener
    if (instance.scrollHandler) {
      instance.container.removeEventListener('scroll', instance.scrollHandler);
    }

    // Restore original structure
    const table = instance.table;
    const wrapper = instance.container;
    const parent = wrapper.parentNode;
    
    if (parent) {
      parent.insertBefore(table, wrapper);
      parent.removeChild(wrapper);
    }

    this.instances.delete(instanceId);
    
    log.info('Virtual scroll destroyed', { instanceId });
  }

  /**
   * Get instance state for debugging
   * @param {string} instanceId - Virtual scroll instance ID
   * @returns {Object} Current state
   */
  getState(instanceId) {
    const instance = this.instances.get(instanceId);
    return instance ? { ...instance.state } : null;
  }

  /**
   * Destroy all instances
   */
  destroyAll() {
    for (const instanceId of this.instances.keys()) {
      this.destroy(instanceId);
    }
    log.info('All virtual scroll instances destroyed');
  }
}

/**
 * Create a singleton instance of VirtualScrollService
 * @returns {VirtualScrollService} Shared virtual scroll service instance
 */
let _instance = null;

export function getVirtualScrollService() {
  if (!_instance) {
    _instance = new VirtualScrollService();
  }
  return _instance;
}
