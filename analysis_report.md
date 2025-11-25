# Costco Data Analysis Report

## Overview
This report outlines the design decisions for the new comprehensive Costco Dashboard (`dashboard3_comprehensive.html`). The goal is to merge the best features of previous dashboards, fix existing bugs, and introduce new analytical dimensions to better understand spending habits.

## Proposed Panels & Features

### 1. Consolidated Overview (Merged & Fixed)
*   **Rationale:** Users need a high-level view of their spending. Previous dashboards had split functionality.
*   **Features:**
    *   **Net Spend & Item Counts:** Essential metrics.
    *   **Gas vs. Merchandise:** Clear separation of fuel and store purchases.
    *   **Rewards Tracker:** 2% Executive reward estimation.
    *   **Filters:** Robust Year and Location filtering (fixing the bug in `dashboard2`).

### 2. Product Intelligence (New Tab)
*   **Rationale:** Users want to search for specific items and see their history.
*   **Features:**
    *   **Searchable Grid:** Filter by name, ID, or price range.
    *   **Product Detail View:**
        *   **Price History Graph:** Visualizing inflation/deflation of a specific item.
        *   **Purchase Frequency:** How often is this bought?
        *   **Location Analysis:** Is this item cheaper at specific stores? (Price difference tracking).
        *   **External Link:** Direct link to Costco.com for current details.

### 3. Advanced Analysis (New Tab)
*   **Rationale:** The JSON data contains rich fields like `itemDepartmentNumber`, `transactionDateTime`, and `warehouseName` that were underutilized.
*   **New Panels:**
    *   **Department Breakdown:** Group spending by `itemDepartmentNumber`. This helps categorize spending (e.g., Grocery vs. Electronics vs. Clothing).
    *   **Shopping Habits (Day/Time):** Analyze `transactionDateTime` to show:
        *   **Visits by Day of Week:** Do you shop mostly on weekends?
        *   **Visits by Hour:** What time do you usually go?
    *   **Location Analytics:**
        *   **Spend by Warehouse:** Which Costco gets most of your money?
        *   **Tax Analysis:** Tax paid per location (different cities/states have different rates).

### 4. User Experience Improvements
*   **Dark/Light Theme:** Built-in support for visual comfort.
*   **Modular Code:** Clean separation of data processing, filtering, and rendering logic for maintainability.
*   **No External Dependencies:** Pure Chart.js and Vanilla JS as requested.

## Technical Approach
*   **Data Structure:** We will parse the flat JSON into a structured object:
    ```javascript
    {
        receipts: [],
        items: Map<ItemId, ItemStats>,
        departments: Map<DeptId, DeptStats>,
        warehouses: Map<Id, WarehouseStats>
    }
    ```
*   **Filtering Engine:** A central `applyFilters(year, locations)` function will drive all charts, ensuring consistency.
*   **Performance:** Large datasets (30k+ lines) will be processed once on load, with lightweight filtering on UI interaction.
