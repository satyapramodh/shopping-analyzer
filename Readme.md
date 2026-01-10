## Costco Receipt Toolkit

### What You Get
- Scripts to export warehouse receipts, gas fill ups, and online order history from Costco.com.
- Interactive dashboards (dark and light themes) for exploring the exported JSON files.
- Location metadata in warehouses.json to enrich dashboard views.

### Before You Start
- Active Costco membership with access to warehouse receipts and online order history.
- Modern Chromium-based browser (Chrome, Edge, Brave) with pop-ups enabled for downloads.
- Local clone of this repository so the scripts and dashboards are accessible offline.

### Step 1 – Sign in and Prep the Costco Session
- Navigate to https://www.costco.com and sign in with your member credentials.
- Open a first-party page that already lists your orders or receipts (e.g. Order History → Receipts tab). This ensures the page loads authentication tokens into localStorage.
- Keep this tab open; you will run the scripts from the browser developer tools against the same origin.

### Step 2 – Download Warehouse & Gas Receipts
- Open the browser developer tools (Chrome: Ctrl+Shift+J, Mac: Cmd+Opt+J) on the Costco tab.
- Paste the contents of [download_costco_receipts.js](download_costco_receipts.js) into the console and press Enter.
- Wait for the console logs to report the number of receipts collected; a JSON file named like `costco-gas-YYYY-MM-DDTHH_mm_ss.json` downloads automatically.
- The script strips membership numbers before saving. Keep the resulting JSON for the dashboards.
- Adjust the `startDateStr` constant at the top of the script if you need to pull history from a different starting point; the API returns all receipts from that date forward.

### Step 3 – Download Detailed Online Orders
- Stay on the signed-in Costco tab and clear the console to keep logs readable.
- Paste the contents of [download_costco_online_orders.js](download_costco_online_orders.js) and press Enter.
- The script pages through every order since 01/01/2020, fetches full line-item detail, and saves a sanitized JSON named `costco-online-orders-YYYY-MM-DDTHH_mm_ss.json`.
- Large accounts may take several minutes; the script throttles requests to avoid rate limiting. Keep the tab focused so the browser does not suspend execution.
- Change the `startDateStr` constant before running if you want to narrow or expand the date range; the script respects that boundary when paging the Costco API.

### Step 4 – Collect Warehouse Metadata (Optional but Recommended) - TODO
Open https://www.costco.com/warehouse-locations and wait for the map to populate all markers (zoom out to continental view so every region loads at least once).
In DevTools → Network, filter on XHR requests containing warehouse; the call named like warehouseLocations or getWarehouses delivers a JSON array with the full directory. Right-click that request, choose Copy → Copy response, and paste the raw payload into a scratch editor.
Still on the Costco tab, go to the Console and run: const payload = JSON.parse(pastedResponse); const cleaned = payload.warehouses.map(w => ({ warehouseNumber: w.warehouseNumber, warehouseName: w.name, address1: w.address1, address2: w.address2, city: w.city, state: w.state, postalCode: w.postalCode, country: w.country, latitude: w.latitude, longitude: w.longitude })); copy(cleaned); This strips the response down to the fields your dashboards expect and places the result on the clipboard.
Replace the contents of warehouses.json with the copied array, then run your formatter so indentation matches the rest of the repo.
Commit the refreshed file (for example, chore: refresh warehouse directory) and push.


### Step 5 – Explore the Dashboards
- Launch [dashboard_comprehensive.html](dashboard_comprehensive.html) in a browser (double-click the file or serve the repo with a simple HTTP server to avoid mixed-content warnings).
- Use the file picker at the top to load the JSON exports. Select multiple files at once (e.g. receipts + online orders + warehouses) for the richest analysis.
- Navigate the tabs for Overview metrics, Product Search, Category drill-downs, Discounts, Refunds, Gas, Payments, Price Analysis, Deep Analysis, and Forecast insights.
- Older reference dashboards live under the imported/ directory if you want lighter views:
	- [imported/dashboard1.html](imported/dashboard1.html) – original receipt summary.
	- [imported/dashboard1_yearlybottom.html](imported/dashboard1_yearlybottom.html) – adds yearly spend trend.
	- [imported/dashboard2_enhanced.html](imported/dashboard2_enhanced.html) – introduces gas analytics and reward tracking.
	- [imported/dashboard2_peryear.html](imported/dashboard2_peryear.html) – enhanced version with year filter UI.

### Step 6 – Keep Your Data Organized
- Store downloaded JSON files under a dedicated data/ folder (not tracked in git) to keep personal data out of commits.
- When you update data, reload the dashboard page and re-import the files. The dashboard runs fully client-side; no backend reset is required.

### FAQ
- **Why ignore download_all_receipts.js?** That script is deprecated; the two specialized scripts cover the supported Costco APIs without redundant calls.
- **How often should I re-run the scripts?** Run them whenever you need updated history; re-downloads overwrite nothing—just keep the latest timestamped JSON.
- **Can I share the dashboards?** Yes. They operate locally and contain no authentication logic, so you can pass the HTML files to another machine and load sanitized JSON exports there.
