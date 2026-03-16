# Plan: Admin Panel Simplification for Phone-Only Workflow

This plan outlines the complete removal of order management and stock tracking features from the admin panel to align with the new phone-only ordering model.

## Proposed Changes

### 1. Admin Sidebar & Navigation
- **Remove "Orders" Link**: Delete the Orders menu item and associated badge logic from the admin sidebar.
- **Update Badge Counts**: Remove `orders` from the `NavBadgeCounts` type and the `fetchCounts` logic.

### 2. Admin Dashboard
- **Stats Removal**: Delete cards for "Total Orders", "Revenue", "Total Profit", "Low Stock Items", and "Expiring Items".
- **Section Removal**: Remove "Low Stock Alerts", "Expiry Alerts", and "Recent Orders" sections from the dashboard.
- **Simplified Metrics**: The dashboard will now primarily focus on product and category counts.

### 3. Product Management Forms
- **Stock Field Removal**: Remove the "Stock" input field from the "Add New Product" and "Edit Product" forms.
- **API Updates**: Adjust the product creation and update logic to default stock to a high value (e.g., 999) or remove the requirement if the database schema allows.

### 4. Code Cleanup
- **Route Deletion**: If no longer needed, we can eventually remove the `/admin/orders` page and `/api/orders` endpoints (though keeping the API for historical data or internal use is an option).
- **Type Updates**: Update the `Product` type to reflect that stock is no longer a managed field in the UI.

## Verification Plan
- Verify that the "Orders" link is gone from the sidebar.
- Confirm the Dashboard is clean and only shows relevant product info.
- Check that adding/editing products no longer requires entering stock.
