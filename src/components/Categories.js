/**
 * Categories Tab Component
 * Category spending breakdown
 * @module components/Categories
 */

import { BaseComponent } from './BaseComponent.js';
import { logger } from '../utils/logger.js';
import { formatMoney } from '../utils/formatters.js';
import { buildCategorySummaries } from '../utils/dataTransforms.js';

const log = logger.createChild('CategoriesComponent');

/**
 * Categories component
 * 
 * @class CategoriesComponent
 * @extends BaseComponent
 */
export class CategoriesComponent extends BaseComponent {
  constructor() {
    super('Categories', 'categories');
    this.categories = [];
    this.selectedCategory = null;
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

    log.info('Initializing Categories component');
    this.cacheDomReferences();
    this.attachEvents();

    this.subscribeToState('filteredData', (data) => {
      this.render(data);
    });

    this.isInitialized = true;
    log.info('Categories component initialized');
  }

  /**
   * Cache DOM nodes used for rendering.
   * @private
   */
  cacheDomReferences() {
    const container = this.getContainer();
    this.tableBody = container.querySelector('#categoryListTable tbody');
    this.placeholder = container.querySelector('#cat-placeholder');
    this.detailContent = container.querySelector('#cat-content');
    this.detailFields = {
      title: container.querySelector('#cat-title'),
      total: container.querySelector('#cat-total'),
      refund: container.querySelector('#cat-refund'),
      returnRate: container.querySelector('#cat-returnRate'),
      returnCount: container.querySelector('#cat-returnCount')
    };
    this.topProductsBody = container.querySelector('#cat-topProductsTable tbody');
    this.allProductsBody = container.querySelector('#cat-allProductsTable tbody');
  }

  /**
   * Attach DOM event listeners.
   * @private
   */
  attachEvents() {
    if (this.tableBody) {
      this.tableBody.addEventListener('click', this.handleTableClick);
    }
  }

  /**
   * Handle table row click through delegation.
   * @param {MouseEvent} event - Click event.
   * @private
   */
  handleTableClick(event) {
    const row = event.target.closest('tr[data-category-id]');
    if (!row) {
      return;
    }
    const id = row.getAttribute('data-category-id');
    const match = this.categories.find((category) => category.id === id);
    if (match) {
      this.selectedCategory = match;
      this.renderDetail(match);
    }
  }

  /**
   * Render component with supplied data.
   * @param {Array<Object>} data - Filtered transactions.
   */
  render(data) {
    if (!Array.isArray(data) || data.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.categories = buildCategorySummaries(data);
    this.renderTable();
    if (this.selectedCategory) {
      const refreshed = this.categories.find((category) => category.id === this.selectedCategory.id);
      if (refreshed) {
        this.renderDetail(refreshed);
      }
    } else {
      this.resetDetailPanel();
    }
  }

  /**
   * Render placeholder state when no data.
   * @private
   */
  renderEmptyState() {
    if (this.tableBody) {
      this.tableBody.innerHTML = '<tr><td colspan="3">Upload receipts to view categories.</td></tr>';
    }
    this.resetDetailPanel();
  }

  /**
   * Populate category list table.
   * @private
   */
  renderTable() {
    if (!this.tableBody) {
      return;
    }
    this.tableBody.innerHTML = this.categories.map((category) => `
      <tr data-category-id="${category.id}" style="cursor:pointer">
        <td title="${category.name}" style="font-weight:bold; color:var(--accent-color)">${category.id}</td>
        <td>${category.name}</td>
        <td class="money">${formatMoney(category.spend)}</td>
      </tr>
    `).join('');
  }

  /**
   * Reset detail panel to placeholder view.
   * @private
   */
  resetDetailPanel() {
    if (this.placeholder) {
      this.placeholder.style.display = '';
    }
    if (this.detailContent) {
      this.detailContent.classList.add('hidden');
    }
  }

  /**
   * Render detail section for selected category.
   * @param {Object} category - Category summary.
   * @private
   */
  renderDetail(category) {
    if (!category) {
      this.resetDetailPanel();
      return;
    }
    if (this.placeholder) {
      this.placeholder.style.display = 'none';
    }
    if (this.detailContent) {
      this.detailContent.classList.remove('hidden');
    }
    this.detailFields.title.textContent = category.name;
    this.detailFields.title.setAttribute('data-id', category.id);
    this.detailFields.total.textContent = formatMoney(category.spend);
    this.detailFields.refund.textContent = formatMoney(category.refundAmount);
    const gross = category.spend + category.refundAmount;
    const rate = gross > 0 ? (category.refundAmount / gross) * 100 : 0;
    this.detailFields.returnRate.textContent = `${rate.toFixed(1)}%`;
    this.detailFields.returnCount.textContent = category.returnCount;

    this.renderCategoryChart(category);
    this.renderTopProducts(category);
    this.renderAllProducts(category);
  }

  /**
   * Render monthly spend bar chart.
   * @param {Object} category - Category summary.
   * @private
   */
  renderCategoryChart(category) {
    const labels = category.monthly.map(([month]) => month).sort();
    const values = labels.map((label) => {
      const match = category.monthly.find(([month]) => month === label);
      return match ? match[1] : 0;
    });
    this.chartService.createChart('cat-monthlyChart', 'bar', {
      labels,
      datasets: [{ label: 'Monthly Spend', data: values }]
    });
  }

  /**
   * Render top products table.
   * @param {Object} category - Category summary.
   * @private
   */
  renderTopProducts(category) {
    if (!this.topProductsBody) {
      return;
    }
    const rows = category.items.slice(0, 5).map((item) => `
      <tr>
        <td>${item.name}</td>
        <td class="money">${formatMoney(item.total)}</td>
      </tr>
    `).join('');
    this.topProductsBody.innerHTML = rows || '<tr><td colspan="2">No products</td></tr>';
  }

  /**
   * Render all products table for the category.
   * @param {Object} category - Category summary.
   * @private
   */
  renderAllProducts(category) {
    if (!this.allProductsBody) {
      return;
    }
    const rows = category.items.map((item) => `
      <tr>
        <td>${item.name}</td>
        <td class="money">${formatMoney(item.total)}</td>
        <td>${item.count}</td>
      </tr>
    `).join('');
    this.allProductsBody.innerHTML = rows || '<tr><td colspan="3">No data</td></tr>';
  }
}
