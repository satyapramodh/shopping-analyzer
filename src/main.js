/**
 * Main Application Entry Point
 * Initializes services, manages tabs, and coordinates data flow
 * @module main
 */

import { logger } from './utils/logger.js';
import { getStateManager } from './core/StateManager.js';
import { getChartService } from './services/ChartService.js';
import { getFilterService } from './services/FilterService.js';
import { createDefaultNormalizer } from './core/DataNormalizer.js';
import { getCalculationService } from './services/CalculationService.js';
import { OverviewComponent } from './components/Overview.js';

const log = logger.createChild('App');

/**
 * Main application class
 * Manages application lifecycle and tab navigation
 * 
 * @class CostcoDashboardApp
 */
class CostcoDashboardApp {
  constructor() {
    this.state = getStateManager();
    this.filterService = getFilterService();
    this.chartService = getChartService();
    this.calc = getCalculationService();
    this.normalizer = createDefaultNormalizer();
    
    this.components = new Map();
    this.activeTab = null; // Start with null so first tab switch works
    
    log.info('CostcoDashboardApp created');
  }

  /**
   * Initialize the application
   * @returns {Promise<void>}
   */
  async init() {
    log.info('Initializing Costco Dashboard Application');

    try {
      // Initialize state
      this.initializeState();

      // Setup event listeners
      this.setupEventListeners();

      // Initialize theme
      this.initializeTheme();

      // Register components (lazy loaded)
      this.registerComponents();

      // Initialize first tab (overview)
      await this.switchTab('overview');

      log.info('Application initialized successfully');
    } catch (error) {
      log.error('Failed to initialize application', { error });
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }

  /**
   * Initialize application state
   * @private
   */
  initializeState() {
    this.state.update({
      rawData: [],
      filteredData: [],
      processedStats: {},
      selectedYears: [],
      selectedLocations: [],
      theme: 'dark',
      isDataLoaded: false
    });

    log.debug('State initialized');
  }

  /**
   * Setup global event listeners
   * @private
   */
  setupEventListeners() {
    // File upload
    const fileInput = document.getElementById('jsonFile');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // Filter button
    const filterBtn = document.getElementById('applyFiltersBtn');
    if (filterBtn) {
      filterBtn.addEventListener('click', () => this.applyFilters());
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Tab buttons - support both data-tab attribute and onclick patterns
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // First check for data-tab attribute (new pattern)
        let tab = e.target.dataset.tab;
        
        // Fallback to onclick pattern (legacy support)
        if (!tab) {
          tab = e.target.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
        }
        
        if (tab) {
          this.switchTab(tab);
        }
      });
    });

    // Filter select/deselect all buttons
    this.setupFilterButtons();

    log.debug('Event listeners setup complete');
  }

  /**
   * Setup filter select/deselect all buttons
   * @private
   */
  setupFilterButtons() {
    // Year filters
    document.getElementById('yearSelectAll')?.addEventListener('click', () => {
      document.querySelectorAll('#yearFilter input[type="checkbox"]').forEach(cb => cb.checked = true);
    });
    document.getElementById('yearDeselectAll')?.addEventListener('click', () => {
      document.querySelectorAll('#yearFilter input[type="checkbox"]').forEach(cb => cb.checked = false);
    });

    // Location filters
    document.getElementById('locSelectAll')?.addEventListener('click', () => {
      document.querySelectorAll('#locationFilter input[type="checkbox"]').forEach(cb => cb.checked = true);
    });
    document.getElementById('locDeselectAll')?.addEventListener('click', () => {
      document.querySelectorAll('#locationFilter input[type="checkbox"]').forEach(cb => cb.checked = false);
    });
  }

  /**
   * Register available components (for lazy loading)
   * @private
   */
  registerComponents() {
    // Component registry with lazy load functions
    this.componentRegistry = {
      'overview': () => Promise.resolve(new OverviewComponent()),
      'products': () => import('./components/ProductSearch.js').then(m => new m.ProductSearchComponent()),
      'categories': () => import('./components/Categories.js').then(m => new m.CategoriesComponent()),
      'discounts': () => import('./components/Discounts.js').then(m => new m.DiscountsComponent()),
      'refunds': () => import('./components/Refunds.js').then(m => new m.RefundsComponent()),
      'gas': () => import('./components/Gas.js').then(m => new m.GasComponent()),
      'payments': () => import('./components/Payments.js').then(m => new m.PaymentsComponent()),
      'price-analysis': () => import('./components/PriceAnalysis.js').then(m => new m.PriceAnalysisComponent()),
      'analysis': () => import('./components/Analysis.js').then(m => new m.AnalysisComponent()),
      'forecast': () => import('./components/Forecast.js').then(m => new m.ForecastComponent())
    };

    log.debug('Component registry initialized', { 
      components: Object.keys(this.componentRegistry) 
    });
  }

  /**
   * Switch to a different tab
   * Implements lazy loading for components
   * @param {string} tabName - Tab name to switch to
   * @returns {Promise<void>}
   */
  async switchTab(tabName) {
    if (this.activeTab === tabName && this.components.has(tabName)) {
      return; // Already on this tab and loaded
    }

    log.info(`Switching to tab: ${tabName}`);

    try {
      // Hide current component
      const currentComponent = this.components.get(this.activeTab);
      if (currentComponent) {
        currentComponent.hide();
      }

      // Update tab button states
      this.updateTabButtons(tabName);

      // Load component if not already loaded (lazy loading)
      if (!this.components.has(tabName)) {
        await this.loadComponent(tabName);
      }

      // Show new component
      const newComponent = this.components.get(tabName);
      if (newComponent) {
        newComponent.show();
        
        // Trigger render with current data
        const filteredData = this.state.get('filteredData');
        if (filteredData && filteredData.length > 0) {
          newComponent.render(filteredData);
        }
      }

      this.activeTab = tabName;
      log.info(`Tab switched successfully: ${tabName}`);

    } catch (error) {
      log.error(`Failed to switch tab: ${tabName}`, { error });
      this.showError(`Failed to load tab: ${tabName}`);
    }
  }

  /**
   * Load and initialize a component
   * @private
   * @param {string} tabName - Tab name
   * @returns {Promise<void>}
   */
  async loadComponent(tabName) {
    const loader = this.componentRegistry[tabName];
    if (!loader) {
      throw new Error(`Unknown tab: ${tabName}`);
    }

    log.debug(`Loading component: ${tabName}`);
    
    // Show loading indicator
    this.showLoading(true);

    try {
      const component = await loader();
      await component.init();
      this.components.set(tabName, component);
      log.info(`Component loaded: ${tabName}`);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Update tab button active states
   * @private
   * @param {string} activeTab - Active tab name
   */
  updateTabButtons(activeTab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      
      // Check for data-tab attribute (new pattern)
      let tabName = btn.dataset.tab;
      
      // Fallback to onclick pattern (legacy support)
      if (!tabName) {
        tabName = btn.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      }
      
      if (tabName === activeTab) {
        btn.classList.add('active');
      }
    });

    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(activeTab);
    if (activeContent) {
      activeContent.classList.add('active');
    }
  }

  /**
   * Handle file upload
   * @private
   * @param {Event} event - File input change event
   * @returns {Promise<void>}
   */
  async handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    log.info('Processing file upload', { fileName: file.name, fileSize: file.size });
    this.showLoading(true);

    try {
      const text = await file.text();
      const rawData = JSON.parse(text);

      // Normalize data
      const normalized = this.normalizer.normalizeMany(rawData);
      
      log.info(`Data loaded: ${normalized.length} records`);

      // Update state
      this.state.set('rawData', normalized);
      this.state.set('filteredData', normalized);
      this.state.set('isDataLoaded', true);

      // Process data
      this.processData(normalized);

      // Build filter UI
      this.buildFilterUI(normalized);

      this.showSuccess(`Loaded ${normalized.length} transactions successfully`);

    } catch (error) {
      log.error('Failed to process file', { error });
      this.showError('Failed to load file. Please ensure it\'s valid JSON.');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Process data and calculate statistics
   * @private
   * @param {Array<Object>} data - Transaction data
   */
  processData(data) {
    log.info(`Processing ${data.length} records`);

    const stats = {
      totalSpent: 0,
      gasSpent: 0,
      gasGallons: 0,
      itemCount: 0,
      visitCount: data.length,
      rewardsEligible: 0,
      totalRefunded: 0,
      refundCount: 0,
      onlineSpent: 0,
      onlineOrderCount: 0
    };

    data.forEach(record => {
      stats.totalSpent += record.total || 0;

      const isGas = record.receiptType === 'Gas Station' || 
                    record.documentType === 'FuelReceipts';

      if (isGas) {
        stats.gasSpent += record.total || 0;
        if (record.itemArray) {
          record.itemArray.forEach(item => {
            stats.gasGallons += item.fuelUnitQuantity || 0;
          });
        }
      } else {
        stats.rewardsEligible += record.subTotal || 0;
      }

      if (record.isOnline) {
        stats.onlineSpent += record.total || 0;
        stats.onlineOrderCount++;
      }

      if (record.total < 0 || record.transactionType === 'Refund') {
        stats.totalRefunded += Math.abs(record.total || 0);
        stats.refundCount++;
      }

      if (record.itemArray) {
        record.itemArray.forEach(item => {
          stats.itemCount += item.unit || 1;
        });
      }
    });

    // Calculate derived metrics
    stats.avgTransaction = stats.visitCount > 0 ? stats.totalSpent / stats.visitCount : 0;
    stats.estimatedRewards = this.calc.calculateRewards(stats.rewardsEligible);

    this.state.set('processedStats', stats);
    log.debug('Data processing complete', stats);
  }

  /**
   * Build filter UI from data
   * @private
   * @param {Array<Object>} data - Transaction data
   */
  buildFilterUI(data) {
    // Extract unique years
    const years = new Set();
    data.forEach(record => {
      if (record.transactionDate) {
        const year = record.transactionDate.substring(0, 4);
        years.add(year);
      }
    });

    // TODO: Build year checkboxes in UI
    this.state.set('availableYears', Array.from(years).sort());
    
    log.debug('Filter UI built', { yearCount: years.size });
  }

  /**
   * Apply filters and update display
   * @private
   */
  applyFilters() {
    log.info('Applying filters');

    const rawData = this.state.get('rawData', []);
    
    // TODO: Get selected years and locations from UI
    // For now, just use all data
    const filtered = rawData;

    this.state.set('filteredData', filtered);
    this.processData(filtered);

    // Trigger re-render of active component
    const activeComponent = this.components.get(this.activeTab);
    if (activeComponent) {
      activeComponent.render(filtered);
    }

    log.info(`Filters applied: ${filtered.length} records`);
  }

  /**
   * Initialize theme
   * @private
   */
  initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);
  }

  /**
   * Toggle theme between dark and light
   * @private
   */
  toggleTheme() {
    const currentTheme = this.state.get('theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Set application theme
   * @private
   * @param {string} theme - Theme name ('dark' or 'light')
   */
  setTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    this.chartService.setTheme(theme);
    this.state.set('theme', theme);
    localStorage.setItem('theme', theme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = theme === 'dark' ? '☀ Light Mode' : '🌙 Dark Mode';
    }

    log.debug(`Theme set to: ${theme}`);
  }

  /**
   * Show loading indicator
   * @private
   * @param {boolean} show - Whether to show or hide
   */
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    const indicator = document.getElementById('loadingIndicator');
    
    if (overlay && indicator) {
      if (show) {
        overlay.classList.add('active');
        indicator.classList.add('active');
      } else {
        overlay.classList.remove('active');
        indicator.classList.remove('active');
      }
    }
    
    log.debug(`Loading: ${show}`);
  }

  /**
   * Show success message
   * @private
   * @param {string} message - Success message
   */
  showSuccess(message) {
    log.info(message);
    const status = document.getElementById('status');
    if (status) {
      status.textContent = message;
      status.style.color = 'var(--success-color)';
    }
  }

  /**
   * Show error message
   * @private
   * @param {string} message - Error message
   */
  showError(message) {
    log.error(message);
    const status = document.getElementById('status');
    if (status) {
      status.textContent = message;
      status.style.color = 'var(--danger-color)';
    }
    // Also show alert for critical errors
    alert(message);
  }

  /**
   * Get application statistics
   * @returns {Object} Application stats
   */
  getStats() {
    return {
      loadedComponents: Array.from(this.components.keys()),
      activeTab: this.activeTab,
      dataLoaded: this.state.get('isDataLoaded'),
      recordCount: this.state.get('rawData', []).length
    };
  }
}

// Initialize application when DOM is ready
let app = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    app = new CostcoDashboardApp();
    await app.init();
    
    // Make available globally for debugging
    window.costcoApp = app;
  });
} else {
  app = new CostcoDashboardApp();
  app.init().then(() => {
    window.costcoApp = app;
  });
}

export { CostcoDashboardApp };
