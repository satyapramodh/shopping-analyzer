# Costco Dashboard Panel Inventory

## Legacy Dashboards Recap
- [imported/dashboard1.html](imported/dashboard1.html) introduced the core receipt experience: six KPI cards, paired tables for total spenders and price movers, and a monthly Chart.js trend.
- [imported/dashboard1_yearlybottom.html](imported/dashboard1_yearlybottom.html) kept the original layout but added a yearly spend canvas that stacks below the monthly trend so long-term drift is visible at a glance.
- [imported/dashboard2_enhanced.html](imported/dashboard2_enhanced.html) expanded scope with dedicated merchandise KPIs, a 2% Executive reward tracker, richer item leaderboards (price increases, decreases, expensive purchases), and a full gas analytics section with split-grade charts and weighted gallon stats.
- [imported/dashboard2_peryear.html](imported/dashboard2_peryear.html) refined the enhanced view by layering a year selector, reusable sorting, and the same merchandise/gas separation—bridging the gap between static grids and filter-aware analysis.

## Comprehensive Dashboard Enhancements
- **Global UX Foundation** (see [dashboard_comprehensive.html](dashboard_comprehensive.html#L1-L210))
    - Dark/light theming toggle with Chart.js palette updates.
    - Multi-file loader accepts receipts, online orders, and warehouse metadata simultaneously.
    - Year and warehouse multi-select filters with quick select/deselect helpers and a global Apply action to recompute every panel consistently.

- **Overview Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L220-L360))
    - KPI grid merges merchandise, gas, online spend, refunds, and estimated Executive rewards.
    - Monthly spend trend plus department pie chart to surface mix shifts borrowed from dashboard2 intellectual groundwork.
    - Reward tracker table and dual top-ten lists (spend, frequency) keep dashboard1-style tables accessible.

- **Product Search Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L360-L520))
    - Sortable inventory table with dynamic search modes (by spend, frequency, price high/low).
    - Detail drawer for a selected item: price history charts, annual spend, cumulative spend, transaction log, and warehouse-specific stats.

- **Categories Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L520-L660))
    - Editable department names plus spend totals re-purpose dashboard2 department logic into a focused workspace.
    - Category detail panel adds refund metrics, monthly spend chart, top items, and a complete product roster per department.

- **Discounts Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L660-L740))
    - Savings KPIs (total saved, count, average, top saver) highlight coupon effectiveness.
    - Leaderboard and frequency chart quantify discount cadence—missing in all legacy dashboards.

- **Refunds Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L740-L860))
    - Dedicated return metrics, department-level heatmap, and separate tables for full returns versus price adjustments provide clarity beyond the old refund counts.

- **Gas Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L860-L930))
    - Carries forward dashboard2 gas analytics while tightening layout: KPI grid, price-per-gallon history, grade-spend breakdown, and total monthly bar chart in one place.

- **Payments Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L930-L1010))
    - New payment aggregation pipeline with Citi rewards estimation, method mix chart, and yearly trend analysis—a dimension untouched in earlier dashboards.

- **Price Analysis Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L1010-L1070))
    - Refines legacy price increase/decrease and most expensive tables with consistent table sorting and percentage deltas.

- **Deep Analysis Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L1070-L1130))
    - Day-of-week and hour-of-day shopping behavior, warehouse spend ranking, tax estimator, and recurring item cadence forecasting build upon raw JSON fields the legacy dashboards never visualized.

- **Forecast Tab** ([dashboard_comprehensive.html](dashboard_comprehensive.html#L1130-L1200))
    - Frequency clustering outputs weekly, monthly, quarterly, and yearly shopping lists with estimated spend totals. Separate tables project next purchase windows, enabling proactive budgeting.

## Implementation Notes
- State management centralizes parsed receipts, item catalog, department map, discounts, gas metrics, and Chart.js instances so filters apply uniformly across tabs.
- Table sorting helper initialises once on DOM ready and reuses existing markup, avoiding external dependencies while keeping large grids navigable.
- Theme switching updates Chart.js defaults in-place, preventing chart re-renders and keeping transitions fluid across dark/light toggles.
