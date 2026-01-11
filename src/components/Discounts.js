/**
 * Discounts Tab Component
 * Discount analysis
 * @module components/Discounts
 */

import { BaseComponent } from './BaseComponent.js';
import { logger } from '../utils/logger.js';
import { formatMoney } from '../utils/formatters.js';
import { collectDiscountInsights } from '../utils/dataTransforms.js';

const log = logger.createChild('DiscountsComponent');

/**
 * Discounts component
 * 
 * @class DiscountsComponent
 * @extends BaseComponent
 */
export class DiscountsComponent extends BaseComponent {
  constructor() {
    super('Discounts', 'discounts');
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

    log.info('Initializing Discounts component');
    this.cacheDom();

    this.subscribeToState('filteredData', (data) => {
      this.render(data);
    });

    this.isInitialized = true;
    log.info('Discounts component initialized');
  }

  /**
   * Cache DOM nodes used in renders.
   * @private
   */
  cacheDom() {
    const container = this.getContainer();
    this.cards = {
      total: container.querySelector('#disc-totalSaved'),
      count: container.querySelector('#disc-count'),
      avg: container.querySelector('#disc-avg'),
      topItem: container.querySelector('#disc-topItem'),
      topAmount: container.querySelector('#disc-topItemAmt')
    };
    this.tableBody = container.querySelector('#topDiscountsTable tbody');
  }

  /**
   * Render component with new data.
   * @param {Array<Object>} data - Filtered transactions.
   */
  render(data) {
    if (!Array.isArray(data) || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.summary = collectDiscountInsights(data);
    this.renderCards();
    this.renderTable();
    this.renderChart();
  }

  /**
   * Render placeholder if no data.
   * @private
   */
  renderEmptyState() {
    if (this.tableBody) {
      this.tableBody.innerHTML = '<tr><td colspan="4">No discounts detected.</td></tr>';
    }
    if (this.cards.total) {
      this.cards.total.textContent = '$0.00';
      this.cards.count.textContent = '0';
      this.cards.avg.textContent = '$0.00';
      this.cards.topItem.textContent = '-';
      this.cards.topAmount.textContent = '$0.00 saved';
    }
  }

  /**
   * Update summary cards.
   * @private
   */
  renderCards() {
    if (!this.summary || !this.cards.total) {
      return;
    }
    const { totalSaved, discountCount, topItems } = this.summary;
    this.cards.total.textContent = formatMoney(totalSaved);
    this.cards.count.textContent = discountCount;
    const avg = discountCount ? totalSaved / discountCount : 0;
    this.cards.avg.textContent = formatMoney(avg);
    const top = topItems[0];
    if (top) {
      this.cards.topItem.textContent = top.name;
      this.cards.topAmount.textContent = `${formatMoney(top.total)} saved`;
    } else {
      this.cards.topItem.textContent = '-';
      this.cards.topAmount.textContent = '$0.00 saved';
    }
  }

  /**
   * Render table of top discounted products.
   * @private
   */
  renderTable() {
    if (!this.tableBody || !this.summary) {
      return;
    }
    const rows = this.summary.topItems.map((item) => `
      <tr>
        <td>${item.name}</td>
        <td class="money">${formatMoney(item.total)}</td>
        <td>${item.count}</td>
        <td class="money">${formatMoney(item.total / (item.count || 1))}</td>
      </tr>
    `).join('');
    this.tableBody.innerHTML = rows || '<tr><td colspan="4">No discount data</td></tr>';
  }

  /**
   * Render doughnut chart of top discounts.
   * @private
   */
  renderChart() {
    if (!this.summary) {
      return;
    }
    const labels = this.summary.topItems.map((item) => item.name);
    const data = this.summary.topItems.map((item) => item.total);
    this.chartService.createChart('discountChart', 'doughnut', {
      labels,
      datasets: [{ data }]
    }, { showLegend: true });
  }
}
