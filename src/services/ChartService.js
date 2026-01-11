/**
 * ChartService - Factory pattern for Chart.js instances
 * Manages chart lifecycle, prevents memory leaks, and centralizes configuration
 * @module services/ChartService
 */

import { logger } from '../utils/logger.js';
import { ChartError } from '../utils/errors.js';
import { CONSTANTS } from '../utils/constants.js';

const log = logger.createChild('ChartService');

/**
 * Factory for creating and managing Chart.js instances
 * Implements Factory pattern to standardize chart creation and lifecycle management
 * 
 * Features:
 * - Prevents memory leaks by properly destroying old charts
 * - Centralizes theme configuration
 * - Provides consistent styling across all charts
 * - Manages chart registry for bulk operations
 * 
 * @class ChartService
 * @example
 * const chartService = new ChartService();
 * chartService.createChart('myChart', 'line', data, options);
 */
export class ChartService {
  /**
   * @param {Object} [config={}] - Configuration options
   * @param {string} [config.theme='dark'] - Default theme ('dark' or 'light')
   */
  constructor(config = {}) {
    /** @private */
    this.charts = new Map();
    
    /** @private */
    this.theme = config.theme || 'dark';
    
    /** @private */
    this.defaultColors = CONSTANTS.CHART.COLORS;
    
    log.info('ChartService initialized', { theme: this.theme });
  }

  /**
   * Get chart instance by ID
   * @param {string} chartId - Canvas element ID
   * @returns {Chart|undefined} Chart.js instance
   */
  getChart(chartId) {
    return this.charts.get(chartId);
  }

  /**
   * Check if a chart exists
   * @param {string} chartId - Canvas element ID
   * @returns {boolean} True if chart exists
   */
  hasChart(chartId) {
    return this.charts.has(chartId);
  }

  /**
   * Destroy a chart and remove from registry
   * Prevents memory leaks by properly cleaning up Chart.js instances
   * @param {string} chartId - Canvas element ID
   * @returns {boolean} True if chart was destroyed, false if not found
   */
  destroyChart(chartId) {
    const chart = this.charts.get(chartId);
    if (chart) {
      try {
        chart.destroy();
        this.charts.delete(chartId);
        log.debug(`Chart destroyed: ${chartId}`);
        return true;
      } catch (error) {
        log.error(`Error destroying chart: ${chartId}`, { error });
        throw new ChartError(`Failed to destroy chart: ${chartId}`, { chartId, cause: error });
      }
    }
    return false;
  }

  /**
   * Destroy all managed charts
   * Useful for cleanup on page unload or data refresh
   */
  destroyAllCharts() {
    const count = this.charts.size;
    log.info(`Destroying ${count} chart(s)`);
    
    for (const chartId of this.charts.keys()) {
      this.destroyChart(chartId);
    }
  }

  /**
   * Build default chart options based on chart type and theme
   * @private
   * @param {string} type - Chart type ('line', 'bar', 'doughnut', 'pie')
   * @param {Object} customOptions - Custom options to merge
   * @returns {Object} Merged options object
   */
  _buildOptions(type, customOptions = {}) {
    const isDarkTheme = this.theme === 'dark';
    const textColor = isDarkTheme ? CONSTANTS.CHART.THEME.DARK.TEXT : CONSTANTS.CHART.THEME.LIGHT.TEXT;
    const gridColor = isDarkTheme ? CONSTANTS.CHART.THEME.DARK.GRID : CONSTANTS.CHART.THEME.LIGHT.GRID;

    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type === 'doughnut' || type === 'pie' || customOptions.showLegend || false,
          labels: {
            color: textColor,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: isDarkTheme ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1
        }
      }
    };

    // Add scales for non-circular charts
    if (type !== 'doughnut' && type !== 'pie') {
      baseOptions.scales = {
        x: {
          ticks: { color: textColor },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          ticks: { color: textColor },
          grid: { color: gridColor }
        }
      };
    }

    // Deep merge custom options
    return this._mergeOptions(baseOptions, customOptions);
  }

  /**
   * Deep merge two options objects
   * @private
   * @param {Object} base - Base options
   * @param {Object} custom - Custom options to merge
   * @returns {Object} Merged options
   */
  _mergeOptions(base, custom) {
    const result = { ...base };

    for (const key in custom) {
      if (custom[key] && typeof custom[key] === 'object' && !Array.isArray(custom[key])) {
        result[key] = this._mergeOptions(base[key] || {}, custom[key]);
      } else {
        result[key] = custom[key];
      }
    }

    return result;
  }

  /**
   * Apply color palette to datasets
   * @private
   * @param {Array} datasets - Chart datasets
   * @returns {Array} Datasets with colors applied
   */
  _applyColors(datasets) {
    return datasets.map((dataset, index) => {
      // If dataset already has colors, preserve them
      if (dataset.backgroundColor || dataset.borderColor) {
        return dataset;
      }

      // Apply default color palette
      const color = this.defaultColors[index % this.defaultColors.length];
      return {
        ...dataset,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 2
      };
    });
  }

  /**
   * Create or update a chart
   * If chart already exists, destroys it first to prevent memory leaks
   * 
   * @param {string} chartId - Canvas element ID
   * @param {string} type - Chart type ('line', 'bar', 'doughnut', 'pie', 'scatter', 'bubble', 'radar', 'polarArea')
   * @param {Object} data - Chart data (labels and datasets)
   * @param {Object} [customOptions={}] - Custom Chart.js options
   * @returns {Chart} Chart.js instance
   * @throws {ChartError} If canvas element not found or chart creation fails
   * 
   * @example
   * // Create a line chart
   * chartService.createChart('salesChart', 'line', {
   *   labels: ['Jan', 'Feb', 'Mar'],
   *   datasets: [{
   *     label: 'Sales',
   *     data: [100, 200, 150]
   *   }]
   * });
   * 
   * @example
   * // Create a doughnut chart with custom options
   * chartService.createChart('categoryChart', 'doughnut', {
   *   labels: ['Food', 'Gas', 'Merchandise'],
   *   datasets: [{ data: [500, 200, 300] }]
   * }, {
   *   plugins: {
   *     legend: { position: 'bottom' }
   *   }
   * });
   */
  createChart(chartId, type, data, customOptions = {}) {
    // Validate inputs
    if (!chartId || typeof chartId !== 'string') {
      throw new ChartError('Invalid chartId provided', { chartId });
    }

    if (!type || typeof type !== 'string') {
      throw new ChartError('Invalid chart type provided', { chartId, type });
    }

    if (!data || !data.datasets) {
      throw new ChartError('Invalid chart data provided (missing datasets)', { chartId, data });
    }

    // Get canvas element
    const canvas = document.getElementById(chartId);
    if (!canvas) {
      throw new ChartError(`Canvas element not found: ${chartId}`, { chartId });
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ChartError(`Could not get 2D context for canvas: ${chartId}`, { chartId });
    }

    // Destroy existing chart if present (prevents memory leaks)
    if (this.hasChart(chartId)) {
      log.debug(`Chart already exists, destroying old instance: ${chartId}`);
      this.destroyChart(chartId);
    }

    try {
      // Apply color palette to datasets
      const processedData = {
        ...data,
        datasets: this._applyColors(data.datasets)
      };

      // Build options
      const options = this._buildOptions(type, customOptions);

      // Create chart
      const chart = new Chart(ctx, {
        type,
        data: processedData,
        options
      });

      // Register chart
      this.charts.set(chartId, chart);
      log.debug(`Chart created: ${chartId}`, { type, datasetCount: data.datasets.length });

      return chart;
    } catch (error) {
      log.error(`Failed to create chart: ${chartId}`, { error });
      throw new ChartError(`Failed to create chart: ${chartId}`, { chartId, type, cause: error });
    }
  }

  /**
   * Update chart data
   * More efficient than recreating the entire chart
   * 
   * @param {string} chartId - Canvas element ID
   * @param {Object} newData - New chart data
   * @throws {ChartError} If chart not found
   */
  updateChartData(chartId, newData) {
    const chart = this.charts.get(chartId);
    if (!chart) {
      throw new ChartError(`Chart not found: ${chartId}`, { chartId });
    }

    try {
      chart.data = {
        ...newData,
        datasets: this._applyColors(newData.datasets)
      };
      chart.update();
      log.debug(`Chart data updated: ${chartId}`);
    } catch (error) {
      log.error(`Failed to update chart: ${chartId}`, { error });
      throw new ChartError(`Failed to update chart: ${chartId}`, { chartId, cause: error });
    }
  }

  /**
   * Update chart options
   * @param {string} chartId - Canvas element ID
   * @param {Object} newOptions - New options to merge
   * @throws {ChartError} If chart not found
   */
  updateChartOptions(chartId, newOptions) {
    const chart = this.charts.get(chartId);
    if (!chart) {
      throw new ChartError(`Chart not found: ${chartId}`, { chartId });
    }

    try {
      chart.options = this._mergeOptions(chart.options, newOptions);
      chart.update();
      log.debug(`Chart options updated: ${chartId}`);
    } catch (error) {
      log.error(`Failed to update chart options: ${chartId}`, { error });
      throw new ChartError(`Failed to update chart options: ${chartId}`, { chartId, cause: error });
    }
  }

  /**
   * Set theme for all charts
   * Updates existing charts and sets default for new ones
   * @param {string} theme - Theme name ('dark' or 'light')
   */
  setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') {
      throw new ChartError('Invalid theme. Must be "dark" or "light"', { theme });
    }

    this.theme = theme;
    log.info(`Theme changed to: ${theme}`);

    // Update all existing charts
    for (const [chartId, chart] of this.charts.entries()) {
      try {
        const newOptions = this._buildOptions(chart.config.type, {});
        chart.options = this._mergeOptions(chart.options, newOptions);
        chart.update();
      } catch (error) {
        log.error(`Failed to update theme for chart: ${chartId}`, { error });
      }
    }
  }

  /**
   * Get service statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      chartCount: this.charts.size,
      theme: this.theme,
      chartIds: Array.from(this.charts.keys())
    };
  }
}

/**
 * Create a singleton instance of ChartService
 * @returns {ChartService} Shared chart service instance
 */
let _instance = null;

export function getChartService() {
  if (!_instance) {
    _instance = new ChartService();
  }
  return _instance;
}
