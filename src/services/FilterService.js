/**
 * FilterService - Strategy pattern for data filtering
 * Provides flexible, composable filtering strategies
 * @module services/FilterService
 */

import { logger } from '../utils/logger.js';
import { DataValidationError } from '../utils/errors.js';

const log = logger.createChild('FilterService');

/**
 * Base class for filter strategies
 * Implements Strategy pattern for extensible filtering
 * 
 * @abstract
 * @class FilterStrategy
 */
export class FilterStrategy {
  /**
   * @param {string} name - Filter name for logging
   */
  constructor(name) {
    if (new.target === FilterStrategy) {
      throw new Error('FilterStrategy is abstract and cannot be instantiated directly');
    }
    this.name = name;
  }

  /**
   * Test if a record passes this filter
   * @abstract
   * @param {Object} record - Data record to test
   * @returns {boolean} True if record passes filter
   */
  test(record) {
    throw new Error('FilterStrategy.test() must be implemented by subclass');
  }

  /**
   * Apply filter to a record (alias for test)
   * @param {Object} record - Data record to test
   * @returns {boolean} True if record passes filter
   */
  apply(record) {
    return this.test(record);
  }

  /**
   * Get filter configuration for serialization
   * @returns {Object} Filter configuration
   */
  getConfig() {
    return { name: this.name };
  }
}

/**
 * Filter records by year
 * @class YearFilter
 * @extends FilterStrategy
 */
export class YearFilter extends FilterStrategy {
  /**
   * @param {number|string|Array} years - Year(s) to include (e.g., 2024 or [2023, 2024])
   * @throws {DataValidationError} If years parameter is invalid
   */
  constructor(years) {
    super('YearFilter');
    
    const yearArray = Array.isArray(years) ? years : [years];
    
    if (yearArray.length === 0) {
      throw new DataValidationError('Years must be a non-empty array', { years });
    }

    // Convert all to strings for consistent comparison
    this.years = new Set(yearArray.map(y => String(y)));
  }

  /**
   * Test if record's year is in the allowed set
   * @param {Object} record - Record with transactionDate or date field
   * @returns {boolean} True if year matches
   */
  test(record) {
    const dateField = record.transactionDate || record.date;
    if (!dateField) {
      return false;
    }

    // Handle Date objects
    if (dateField instanceof Date) {
      return this.years.has(String(dateField.getFullYear()));
    }

    // Handle string dates
    const year = String(dateField).substring(0, 4);
    return this.years.has(year);
  }

  getConfig() {
    return {
      ...super.getConfig(),
      years: Array.from(this.years)
    };
  }
}

/**
 * Filter records by location (state and warehouse name)
 * @class LocationFilter
 * @extends FilterStrategy
 */
export class LocationFilter extends FilterStrategy {
  /**
   * @param {string|string[]} locations - Location(s) to include
   * @param {Function} [normalizeLocationFn] - Optional function to normalize warehouse names
   * @param {Function} [getWarehouseMetaFn] - Optional function to get warehouse metadata
   * @throws {DataValidationError} If locations parameter is invalid
   */
  constructor(locations, normalizeLocationFn = null, getWarehouseMetaFn = null) {
    super('LocationFilter');
    
    const locArray = Array.isArray(locations) ? locations : [locations];
    
    if (locArray.length === 0) {
      throw new DataValidationError('Locations must be a non-empty array', { locations });
    }

    this.locations = new Set(locArray.map(loc => String(loc)));
    this.normalizeLocation = normalizeLocationFn || ((name) => {
      if (!name) return '';
      // Extract warehouse number if present
      const match = String(name).match(/(?:warehouse|wh|#)?\s*(\d+)/i);
      return match ? match[1] : String(name).toLowerCase().trim();
    });
    this.getWarehouseMeta = getWarehouseMetaFn || (() => null);
  }

  /**
   * Test if record's location is in the allowed set
   * @param {Object} record - Record with warehouseName, location field
   * @returns {boolean} True if location matches
   */
  test(record) {
    const locationField = record.location || record.warehouseName || '';
    const normName = this.normalizeLocation(locationField);
    
    // Check direct match first
    if (this.locations.has(normName)) {
      return true;
    }

    // Check against original location list
    return this.locations.has(String(locationField));
  }

  getConfig() {
    return {
      ...super.getConfig(),
      locations: Array.from(this.locations)
    };
  }
}

/**
 * Filter records by date range
 * @class DateRangeFilter
 * @extends FilterStrategy
 */
export class DateRangeFilter extends FilterStrategy {
  /**
   * @param {Date|string} startDate - Start date (inclusive)
   * @param {Date|string} endDate - End date (inclusive)
   * @throws {DataValidationError} If dates are invalid
   */
  constructor(startDate, endDate) {
    super('DateRangeFilter');
    
    this.startDate = startDate instanceof Date ? startDate : new Date(startDate);
    this.endDate = endDate instanceof Date ? endDate : new Date(endDate);

    if (isNaN(this.startDate.getTime()) || isNaN(this.endDate.getTime())) {
      throw new DataValidationError('Invalid date range', { startDate, endDate });
    }

    if (this.startDate > this.endDate) {
      throw new DataValidationError('Start date must be before or equal to end date', {
        startDate: this.startDate,
        endDate: this.endDate
      });
    }
  }

  /**
   * Test if record's date falls within range
   * @param {Object} record - Record with transactionDate or date field
   * @returns {boolean} True if date is in range
   */
  test(record) {
    const dateField = record.transactionDate || record.date;
    if (!dateField) {
      return false;
    }

    const recordDate = dateField instanceof Date ? dateField : new Date(dateField);
    return recordDate >= this.startDate && recordDate <= this.endDate;
  }

  getConfig() {
    return {
      ...super.getConfig(),
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString()
    };
  }
}

/**
 * Filter records by transaction type
 * @class TransactionTypeFilter
 * @extends FilterStrategy
 */
export class TransactionTypeFilter extends FilterStrategy {
  /**
   * @param {string[]} types - Array of transaction types to include
   * @throws {DataValidationError} If types array is invalid
   */
  constructor(types) {
    super('TransactionTypeFilter');
    
    if (!Array.isArray(types) || types.length === 0) {
      throw new DataValidationError('Types must be a non-empty array', { types });
    }

    this.types = new Set(types);
  }

  /**
   * Test if record's transaction type is in the allowed set
   * @param {Object} record - Record with transactionType field
   * @returns {boolean} True if type matches
   */
  test(record) {
    return this.types.has(record.transactionType);
  }

  getConfig() {
    return {
      ...super.getConfig(),
      types: Array.from(this.types)
    };
  }
}

/**
 * Custom filter using a predicate function
 * @class CustomFilter
 * @extends FilterStrategy
 */
export class CustomFilter extends FilterStrategy {
  /**
   * @param {string} name - Filter name
   * @param {Function} predicateFn - Function that returns true if record passes
   * @throws {DataValidationError} If predicateFn is not a function
   */
  constructor(name, predicateFn) {
    super(name);
    
    if (typeof predicateFn !== 'function') {
      throw new DataValidationError('Predicate must be a function', { predicateFn });
    }

    this.predicateFn = predicateFn;
  }

  /**
   * Test record using custom predicate function
   * @param {Object} record - Record to test
   * @returns {boolean} Result of predicate function
   */
  test(record) {
    try {
      return this.predicateFn(record);
    } catch (error) {
      log.error(`Error in custom filter "${this.name}"`, { error, record });
      return false;
    }
  }
}

/**
 * Combines multiple filter strategies into a pipeline
 * All filters must pass for a record to be included (AND logic)
 * 
 * @class FilterPipeline
 */
export class FilterPipeline {
  /**
   * @param {FilterStrategy[]} [filters=[]] - Initial filters
   */
  constructor(filters = []) {
    this.filters = [];
    filters.forEach(filter => this.addFilter(filter));
    log.debug('FilterPipeline created', { filterCount: this.filters.length });
  }

  /**
   * Add a filter to the pipeline
   * @param {FilterStrategy} filter - Filter strategy to add
   * @returns {FilterPipeline} This pipeline (for chaining)
   * @throws {DataValidationError} If filter is not a FilterStrategy instance
   */
  addFilter(filter) {
    if (!(filter instanceof FilterStrategy)) {
      throw new DataValidationError('Filter must be an instance of FilterStrategy', { filter });
    }

    this.filters.push(filter);
    log.debug(`Filter added: ${filter.name}`, { totalFilters: this.filters.length });
    return this;
  }

  /**
   * Remove a filter from the pipeline
   * @param {FilterStrategy} filter - Filter to remove
   * @returns {boolean} True if filter was removed
   */
  removeFilter(filter) {
    const index = this.filters.indexOf(filter);
    if (index === -1) {
      return false;
    }

    this.filters.splice(index, 1);
    log.debug(`Filter removed: ${filter.name}`, { remaining: this.filters.length });
    return true;
  }

  /**
   * Remove all filters from the pipeline
   * @returns {FilterPipeline} This pipeline (for chaining)
   */
  clearFilters() {
    const count = this.filters.length;
    this.filters = [];
    log.debug(`Cleared ${count} filter(s)`);
    return this;
  }

  /**
   * Remove all filters from the pipeline (alias for clearFilters)
   * @returns {FilterPipeline} This pipeline (for chaining)
   */
  clear() {
    return this.clearFilters();
  }

  /**
   * Get all filter configurations
   * @returns {Array<Object>} Array of filter configurations
   */
  getFiltersConfig() {
    return this.filters.map(f => f.getConfig());
  }

  /**
   * Test if a record passes all filters in the pipeline
   * @param {Object} record - Record to test
   * @returns {boolean} True if record passes all filters
   */
  test(record) {
    // All filters must pass (AND logic)
    return this.filters.every(filter => filter.test(record));
  }

  /**
   * Apply filters to an array of records
   * @param {Array<Object>} records - Records to filter
   * @returns {Array<Object>} Filtered records
   */
  apply(records) {
    if (!Array.isArray(records)) {
      throw new DataValidationError('Records must be an array', { records });
    }

    const startTime = performance.now();
    const filtered = records.filter(record => this.test(record));
    const duration = performance.now() - startTime;

    log.info('Filters applied', {
      inputCount: records.length,
      outputCount: filtered.length,
      filterCount: this.filters.length,
      duration: `${duration.toFixed(2)}ms`
    });

    return filtered;
  }

  /**
   * Get statistics about the filter pipeline
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      filterCount: this.filters.length,
      filters: this.filters.map(f => f.name)
    };
  }
}

/**
 * Factory class for creating common filter combinations
 * @class FilterFactory
 */
export class FilterFactory {
  /**
   * Create a filter pipeline with year and location filters
   * @param {string[]} years - Years to include
   * @param {string[]} locations - Location keys to include
   * @param {Function} [normalizeLocationFn] - Location normalizer function
   * @param {Function} [getWarehouseMetaFn] - Warehouse metadata function
   * @returns {FilterPipeline} Configured filter pipeline
   */
  static createYearLocationPipeline(years, locations, normalizeLocationFn, getWarehouseMetaFn) {
    const pipeline = new FilterPipeline();
    
    if (years && years.length > 0) {
      pipeline.addFilter(new YearFilter(years));
    }
    
    if (locations && locations.length > 0) {
      pipeline.addFilter(new LocationFilter(locations, normalizeLocationFn, getWarehouseMetaFn));
    }

    return pipeline;
  }

  /**
   * Create a filter pipeline with date range filter
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {FilterPipeline} Configured filter pipeline
   */
  static createDateRangePipeline(startDate, endDate) {
    return new FilterPipeline([
      new DateRangeFilter(startDate, endDate)
    ]);
  }

  /**
   * Create a filter pipeline for excluding refunds
   * @returns {FilterPipeline} Configured filter pipeline
   */
  static createNoRefundsPipeline() {
    return new FilterPipeline([
      new CustomFilter('NoRefunds', (record) => {
        return record.total >= 0 && record.transactionType !== 'Refund';
      })
    ]);
  }
}

/**
 * Service class for managing filters in the application
 * @class FilterService
 */
export class FilterService {
  constructor() {
    this.pipeline = new FilterPipeline();
    this.rawData = [];
    this.filteredData = [];
    this.listeners = new Set();
    this.registeredFilters = new Map();
    log.info('FilterService initialized');
  }

  /**
   * Create a new filter pipeline
   * @param {FilterStrategy[]} [filters=[]] - Initial filters
   * @returns {FilterPipeline} New filter pipeline
   */
  createPipeline(filters = []) {
    return new FilterPipeline(filters);
  }

  /**
   * Register a custom filter class
   * @param {string} name - Filter name
   * @param {Class} FilterClass - Filter class constructor
   */
  registerFilter(name, FilterClass) {
    if (!name || typeof name !== 'string') {
      throw new DataValidationError('Filter name must be a non-empty string', { name });
    }
    if (typeof FilterClass !== 'function') {
      throw new DataValidationError('FilterClass must be a constructor function', { FilterClass });
    }

    this.registeredFilters.set(name, FilterClass);
    log.debug(`Filter registered: ${name}`);
  }

  /**
   * Create an instance of a registered filter
   * @param {string} name - Filter name
   * @param {...*} args - Arguments to pass to filter constructor
   * @returns {Object} Filter instance
   */
  createFilter(name, ...args) {
    const FilterClass = this.registeredFilters.get(name);
    if (!FilterClass) {
      throw new DataValidationError(`Filter not registered: ${name}`, { name, available: Array.from(this.registeredFilters.keys()) });
    }

    return new FilterClass(...args);
  }

  /**
   * Set the raw data to be filtered
   * @param {Array<Object>} data - Raw data array
   */
  setRawData(data) {
    this.rawData = data;
    log.debug(`Raw data set: ${data.length} records`);
  }

  /**
   * Get the current filter pipeline
   * @returns {FilterPipeline} Current pipeline
   */
  getPipeline() {
    return this.pipeline;
  }

  /**
   * Replace the entire filter pipeline
   * @param {FilterPipeline} pipeline - New pipeline
   */
  setPipeline(pipeline) {
    if (!(pipeline instanceof FilterPipeline)) {
      throw new DataValidationError('Pipeline must be an instance of FilterPipeline', { pipeline });
    }

    this.pipeline = pipeline;
    log.debug('Filter pipeline replaced');
  }

  /**
   * Apply current filters and notify listeners
   * @returns {Array<Object>} Filtered data
   */
  applyFilters() {
    this.filteredData = this.pipeline.apply(this.rawData);
    this._notifyListeners();
    return this.filteredData;
  }

  /**
   * Get the currently filtered data without reapplying filters
   * @returns {Array<Object>} Filtered data
   */
  getFilteredData() {
    return this.filteredData;
  }

  /**
   * Add a listener for filter changes
   * @param {Function} callback - Callback function(filteredData)
   */
  addListener(callback) {
    if (typeof callback !== 'function') {
      throw new DataValidationError('Listener must be a function', { callback });
    }

    this.listeners.add(callback);
    log.debug(`Listener added: ${this.listeners.size} total`);
  }

  /**
   * Remove a listener
   * @param {Function} callback - Callback function to remove
   */
  removeListener(callback) {
    this.listeners.delete(callback);
    log.debug(`Listener removed: ${this.listeners.size} remaining`);
  }

  /**
   * Notify all listeners of filter changes
   * @private
   */
  _notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.filteredData);
      } catch (error) {
        log.error('Error in filter listener', { error });
      }
    });
  }

  /**
   * Get service statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      rawDataCount: this.rawData.length,
      filteredDataCount: this.filteredData.length,
      listenerCount: this.listeners.size,
      ...this.pipeline.getStats()
    };
  }
}

/**
 * Create a singleton instance of FilterService
 * @returns {FilterService} Shared filter service instance
 */
let _instance = null;

export function getFilterService() {
  if (!_instance) {
    _instance = new FilterService();
  }
  return _instance;
}
