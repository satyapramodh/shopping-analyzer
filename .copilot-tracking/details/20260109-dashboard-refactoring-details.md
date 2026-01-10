<!-- markdownlint-disable-file -->

# Task Details: Costco Dashboard Code Refactoring

## Research Reference

**Source Research**: #file:../research/20260109-dashboard-refactoring-research.md

## Phase 1: Project Infrastructure & Utilities (Low Risk)

### Task 1.1: Setup project structure with native ES6 modules

Create modular JavaScript structure using native browser ES6 modules - NO build system required.

- **Files**:
  - index.html - Main HTML file with `<script type="module">` imports
  - src/ directory - Source code root
  - src/utils/, src/services/, src/core/, src/components/ - Module directories
  - .vscode/settings.json - VS Code configuration for ESLint (optional)
  - .eslintrc.json - ESLint config (optional, can use VS Code extension)
- **Success**:
  - Serve with simple HTTP server: `python -m http.server 8000` or VS Code Live Server
  - Open browser to http://localhost:8000
  - ES6 modules load correctly with `import`/`export`
  - No build step required - direct browser execution
  - **JSDoc comments added to all new files from the start**
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 270-318) - Module pattern and target structure
  - Updated approach: Native ES6 modules for simplicity
- **Dependencies**:
  - Modern browser with ES6 module support (Chrome, Firefox, Safari, Edge)
  - Simple HTTP server (Python, PHP, or Live Server extension)

### Task 1.2: Extract utility modules

Extract repeated utility functions into reusable modules.

- **Files**:
  - src/utils/formatters.js - Money and date formatting (singleton pattern)
  - src/utils/piiSanitizer.js - PII removal logic
  - src/utils/constants.js - Configuration constants
  - src/utils/logger.js - Structured logging
- **Success**:
  - formatMoney() creates formatter instance once (performance improvement)
  - All magic numbers replaced with named constants
  - PII sanitization code unified (eliminates duplication in Lines 349-377 and 119-126)
  - Logger replaces all console.log calls
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 90-107) - DRY violations in authentication
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 216-235) - PII sanitization duplication
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 181-195) - Magic numbers
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 544-560) - Logging system
- **Dependencies**:
  - Task 1.1 complete

### Task 1.3: Create configuration management

Implement Singleton pattern for centralized configuration.

- **Files**:
  - src/core/Config.js - Configuration singleton
- **Success**:
  - Single source of truth for all configuration
  - API_START_DATE, API_ENDPOINT, CLIENT_ID, REWARDS_RATE, etc. defined
  - Config.getInstance() returns same instance
  - No hardcoded values in codebase
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 392-413) - Singleton pattern implementation
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 181-195) - Magic numbers to extract
- **Dependencies**:
  - Task 1.1 complete

### Task 1.4: Add error handling infrastructure

Create custom error classes and error boundaries.

- **Files**:
  - src/utils/errors.js - Custom error classes (APIError, DataValidationError, NetworkError)
- **Success**:
  - Custom errors thrown with context
  - APIError includes status code and response
  - DataValidationError includes field and value
  - NetworkError for connection issues
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 108-115) - No error handling issue
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 528-543) - Error classes implementation
- **Dependencies**:
  - Task 1.1 complete

## Phase 2: Service Layer Extraction (Medium Risk)

### Task 2.1: Create API client facade

Implement Facade pattern to centralize API interactions and eliminate authentication code duplication.

- **Files**:
  - src/services/CostcoAPIClient.js - API facade with authentication
  - src/graphql/queries.js - Extracted GraphQL queries
- **Success**:
  - Single method for all API calls: client.query(queryName, variables)
  - Authentication headers applied automatically
  - Error handling standardized
  - Download scripts refactored to use shared client
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 415-453) - Facade pattern implementation
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 90-107) - Authentication duplication
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 236-251) - GraphQL query issues
- **Dependencies**:
  - Task 1.3 complete (Config)
  - Task 1.4 complete (Errors)

### Task 2.2: Implement ChartService with Factory pattern

Create ChartFactory to manage Chart.js instances and fix memory leaks.

- **Files**:
  - src/services/ChartService.js - Chart factory with lifecycle management
- **Success**:
  - Charts properly destroyed before recreation
  - No memory leaks on filter changes
  - Consistent theme application
  - centralized chart configuration
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 320-348) - Factory pattern implementation
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 134-159) - Chart memory leak issue
- **Dependencies**:
  - Task 1.3 complete (Config)

### Task 2.3: Create FilterService with Strategy pattern

Implement Strategy pattern for extensible, testable filtering logic.

- **Files**:
  - src/services/FilterService.js - Filter strategies and pipeline
- **Success**:
  - FilterStrategy base class defined
  - YearFilter and LocationFilter strategies implemented
  - FilterPipeline combines multiple filters
  - Filters testable in isolation
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 350-377) - Strategy pattern implementation
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 116-133) - Inefficient data processing
- **Dependencies**:
  - Task 1.1 complete

### Task 2.4: Implement StateManager with Observer pattern

Create Observer pattern for decoupled state management.

- **Files**:
  - src/core/StateManager.js - Observable state container
- **Success**:
  - No global variables in application
  - Components subscribe to state changes
  - setState triggers notifications
  - State immutable (shallow copy on update)
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 379-405) - Observer pattern implementation
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 64-89) - Global state anti-pattern
- **Dependencies**:
  - Task 1.1 complete

### Task 2.5: Extract TableService

Create reusable table rendering and sorting service.

- **Files**:
  - src/services/TableService.js - Table rendering with sorting
- **Success**:
  - makeTableSortable() enhanced with data type detection
  - Sort persistence in URL params
  - ARIA attributes for accessibility
  - Reusable across all 16 tables
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 160-180) - Table sorting improvements
- **Dependencies**:
  - Task 1.2 complete (formatters)

## Phase 3: Data Processing Layer (Medium Risk)

### Task 3.1: Create DataNormalizer with Template Method pattern

Implement Template Method pattern for data transformation.

- **Files**:
  - src/core/DataNormalizer.js - Base normalizer class
  - src/core/OnlineOrderNormalizer.js - Online order specific
  - src/core/WarehouseReceiptNormalizer.js - Warehouse receipt specific
- **Success**:
  - DataNormalizer base class with normalize() template method
  - Subclasses implement canHandle() and extractSpecificData()
  - Replaces normalizeRecord() function (dashboard Lines 1153-1224)
  - Testable in isolation
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 455-483) - Template Method pattern
- **Dependencies**:
  - Task 1.2 complete (utilities)

### Task 3.2: Implement CalculationService

Extract business logic calculations into dedicated service.

- **Files**:
  - src/services/CalculationService.js - All calculation logic
- **Success**:
  - Methods: calculateRewards(), calculateRefundRate(), calculateAverages()
  - Pure functions (no side effects)
  - Comprehensive JSDoc
  - Unit testable
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 252-269) - Mixed responsibilities in processData()
- **Dependencies**:
  - Task 1.2 complete (constants)

### Task 3.3: Fix returns/refunds calculation bug

Fix known bug in product search returns/refunds calculation.

- **Files**:
  - src/services/CalculationService.js - Add returnType distinction
  - Updated wherever returns are calculated
- **Success**:
  - Separate handling for full returns vs. price adjustments
  - returnType field added to itemMap
  - Product detail panel shows correct values
  - Tests verify fix
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 631-641) - Known bug analysis
  - #file:../../todo.md (Line 1) - Bug description
- **Dependencies**:
  - Task 3.2 complete (CalculationService)

## Phase 4: Component Extraction (High Risk)

### Task 4.1: Extract tab components

Extract each dashboard tab into separate component module.

- **Files**:
  - src/components/Overview.js
  - src/components/ProductSearch.js
  - src/components/Categories.js
  - src/components/Discounts.js
  - src/components/Refunds.js
  - src/components/Gas.js
  - src/components/Payments.js
  - src/components/PriceAnalysis.js
  - src/components/Analysis.js
  - src/components/Forecast.js
- **Success**:
  - Each component self-contained
  - Components export init() and render() methods
  - DOM manipulation isolated to components
  - State accessed via StateManager
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 270-318) - Module pattern structure
- **Dependencies**:
  - Task 2.2, 2.3, 2.4, 2.5 complete (all services)
  - Task 3.1, 3.2 complete (data processing)

### Task 4.2: Implement lazy loading for tabs

Add dynamic imports for tab components to improve initial load time.

- **Files**:
  - src/main.js - Dynamic import logic
- **Success**:
  - Tab content loaded only when first viewed
  - Loading indicator shown during import
  - Bundle split into separate chunks
  - Lighthouse performance score improved
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 196-204) - Lazy loading need
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 519-527) - Lazy tab loading strategy
- **Dependencies**:
  - Task 4.1 complete (components extracted)

### Task 4.3: Create main application entry point

Build main entry point that initializes application.

- **Files**:
  - src/main.js - Application bootstrapping
  - index.html - Updated to use bundled script
- **Success**:
  - StateManager initialized
  - Services instantiated
  - Event listeners attached
  - Theme initialized
  - File input handler connected
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 270-318) - Entry point in structure
- **Dependencies**:
  - Task 4.1 complete
  - Task 4.2 complete

## Phase 5: Performance Optimization (Medium Risk)

### Task 5.1: Add memoization for expensive calculations

Implement memoization to cache expensive calculations.

- **Files**:
  - src/utils/memoize.js - Memoization utility
  - Updated CalculationService methods
- **Success**:
  - Category totals cached
  - Price analysis cached
  - Cache invalidated on data change
  - Performance improvement measurable (>40%)
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 485-493) - Memoization strategy
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 116-133) - Performance issue
- **Dependencies**:
  - Task 3.2 complete (CalculationService)

### Task 5.2: Implement debouncing for filters and search

Add debouncing to prevent excessive recalculations.

- **Files**:
  - src/utils/debounce.js - Debounce utility
  - Updated filter and search event handlers
- **Success**:
  - Search input debounced by 300ms
  - Filter application debounced by 200ms
  - No UI lag during typing
  - Performance improvement measurable
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 495-500) - Debouncing strategy
- **Dependencies**:
  - Task 2.3 complete (FilterService)

### Task 5.3: Add virtual scrolling for large tables

Implement virtual scrolling for product table with 1000+ items.

- **Files**:
  - src/utils/VirtualScroller.js - Virtual scrolling utility
  - Updated TableService
- **Success**:
  - Only visible rows rendered
  - Smooth scrolling with large datasets
  - DOM node count reduced by 90%+
  - IntersectionObserver for lazy row rendering
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 205-215) - No pagination issue
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 501-506) - Virtual scrolling strategy
- **Dependencies**:
  - Task 2.5 complete (TableService)

## Phase 6: Testing Infrastructure (Low Risk)

### Task 6.1: Setup browser-based testing

Create simple testing infrastructure using browser-based approach - no npm dependencies.

- **Files**:
  - tests/test-runner.html - Simple HTML test runner
  - tests/test-utils.js - Minimal assertion library (write our own)
  - tests/run-tests.js - Test orchestration
  - Optional: Can use QUnit (CDN, no npm) or write minimal test harness
- **Success**:
  - Open test-runner.html in browser to run tests
  - Tests pass/fail displayed in browser
  - Coverage measured manually or with browser DevTools
  - Tests can run without any build step
  - All test files have comprehensive JSDoc
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 561-594) - Testing strategy
  - Updated: Browser-based testing for simplicity
- **Dependencies**:
  - Modern browser only
  - Optional: QUnit from CDN (no npm)

### Task 6.2: Write unit tests for utilities and services

Create comprehensive unit tests for all utilities and services.

- **Files**:
  - src/utils/__tests__/formatters.test.js
  - src/utils/__tests__/piiSanitizer.test.js
  - src/services/__tests__/FilterService.test.js
  - src/services/__tests__/CalculationService.test.js
  - src/core/__tests__/StateManager.test.js
- **Success**:
  - 80%+ code coverage on utils and services
  - All edge cases tested
  - Mock data used appropriately
  - Tests run fast (<1s per suite)
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 561-594) - Unit test examples
- **Dependencies**:
  - Task 6.1 complete
  - Tasks 1.2, 2.x, 3.x complete (modules to test)

### Task 6.3: Add integration tests

Create integration tests for data pipeline and UI interactions.

- **Files**:
  - src/__tests__/integration/dataLoading.test.js
  - src/__tests__/integration/filtering.test.js
  - src/__tests__/integration/chartRendering.test.js
- **Success**:
  - End-to-end data loading tested
  - Filter combinations verified
  - Chart rendering validated
  - Known bug regression test
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 595-599) - Integration tests
- **Dependencies**:
  - Task 6.2 complete

## Phase 7: Documentation & Polish (Low Risk)

### Task 7.1: Add JSDoc documentation

Add comprehensive JSDoc comments to all public APIs.

- **Files**:
  - All .js files in src/
- **Success**:
  - Every public function/class documented
  - @param, @returns, @throws tags used
  - Examples provided for complex functions
  - Type hints for better IDE support
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 512-527) - JSDoc examples
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 284-298) - No type safety issue
- **Dependencies**:
  - All implementation complete

### Task 7.2: Update project documentation

Update and create comprehensive documentation.

- **Files**:
  - README.md - Updated with new architecture
  - ARCHITECTURE.md - System design documentation
  - API.md - API client usage guide
  - CONTRIBUTING.md - Development setup
  - CHANGELOG.md - Version history
- **Success**:
  - Architecture diagram included
  - Setup instructions clear
  - API usage examples provided
  - Contributing guidelines complete
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 618-630) - Documentation needs
- **Dependencies**:
  - All implementation complete

### Task 7.3: Setup linting and formatting

Configure ESLint and Prettier for code quality.

- **Files**:
  - .eslintrc.js - ESLint configuration
  - .prettierrc - Prettier configuration
  - .github/workflows/lint.yml - Lint CI pipeline
- **Success**:
  - Zero ESLint errors
  - Code auto-formatted on save
  - Pre-commit hooks run linting
  - CI fails on lint errors
- **Research References**:
  - #file:../research/20260109-dashboard-refactoring-research.md (Lines 600-617) - Code quality section
- **Dependencies**:
  - Task 1.1 complete

## Overall Dependencies

**Minimal Approach (YAGNI Principle):**
- Modern browser with ES6 module support
- Simple HTTP server:
  - Python 3: `python -m http.server 8000` (built-in)
  - PHP: `php -S localhost:8000` (built-in)
  - VS Code Live Server extension (one-click)
- Chart.js 4.x (already in use, loaded via CDN)
- Optional: ESLint via VS Code extension (no npm)
- Optional: QUnit from CDN for testing (no npm)

**NO Node.js, NO npm, NO build system required**

## Success Criteria

- All 23 tasks completed and verified
- 80%+ test coverage achieved (measured via browser DevTools or manual tracking)
- Zero ESLint errors or warnings (if using VS Code extension)
- Performance benchmarks met:
  - Initial load < 2s
  - Filter application < 500ms
  - Chart rendering < 300ms
  - Lighthouse score > 90
- Known bug fixed with regression test
- **Documentation complete: Every function, class, and module has JSDoc comments**
- **Inline documentation written during development, not after**
- All code following DRY, YAGNI, SOLID principles
- Design patterns properly implemented
- **Minimal dependencies: Chart.js only**
- **No build system: Works with simple HTTP server**
