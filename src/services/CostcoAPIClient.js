/**
 * Costco API Client - Facade pattern for API interactions
 * Centralizes all API calls, authentication, and error handling
 * @module services/CostcoAPIClient
 */

import { APIError, NetworkError, ConfigurationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { CONSTANTS } from '../utils/constants.js';
import {
  RECEIPTS_WITH_COUNTS_QUERY,
  GET_ONLINE_ORDERS_QUERY,
  GET_ORDER_DETAILS_QUERY
} from '../graphql/queries.js';

const log = logger.createChild('CostcoAPIClient');

/**
 * Facade for Costco GraphQL API interactions
 * Implements Facade pattern to simplify API access and centralize authentication
 * 
 * @class CostcoAPIClient
 * @example
 * const client = new CostcoAPIClient();
 * const receipts = await client.fetchReceipts('01/01/2023', '12/31/2023');
 */
export class CostcoAPIClient {
  /**
   * @param {Object} [config={}] - Configuration options
   * @param {string} [config.apiEndpoint] - API endpoint URL
   * @param {string} [config.clientId] - Client ID for authentication
   * @param {string} [config.idToken] - Bearer token for authentication
   */
  constructor(config = {}) {
    this.apiEndpoint = config.apiEndpoint || CONSTANTS.API.ENDPOINT;
    this.clientId = config.clientId || null;
    this.idToken = config.idToken || null;
    this.requestCount = 0;
    log.info('CostcoAPIClient initialized');
  }

  /**
   * Set authentication credentials
   * @param {string} clientId - Client identifier from localStorage
   * @param {string} idToken - Bearer token from localStorage
   * @throws {ConfigurationError} If credentials are invalid
   */
  setCredentials(clientId, idToken) {
    if (!clientId || typeof clientId !== 'string') {
      throw new ConfigurationError('Invalid clientId provided', { clientId });
    }
    if (!idToken || typeof idToken !== 'string') {
      throw new ConfigurationError('Invalid idToken provided');
    }
    
    this.clientId = clientId;
    this.idToken = idToken;
    log.debug('Credentials set successfully');
  }

  /**
   * Load credentials from localStorage
   * @throws {ConfigurationError} If credentials not found in localStorage
   */
  loadCredentialsFromStorage() {
    const clientId = localStorage.getItem('clientID');
    const idToken = localStorage.getItem('idToken');
    
    if (!clientId || !idToken) {
      throw new ConfigurationError(
        'Authentication credentials not found in localStorage. Please ensure clientID and idToken are set.'
      );
    }
    
    this.setCredentials(clientId, idToken);
  }

  /**
   * Build request headers for Costco API
   * @private
   * @returns {Object} Headers object
   * @throws {ConfigurationError} If credentials not set
   */
  _buildHeaders() {
    if (!this.clientId || !this.idToken) {
      throw new ConfigurationError(
        'Credentials not set. Call setCredentials() or loadCredentialsFromStorage() first.'
      );
    }

    return {
      'Content-Type': 'application/json-patch+json',
      'Costco.Env': 'ecom',
      'Costco.Service': 'restOrders',
      'Costco-X-Wcs-Clientid': this.clientId,
      'Client-Identifier': CONSTANTS.API.CLIENT_IDENTIFIER,
      'Costco-X-Authorization': `Bearer ${this.idToken}`
    };
  }

  /**
   * Execute a GraphQL query against Costco API
   * @private
   * @param {string} query - GraphQL query string
   * @param {Object} variables - Query variables
   * @returns {Promise<Object>} Response data
   * @throws {NetworkError} On network failure
   * @throws {APIError} On API error response
   */
  async _executeQuery(query, variables = {}) {
    this.requestCount++;
    const requestId = this.requestCount;
    
    log.debug(`Request #${requestId}: Executing query`, { variables });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.timeout = CONSTANTS.API.TIMEOUT;

      xhr.open('POST', this.apiEndpoint);
      
      // Set headers
      const headers = this._buildHeaders();
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Handle successful response
      xhr.onload = () => {
        if (xhr.status === CONSTANTS.HTTP.OK) {
          log.debug(`Request #${requestId}: Success`, { status: xhr.status });
          resolve(xhr.response);
        } else {
          const error = new APIError(
            `API returned status ${xhr.status}`,
            xhr.status,
            xhr.response
          );
          log.error(`Request #${requestId}: API error`, { error });
          reject(error);
        }
      };

      // Handle network errors
      xhr.onerror = () => {
        const error = new NetworkError('Network request failed');
        log.error(`Request #${requestId}: Network error`, { error });
        reject(error);
      };

      // Handle timeout
      xhr.ontimeout = () => {
        const error = new NetworkError('Request timeout');
        log.error(`Request #${requestId}: Timeout`);
        reject(error);
      };

      // Send request
      xhr.send(JSON.stringify({ query, variables }));
    });
  }

  /**
   * Fetch warehouse receipts (gas and merchandise)
   * @param {string} startDate - Start date in MM/DD/YYYY format
   * @param {string} endDate - End date in MM/DD/YYYY format
   * @returns {Promise<Array>} Array of receipt objects
   * @throws {APIError} On API failure
   * @example
   * const receipts = await client.fetchReceipts('01/01/2023', '12/31/2023');
   * console.log(`Fetched ${receipts.length} receipts`);
   */
  async fetchReceipts(startDate, endDate) {
    log.info('Fetching receipts', { startDate, endDate });
    
    const response = await this._executeQuery(
      RECEIPTS_WITH_COUNTS_QUERY,
      { startDate, endDate }
    );

    if (!response.data?.receiptsWithCounts?.receipts) {
      throw new APIError('Invalid receipts response format', 200, response);
    }

    const receipts = response.data.receiptsWithCounts.receipts;
    log.info(`Fetched ${receipts.length} receipts successfully`);
    return receipts;
  }

  /**
   * Fetch online orders list with pagination
   * @param {string} startDate - Start date in MM/DD/YYYY format
   * @param {string} endDate - End date in MM/DD/YYYY format
   * @param {number} [pageNumber=1] - Page number (1-indexed)
   * @param {number} [pageSize=50] - Items per page
   * @param {string} [warehouseNumber='847'] - Warehouse number
   * @returns {Promise<Object>} Object with pageNumber, pageSize, totalNumberOfRecords, and bcOrders array
   * @throws {APIError} On API failure
   * @example
   * const result = await client.fetchOnlineOrders('01/01/2023', '12/31/2023', 1, 50);
   * console.log(`Page ${result.pageNumber}: ${result.bcOrders.length} of ${result.totalNumberOfRecords}`);
   */
  async fetchOnlineOrders(startDate, endDate, pageNumber = 1, pageSize = 50, warehouseNumber = '847') {
    log.info('Fetching online orders', { startDate, endDate, pageNumber, pageSize });
    
    const response = await this._executeQuery(
      GET_ONLINE_ORDERS_QUERY,
      { startDate, endDate, pageNumber, pageSize, warehouseNumber }
    );

    if (!response.data?.getOnlineOrders || response.data.getOnlineOrders.length === 0) {
      log.warn('No online orders found in response');
      return null;
    }

    const ordersData = response.data.getOnlineOrders[0];
    log.info(`Fetched page ${ordersData.pageNumber}: ${ordersData.bcOrders?.length || 0} orders`);
    return ordersData;
  }

  /**
   * Fetch all online orders across all pages
   * @param {string} startDate - Start date in MM/DD/YYYY format
   * @param {string} endDate - End date in MM/DD/YYYY format
   * @param {number} [pageSize=50] - Items per page
   * @returns {Promise<Array>} Array of all orders
   * @throws {APIError} On API failure
   * @example
   * const allOrders = await client.fetchAllOnlineOrders('01/01/2023', '12/31/2023');
   * console.log(`Fetched ${allOrders.length} total orders`);
   */
  async fetchAllOnlineOrders(startDate, endDate, pageSize = 50) {
    log.info('Fetching all online orders', { startDate, endDate, pageSize });
    
    let pageNumber = 1;
    let allOrders = [];
    let totalRecords = 0;

    while (true) {
      const ordersData = await this.fetchOnlineOrders(startDate, endDate, pageNumber, pageSize);
      
      if (!ordersData) {
        break;
      }

      totalRecords = ordersData.totalNumberOfRecords;
      if (ordersData.bcOrders) {
        allOrders = allOrders.concat(ordersData.bcOrders);
      }

      log.debug(`Progress: ${allOrders.length}/${totalRecords} orders fetched`);

      if (allOrders.length >= totalRecords) {
        break;
      }

      pageNumber++;
    }

    log.info(`Fetched all ${allOrders.length} online orders successfully`);
    return allOrders;
  }

  /**
   * Fetch detailed information for specific orders
   * @param {string|string[]} orderNumbers - Single order number or array of order numbers
   * @returns {Promise<Array>} Array of order detail objects
   * @throws {APIError} On API failure
   * @example
   * const details = await client.fetchOrderDetails(['123456', '789012']);
   * details.forEach(order => console.log(order.orderNumber, order.status));
   */
  async fetchOrderDetails(orderNumbers) {
    const ordersArray = Array.isArray(orderNumbers) ? orderNumbers : [orderNumbers];
    log.info(`Fetching order details for ${ordersArray.length} order(s)`);
    
    const response = await this._executeQuery(
      GET_ORDER_DETAILS_QUERY,
      { orderNumbers: ordersArray }
    );

    if (!response.data?.getOrderDetails) {
      throw new APIError('Invalid order details response format', 200, response);
    }

    const orderDetails = response.data.getOrderDetails;
    log.info(`Fetched details for ${orderDetails.length} order(s)`);
    return orderDetails;
  }

  /**
   * Get client statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      authenticated: !!(this.clientId && this.idToken)
    };
  }
}

/**
 * Create a singleton instance of CostcoAPIClient
 * @returns {CostcoAPIClient} Shared API client instance
 */
let _instance = null;

export function getAPIClient() {
  if (!_instance) {
    _instance = new CostcoAPIClient();
    _instance.loadCredentialsFromStorage();
  }
  return _instance;
}
