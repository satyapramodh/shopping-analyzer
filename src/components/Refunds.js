/**
 * Refunds Tab Component
 * Refunds and returns analysis
 * @module components/Refunds
 */

import { BaseComponent } from './BaseComponent.js';
import { logger } from '../utils/logger.js';
import { formatMoney, formatDate } from '../utils/formatters.js';
import { collectRefundInsights } from '../utils/dataTransforms.js';

const log = logger.createChild('RefundsComponent');

/**
 * Refunds component
 * 
 * @class RefundsComponent
 * @extends BaseComponent
 */
export class RefundsComponent extends BaseComponent {
  constructor() {
    super('Refunds', 'refunds');
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

    log.info('Initializing Refunds component');
    this.cacheDom();

    this.subscribeToState('filteredData', (data) => {
      this.render(data);
    });

    this.isInitialized = true;
    log.info('Refunds component initialized');
  }

  /**
   * Cache DOM references.
   * @private
   */
  cacheDom() {
    const container = this.getContainer();
    this.cards = {
      totalReturned: container.querySelector('#ref-totalReturned'),
      returnCount: container.querySelector('#ref-returnCount'),
      totalAdjustments: container.querySelector('#ref-totalAdjustments'),
      rate: container.querySelector('#ref-rate'),
      netSpend: container.querySelector('#ref-netSpend')
    };
    this.returnsBody = container.querySelector('#returnsTable tbody');
    this.adjustmentsBody = container.querySelector('#adjustmentsTable tbody');
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

    this.summary = collectRefundInsights(data);
    this.renderCards();
    this.renderTables();
    this.renderChart();
  }

  /**
   * Render placeholder when no data.
   * @private
   */
  renderEmptyState() {
    if (this.returnsBody) {
      this.returnsBody.innerHTML = '<tr><td colspan="5">No returns</td></tr>';
    }
    if (this.adjustmentsBody) {
      this.adjustmentsBody.innerHTML = '<tr><td colspan="5">No adjustments</td></tr>';
    }
    if (this.cards.totalReturned) {
      this.cards.totalReturned.textContent = '$0.00';
      this.cards.returnCount.textContent = '0 Items';
      this.cards.totalAdjustments.textContent = '$0.00';
      this.cards.rate.textContent = '0.0%';
      this.cards.netSpend.textContent = '$0.00';
    }
  }

  /**
   * Update KPI cards.
   * @private
   */
  renderCards() {
    if (!this.summary || !this.cards.totalReturned) {
      return;
    }
    const { totalReturned, returnCount, totalAdjustments, totalPurchases } = this.summary;
    this.cards.totalReturned.textContent = formatMoney(totalReturned);
    this.cards.returnCount.textContent = `${returnCount} Items`;
    this.cards.totalAdjustments.textContent = formatMoney(totalAdjustments);
    const rate = totalPurchases > 0 ? (totalReturned / totalPurchases) * 100 : 0;
    this.cards.rate.textContent = `${rate.toFixed(2)}%`;
    const netSpend = totalPurchases - totalReturned - totalAdjustments;
    this.cards.netSpend.textContent = formatMoney(netSpend);
  }

  /**
   * Render returns and adjustments tables.
   * @private
   */
  renderTables() {
    if (!this.summary) {
      return;
    }
    if (this.returnsBody) {
      const rows = this.summary.returns.map((entry) => `
        <tr>
          <td>${entry.name}</td>
          <td>${entry.returnDate ? formatDate(entry.returnDate) : '-'}</td>
          <td>${entry.buyDate ? formatDate(entry.buyDate) : '-'}</td>
          <td>${entry.daysKept ? `${entry.daysKept} days` : '-'}</td>
          <td class="money">${formatMoney(entry.amount)}</td>
        </tr>
      `).join('');
      this.returnsBody.innerHTML = rows || '<tr><td colspan="5">No returns</td></tr>';
    }
    if (this.adjustmentsBody) {
      const rows = this.summary.adjustments.map((entry) => `
        <tr>
          <td>${entry.name}</td>
          <td>${entry.returnDate ? formatDate(entry.returnDate) : '-'}</td>
          <td class="money">${formatMoney(entry.amount)}</td>
          <td class="money">-</td>
          <td>-</td>
        </tr>
      `).join('');
      this.adjustmentsBody.innerHTML = rows || '<tr><td colspan="5">No adjustments</td></tr>';
    }
  }

  /**
   * Render department chart.
   * @private
   */
  renderChart() {
    if (!this.summary) {
      return;
    }
    const labels = this.summary.byDepartment.map((dept) => dept.name);
    const values = this.summary.byDepartment.map((dept) => dept.amount);
    this.chartService.createChart('refundsDeptChart', 'bar', {
      labels,
      datasets: [{ label: 'Refunded Amount', data: values }]
    });
  }
}
