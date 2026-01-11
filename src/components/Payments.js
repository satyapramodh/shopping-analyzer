/**
 * Payments Tab Component
 * Payment method analysis
 * @module components/Payments
 */

import { BaseComponent } from './BaseComponent.js';
import { logger } from '../utils/logger.js';
import { formatMoney } from '../utils/formatters.js';
import { collectPaymentInsights } from '../utils/dataTransforms.js';

const log = logger.createChild('PaymentsComponent');

/**
 * Payments component
 * 
 * @class PaymentsComponent
 * @extends BaseComponent
 */
export class PaymentsComponent extends BaseComponent {
  constructor() {
    super('Payments', 'payments');
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

    log.info('Initializing Payments component');
    this.cacheDom();

    this.subscribeToState('filteredData', (data) => {
      this.render(data);
    });

    this.isInitialized = true;
    log.info('Payments component initialized');
  }

  /**
   * Cache DOM references.
   * @private
   */
  cacheDom() {
    const container = this.getContainer();
    this.cards = {
      total: container.querySelector('#pay-total'),
      methodCount: container.querySelector('#pay-methodCount'),
      topMethod: container.querySelector('#pay-topMethod'),
      topAmount: container.querySelector('#pay-topMethodAmt'),
      rewards: container.querySelector('#pay-citiRewards')
    };
    this.tableBody = container.querySelector('#paymentsTable tbody');
  }

  /**
   * Safely set text for a DOM node.
   * @param {HTMLElement|null} node - Target element.
   * @param {string} value - Desired text.
   * @private
   */
  setText(node, value) {
    if (node) {
      node.textContent = value;
    }
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

    this.summary = collectPaymentInsights(data);
    if (!this.summary.methods.length) {
      this.renderEmpty();
      return;
    }
    this.renderCards();
    this.renderPieChart();
    this.renderHistoryChart();
    this.renderTable();
  }

  /**
   * Render placeholder state.
   * @private
   */
  renderEmpty() {
    if (this.cards) {
      this.setText(this.cards.total, '0');
      this.setText(this.cards.methodCount, '0');
      this.setText(this.cards.topMethod, '-');
      this.setText(this.cards.topAmount, '$0.00');
      this.setText(this.cards.rewards, '$0.00');
    }
    if (this.tableBody) {
      this.tableBody.innerHTML = '<tr><td colspan="5">No payment data</td></tr>';
    }
    this.chartService.destroyChart('payMethodChart');
    this.chartService.destroyChart('payHistoryChart');
  }

  /**
   * Update KPI cards.
   * @private
   */
  renderCards() {
    const { total, methods, rewards } = this.summary;
    if (!this.cards) {
      return;
    }
    this.setText(this.cards.total, formatMoney(total));
    this.setText(this.cards.methodCount, String(methods.length));
    const top = methods[0];
    if (top) {
      this.setText(this.cards.topMethod, top.name);
      this.setText(this.cards.topAmount, formatMoney(top.total));
    } else {
      this.setText(this.cards.topMethod, '-');
      this.setText(this.cards.topAmount, '$0.00');
    }
    this.setText(this.cards.rewards, formatMoney(rewards));
  }

  /**
   * Render payment method pie chart.
   * @private
   */
  renderPieChart() {
    if (!this.summary?.methods.length) {
      this.chartService.destroyChart('payMethodChart');
      return;
    }
    const labels = this.summary.methods.slice(0, 6).map((method) => method.name);
    const data = this.summary.methods.slice(0, 6).map((method) => method.total);
    this.chartService.createChart('payMethodChart', 'doughnut', {
      labels,
      datasets: [{ data }]
    }, { showLegend: true });
  }

  /**
   * Render yearly history stacked bar chart.
   * @private
   */
  renderHistoryChart() {
    if (!this.summary?.methods.length) {
      this.chartService.destroyChart('payHistoryChart');
      return;
    }
    const topMethods = this.summary.methods.slice(0, 5);
    const years = new Set();
    topMethods.forEach((method) => {
      method.yearly.forEach(([year]) => years.add(year));
    });
    const labels = Array.from(years).sort();
    const datasets = topMethods.map((method) => ({
      label: method.name,
      data: labels.map((label) => {
        const match = method.yearly.find(([year]) => year === label);
        return match ? match[1] : 0;
      })
    }));
    this.chartService.createChart('payHistoryChart', 'bar', {
      labels,
      datasets
    }, {
      showLegend: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true }
      }
    });
  }

  /**
   * Render payment method table.
   * @private
   */
  renderTable() {
    if (!this.tableBody) {
      return;
    }
    const rows = this.summary.methods.map((method) => {
      const rewardEstimate = this.estimateRewards(method);
      const share = this.summary.total ? ((method.total / this.summary.total) * 100) : 0;
      const yearlyRows = (method.yearly || []).slice().reverse().map(([year, amount]) => `
        <tr>
          <td style="padding-left:20px;">&rarr; ${method.name}</td>
          <td>${year}</td>
          <td class="money">${formatMoney(amount)}</td>
          <td class="money">-</td>
          <td>-</td>
        </tr>
      `).join('');
      return `
        <tr style="background:rgba(128,128,128,0.1); font-weight:bold;">
          <td>${method.name}</td>
          <td>All Time</td>
          <td class="money">${formatMoney(method.total)}</td>
          <td class="money">${formatMoney(rewardEstimate)}</td>
          <td>${share.toFixed(1)}%</td>
        </tr>
        ${yearlyRows}
      `;
    }).join('');
    this.tableBody.innerHTML = rows || '<tr><td colspan="5">No payment data</td></tr>';
  }

  /**
   * Estimate rewards for a payment method.
   * @param {Object} method - Method entry.
   * @returns {number} Reward estimate.
   * @private
   */
  estimateRewards(method) {
    const name = method.name.toUpperCase();
    if (name.includes('COSTCO VISA')) {
      const gas = method.gasSpend || 0;
      const merch = method.merchSpend || 0;
      return (gas * 0.04) + (merch * 0.02);
    }
    return (method.total || 0) * 0.01;
  }
}
