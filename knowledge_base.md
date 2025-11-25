# Costco Receipt Data Knowledge Base

## Discount Pattern Analysis

In the Costco receipt JSON data, discounts are not applied directly to the product's line item. Instead, they appear as a separate, subsequent line item.

### Pattern Identification

1.  **Product Line Item:** The product is listed first with its full price.
2.  **Discount Line Item:** The discount follows immediately (or shortly after) as a separate entry.

### Discount Entry Characteristics

*   **Item Number:** A unique identifier for the discount itself (e.g., `354986`).
*   **Description (`itemDescription01`):** Starts with a forward slash `/` followed by the `itemNumber` of the product the discount applies to (e.g., `/1421932`).
*   **Unit:** Set to `-1`.
*   **Amount:** A negative value representing the discount amount (e.g., `-5`).

### Example

**Product Entry:**
```json
{
  "itemNumber": "1421932",
  "itemDescription01": "DOVE16CT",
  "amount": 18.49,
  ...
}
```

**Associated Discount Entry:**
```json
{
  "itemNumber": "354986",
  "itemDescription01": "/1421932",
  "amount": -5,
  "unit": -1,
  ...
}
```

### Implementation Logic for Dashboards

To correctly calculate spend and track savings:

1.  **Iterate** through the `itemArray`.
2.  **Detect** discount items by checking if `amount < 0` and/or `itemDescription01` starts with `/`.
3.  **Link** the discount to the target product. The target product's `itemNumber` is contained in the discount's description (e.g., parse `/1421932` to find item `1421932`).
4.  **Adjust** the net cost of the product for spend analysis.
5.  **Aggregate** the absolute values of these discount items to calculate "Total Saved".
