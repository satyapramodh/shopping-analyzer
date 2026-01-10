/**
 * Application Configuration Singleton
 * 
 * Centralized configuration management using the Singleton pattern.
 * Provides single source of truth for all application settings.
 * Prevents multiple configuration instances and ensures consistency.
 * 
 * @module core/Config
 * @author Costco Dashboard Team
 * @since 1.0.0
 */

import { API, BUSINESS, UI, CHART } from '../utils/constants.js';
import { ConfigurationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const configLogger = logger.child('Config');

/**
 * Configuration Singleton Class
 * 
 * Manages all application configuration with validation and defaults.
 * Only one instance exists throughout the application lifecycle.
 * 
 * @example
 * const config = Config.getInstance();
 * console.log(config.apiEndpoint); // Access configuration
 * 
 * @example
 * config.set('theme', 'dark'); // Update configuration
 * const theme = config.get('theme'); // Retrieve value
 */
export class Config {
    /**
     * Singleton instance
     * @private
     * @static
     * @type {Config}
     */
    static #instance = null;

    /**
     * Configuration data store
     * @private
     * @type {Map<string, *>}
     */
    #config = new Map();

    /**
     * Whether configuration has been initialized
     * @private
     * @type {boolean}
     */
    #initialized = false;

    /**
     * Private constructor to enforce singleton pattern
     * @private
     */
    constructor() {
        if (Config.#instance) {
            throw new ConfigurationError('Config', 'Cannot create multiple Config instances. Use Config.getInstance()');
        }
        
        this.#initializeDefaults();
        Config.#instance = this;
        configLogger.info('Configuration singleton initialized');
    }

    /**
     * Gets the singleton instance
     * @static
     * @returns {Config} The singleton Config instance
     * 
     * @example
     * const config = Config.getInstance();
     */
    static getInstance() {
        if (!Config.#instance) {
            Config.#instance = new Config();
        }
        return Config.#instance;
    }

    /**
     * Initializes default configuration values
     * @private
     */
    #initializeDefaults() {
        // API Configuration
        this.#config.set('apiEndpoint', API.ENDPOINT);
        this.#config.set('apiClientId', API.CLIENT_ID);
        this.#config.set('apiStartDate', API.START_DATE);
        this.#config.set('apiPageSize', API.PAGE_SIZE);
        this.#config.set('apiFetchDelayMs', API.FETCH_DELAY_MS);

        // Business Configuration
        this.#config.set('rewardsRate', BUSINESS.REWARDS_RATE);
        this.#config.set('citiGasRewardsRate', BUSINESS.CITI_GAS_REWARDS_RATE);
        this.#config.set('citiRestaurantRewardsRate', BUSINESS.CITI_RESTAURANT_REWARDS_RATE);
        this.#config.set('citiDefaultRewardsRate', BUSINESS.CITI_DEFAULT_REWARDS_RATE);

        // UI Configuration
        this.#config.set('searchDebounceMs', UI.SEARCH_DEBOUNCE_MS);
        this.#config.set('filterDebounceMs', UI.FILTER_DEBOUNCE_MS);
        this.#config.set('maxTableRows', UI.MAX_TABLE_ROWS);
        this.#config.set('virtualScrollBuffer', UI.VIRTUAL_SCROLL_BUFFER);

        // Chart Configuration
        this.#config.set('chartDarkColor', CHART.DARK_COLOR);
        this.#config.set('chartLightColor', CHART.LIGHT_COLOR);
        this.#config.set('chartDarkGrid', CHART.DARK_GRID);
        this.#config.set('chartLightGrid', CHART.LIGHT_GRID);
        this.#config.set('chartDefaultHeight', CHART.DEFAULT_HEIGHT);
        this.#config.set('chartAnimationDuration', CHART.ANIMATION_DURATION);

        // Application Settings
        this.#config.set('theme', 'dark');
        this.#config.set('debugMode', false);
        this.#config.set('enableLogging', true);

        this.#initialized = true;
    }

    /**
     * Gets a configuration value
     * @param {string} key - Configuration key
     * @param {*} [defaultValue] - Default value if key doesn't exist
     * @returns {*} Configuration value
     * 
     * @example
     * const apiEndpoint = config.get('apiEndpoint');
     * const customValue = config.get('myKey', 'defaultValue');
     */
    get(key, defaultValue = undefined) {
        if (!this.#config.has(key)) {
            if (defaultValue !== undefined) {
                return defaultValue;
            }
            configLogger.warn('Configuration key not found', { key });
            return undefined;
        }
        return this.#config.get(key);
    }

    /**
     * Sets a configuration value
     * @param {string} key - Configuration key
     * @param {*} value - Configuration value
     * @throws {ConfigurationError} If key is invalid
     * 
     * @example
     * config.set('theme', 'light');
     * config.set('debugMode', true);
     */
    set(key, value) {
        if (typeof key !== 'string' || key.trim() === '') {
            throw new ConfigurationError(key, 'Key must be a non-empty string');
        }

        const oldValue = this.#config.get(key);
        this.#config.set(key, value);
        
        configLogger.debug('Configuration updated', { key, oldValue, newValue: value });
    }

    /**
     * Checks if a configuration key exists
     * @param {string} key - Configuration key
     * @returns {boolean} True if key exists
     * 
     * @example
     * if (config.has('apiEndpoint')) {
     *   console.log('API endpoint is configured');
     * }
     */
    has(key) {
        return this.#config.has(key);
    }

    /**
     * Deletes a configuration value
     * @param {string} key - Configuration key to delete
     * @returns {boolean} True if key was deleted
     * 
     * @example
     * config.delete('customSetting');
     */
    delete(key) {
        const deleted = this.#config.delete(key);
        if (deleted) {
            configLogger.debug('Configuration key deleted', { key });
        }
        return deleted;
    }

    /**
     * Gets all configuration as an object
     * @returns {Object} All configuration values
     * 
     * @example
     * const allConfig = config.getAll();
     * console.log(allConfig);
     */
    getAll() {
        return Object.fromEntries(this.#config);
    }

    /**
     * Loads configuration from an object
     * @param {Object} configObj - Configuration object
     * @throws {ConfigurationError} If configObj is invalid
     * 
     * @example
     * config.load({ theme: 'dark', debugMode: true });
     */
    load(configObj) {
        if (!configObj || typeof configObj !== 'object') {
            throw new ConfigurationError('load', 'Configuration must be an object');
        }

        for (const [key, value] of Object.entries(configObj)) {
            this.set(key, value);
        }

        configLogger.info('Configuration loaded', { keyCount: Object.keys(configObj).length });
    }

    /**
     * Resets configuration to defaults
     * 
     * @example
     * config.reset(); // Restore all defaults
     */
    reset() {
        this.#config.clear();
        this.#initializeDefaults();
        configLogger.info('Configuration reset to defaults');
    }

    /**
     * Validates configuration completeness
     * @returns {boolean} True if all required keys exist
     * 
     * @example
     * if (!config.validate()) {
     *   console.error('Configuration is incomplete');
     * }
     */
    validate() {
        const requiredKeys = [
            'apiEndpoint',
            'apiClientId',
            'rewardsRate'
        ];

        const missingKeys = requiredKeys.filter(key => !this.has(key));
        
        if (missingKeys.length > 0) {
            configLogger.error('Configuration validation failed', { missingKeys });
            return false;
        }

        return true;
    }

    // Convenience getters for commonly used values

    /** @type {string} API endpoint URL */
    get apiEndpoint() { return this.get('apiEndpoint'); }

    /** @type {string} API client ID */
    get apiClientId() { return this.get('apiClientId'); }

    /** @type {string} API start date */
    get apiStartDate() { return this.get('apiStartDate'); }

    /** @type {number} API page size */
    get apiPageSize() { return this.get('apiPageSize'); }

    /** @type {number} API fetch delay in milliseconds */
    get apiFetchDelayMs() { return this.get('apiFetchDelayMs'); }

    /** @type {number} Executive membership rewards rate */
    get rewardsRate() { return this.get('rewardsRate'); }

    /** @type {number} Search debounce delay */
    get searchDebounceMs() { return this.get('searchDebounceMs'); }

    /** @type {number} Filter debounce delay */
    get filterDebounceMs() { return this.get('filterDebounceMs'); }

    /** @type {string} Current theme (light/dark) */
    get theme() { return this.get('theme'); }
    set theme(value) { this.set('theme', value); }

    /** @type {boolean} Debug mode enabled */
    get debugMode() { return this.get('debugMode'); }
    set debugMode(value) { this.set('debugMode', value); }
}

/**
 * Gets the singleton Config instance (convenience export)
 * @returns {Config} Config singleton instance
 * 
 * @example
 * import { getConfig } from './core/Config.js';
 * const config = getConfig();
 */
export function getConfig() {
    return Config.getInstance();
}

// Export singleton instance for direct use
export const config = Config.getInstance();
