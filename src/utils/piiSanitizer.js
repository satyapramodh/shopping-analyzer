/**
 * PII Sanitization Utility
 * 
 * Removes personally identifiable information (PII) from data before download or storage.
 * Consolidates duplicate sanitization logic from download scripts.
 * 
 * @module utils/piiSanitizer
 * @author Costco Dashboard Team
 * @since 1.0.0
 */

import { PII_FIELDS } from './constants.js';
import { logger } from './logger.js';

const sanitizerLogger = logger.child('PIISanitizer');

/**
 * Sanitizes a single object by removing PII fields
 * 
 * @private
 * @param {Object} obj - Object to sanitize
 * @param {string[]} fieldsToRemove - Array of field names to remove
 * @returns {Object} Sanitized object (shallow copy)
 */
function sanitizeObject(obj, fieldsToRemove) {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    const sanitized = { ...obj };
    
    for (const field of fieldsToRemove) {
        delete sanitized[field];
    }

    return sanitized;
}

/**
 * Sanitizes receipt data by removing all PII fields
 * 
 * Removes personal information including names, addresses, emails, phone numbers,
 * membership numbers, and payment card details.
 * 
 * @param {Object|Object[]} data - Receipt data (single object or array)
 * @returns {Object|Object[]} Sanitized data with PII removed
 * @throws {TypeError} If data is null or undefined
 * 
 * @example
 * const receipt = { firstName: 'John', total: 100, membershipNumber: '12345' };
 * const clean = sanitizeReceipt(receipt);
 * // Returns: { total: 100 }
 * 
 * @example
 * const receipts = [{ firstName: 'John', total: 100 }, { firstName: 'Jane', total: 200 }];
 * const clean = sanitizeReceipt(receipts);
 * // Returns: [{ total: 100 }, { total: 200 }]
 */
export function sanitizeReceipt(data) {
    if (data === null || data === undefined) {
        throw new TypeError('sanitizeReceipt: data cannot be null or undefined');
    }

    if (Array.isArray(data)) {
        sanitizerLogger.debug('Sanitizing receipt array', { count: data.length });
        return data.map(item => sanitizeObject(item, PII_FIELDS));
    }

    sanitizerLogger.debug('Sanitizing single receipt');
    return sanitizeObject(data, PII_FIELDS);
}

/**
 * Sanitizes online order data by removing PII from order and nested structures
 * 
 * Handles complex nested structures including shipToAddress arrays and orderPayment objects.
 * 
 * @param {Object|Object[]} orders - Order data (single object or array)
 * @returns {Object|Object[]} Sanitized orders with PII removed
 * @throws {TypeError} If orders is null or undefined
 * 
 * @example
 * const order = {
 *   orderNumber: '123',
 *   firstName: 'John',
 *   orderPayment: { nameOnCard: 'John Doe', totalCharged: 100 }
 * };
 * const clean = sanitizeOnlineOrder(order);
 * // Returns: { orderNumber: '123', orderPayment: { totalCharged: 100 } }
 */
export function sanitizeOnlineOrder(orders) {
    if (orders === null || orders === undefined) {
        throw new TypeError('sanitizeOnlineOrder: orders cannot be null or undefined');
    }

    const sanitizeOrder = (order) => {
        const clean = sanitizeObject(order, PII_FIELDS);

        // Sanitize nested payment information
        if (clean.orderPayment && typeof clean.orderPayment === 'object') {
            clean.orderPayment = sanitizeObject(clean.orderPayment, PII_FIELDS);
        }

        // Sanitize nested shipping addresses
        if (Array.isArray(clean.shipToAddress)) {
            clean.shipToAddress = clean.shipToAddress.map(addr => 
                sanitizeObject(addr, PII_FIELDS)
            );
        }

        return clean;
    };

    if (Array.isArray(orders)) {
        sanitizerLogger.debug('Sanitizing order array', { count: orders.length });
        return orders.map(sanitizeOrder);
    }

    sanitizerLogger.debug('Sanitizing single order');
    return sanitizeOrder(orders);
}

/**
 * Sanitizes warehouse data by removing PII
 * 
 * @param {Object} warehouse - Warehouse data object
 * @returns {Object} Sanitized warehouse data
 * 
 * @example
 * const warehouse = { id: 847, phone: '555-1234', city: 'Seattle' };
 * const clean = sanitizeWarehouse(warehouse);
 * // Returns: { id: 847, city: 'Seattle' }
 */
export function sanitizeWarehouse(warehouse) {
    if (!warehouse || typeof warehouse !== 'object') {
        return warehouse;
    }

    const warehousePIIFields = ['phone', 'fax', ...PII_FIELDS];
    return sanitizeObject(warehouse, warehousePIIFields);
}

/**
 * Generic PII sanitizer for any object or array
 * 
 * Recursively removes PII from nested structures.
 * 
 * @param {*} data - Data to sanitize
 * @param {string[]} [customFields] - Additional fields to remove beyond defaults
 * @returns {*} Sanitized data
 * 
 * @example
 * const data = { name: 'John', email: 'john@example.com', amount: 100 };
 * const clean = sanitize(data, ['name']);
 * // Returns: { amount: 100 }
 */
export function sanitize(data, customFields = []) {
    if (data === null || data === undefined || typeof data !== 'object') {
        return data;
    }

    const fieldsToRemove = [...PII_FIELDS, ...customFields];

    if (Array.isArray(data)) {
        return data.map(item => sanitize(item, customFields));
    }

    const sanitized = {};
    
    for (const [key, value] of Object.entries(data)) {
        if (fieldsToRemove.includes(key)) {
            continue; // Skip PII fields
        }

        if (value && typeof value === 'object') {
            sanitized[key] = sanitize(value, customFields);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

/**
 * Validates that PII has been removed from data
 * 
 * @param {Object|Object[]} data - Data to validate
 * @returns {boolean} True if no PII found, false otherwise
 * 
 * @example
 * const clean = { total: 100 };
 * validatePIIRemoved(clean); // Returns true
 * 
 * const dirty = { firstName: 'John', total: 100 };
 * validatePIIRemoved(dirty); // Returns false
 */
export function validatePIIRemoved(data) {
    if (!data || typeof data !== 'object') {
        return true;
    }

    if (Array.isArray(data)) {
        return data.every(item => validatePIIRemoved(item));
    }

    const foundPII = PII_FIELDS.some(field => field in data);
    
    if (foundPII) {
        sanitizerLogger.warn('PII validation failed - sensitive data found', {
            fields: PII_FIELDS.filter(field => field in data)
        });
        return false;
    }

    // Check nested objects
    for (const value of Object.values(data)) {
        if (value && typeof value === 'object') {
            if (!validatePIIRemoved(value)) {
                return false;
            }
        }
    }

    return true;
}
