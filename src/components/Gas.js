/**
 * Gas Tab Component
 * Gas station spending
 * @module components/Gas
 */

import { BaseComponent } from './BaseComponent.js';
import { logger } from '../utils/logger.js';
import { formatMoney } from '../utils/formatters.js';
import { collectGasInsights } from '../utils/dataTransforms.js';

const log = logger.createChild('GasComponent');

/**
 * Gas component
 * 
 * @class GasComponent
 * @extends BaseComponent
 */
export class GasComponent extends BaseComponent {
  constructor() {
    super('Gas', 'gas');
    this.summary = null;
  }

  /**
   * Initialize the component
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    log.info('Initializing Gas component');
    this.cacheDom();

    this.subscribeToState('filteredData', (data) => {
      this.render(data);
    });

    this.isInitialized = true;
    log.info('Gas component initialized');
  }

  /**
   * Cache DOM references for cards.
   * @private
   */
  cacheDom() {
    const container = this.getContainer();
    this.cards = {
      total: container.querySelector('#gas-totalSpent'),
      gallons: container.querySelector('#gas-totalGallons'),
      avgPrice: container.querySelector('#gas-avgPrice'),
      visits: container.querySelector('#gas-visits'),
      locations: container.querySelector('#gas-locations')
    };
  }

  /**
   * Render component with new data.
   * @param {Array<Object>} data - Filtered transactions.
   */
  render(data) {
    if (!Array.isArray(data) || data.length === 0) {
      this.renderEmpty();
      return;
    }
    this.summary = collectGasInsights(data);
    this.renderCards();
    this.renderPriceHistory();
    this.renderGradeBreakdown();
    this.renderMonthlyTotals();
  }

  /**
   * Render placeholder when no data.
   * @private
   */
  renderEmpty() {
    if (this.cards.total) {
      this.cards.total.textContent = '$0.00';
      this.cards.gallons.textContent = '0';
      this.cards.avgPrice.textContent = '$0.00';
      this.cards.visits.textContent = '0';
      this.cards.locations.textContent = '0 Locations';
    }
    this.chartService.destroyChart('gasPriceHistoryChart');
    this.chartService.destroyChart('gasSpendBreakdownChart');
    this.chartService.destroyChart('gasMonthlyChart');
  }

  /**
   * Update KPI cards.
   * @private
   */
  renderCards() {
    const summary = this.summary;
    this.cards.total.textContent = formatMoney(summary.totalSpent);
    this.cards.gallons.textContent = summary.totalGallons.toFixed(1);
    this.cards.avgPrice.textContent = formatMoney(summary.averagePrice);
    this.cards.visits.textContent = summary.visits;
    this.cards.locations.textContent = `${summary.locationCount} Locations`;
  }

  /**
   * Render price history line chart.
   * @private
   */
  renderPriceHistory() {
    const labels = this.summary.priceHistory.map((row) => row.month);
    const premium = this.summary.priceHistory.map((row) => row.premium);
    const regular = this.summary.priceHistory.map((row) => row.regular);
    this.chartService.createChart('gasPriceHistoryChart', 'line', {
      labels,
      datasets: [
        { label: 'Premium ($/gal)', data: premium },
        { label: 'Regular ($/gal)', data: regular }
      ]
    }, { tension: 0.3 });
  }

  /**
   * Render grade spend breakdown stacked bar chart.
   * @private
   */
  renderGradeBreakdown() {
    const labels = this.summary.gradeBreakdown.map((row) => row.month);
    const premium = this.summary.gradeBreakdown.map((row) => row.premiumSpend);
    const regular = this.summary.gradeBreakdown.map((row) => row.regularSpend);
    this.chartService.createChart('gasSpendBreakdownChart', 'bar', {
      labels,
      datasets: [
        { label: 'Premium Spend', data: premium },
        { label: 'Regular Spend', data: regular }
      ]
    }, {
      showLegend: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    });
  }

  /**
   * Render monthly totals bar chart.
   * @private
   */
  renderMonthlyTotals() {
    const { labels, values } = this.summary.monthly;
    this.chartService.createChart('gasMonthlyChart', 'bar', {
      labels,
      datasets: [{ label: 'Monthly Spend', data: values }]
    });
  }
}
