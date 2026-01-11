/**
 * Application Configuration Constants
 * 
 * Centralized configuration values extracted from hardcoded strings throughout the codebase.
 * Following the DRY principle to eliminate magic numbers and strings.
 * 
 * @module utils/constants
 * @author Costco Dashboard Team
 * @since 1.0.0
 */

/**
 * API Configuration
 * @namespace
 */
export const API = {
    /** @type {string} Costco GraphQL API endpoint */
    ENDPOINT: 'https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql',
    
    /** @type {string} Client identifier for API requests */
    CLIENT_ID: '481b1aec-aa3b-454b-b81b-48187e28f205',
    
    /** @type {string} Default start date for data queries (MM/DD/YYYY) */
    START_DATE: '01/01/2020',
    
    /** @type {number} Page size for paginated API requests */
    PAGE_SIZE: 50,
    
    /** @type {number} Delay in milliseconds between API requests to avoid rate limiting */
    FETCH_DELAY_MS: 300
};

/**
 * Business Logic Constants
 * @namespace
 */
export const BUSINESS = {
    /** @type {number} Executive membership reward rate (2%) */
    REWARDS_RATE: 0.02,
    
    /** @type {number} Citi credit card reward rate for gas purchases */
    CITI_GAS_REWARDS_RATE: 0.04,
    
    /** @type {number} Citi credit card reward rate for restaurant purchases */
    CITI_RESTAURANT_REWARDS_RATE: 0.03,
    
    /** @type {number} Citi credit card default reward rate */
    CITI_DEFAULT_REWARDS_RATE: 0.01
};

/**
 * UI Performance Constants
 * @namespace
 */
export const UI = {
    /** @type {number} Debounce delay for search input in milliseconds */
    SEARCH_DEBOUNCE_MS: 300,
    
    /** @type {number} Debounce delay for filter application in milliseconds */
    FILTER_DEBOUNCE_MS: 200,
    
    /** @type {number} Maximum number of visible table rows before pagination */
    MAX_TABLE_ROWS: 1000,
    
    /** @type {number} Virtual scroll viewport buffer size */
    VIRTUAL_SCROLL_BUFFER: 10
};

/**
 * Date/Time Format Constants
 * @namespace
 */
export const FORMATS = {
    /** @type {string} US date format (MM/DD/YYYY) */
    DATE_US: 'en-US',
    
    /** @type {string} ISO date format for storage */
    DATE_ISO: 'YYYY-MM-DD',
    
    /** @type {string} Display month format */
    MONTH_DISPLAY: 'MMM YYYY',
    
    /** @type {Intl.DateTimeFormatOptions} Date format options */
    DATE_OPTIONS: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }
};

/**
 * Currency Configuration
 * @namespace
 */
export const CURRENCY = {
    /** @type {string} Currency code */
    CODE: 'USD',
    
    /** @type {string} Currency locale */
    LOCALE: 'en-US',
    
    /** @type {Intl.NumberFormatOptions} Currency format options */
    FORMAT_OPTIONS: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }
};

/**
 * Chart Configuration
 * @namespace
 */
export const CHART = {
    /** @type {string} Dark theme color */
    DARK_COLOR: '#e0e0e0',
    
    /** @type {string} Light theme color */
    LIGHT_COLOR: '#1f2937',
    
    /** @type {string} Dark theme grid color */
    DARK_GRID: '#333',
    
    /** @type {string} Light theme grid color */
    LIGHT_GRID: '#e5e7eb',
    
    /** @type {number} Default chart height in pixels */
    DEFAULT_HEIGHT: 300,
    
    /** @type {number} Animation duration in milliseconds */
    ANIMATION_DURATION: 750
};

/**
 * Local Storage Keys
 * @namespace
 */
export const STORAGE = {
    /** @type {string} Theme preference key */
    THEME: 'costco-dashboard-theme',
    
    /** @type {string} Filter state key */
    FILTERS: 'costco-dashboard-filters',
    
    /** @type {string} Client ID key (Costco API) */
    CLIENT_ID: 'clientID',
    
    /** @type {string} ID token key (Costco API) */
    ID_TOKEN: 'idToken'
};

/**
 * PII Field Names to Remove
 * @type {string[]}
 */
export const PII_FIELDS = [
    'firstName',
    'lastName',
    'line1',
    'line2',
    'line3',
    'emailAddress',
    'phoneNumber',
    'membershipNumber',
    'postalCode',
    'nameOnCard',
    'giftToFirstName',
    'giftToLastName',
    'giftFromName'
];

/**
 * HTTP Status Codes
 * @namespace
 */
export const HTTP_STATUS = {
    /** @type {number} Success */
    OK: 200,
    
    /** @type {number} Bad Request */
    BAD_REQUEST: 400,
    
    /** @type {number} Unauthorized */
    UNAUTHORIZED: 401,
    
    /** @type {number} Forbidden */
    FORBIDDEN: 403,
    
    /** @type {number} Not Found */
    NOT_FOUND: 404,
    
    /** @type {number} Too Many Requests */
    RATE_LIMIT: 429,
    
    /** @type {number} Internal Server Error */
    SERVER_ERROR: 500
};

/**
 * Transaction Types
 * @enum {string}
 */
export const TRANSACTION_TYPE = {
    PURCHASE: 'purchase',
    RETURN: 'return',
    ADJUSTMENT: 'adjustment',
    GAS: 'gas'
};

/**
 * Day of Week Labels
 * @type {string[]}
 */
export const DAYS_OF_WEEK = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

/**
 * Unified Constants Object
 * Provides a single frozen object containing all constants for convenience.
 * All nested objects are also frozen to prevent modification.
 * @constant {Object}
 */
export const CONSTANTS = Object.freeze({
    API: Object.freeze({
        GRAPHQL_ENDPOINT: API.ENDPOINT,
        CLIENT_ID: API.CLIENT_ID,
        START_DATE: API.START_DATE,
        PAGE_SIZE: API.PAGE_SIZE,
        FETCH_DELAY_MS: API.FETCH_DELAY_MS,
        METHOD: Object.freeze({
            POST: 'POST',
            GET: 'GET'
        }),
        STATUS: Object.freeze({
            OK: HTTP_STATUS.OK,
            UNAUTHORIZED: HTTP_STATUS.UNAUTHORIZED,
            NOT_FOUND: HTTP_STATUS.NOT_FOUND,
            SERVER_ERROR: HTTP_STATUS.SERVER_ERROR
        }),
        HEADERS: Object.freeze({
            CONTENT_TYPE: 'Content-Type',
            JSON: 'application/json'
        })
    }),
    BUSINESS: Object.freeze({
        REWARDS_RATE: BUSINESS.REWARDS_RATE,
        MAX_REWARD: 1000,
        CITI_GAS_REWARDS_RATE: BUSINESS.CITI_GAS_REWARDS_RATE,
        CITI_RESTAURANT_REWARDS_RATE: BUSINESS.CITI_RESTAURANT_REWARDS_RATE,
        CITI_DEFAULT_REWARDS_RATE: BUSINESS.CITI_DEFAULT_REWARDS_RATE,
        TRANSACTION_TYPE: Object.freeze({
            WAREHOUSE: 'warehouse',
            ONLINE: 'online',
            GAS: 'gas'
        }),
        REFUND_TYPE: Object.freeze({
            FULL_RETURN: 'full_return',
            PRICE_ADJUSTMENT: 'price_adjustment'
        })
    }),
    UI: Object.freeze({
        DEFAULT_PAGE_SIZE: UI.MAX_TABLE_ROWS,
        SEARCH_DEBOUNCE_MS: UI.SEARCH_DEBOUNCE_MS,
        FILTER_DEBOUNCE_MS: UI.FILTER_DEBOUNCE_MS,
        MAX_TABLE_ROWS: UI.MAX_TABLE_ROWS,
        VIRTUAL_SCROLL_BUFFER: UI.VIRTUAL_SCROLL_BUFFER,
        DATE_FORMAT: FORMATS.DATE_US,
        LOADING_MESSAGE: 'Loading...',
        ERROR_MESSAGE: 'An error occurred'
    }),
    FORMATS: Object.freeze({
        LOCALE: CURRENCY.LOCALE,
        CURRENCY: CURRENCY.CODE,
        DATE_US: FORMATS.DATE_US,
        DATE_ISO: FORMATS.DATE_ISO,
        MONTH_DISPLAY: FORMATS.MONTH_DISPLAY,
        DATE_OPTIONS: Object.freeze(FORMATS.DATE_OPTIONS)
    }),
    CHART: Object.freeze({
        COLORS: Object.freeze([
            '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
            '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
        ]),
        TYPE: Object.freeze({
            BAR: 'bar',
            LINE: 'line',
            PIE: 'pie'
        }),
        DARK_COLOR: CHART.DARK_COLOR,
        LIGHT_COLOR: CHART.LIGHT_COLOR,
        DARK_GRID: CHART.DARK_GRID,
        LIGHT_GRID: CHART.LIGHT_GRID,
        DEFAULT_HEIGHT: CHART.DEFAULT_HEIGHT,
        ANIMATION_DURATION: CHART.ANIMATION_DURATION
    }),
    STORAGE: Object.freeze({
        PREFIX: 'costco-dashboard',
        THEME: STORAGE.THEME,
        FILTERS: STORAGE.FILTERS,
        CLIENT_ID: STORAGE.CLIENT_ID,
        ID_TOKEN: STORAGE.ID_TOKEN
    }),
    HTTP_STATUS: Object.freeze({
        OK: HTTP_STATUS.OK,
        BAD_REQUEST: HTTP_STATUS.BAD_REQUEST,
        UNAUTHORIZED: HTTP_STATUS.UNAUTHORIZED,
        FORBIDDEN: HTTP_STATUS.FORBIDDEN,
        NOT_FOUND: HTTP_STATUS.NOT_FOUND,
        RATE_LIMIT: HTTP_STATUS.RATE_LIMIT,
        SERVER_ERROR: HTTP_STATUS.SERVER_ERROR
    }),
    TRANSACTION_TYPE: Object.freeze({
        PURCHASE: TRANSACTION_TYPE.PURCHASE,
        RETURN: TRANSACTION_TYPE.RETURN,
        ADJUSTMENT: TRANSACTION_TYPE.ADJUSTMENT,
        GAS: TRANSACTION_TYPE.GAS
    }),
    PII_FIELDS: Object.freeze([...PII_FIELDS]),
    DAYS_OF_WEEK: Object.freeze([...DAYS_OF_WEEK])
});
