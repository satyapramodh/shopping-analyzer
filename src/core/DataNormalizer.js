/**
 * DataNormalizer - Template Method pattern for data transformation
 * Provides consistent data normalization across different source formats
 * @module core/DataNormalizer
 */

import { logger } from '../utils/logger.js';
import { DataValidationError } from '../utils/errors.js';

const log = logger.createChild('DataNormalizer');

/**
 * Abstract base class for data normalization
 * Implements Template Method pattern for consistent data transformation
 * 
 * The template method normalize() defines the normalization algorithm skeleton,
 * while subclasses implement specific extraction logic.
 * 
 * @abstract
 * @class DataNormalizer
 * @example
 * class MyNormalizer extends DataNormalizer {
 *   canHandle(record) { return record.type === 'myType'; }
 *   extractSpecificData(record) { return { ... }; }
 * }
 */
export class DataNormalizer {
  /**
   * @param {string} name - Normalizer name for logging
   */
  constructor(name) {
    if (new.target === DataNormalizer) {
      throw new Error('DataNormalizer is abstract and cannot be instantiated directly');
    }
    this.name = name;
    log.debug(`${this.name} created`);
  }

  /**
   * Check if this normalizer can handle the given record
   * @abstract
   * @param {Object} record - Raw data record
   * @returns {boolean} True if normalizer can handle this record
   */
  canHandle(record) {
    throw new Error('DataNormalizer.canHandle() must be implemented by subclass');
  }

  /**
   * Extract source-specific data from the record
   * @abstract
   * @protected
   * @param {Object} record - Raw data record
   * @returns {Object} Extracted data
   */
  extractSpecificData(record) {
    throw new Error('DataNormalizer.extractSpecificData() must be implemented by subclass');
  }

  /**
   * Validate the normalized record
   * @protected
   * @param {Object} normalized - Normalized record
   * @returns {boolean} True if valid
   */
  validateNormalized(normalized) {
    // Basic validation - subclasses can override for stricter checks
    return (
      normalized &&
      typeof normalized === 'object' &&
      normalized.transactionDate &&
      typeof normalized.total === 'number'
    );
  }

  /**
   * Template method - normalizes a record using the algorithm defined here
   * This method defines the skeleton of the normalization process
   * 
   * @param {Object} record - Raw data record
   * @returns {Object|null} Normalized record or null if cannot handle/invalid
   * @throws {DataValidationError} If record is invalid after normalization
   * 
   * @example
   * const normalized = normalizer.normalize(rawRecord);
   * if (normalized) {
   *   console.log('Normalized:', normalized);
   * }
   */
  normalize(record) {
    if (!record || typeof record !== 'object') {
      log.warn(`${this.name}: Invalid record (not an object)`, { record });
      return null;
    }

    // Check if this normalizer can handle the record
    if (!this.canHandle(record)) {
      log.debug(`${this.name}: Cannot handle record`);
      return null;
    }

    try {
      // Extract source-specific data (implemented by subclass)
      const specificData = this.extractSpecificData(record);

      // Build normalized record
      const normalized = {
        ...specificData,
        // Ensure required fields exist
        transactionDate: specificData.transactionDate || '',
        transactionDateTime: specificData.transactionDateTime || specificData.transactionDate || '',
        transactionType: specificData.transactionType || 'Sales',
        warehouseName: specificData.warehouseName || 'Unknown',
        total: specificData.total || 0,
        subTotal: specificData.subTotal || specificData.total || 0,
        taxes: specificData.taxes || 0,
        itemArray: specificData.itemArray || [],
        tenderArray: specificData.tenderArray || []
      };

      // Validate the normalized record
      if (!this.validateNormalized(normalized)) {
        throw new DataValidationError(`Normalized record failed validation`, { 
          normalizer: this.name,
          record: normalized 
        });
      }

      log.debug(`${this.name}: Record normalized successfully`);
      return normalized;

    } catch (error) {
      log.error(`${this.name}: Normalization failed`, { error, record });
      throw new DataValidationError(`Failed to normalize record: ${error.message}`, {
        normalizer: this.name,
        cause: error
      });
    }
  }

  /**
   * Normalize an array of records
   * @param {Array<Object>} records - Array of raw records
   * @returns {Array<Object>} Array of normalized records (nulls filtered out)
   */
  normalizeMany(records) {
    if (!Array.isArray(records)) {
      throw new DataValidationError('Records must be an array', { records });
    }

    log.info(`${this.name}: Normalizing ${records.length} record(s)`);
    const startTime = performance.now();

    const normalized = records
      .map(record => {
        try {
          return this.normalize(record);
        } catch (error) {
          log.warn(`${this.name}: Skipping invalid record`, { error });
          return null;
        }
      })
      .filter(record => record !== null);

    const duration = performance.now() - startTime;
    log.info(`${this.name}: Normalized ${normalized.length}/${records.length} records in ${duration.toFixed(2)}ms`);

    return normalized;
  }
}

/**
 * Normalizer for online order records
 * Handles both detailed and simple order formats from Costco.com
 * 
 * @class OnlineOrderNormalizer
 * @extends DataNormalizer
 */
export class OnlineOrderNormalizer extends DataNormalizer {
  constructor() {
    super('OnlineOrderNormalizer');
  }

  /**
   * Check if record is an online order
   * @param {Object} record - Raw record
   * @returns {boolean} True if online order
   */
  canHandle(record) {
    return !!(
      (record.orderPlacedDate || record.orderedDate || record.orderNumber) &&
      !record.transactionDate &&
      !record.transactionDateTime
    );
  }

  /**
   * Extract data from online order record
   * @protected
   * @param {Object} record - Raw online order
   * @returns {Object} Extracted data
   */
  extractSpecificData(record) {
    // Skip cancelled orders
    if (record.status === 'Cancelled') {
      throw new DataValidationError('Order is cancelled', { orderNumber: record.orderNumber });
    }

    // Detailed format with shipToAddress array
    if (record.shipToAddress && Array.isArray(record.shipToAddress)) {
      return this._extractDetailedFormat(record);
    }

    // Simple format with orderLineItems
    return this._extractSimpleFormat(record);
  }

  /**
   * Extract data from detailed order format
   * @private
   * @param {Object} record - Raw record
   * @returns {Object} Extracted data
   */
  _extractDetailedFormat(record) {
    const items = [];

    record.shipToAddress.forEach(ship => {
      if (ship.orderLineItems) {
        ship.orderLineItems.forEach(item => {
          items.push({
            itemNumber: item.itemNumber,
            itemDescription01: item.itemDescription,
            amount: item.price * item.quantity,
            unit: item.quantity,
            unitPrice: item.price,
            itemDepartmentNumber: 'Online',
            isOnline: true
          });
        });
      }
    });

    return {
      transactionDate: (record.orderPlacedDate || record.orderedDate || '').substring(0, 10),
      transactionDateTime: record.orderPlacedDate || record.orderedDate,
      warehouseName: 'Costco.com',
      total: record.orderTotal || 0,
      subTotal: record.merchandiseTotal || record.orderTotal || 0,
      taxes: (record.uSTaxTotal1 || 0) + (record.foreignTaxTotal1 || 0),
      itemArray: items,
      isOnline: true,
      transactionType: 'Sales',
      orderNumber: record.orderNumber
    };
  }

  /**
   * Extract data from simple order format
   * @private
   * @param {Object} record - Raw record
   * @returns {Object} Extracted data
   */
  _extractSimpleFormat(record) {
    const total = record.orderTotal || 0;
    const items = record.orderLineItems || [];
    
    // Distribute total evenly among items (approximation)
    const itemCount = items.length || 1;
    const avgPrice = total / itemCount;

    return {
      transactionDate: (record.orderPlacedDate || record.orderedDate || '').substring(0, 10),
      transactionDateTime: record.orderPlacedDate || record.orderedDate,
      warehouseName: 'Costco.com',
      total: total,
      subTotal: total,
      taxes: 0, // Unknown in simple format
      itemArray: items.map(item => ({
        itemNumber: item.itemNumber,
        itemDescription01: item.itemDescription,
        amount: avgPrice,
        unit: 1,
        itemDepartmentNumber: 'Online',
        isOnline: true
      })),
      isOnline: true,
      transactionType: 'Sales',
      orderNumber: record.orderNumber
    };
  }
}

/**
 * Normalizer for warehouse receipt records
 * Handles gas station and in-store purchases
 * 
 * @class WarehouseReceiptNormalizer
 * @extends DataNormalizer
 */
export class WarehouseReceiptNormalizer extends DataNormalizer {
  constructor() {
    super('WarehouseReceiptNormalizer');
  }

  /**
   * Check if record is a warehouse receipt
   * @param {Object} record - Raw record
   * @returns {boolean} True if warehouse receipt
   */
  canHandle(record) {
    return !!(record.transactionDate || record.transactionDateTime);
  }

  /**
   * Extract data from warehouse receipt
   * @protected
   * @param {Object} record - Raw warehouse receipt
   * @returns {Object} Extracted data
   */
  extractSpecificData(record) {
    return {
      ...record,
      isOnline: false,
      // Ensure itemArray and tenderArray exist
      itemArray: record.itemArray || [],
      tenderArray: record.tenderArray || [],
      // Normalize transaction type
      transactionType: record.transactionType || (record.total < 0 ? 'Refund' : 'Sales')
    };
  }

  /**
   * Validate warehouse receipt
   * @protected
   * @param {Object} normalized - Normalized record
   * @returns {boolean} True if valid
   */
  validateNormalized(normalized) {
    // Call parent validation
    if (!super.validateNormalized(normalized)) {
      return false;
    }

    // Warehouse receipts should have warehouse info
    return !!(
      normalized.warehouseName ||
      normalized.warehouseNumber
    );
  }
}

/**
 * Composite normalizer that tries multiple normalizers in sequence
 * Uses Chain of Responsibility pattern
 * 
 * @class CompositeNormalizer
 * @extends DataNormalizer
 */
export class CompositeNormalizer extends DataNormalizer {
  /**
   * @param {Array<DataNormalizer>} normalizers - Array of normalizers to try
   */
  constructor(normalizers = []) {
    super('CompositeNormalizer');
    this.normalizers = normalizers;
    log.info(`CompositeNormalizer initialized with ${normalizers.length} normalizer(s)`);
  }

  /**
   * Add a normalizer to the chain
   * @param {DataNormalizer} normalizer - Normalizer to add
   * @returns {CompositeNormalizer} This normalizer (for chaining)
   */
  addNormalizer(normalizer) {
    if (!(normalizer instanceof DataNormalizer)) {
      throw new DataValidationError('Must be a DataNormalizer instance', { normalizer });
    }
    this.normalizers.push(normalizer);
    return this;
  }

  /**
   * Check if any normalizer can handle the record
   * @param {Object} record - Raw record
   * @returns {boolean} True if any normalizer can handle
   */
  canHandle(record) {
    return this.normalizers.some(n => n.canHandle(record));
  }

  /**
   * Find the first normalizer that can handle the record and use it
   * @protected
   * @param {Object} record - Raw record
   * @returns {Object} Extracted data
   */
  extractSpecificData(record) {
    for (const normalizer of this.normalizers) {
      if (normalizer.canHandle(record)) {
        log.debug(`Using ${normalizer.name} for record`);
        return normalizer.extractSpecificData(record);
      }
    }

    throw new DataValidationError('No normalizer could handle this record', { record });
  }

  /**
   * Get statistics about normalization
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      normalizerCount: this.normalizers.length,
      normalizers: this.normalizers.map(n => n.name)
    };
  }
}

/**
 * Create a default composite normalizer with all standard normalizers
 * @returns {CompositeNormalizer} Configured normalizer
 */
export function createDefaultNormalizer() {
  return new CompositeNormalizer([
    new OnlineOrderNormalizer(),
    new WarehouseReceiptNormalizer()
  ]);
}
