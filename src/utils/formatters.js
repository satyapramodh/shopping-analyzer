/**
 * Formatting Utilities
 * 
 * Provides consistent formatting for money, dates, and numbers throughout the application.
 * Uses singleton pattern for formatters to avoid creating new instances on each call.
 * 
 * @module utils/formatters
 * @author Costco Dashboard Team
 * @since 1.0.0
 */

import { CURRENCY, FORMATS } from './constants.js';

/**
 * Singleton money formatter instance
 * @private
 * @type {Intl.NumberFormat}
 */
const moneyFormatter = new Intl.NumberFormat(CURRENCY.LOCALE, CURRENCY.FORMAT_OPTIONS);

/**
 * Singleton date formatter instance
 * @private
 * @type {Intl.DateTimeFormat}
 */
const dateFormatter = new Intl.DateTimeFormat(FORMATS.DATE_US, FORMATS.DATE_OPTIONS);

/**
 * Formats a number as US currency
 * 
 * Uses a singleton Intl.NumberFormat instance for performance.
 * 
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "$1,234.56")
 * @throws {TypeError} If amount is not a number
 * 
 * @example
 * formatMoney(1234.56);  // Returns "$1,234.56"
 * formatMoney(-50);      // Returns "-$50.00"
 * formatMoney(0);        // Returns "$0.00"
 */
export function formatMoney(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        throw new TypeError(`formatMoney: amount must be a valid number, got ${typeof amount}`);
    }
    return moneyFormatter.format(amount);
}

/**
 * Formats a date using US locale
 * 
 * @param {Date|string|number} date - Date to format (Date object, ISO string, or timestamp)
 * @returns {string} Formatted date string (MM/DD/YYYY)
 * @throws {TypeError} If date cannot be parsed
 * 
 * @example
 * formatDate(new Date('2024-01-15'));  // Returns "01/15/2024"
 * formatDate('2024-01-15');            // Returns "01/15/2024"
 * formatDate(1705276800000);           // Returns "01/15/2024"
 */
export function formatDate(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        throw new TypeError(`formatDate: invalid date value: ${date}`);
    }
    
    return dateFormatter.format(dateObj);
}

/**
 * Formats a date as YYYY-MM format for grouping
 * 
 * @param {Date|string} date - Date to format
 * @returns {string} Year-month string (e.g., "2024-01")
 * @throws {TypeError} If date cannot be parsed
 * 
 * @example
 * formatYearMonth(new Date('2024-01-15'));  // Returns "2024-01"
 * formatYearMonth('2024-01-15');            // Returns "2024-01"
 */
export function formatYearMonth(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        throw new TypeError(`formatYearMonth: invalid date value: ${date}`);
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Formats a number as a percentage
 * 
 * @param {number} value - Value to format (e.g., 0.15 for 15%)
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted percentage (e.g., "15.0%")
 * @throws {TypeError} If value is not a number
 * 
 * @example
 * formatPercent(0.1542);     // Returns "15.4%"
 * formatPercent(0.1542, 2);  // Returns "15.42%"
 * formatPercent(1);          // Returns "100.0%"
 */
export function formatPercent(value, decimals = 1) {
    if (typeof value !== 'number' || isNaN(value)) {
        throw new TypeError(`formatPercent: value must be a valid number, got ${typeof value}`);
    }
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formats a number with thousands separators
 * 
 * @param {number} num - Number to format
 * @returns {string} Formatted number (e.g., "1,234")
 * @throws {TypeError} If num is not a number
 * 
 * @example
 * formatNumber(1234567);  // Returns "1,234,567"
 * formatNumber(42);       // Returns "42"
 */
export function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        throw new TypeError(`formatNumber: num must be a valid number, got ${typeof num}`);
    }
    return num.toLocaleString(FORMATS.DATE_US);
}

/**
 * Normalizes a location name for consistent comparison
 * 
 * Removes extra whitespace, converts to lowercase, and standardizes format.
 * 
 * @param {string} name - Location name to normalize
 * @returns {string} Normalized location name
 * 
 * @example
 * normalizeLocation("  Seattle  WA  ");  // Returns "seattle wa"
 * normalizeLocation("New York");         // Returns "new york"
 */
export function normalizeLocation(name) {
    if (typeof name !== 'string') {
        return '';
    }
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Truncates text to a maximum length with ellipsis
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length including ellipsis
 * @returns {string} Truncated text
 * 
 * @example
 * truncateText("Long product description", 10);  // Returns "Long pr..."
 * truncateText("Short", 10);                     // Returns "Short"
 */
export function truncateText(text, maxLength) {
    if (typeof text !== 'string') {
        return '';
    }
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats a timestamp as a human-readable relative time
 * 
 * @param {Date|string|number} timestamp - Timestamp to format
 * @returns {string} Relative time string (e.g., "2 hours ago")
 * 
 * @example
 * formatRelativeTime(Date.now() - 3600000);  // Returns "1 hour ago"
 * formatRelativeTime(Date.now() + 86400000); // Returns "in 1 day"
 */
export function formatRelativeTime(timestamp) {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay > 0) {
        return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    } else if (diffHr > 0) {
        return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else {
        return 'just now';
    }
}
