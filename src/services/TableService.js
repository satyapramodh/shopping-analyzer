/**
 * TableService - Reusable table rendering and sorting
 * Provides utilities for creating sortable, accessible HTML tables
 * @module services/TableService
 */

import { logger } from '../utils/logger.js';
import { DataValidationError } from '../utils/errors.js';
import { formatMoney, formatDate, formatPercent } from '../utils/formatters.js';

const log = logger.createChild('TableService');

/**
 * Sort direction enumeration
 * @enum {string}
 */
export const SortDirection = {
  ASC: 'asc',
  DESC: 'desc'
};

/**
 * Data type enumeration for sorting
 * @enum {string}
 */
export const DataType = {
  STRING: 'string',
  NUMBER: 'number',
  MONEY: 'money',
  PERCENT: 'percent',
  DATE: 'date'
};

/**
 * Service for creating and managing HTML tables
 * Features:
 * - Sortable columns with automatic type detection
 * - ARIA attributes for accessibility
 * - Sort state persistence in URL params
 * - Customizable formatters
 * - Efficient DOM manipulation
 * 
 * @class TableService
 * @example
 * const tableService = new TableService();
 * tableService.makeTableSortable('myTable');
 */
export class TableService {
  constructor() {
    /** @private */
    this.sortStates = new Map(); // tableId -> { columnIndex, direction }
    
    log.info('TableService initialized');
  }

  /**
   * Detect data type from cell content
   * @private
   * @param {string} value - Cell text content
   * @returns {string} Data type (from DataType enum)
   */
  _detectDataType(value) {
    if (!value || value.trim() === '') {
      return DataType.STRING;
    }

    // Remove common formatting
    const cleaned = value.replace(/[$,%\s]/g, '');

    // Check for percentage
    if (value.includes('%')) {
      return DataType.PERCENT;
    }

    // Check for money
    if (value.includes('$')) {
      return DataType.MONEY;
    }

    // Check for number
    if (!isNaN(parseFloat(cleaned)) && isFinite(cleaned)) {
      return DataType.NUMBER;
    }

    // Check for date (simple heuristic)
    if (value.match(/\d{1,2}\/\d{1,2}\/\d{2,4}/) || value.match(/\d{4}-\d{2}-\d{2}/)) {
      return DataType.DATE;
    }

    return DataType.STRING;
  }

  /**
   * Parse cell value based on data type
   * @private
   * @param {string} value - Cell text content
   * @param {string} dataType - Data type from DataType enum
   * @returns {*} Parsed value
   */
  _parseValue(value, dataType) {
    if (!value || value.trim() === '') {
      return null;
    }

    switch (dataType) {
      case DataType.MONEY:
      case DataType.PERCENT:
      case DataType.NUMBER:
        const cleaned = value.replace(/[$,%\s]/g, '');
        return parseFloat(cleaned);

      case DataType.DATE:
        return new Date(value);

      case DataType.STRING:
      default:
        return value;
    }
  }

  /**
   * Compare two values for sorting
   * @private
   * @param {*} a - First value
   * @param {*} b - Second value
   * @param {string} dataType - Data type
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {number} Comparison result (-1, 0, 1)
   */
  _compareValues(a, b, dataType, direction) {
    // Handle null values
    if (a === null && b === null) return 0;
    if (a === null) return direction === SortDirection.ASC ? 1 : -1;
    if (b === null) return direction === SortDirection.ASC ? -1 : 1;

    let result = 0;

    switch (dataType) {
      case DataType.NUMBER:
      case DataType.MONEY:
      case DataType.PERCENT:
        result = a - b;
        break;

      case DataType.DATE:
        result = a.getTime() - b.getTime();
        break;

      case DataType.STRING:
      default:
        result = a.localeCompare(b);
        break;
    }

    return direction === SortDirection.ASC ? result : -result;
  }

  /**
   * Get sort state for a table
   * @param {string} tableId - Table element ID
   * @returns {Object|null} Sort state { columnIndex, direction } or null
   */
  getSortState(tableId) {
    return this.sortStates.get(tableId) || null;
  }

  /**
   * Set sort state for a table
   * @param {string} tableId - Table element ID
   * @param {number} columnIndex - Column index to sort by
   * @param {string} direction - Sort direction ('asc' or 'desc')
   */
  setSortState(tableId, columnIndex, direction) {
    this.sortStates.set(tableId, { columnIndex, direction });
    log.debug(`Sort state set for ${tableId}`, { columnIndex, direction });
  }

  /**
   * Sort table by column
   * @param {string} tableId - Table element ID
   * @param {number} columnIndex - Column index to sort by
   * @param {string} [direction='asc'] - Sort direction
   * @throws {DataValidationError} If table not found
   */
  sortTable(tableId, columnIndex, direction = SortDirection.ASC) {
    const table = document.getElementById(tableId);
    if (!table) {
      throw new DataValidationError(`Table not found: ${tableId}`, { tableId });
    }

    const tbody = table.querySelector('tbody');
    if (!tbody) {
      throw new DataValidationError(`Table body not found: ${tableId}`, { tableId });
    }

    const rows = Array.from(tbody.querySelectorAll('tr'));
    if (rows.length === 0) {
      log.debug(`No rows to sort in table: ${tableId}`);
      return;
    }

    // Detect data type from first non-empty cell in column
    let dataType = DataType.STRING;
    for (const row of rows) {
      const cell = row.children[columnIndex];
      if (cell && cell.textContent.trim()) {
        dataType = this._detectDataType(cell.textContent);
        break;
      }
    }

    log.debug(`Sorting table ${tableId}`, { columnIndex, direction, dataType });

    // Sort rows
    const startTime = performance.now();
    rows.sort((a, b) => {
      const aCell = a.children[columnIndex];
      const bCell = b.children[columnIndex];
      
      if (!aCell || !bCell) return 0;

      const aValue = this._parseValue(aCell.textContent, dataType);
      const bValue = this._parseValue(bCell.textContent, dataType);

      return this._compareValues(aValue, bValue, dataType, direction);
    });
    const duration = performance.now() - startTime;

    // Update DOM
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));

    // Save sort state
    this.setSortState(tableId, columnIndex, direction);

    log.debug(`Table sorted in ${duration.toFixed(2)}ms`);
  }

  /**
   * Make a table sortable by clicking on headers
   * @param {string} tableId - Table element ID
   * @param {Object} [options={}] - Configuration options
   * @param {boolean} [options.persistState=true] - Persist sort state in URL
   * @param {number} [options.initialColumn] - Initial column to sort by
   * @param {string} [options.initialDirection='asc'] - Initial sort direction
   * @throws {DataValidationError} If table not found
   * 
   * @example
   * tableService.makeTableSortable('productsTable', {
   *   initialColumn: 2,
   *   initialDirection: 'desc'
   * });
   */
  makeTableSortable(tableId, options = {}) {
    const {
      persistState = true,
      initialColumn = null,
      initialDirection = SortDirection.ASC
    } = options;

    const table = document.getElementById(tableId);
    if (!table) {
      throw new DataValidationError(`Table not found: ${tableId}`, { tableId });
    }

    const headers = table.querySelectorAll('th');
    if (headers.length === 0) {
      log.warn(`No headers found in table: ${tableId}`);
      return;
    }

    log.debug(`Making table sortable: ${tableId}`, { columnCount: headers.length });

    headers.forEach((th, columnIndex) => {
      // Style header
      th.style.cursor = 'pointer';
      th.title = 'Click to sort';
      
      // Add ARIA attributes
      th.setAttribute('role', 'button');
      th.setAttribute('aria-sort', 'none');
      th.setAttribute('tabindex', '0');

      // Click handler
      const handleSort = () => {
        const currentDirection = th.getAttribute('data-order');
        const newDirection = currentDirection === SortDirection.ASC 
          ? SortDirection.DESC 
          : SortDirection.ASC;

        // Reset other headers
        headers.forEach(h => {
          h.removeAttribute('data-order');
          h.setAttribute('aria-sort', 'none');
        });

        // Update clicked header
        th.setAttribute('data-order', newDirection);
        th.setAttribute('aria-sort', newDirection === SortDirection.ASC ? 'ascending' : 'descending');

        // Sort table
        this.sortTable(tableId, columnIndex, newDirection);

        // Persist to URL if enabled
        if (persistState) {
          this._updateURLParams(tableId, columnIndex, newDirection);
        }
      };

      // Mouse click
      th.addEventListener('click', handleSort);

      // Keyboard accessibility (Enter or Space)
      th.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSort();
        }
      });
    });

    // Apply initial sort if specified
    if (initialColumn !== null && initialColumn >= 0 && initialColumn < headers.length) {
      const th = headers[initialColumn];
      th.setAttribute('data-order', initialDirection);
      th.setAttribute('aria-sort', initialDirection === SortDirection.ASC ? 'ascending' : 'descending');
      this.sortTable(tableId, initialColumn, initialDirection);
    }

    // Restore from URL params if available
    if (persistState) {
      this._restoreFromURL(tableId, headers);
    }

    log.info(`Table ${tableId} is now sortable`);
  }

  /**
   * Update URL parameters with sort state
   * @private
   * @param {string} tableId - Table element ID
   * @param {number} columnIndex - Column index
   * @param {string} direction - Sort direction
   */
  _updateURLParams(tableId, columnIndex, direction) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(`${tableId}_sort`, `${columnIndex}:${direction}`);
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      log.error('Failed to update URL params', { error, tableId });
    }
  }

  /**
   * Restore sort state from URL parameters
   * @private
   * @param {string} tableId - Table element ID
   * @param {NodeList} headers - Table header elements
   */
  _restoreFromURL(tableId, headers) {
    try {
      const url = new URL(window.location.href);
      const sortParam = url.searchParams.get(`${tableId}_sort`);
      
      if (sortParam) {
        const [columnIndex, direction] = sortParam.split(':');
        const colIdx = parseInt(columnIndex, 10);

        if (!isNaN(colIdx) && colIdx >= 0 && colIdx < headers.length) {
          const th = headers[colIdx];
          th.setAttribute('data-order', direction);
          th.setAttribute('aria-sort', direction === SortDirection.ASC ? 'ascending' : 'descending');
          this.sortTable(tableId, colIdx, direction);
          log.debug(`Restored sort state from URL: ${tableId}`, { columnIndex: colIdx, direction });
        }
      }
    } catch (error) {
      log.error('Failed to restore from URL params', { error, tableId });
    }
  }

  /**
   * Render an HTML table from data
   * @param {string} containerId - Container element ID
   * @param {Array<Object>} data - Array of data objects
   * @param {Array<Object>} columns - Column definitions
   * @param {Object} [options={}] - Rendering options
   * @returns {HTMLTableElement} Created table element
   * @throws {DataValidationError} If container not found or invalid parameters
   * 
   * @example
   * tableService.renderTable('container', data, [
   *   { key: 'name', label: 'Product Name' },
   *   { key: 'price', label: 'Price', formatter: formatMoney },
   *   { key: 'quantity', label: 'Qty', className: 'text-center' }
   * ], { tableId: 'productsTable', sortable: true });
   */
  renderTable(containerId, data, columns, options = {}) {
    const {
      tableId = `table-${Date.now()}`,
      sortable = false,
      className = '',
      emptyMessage = 'No data available'
    } = options;

    const container = document.getElementById(containerId);
    if (!container) {
      throw new DataValidationError(`Container not found: ${containerId}`, { containerId });
    }

    if (!Array.isArray(data)) {
      throw new DataValidationError('Data must be an array', { data });
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      throw new DataValidationError('Columns must be a non-empty array', { columns });
    }

    log.debug(`Rendering table ${tableId}`, { rowCount: data.length, columnCount: columns.length });

    // Create table
    const table = document.createElement('table');
    table.id = tableId;
    if (className) {
      table.className = className;
    }

    // Create thead
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    columns.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.label || col.key;
      if (col.headerClassName) {
        th.className = col.headerClassName;
      }
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create tbody
    const tbody = document.createElement('tbody');
    
    if (data.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = columns.length;
      emptyCell.textContent = emptyMessage;
      emptyCell.style.textAlign = 'center';
      emptyCell.style.padding = '20px';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
    } else {
      data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(col => {
          const td = document.createElement('td');
          const value = row[col.key];
          
          // Apply formatter if provided
          if (col.formatter && typeof col.formatter === 'function') {
            td.textContent = col.formatter(value);
          } else {
            td.textContent = value !== null && value !== undefined ? value : '';
          }

          // Apply cell className
          if (col.className) {
            td.className = col.className;
          }

          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    }
    
    table.appendChild(tbody);

    // Replace container content
    container.innerHTML = '';
    container.appendChild(table);

    // Make sortable if requested
    if (sortable && data.length > 0) {
      this.makeTableSortable(tableId);
    }

    log.info(`Table ${tableId} rendered successfully`);
    return table;
  }

  /**
   * Get service statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      sortableTablesCount: this.sortStates.size,
      tables: Array.from(this.sortStates.keys())
    };
  }
}

/**
 * Create a singleton instance of TableService
 * @returns {TableService} Shared table service instance
 */
let _instance = null;

export function getTableService() {
  if (!_instance) {
    _instance = new TableService();
  }
  return _instance;
}
