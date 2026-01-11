/**
 * Overview Tab Component
 * Displays key metrics and spending trends
 * @module components/Overview
 */

import { BaseComponent } from './BaseComponent.js';
import { logger } from '../utils/logger.js';
import { formatMoney } from '../utils/formatters.js';
import { getCalculationService } from '../services/CalculationService.js';

const log = logger.createChild('OverviewComponent');

/**
 * Overview dashboard tab component
 * Shows KPI cards, monthly trends, and department breakdown
 * 
 * @class OverviewComponent
 * @extends BaseComponent
 */
export class OverviewComponent extends BaseComponent {
  constructor() {
    super('Overview', 'overview');
    this.calc = getCalculationService();
  }

  /**
   * Initialize the overview component
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    log.info('Initializing Overview component');

    // Subscribe to filtered data changes
    this.subscribeToState('filteredData', (data) => {
      this.render(data);
    });

    // Subscribe to processed stats
    this.subscribeToState('processedStats', (stats) => {
      this.renderStats(stats);
    });

    this.isInitialized = true;
    log.info('Overview component initialized');
  }

  /**
   * Render KPI cards with stats
   * @private
   * @param {Object} stats - Processed statistics
   */
  renderStats(stats) {
    if (!stats) return;

    // Update KPI cards
    this.updateElement('ov-totalSpent', formatMoney(stats.totalSpent || 0));
    this.updateElement('ov-itemCount', `${stats.itemCount || 0} Items`);
    this.updateElement('ov-visits', stats.visitCount || 0);
    this.updateElement('ov-avgVisit', `Avg ${formatMoney(stats.avgTransaction || 0)} / trip`);
    this.updateElement('ov-gasSpent', formatMoney(stats.gasSpent || 0));
    this.updateElement('ov-gasGallons', `${(stats.gasGallons || 0).toFixed(1)} Gallons`);
    this.updateElement('ov-rewards', formatMoney(stats.estimatedRewards || 0));
    this.updateElement('ov-refunds', formatMoney(stats.totalRefunded || 0));
    this.updateElement('ov-refundCount', `${stats.refundCount || 0} Returns`);
    this.updateElement('ov-onlineSpent', formatMoney(stats.onlineSpent || 0));
    this.updateElement('ov-onlineCount', `${stats.onlineOrderCount || 0} Orders`);

    log.debug('KPI cards updated', { totalSpent: stats.totalSpent });
  }

  /**
   * Render the overview tab
   * @param {Array<Object>} data - Filtered transaction data
   */
  render(data) {
    if (!data || !Array.isArray(data)) {
      log.warn('Invalid data provided to render');
      return;
    }

    log.info(`Rendering overview with ${data.length} records`);

    // Render charts
    this.renderMonthlyChart(data);
    this.renderDepartmentChart(data);
  }

  /**
   * Render monthly spending trend chart
   * @private
   * @param {Array<Object>} data - Transaction data
   */
  renderMonthlyChart(data) {
    // Aggregate by month
    const monthlySpend = {};
    data.forEach(record => {
      if (record.transactionDate) {
        const monthKey = record.transactionDate.substring(0, 7); // YYYY-MM
        monthlySpend[monthKey] = (monthlySpend[monthKey] || 0) + (record.total || 0);
      }
    });

    // Sort months
    const sortedMonths = Object.keys(monthlySpend).sort();
    const values = sortedMonths.map(month => monthlySpend[month]);

    // Create chart
    this.chartService.createChart('monthlyChart', 'line', {
      labels: sortedMonths,
      datasets: [{
        label: 'Monthly Spend',
        data: values,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true
      }]
    }, {
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatMoney(value)
          }
        }
      }
    });
  }

  /**
   * Render department spending chart
   * @private
   * @param {Array<Object>} data - Transaction data
   */
  renderDepartmentChart(data) {
    // Aggregate by department
    const deptSpend = {};
    data.forEach(record => {
      if (record.itemArray) {
        record.itemArray.forEach(item => {
          const dept = item.itemDepartmentNumber || 'Other';
          deptSpend[dept] = (deptSpend[dept] || 0) + (item.amount || 0);
        });
      }
    });

    // Get top 10 departments
    const sorted = Object.entries(deptSpend)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const labels = sorted.map(([dept]) => dept);
    const values = sorted.map(([, amount]) => amount);

    // Create chart
    this.chartService.createChart('deptPieChart', 'doughnut', {
      labels,
      datasets: [{
        data: values
      }]
    }, {
      plugins: {
        legend: {
          position: 'right'
        }
      }
    });
  }

  /**
   * Update element text content
   * @private
   * @param {string} elementId - Element ID
   * @param {string|number} value - Value to set
   */
  updateElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value;
    }
  }
}
