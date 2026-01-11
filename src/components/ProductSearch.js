/**
 * ProductSearch Tab Component
 * Product search and analysis
 * @module components/ProductSearch
 */

import { BaseComponent } from './BaseComponent.js';
import { logger } from '../utils/logger.js';
import { formatMoney, formatDate } from '../utils/formatters.js';
import { buildItemSummaries, getMonthKey } from '../utils/dataTransforms.js';

const log = logger.createChild('ProductSearchComponent');

/**
 * ProductSearch component
 * 
 * @class ProductSearchComponent
 * @extends BaseComponent
 */
export class ProductSearchComponent extends BaseComponent {
  constructor() {
    super('ProductSearch', 'products');
    this.items = [];
    this.filteredItems = [];
    this.activeItem = null;
    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleTableClick = this.handleTableClick.bind(this);
  }

  /**
   * Initialize the component
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    log.info('Initializing ProductSearch component');

    this.cacheDomReferences();
    this.attachEventListeners();

    this.subscribeToState('filteredData', (data) => {
      this.render(data);
    });

    this.isInitialized = true;
    log.info('ProductSearch component initialized');
  }

  /**
   * Cache frequently accessed DOM nodes for quicker updates.
   * @private
   */
  cacheDomReferences() {
    const container = this.getContainer();
    this.searchInput = container.querySelector('#productSearch');
    this.sortSelect = container.querySelector('#productSort');
    this.tableBody = container.querySelector('#productTable tbody');
    this.detailPanel = container.querySelector('#productDetailPanel');
    this.detailFields = {
      name: container.querySelector('#pd-name'),
      id: container.querySelector('#pd-id'),
      total: container.querySelector('#pd-total'),
      discounts: container.querySelector('#pd-discountTotal'),
      discountCount: container.querySelector('#pd-discountCount'),
      refunds: container.querySelector('#pd-refundTotal'),
      refundCount: container.querySelector('#pd-refundCount'),
      netSpend: container.querySelector('#pd-netSpend'),
      effectivePrice: container.querySelector('#pd-effectivePrice'),
      firstDate: container.querySelector('#pd-firstDate'),
      lastDate: container.querySelector('#pd-lastDate'),
      frequency: container.querySelector('#pd-frequency'),
      minPrice: container.querySelector('#pd-minPrice'),
      maxPrice: container.querySelector('#pd-maxPrice'),
      priceChange: container.querySelector('#pd-priceChange'),
      link: container.querySelector('#pd-link')
    };
  }

  /**
   * Attach DOM event listeners.
   * @private
   */
  attachEventListeners() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this.handleSearchChange);
    }
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', this.handleSearchChange);
    }
    if (this.tableBody) {
      this.tableBody.addEventListener('click', this.handleTableClick);
    }
  }

  /**
   * Handle search and sort updates.
   * @private
   */
  handleSearchChange() {
    this.updateTable();
  }

  /**
   * Handle row selection via event delegation.
   * @param {MouseEvent} event - Click event.
   * @private
   */
  handleTableClick(event) {
    const row = event.target.closest('tr[data-item-id]');
    if (!row) {
      return;
    }
    const itemId = row.getAttribute('data-item-id');
    const match = this.items.find((item) => item.id === itemId);
    if (match) {
      this.activeItem = match;
      this.renderDetail(match);
    }
  }

  /**
   * Render component with new data.
   * @param {Array<Object>} data - Filtered transaction data.
   */
  render(data) {
    if (!Array.isArray(data) || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.items = buildItemSummaries(data);
    this.updateTable();

    if (this.activeItem) {
      const refreshed = this.items.find((item) => item.id === this.activeItem.id);
      if (refreshed) {
        this.renderDetail(refreshed);
      }
    }
  }

  /**
   * Render placeholder state when no data is present.
   * @private
   */
  renderEmptyState() {
    if (this.tableBody) {
      this.tableBody.innerHTML = '<tr><td colspan="6">Upload receipts to see product insights.</td></tr>';
    }
    if (this.detailPanel) {
      this.detailPanel.style.display = 'none';
    }
  }

  /**
   * Apply search and sort operations then render the table.
   * @private
   */
  updateTable() {
    if (!this.tableBody) {
      return;
    }
    const query = (this.searchInput?.value || '').toLowerCase().trim();
    const sortMode = this.sortSelect?.value || 'spend';

    const filtered = this.items.filter((item) => {
      if (!query) {
        return true;
      }
      const matchesName = item.name.toLowerCase().includes(query);
      const matchesId = item.id.toLowerCase().includes(query);
      return matchesName || matchesId;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortMode === 'count') {
        return b.unitCount - a.unitCount;
      }
      if (sortMode === 'priceDesc') {
        return this.getAveragePrice(b) - this.getAveragePrice(a);
      }
      if (sortMode === 'priceAsc') {
        return this.getAveragePrice(a) - this.getAveragePrice(b);
      }
      return b.totalSpent - a.totalSpent;
    }).slice(0, 50);

    this.filteredItems = sorted;
    this.tableBody.innerHTML = sorted.map((item) => this.renderRow(item)).join('');
  }

  /**
   * Create markup for a table row.
   * @param {Object} item - Item summary.
   * @returns {string} Row HTML string.
   * @private
   */
  renderRow(item) {
    const avgPrice = this.getAveragePrice(item);
    return `
      <tr data-item-id="${item.id}">
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td class="money">${formatMoney(avgPrice)}</td>
        <td class="money">${formatMoney(item.totalSpent)}</td>
        <td>${item.unitCount}</td>
        <td><button type="button">View</button></td>
      </tr>
    `;
  }

  /**
   * Calculate average purchase price for an item.
   * @param {Object} item - Item summary object.
   * @returns {number} Average price.
   * @private
   */
  getAveragePrice(item) {
    if (!item || !item.unitCount) {
      return 0;
    }
    return item.totalSpent / item.unitCount;
  }

  /**
   * Render the detail panel for the supplied item.
   * @param {Object} item - Item summary object.
   * @private
   */
  renderDetail(item) {
    if (!this.detailPanel || !item) {
      return;
    }
    this.detailPanel.style.display = 'block';
    this.detailFields.name.textContent = item.name;
    this.detailFields.id.textContent = `#${item.id}`;
    this.detailFields.total.textContent = formatMoney(item.totalSpent);
    this.detailFields.discounts.textContent = formatMoney(item.discountTotal);
    this.detailFields.discountCount.textContent = `${item.discountCount} Times`;
    this.detailFields.refunds.textContent = formatMoney(item.totalRefunded);
    this.detailFields.refundCount.textContent = `${item.refundCount} Returned`;
    this.detailFields.netSpend.textContent = formatMoney(item.netSpend);
    this.detailFields.effectivePrice.textContent = formatMoney(this.getAveragePrice(item));
    this.detailFields.firstDate.textContent = item.firstPurchase ? formatDate(item.firstPurchase) : '-';
    this.detailFields.lastDate.textContent = item.lastPurchase ? formatDate(item.lastPurchase) : '-';
    this.detailFields.frequency.textContent = this.getFrequencyLabel(item);
    this.detailFields.minPrice.textContent = formatMoney(this.getExtremePrice(item, 'min'));
    this.detailFields.maxPrice.textContent = formatMoney(this.getExtremePrice(item, 'max'));
    this.detailFields.priceChange.textContent = this.getPriceChangeLabel(item);
    if (this.detailFields.link) {
      this.detailFields.link.href = `https://www.costco.com/s?keyword=${encodeURIComponent(item.id)}`;
    }

    this.renderPriceHistoryChart(item);
    this.renderVolumeChart(item);
    this.renderYearlySpendChart(item);
    this.renderCumulativeChart(item);
    this.renderTransactionsList(item);
  }

  /**
   * Provide a human readable purchase frequency label.
   * @param {Object} item - Item summary.
   * @returns {string} Frequency text.
   * @private
   */
  getFrequencyLabel(item) {
    const events = item.purchaseEvents;
    if (!events || events.length < 2) {
      return 'One-time purchase';
    }
    const first = events[0].date;
    const last = events[events.length - 1].date;
    if (!first || !last) {
      return 'Multiple purchases';
    }
    const spanDays = Math.max(1, (last - first) / (1000 * 60 * 60 * 24));
    const avgDays = spanDays / (events.length - 1);
    return `Every ~${Math.round(avgDays)} days`;
  }

  /**
   * Retrieve minimum or maximum unit price.
   * @param {Object} item - Item summary.
   * @param {'min'|'max'} type - Extremum type.
   * @returns {number} Price value.
   * @private
   */
  getExtremePrice(item, type) {
    const prices = item.purchaseEvents
      .filter((event) => Number.isFinite(event.price))
      .map((event) => event.price);
    if (!prices.length) {
      return 0;
    }
    return type === 'min' ? Math.min(...prices) : Math.max(...prices);
  }

  /**
   * Build price change label.
   * @param {Object} item - Item summary.
   * @returns {string} Label with sign.
   * @private
   */
  getPriceChangeLabel(item) {
    const events = item.purchaseEvents;
    if (!events.length) {
      return '-';
    }
    const first = events[0].price || 0;
    const last = events[events.length - 1].price || 0;
    const diff = last - first;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${formatMoney(diff)}`;
  }

  /**
   * Render price history line chart.
   * @param {Object} item - Item summary.
   * @private
   */
  renderPriceHistoryChart(item) {
    const labels = item.purchaseEvents.map((event) => event.date ? formatDate(event.date) : 'Unknown');
    const values = item.purchaseEvents.map((event) => event.price);
    this.chartService.createChart('pd-priceChart', 'line', {
      labels,
      datasets: [{ label: 'Unit Price', data: values }]
    }, { tension: 0.3 });
  }

  /**
   * Render monthly volume bar chart.
   * @param {Object} item - Item summary.
   * @private
   */
  renderVolumeChart(item) {
    const monthly = new Map();
    item.purchaseEvents.forEach((event) => {
      if (!event.date) {
        return;
      }
      const key = getMonthKey(event.date.toISOString());
      monthly.set(key, (monthly.get(key) || 0) + (event.quantity || 0));
    });
    const labels = Array.from(monthly.keys()).sort();
    const values = labels.map((label) => monthly.get(label));
    this.chartService.createChart('pd-volumeChart', 'bar', {
      labels,
      datasets: [{ label: 'Units Purchased', data: values }]
    });
  }

  /**
   * Render yearly spend bar chart.
   * @param {Object} item - Item summary.
   * @private
   */
  renderYearlySpendChart(item) {
    const yearly = new Map();
    item.purchaseEvents.forEach((event) => {
      if (!event.date) {
        return;
      }
      const year = String(event.date.getFullYear());
      yearly.set(year, (yearly.get(year) || 0) + (event.total || 0));
    });
    const labels = Array.from(yearly.keys()).sort();
    const values = labels.map((label) => yearly.get(label));
    this.chartService.createChart('pd-yearSpendChart', 'bar', {
      labels,
      datasets: [{ label: 'Annual Spend', data: values }]
    });
  }

  /**
   * Render cumulative spend line chart.
   * @param {Object} item - Item summary.
   * @private
   */
  renderCumulativeChart(item) {
    let running = 0;
    const labels = [];
    const values = [];
    item.purchaseEvents.forEach((event) => {
      running += event.total || 0;
      labels.push(event.date ? formatDate(event.date) : 'Unknown');
      values.push(running);
    });
    this.chartService.createChart('pd-cumulativeChart', 'line', {
      labels,
      datasets: [{ label: 'Cumulative Spend', data: values }]
    }, { tension: 0.3 });
  }

  /**
   * Render transaction history list for the selected product.
   * @param {Object} item - Item summary.
   * @private
   */
  renderTransactionsList(item) {
    const container = this.getContainer().querySelector('#pd-transactionsList');
    if (!container) {
      return;
    }
    const rows = item.purchaseEvents.slice().reverse().map((event) => `
      <tr>
        <td>${event.date ? formatDate(event.date) : '-'}</td>
        <td>${event.warehouse || 'Unknown'}</td>
        <td class="money">${formatMoney(event.price || 0)}</td>
        <td>${event.quantity || 0}</td>
        <td class="money">${formatMoney(event.total || 0)}</td>
      </tr>
    `).join('');
    container.innerHTML = `
      <table style="width:100%">
        <thead>
          <tr>
            <th>Date</th>
            <th>Warehouse</th>
            <th class="money">Unit Price</th>
            <th>Qty</th>
            <th class="money">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }
}
