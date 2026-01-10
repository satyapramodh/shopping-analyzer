---
applyTo: ".copilot-tracking/changes/20260109-dashboard-refactoring-changes.md"
---

<!-- markdownlint-disable-file -->

# Task Checklist: Costco Dashboard Code Refactoring

## Overview

Refactor the monolithic Costco Dashboard application following DRY, YAGNI, Gang of Four design patterns, and SOLID principles to improve maintainability, testability, and performance.

## Objectives

- Extract JavaScript from monolithic HTML into modular ES6 structure (native browser modules, NO build system)
- Eliminate code duplication across download scripts and dashboard
- Implement proper design patterns (Factory, Strategy, Observer, Facade, Singleton)
- Add comprehensive error handling and logging
- Optimize performance through memoization, debouncing, and lazy loading
- Establish browser-based testing with 80%+ coverage
- Fix known bug in product returns/refunds calculation
- Minimize external dependencies (Chart.js only)
- Document all code inline with JSDoc (not just in final phase)

## Research Summary

### Project Files

- dashboard_comprehensive.html - Main dashboard (2930 lines, needs modularization)
- download_costco_online_orders.js - Online order downloader (DRY violations)
- download_costco_receipts.js - Receipt downloader (duplicate auth code)
- knowledge_base.md - Domain knowledge (discount patterns, product merging)
- todo.md - Known bugs (returns/refunds calculation issue)

### External References

- #file:../research/20260109-dashboard-refactoring-research.md - Comprehensive analysis of 15 critical issues
- #fetch:https://refactoring.guru/design-patterns/catalog - Gang of Four patterns reference
- #fetch:https://www.patterns.dev/posts/ - Modern web patterns
- #githubRepo:"ankurdave/beancount_import_sources" - Receipt downloader patterns

## Implementation Checklist

### [ ] Phase 1: Project Infrastructure & Utilities (Low Risk)

- [x] Task 1.1: Setup project structure and build system
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 15-35)
  - **Completed**: Directory structure, Python server launchers, ESLint config

- [x] Task 1.2: Extract utility modules
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 37-57)
  - **Completed**: constants, errors, logger, formatters (singleton), piiSanitizer - all with full JSDoc

- [x] Task 1.3: Create configuration management
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 59-79)
  - **Completed**: Config singleton with validation, convenience getters, full JSDoc

- [x] Task 1.4: Add error handling infrastructure
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 81-101)
  - **Completed**: Custom error classes + debounce/memoize utilities for Phase 5

### [x] Phase 1: Project Infrastructure & Utilities (Low Risk) - ✅ COMPLETE

- [ ] Task 2.1: Create API client facade
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 103-123)

- [ ] Task 2.2: Implement ChartService with Factory pattern
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 125-145)

- [ ] Task 2.3: Create FilterService with Strategy pattern
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 147-167)

- [ ] Task 2.4: Implement StateManager with Observer pattern
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 169-189)

- [ ] Task 2.5: Extract TableService
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 191-211)

### [ ] Phase 3: Data Processing Layer (Medium Risk)

- [ ] Task 3.1: Create DataNormalizer with Template Method pattern
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 213-233)

- [ ] Task 3.2: Implement CalculationService
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 235-255)

- [ ] Task 3.3: Fix returns/refunds calculation bug
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 257-277)

### [ ] Phase 4: Component Extraction (High Risk)

- [ ] Task 4.1: Extract tab components
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 279-299)

- [ ] Task 4.2: Implement lazy loading for tabs
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 301-321)

- [ ] Task 4.3: Create main application entry point
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 323-343)

### [ ] Phase 5: Performance Optimization (Medium Risk)

- [ ] Task 5.1: Add memoization for expensive calculations
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 345-365)

- [ ] Task 5.2: Implement debouncing for filters and search
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 367-387)

- [ ] Task 5.3: Add virtual scrolling for large tables
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 389-409)

### [ ] Phase 6: Testing Infrastructure (Low Risk)

- [ ] Task 6.1: Setup testing framework
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 411-431)

- [ ] Task 6.2: Write unit tests for utilities and services
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 433-453)

- [ ] Task 6.3: Add integration tests
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 455-475)

### [ ] Phase 7: Documentation & Polish (Low Risk)

- [ ] Task 7.1: Add JSDoc documentation
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 477-497)

- [ ] Task 7.2: Update project documentation
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 499-519)

- [ ] Task 7.3: Setup linting and formatting
  - Details: .copilot-tracking/details/20260109-dashboard-refactoring-details.md (Lines 521-541)

## Dependencies

**Minimal External Dependencies (YAGNI Principle):**
- Chart.js 4.x (already in use - keep it)
- Simple HTTP server (Python built-in, PHP built-in, or VS Code Live Server extension)

**NO Node.js or npm required** - Using native ES6 modules
**NO build system** - Direct browser module loading
**NO testing framework dependencies** - Browser-based testing or simple test harness
**Optional**: ESLint VS Code extension (for linting without npm)

## Success Criteria

- All JavaScript extracted from HTML into modular ES6 files (using native browser modules)
- Zero ESLint errors or warnings (if using VS Code extension)
- 80%+ test coverage on utilities and services
- No global variables (all state managed by StateManager)
- Functions under 50 lines, files under 300 lines
- Performance improvements: filter <500ms, chart render <300ms
- Known returns/refunds bug fixed with test coverage
- **Comprehensive JSDoc documentation on ALL code** (written inline, not deferred)
- Minimal external dependencies (Chart.js only)
- Works with simple HTTP server - no build step required
- README.md includes simple setup: "Serve with Python/PHP/Live Server and open in browser"
