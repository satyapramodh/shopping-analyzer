/**
 * Data transformation helpers for dashboard components.
 * Provides reusable aggregation utilities so each component
 * can focus on rendering logic rather than data crunching.
 * @module utils/dataTransforms
 */

/**
 * Parse a date string into a Date object.
 * @param {string} value - String representation of date.
 * @returns {Date|null} Parsed date or null if invalid.
 */
function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Normalize numeric values ensuring finite numbers.
 * @param {number} value - Input numeric value.
 * @param {number} [fallback=0] - Fallback if value invalid.
 * @returns {number} Safe number.
 */
function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Normalize quantity while keeping integers positive.
 * @param {number} value - Quantity value.
 * @returns {number} Safe quantity (can be negative for returns).
 */
function normalizeQuantity(value) {
  const qty = Number(value);
  if (Number.isFinite(qty) && qty !== 0) {
    return qty;
  }
  return 1;
}

/**
 * Extract YYYY-MM key from a date string.
 * @param {string} value - Date value.
 * @returns {string} Month key or 'unknown'.
 */
function getMonthKey(value) {
  if (!value || typeof value !== 'string') {
    return 'unknown';
  }
  const match = value.match(/(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : 'unknown';
}

/**
 * Determine if a line item represents a discount code.
 * @param {string} description - Item description text.
 * @returns {boolean} True if line is a discount reference.
 */
function isDiscountLine(description) {
  if (!description || typeof description !== 'string') {
    return false;
  }
  return description.trim().startsWith('/');
}

/**
 * Extract the target item ID from a discount description.
 * @param {string} description - Discount description.
 * @returns {string|null} Target item ID or null if missing.
 */
function extractDiscountTarget(description) {
  if (!description) {
    return null;
  }
  const match = description.replace('/', '').trim().match(/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Ensure an item entry exists inside the supplied map.
 * @param {Map<string, Object>} map - Map of items.
 * @param {string} id - Item identifier.
 * @param {string} [name] - Human readable label.
 * @returns {Object} Item entry reference.
 */
function ensureItemEntry(map, id, name = '') {
  if (!map.has(id)) {
    map.set(id, {
      id,
      name: name || `Item ${id}`,
      totalSpent: 0,
      totalRefunded: 0,
      netSpend: 0,
      unitCount: 0,
      refundCount: 0,
      discountTotal: 0,
      discountCount: 0,
      purchaseEvents: [],
      departments: new Set(),
      firstPurchase: null,
      lastPurchase: null
    });
  }
  const entry = map.get(id);
  if (name && (!entry.name || entry.name.startsWith('Item '))) {
    entry.name = name;
  }
  return entry;
}

/**
 * Apply purchase metrics to an item entry.
 * @param {Object} entry - Item summary reference.
 * @param {number} amount - Line amount.
 * @param {number} quantity - Units purchased.
 * @param {Object} meta - Additional metadata.
 */
function applyPurchase(entry, amount, quantity, meta) {
  entry.totalSpent += amount;
  entry.unitCount += Math.max(quantity, 0);
  entry.netSpend = entry.totalSpent - entry.totalRefunded - entry.discountTotal;
  if (meta.event) {
    entry.purchaseEvents.push(meta.event);
  }
  entry.firstPurchase = entry.firstPurchase && meta.date
    ? (entry.firstPurchase < meta.date ? entry.firstPurchase : meta.date)
    : meta.date || entry.firstPurchase;
  entry.lastPurchase = entry.lastPurchase && meta.date
    ? (entry.lastPurchase > meta.date ? entry.lastPurchase : meta.date)
    : meta.date || entry.lastPurchase;
}

/**
 * Apply refund metrics to an item entry.
 * @param {Object} entry - Item summary reference.
 * @param {number} amount - Refund amount.
 * @param {number} quantity - Units refunded.
 */
function applyRefund(entry, amount, quantity) {
  entry.totalRefunded += amount;
  entry.refundCount += Math.abs(quantity) || 1;
  entry.netSpend = entry.totalSpent - entry.totalRefunded - entry.discountTotal;
}

/**
 * Record a discount application for an item.
 * @param {Object} entry - Item summary reference.
 * @param {number} amount - Discount amount.
 */
function applyDiscount(entry, amount) {
  entry.discountTotal += amount;
  entry.discountCount += 1;
  entry.netSpend = entry.totalSpent - entry.totalRefunded - entry.discountTotal;
}

/**
 * Build aggregated item summaries from transaction data.
 * @param {Array<Object>} transactions - Normalized transaction records.
 * @returns {Array<Object>} Array of item summaries.
 */
export function buildItemSummaries(transactions = []) {
  const items = new Map();

  transactions.forEach((record) => {
    const date = parseDate(record.transactionDate);
    const warehouse = record.warehouseName || 'Unknown';
    const itemLines = Array.isArray(record.itemArray) ? record.itemArray : [];

    itemLines.forEach((line) => {
      const description = line.itemDescription01 || '';
      const amount = safeNumber(line.amount);
      const quantity = normalizeQuantity(line.unit);
      const dept = line.itemDepartmentNumber || 'Other';

      if (isDiscountLine(description)) {
        const targetId = extractDiscountTarget(description);
        if (targetId) {
          const discountEntry = ensureItemEntry(items, targetId);
          applyDiscount(discountEntry, Math.abs(amount));
        }
        return;
      }

      const id = String(line.itemNumber || description || Math.random());
      const entry = ensureItemEntry(items, id, description);
      entry.departments.add(dept);

      if (amount >= 0) {
        const unitPrice = safeNumber(line.unitPrice, quantity ? amount / quantity : amount);
        applyPurchase(entry, amount, quantity, {
          date,
          event: {
            date,
            warehouse,
            quantity,
            price: unitPrice,
            total: amount
          }
        });
      } else {
        applyRefund(entry, Math.abs(amount), quantity);
      }
    });
  });

  return Array.from(items.values()).map((entry) => ({
    ...entry,
    departments: Array.from(entry.departments),
    purchaseEvents: entry.purchaseEvents.sort((a, b) => {
      if (!a.date || !b.date) {
        return 0;
      }
      return a.date - b.date;
    })
  })).sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Ensure a department/category entry exists.
 * @param {Map<string, Object>} map - Category map.
 * @param {string} id - Department identifier.
 * @param {string} name - Human readable name.
 * @returns {Object} Category entry.
 */
function ensureCategoryEntry(map, id, name) {
  if (!map.has(id)) {
    map.set(id, {
      id,
      name: name || `Dept ${id}`,
      spend: 0,
      refundAmount: 0,
      returnCount: 0,
      monthly: new Map(),
      items: new Map()
    });
  }
  const entry = map.get(id);
  if (name && entry.name.startsWith('Dept ')) {
    entry.name = name;
  }
  return entry;
}

/**
 * Build summaries for categories/departments.
 * @param {Array<Object>} transactions - Transaction records.
 * @returns {Array<Object>} Category summaries.
 */
export function buildCategorySummaries(transactions = []) {
  const categories = new Map();

  transactions.forEach((record) => {
    const monthKey = getMonthKey(record.transactionDate || '');
    const lines = Array.isArray(record.itemArray) ? record.itemArray : [];

    lines.forEach((line) => {
      if (isDiscountLine(line.itemDescription01)) {
        return;
      }
      const deptId = line.itemDepartmentNumber || 'Other';
      const entry = ensureCategoryEntry(categories, deptId, line.departmentDescription);
      const amount = safeNumber(line.amount);
      const name = line.itemDescription01 || line.itemNumber || 'Item';
      const itemsMap = entry.items;
      const existing = itemsMap.get(name) || { name, total: 0, count: 0 };
      if (amount >= 0) {
        entry.spend += amount;
        existing.total += amount;
        existing.count += 1;
        entry.monthly.set(monthKey, (entry.monthly.get(monthKey) || 0) + amount);
      } else {
        const refundAmount = Math.abs(amount);
        entry.refundAmount += refundAmount;
        entry.returnCount += 1;
      }
      itemsMap.set(name, existing);
    });
  });

  return Array.from(categories.values()).map((entry) => ({
    ...entry,
    monthly: Array.from(entry.monthly.entries()),
    items: Array.from(entry.items.values()).sort((a, b) => b.total - a.total)
  })).sort((a, b) => b.spend - a.spend);
}

/**
 * Build discount insights from transaction data.
 * @param {Array<Object>} transactions - Transaction collection.
 * @returns {Object} Discount summary information.
 */
export function collectDiscountInsights(transactions = []) {
  const discountMap = new Map();
  let totalSaved = 0;
  let discountCount = 0;

  transactions.forEach((record) => {
    const lines = Array.isArray(record.itemArray) ? record.itemArray : [];
    lines.forEach((line) => {
      if (!isDiscountLine(line.itemDescription01)) {
        return;
      }
      const amount = Math.abs(safeNumber(line.amount));
      if (!amount) {
        return;
      }
      const targetId = extractDiscountTarget(line.itemDescription01) || line.itemNumber || line.itemDescription01;
      const entry = discountMap.get(targetId) || {
        id: String(targetId || 'Unknown'),
        name: line.itemDescription01 ? line.itemDescription01.replace('/', '').trim() : `Item #${targetId}`,
        total: 0,
        count: 0
      };
      entry.total += amount;
      entry.count += 1;
      discountMap.set(entry.id, entry);
      totalSaved += amount;
      discountCount += 1;
    });
  });

  const items = Array.from(discountMap.values()).sort((a, b) => b.total - a.total);
  return {
    totalSaved,
    discountCount,
    topItems: items.slice(0, 10)
  };
}

/**
 * Aggregate refund and adjustment information.
 * @param {Array<Object>} transactions - Transaction data.
 * @returns {Object} Refund summary.
 */
export function collectRefundInsights(transactions = []) {
  const returns = [];
  const adjustments = [];
  const deptMap = new Map();
  let totalPurchases = 0;
  let totalReturned = 0;
  let totalAdjustments = 0;
  let returnCount = 0;

  transactions.forEach((record) => {
    totalPurchases += Math.max(0, safeNumber(record.total));
    const date = parseDate(record.transactionDate);
    const lines = Array.isArray(record.itemArray) ? record.itemArray : [];

    lines.forEach((line) => {
      if (isDiscountLine(line.itemDescription01)) {
        return;
      }
      const amount = safeNumber(line.amount);
      if (amount >= 0) {
        return;
      }
      const refundAmount = Math.abs(amount);
      const id = line.itemNumber || line.itemDescription01 || 'Unknown';
      const entry = {
        id: String(id),
        name: line.itemDescription01 || `Item #${id}`,
        amount: refundAmount,
        returnDate: date,
        buyDate: null,
        daysKept: null
      };
      const deptId = line.itemDepartmentNumber || 'Other';
      deptMap.set(deptId, (deptMap.get(deptId) || 0) + refundAmount);
      const isReturn = normalizeQuantity(line.unit) < 0;
      if (isReturn) {
        returns.push(entry);
        totalReturned += refundAmount;
        returnCount += 1;
      } else {
        adjustments.push(entry);
        totalAdjustments += refundAmount;
      }
    });
  });

  const byDepartment = Array.from(deptMap.entries()).map(([id, amount]) => ({
    id,
    name: `Dept ${id}`,
    amount
  })).sort((a, b) => b.amount - a.amount);

  return {
    totalPurchases,
    totalReturned,
    totalAdjustments,
    returnCount,
    returns: returns.sort((a, b) => (b.returnDate || 0) - (a.returnDate || 0)),
    adjustments: adjustments.sort((a, b) => (b.returnDate || 0) - (a.returnDate || 0)),
    byDepartment
  };
}

/**
 * Aggregate gas transaction statistics.
 * @param {Array<Object>} transactions - Transaction data.
 * @returns {Object} Gas insights.
 */
export function collectGasInsights(transactions = []) {
  const monthlyTotals = new Map();
  const gradeByMonth = new Map();
  const gradeCodes = { premium: ['800877'], regular: ['800599'] };
  const locations = new Set();
  let totalSpent = 0;
  let totalGallons = 0;
  let priceAccumulator = 0;
  let visits = 0;

  const isGasRecord = (record) => {
    return record.receiptType === 'Gas Station'
      || record.documentType === 'FuelReceipts'
      || (Array.isArray(record.itemArray) && record.itemArray.some((line) => 
          gradeCodes.premium.includes(String(line.itemNumber)) || 
          gradeCodes.regular.includes(String(line.itemNumber))
        ));
  };

  transactions.forEach((record) => {
    if (!isGasRecord(record)) {
      return;
    }
    visits += 1;
    locations.add(record.warehouseName || 'Gas Station');
    const total = safeNumber(record.total);
    totalSpent += total;
    const monthKey = getMonthKey(record.transactionDate || '');
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + total);

    const lines = Array.isArray(record.itemArray) ? record.itemArray : [];
    lines.forEach((line) => {
      const gallons = safeNumber(line.fuelUnitQuantity);
      const price = safeNumber(line.itemUnitPriceAmount);
      if (gallons > 0 && price > 0) {
        totalGallons += gallons;
        priceAccumulator += price * gallons;
      }
      const amount = safeNumber(line.amount);
      const grade = gradeCodes.premium.includes(String(line.itemNumber)) ? 'premium' : gradeCodes.regular.includes(String(line.itemNumber)) ? 'regular' : null;
      if (!grade) {
        return;
      }
      if (!gradeByMonth.has(monthKey)) {
        gradeByMonth.set(monthKey, { premium: { spend: 0, gallons: 0 }, regular: { spend: 0, gallons: 0 } });
      }
      const bucket = gradeByMonth.get(monthKey)[grade];
      bucket.spend += Math.abs(amount);
      bucket.gallons += gallons;
    });
  });

  const averagePrice = totalGallons > 0 ? priceAccumulator / totalGallons : 0;
  const monthlyLabels = Array.from(monthlyTotals.keys()).sort();
  const monthlyValues = monthlyLabels.map((label) => monthlyTotals.get(label));
  const priceHistory = monthlyLabels.map((label) => {
    const bucket = gradeByMonth.get(label) || { premium: { spend: 0, gallons: 0 }, regular: { spend: 0, gallons: 0 } };
    return {
      month: label,
      premium: bucket.premium.gallons > 0 ? bucket.premium.spend / bucket.premium.gallons : null,
      regular: bucket.regular.gallons > 0 ? bucket.regular.spend / bucket.regular.gallons : null
    };
  });

  return {
    totalSpent,
    totalGallons,
    averagePrice,
    visits,
    locationCount: locations.size,
    monthly: { labels: monthlyLabels, values: monthlyValues },
    priceHistory,
    gradeBreakdown: priceHistory.map((row) => ({ month: row.month, premiumSpend: (gradeByMonth.get(row.month)?.premium.spend) || 0, regularSpend: (gradeByMonth.get(row.month)?.regular.spend) || 0 }))
  };
}

/**
 * Aggregate payment method insights.
 * @param {Array<Object>} transactions - Transaction data.
 * @returns {Object} Payment insights.
 */
export function collectPaymentInsights(transactions = []) {
  const methods = new Map();
  let total = 0;
  const isGasRecord = (record) => record.receiptType === 'Gas Station' || record.documentType === 'FuelReceipts';

  transactions.forEach((record) => {
    if (!Array.isArray(record.tenderArray)) {
      return;
    }
    const year = (record.transactionDate || '').substring(0, 4) || 'Unknown';
    const gas = isGasRecord(record);
    record.tenderArray.forEach((tender) => {
      const methodName = tender.tenderDescription || 'Unknown';
      const amount = Math.abs(safeNumber(tender.amountTender));
      total += amount;
      if (!methods.has(methodName)) {
        methods.set(methodName, {
          name: methodName,
          total: 0,
          count: 0,
          gasSpend: 0,
          merchSpend: 0,
          yearly: new Map()
        });
      }
      const entry = methods.get(methodName);
      entry.total += amount;
      entry.count += 1;
      if (gas) {
        entry.gasSpend += amount;
      } else {
        entry.merchSpend += amount;
      }
      entry.yearly.set(year, (entry.yearly.get(year) || 0) + amount);
    });
  });

  const methodList = Array.from(methods.values()).map((entry) => ({
    ...entry,
    yearly: Array.from(entry.yearly.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  })).sort((a, b) => b.total - a.total);

  const estimateRewards = (entry) => {
    const name = entry.name.toUpperCase();
    if (name.includes('COSTCO VISA')) {
      return (entry.gasSpend * 0.04) + (entry.merchSpend * 0.02);
    }
    return entry.total * 0.01;
  };

  const rewards = methodList.reduce((sum, entry) => sum + estimateRewards(entry), 0);

  return {
    total,
    methods: methodList,
    rewards
  };
}

export {
  parseDate,
  safeNumber,
  getMonthKey,
  isDiscountLine,
  extractDiscountTarget
};
