SELECT 'auth_sessions.admin_id -> admins.id' AS check_name, COUNT(*) AS orphan_count
FROM auth_sessions child
LEFT JOIN admins parent ON parent.id = child.admin_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'ingredient_purchases.supplier_id -> suppliers.id', COUNT(*)
FROM ingredient_purchases child
LEFT JOIN suppliers parent ON parent.id = child.supplier_id
WHERE child.supplier_id IS NOT NULL AND parent.id IS NULL
UNION ALL
SELECT 'ingredient_purchase_lines.purchase_id -> ingredient_purchases.id', COUNT(*)
FROM ingredient_purchase_lines child
LEFT JOIN ingredient_purchases parent ON parent.id = child.purchase_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'ingredient_purchase_lines.ingredient_id -> ingredients.id', COUNT(*)
FROM ingredient_purchase_lines child
LEFT JOIN ingredients parent ON parent.id = child.ingredient_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'purchase_corrections.source_purchase_id -> ingredient_purchases.id', COUNT(*)
FROM purchase_corrections child
LEFT JOIN ingredient_purchases parent ON parent.id = child.source_purchase_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'purchase_correction_lines.correction_id -> purchase_corrections.id', COUNT(*)
FROM purchase_correction_lines child
LEFT JOIN purchase_corrections parent ON parent.id = child.correction_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'purchase_correction_lines.source_purchase_line_id -> ingredient_purchase_lines.id', COUNT(*)
FROM purchase_correction_lines child
LEFT JOIN ingredient_purchase_lines parent ON parent.id = child.source_purchase_line_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'purchase_correction_lines.ingredient_id -> ingredients.id', COUNT(*)
FROM purchase_correction_lines child
LEFT JOIN ingredients parent ON parent.id = child.ingredient_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'production_batches.product_id -> products.id', COUNT(*)
FROM production_batches child
LEFT JOIN products parent ON parent.id = child.product_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'production_batch_lines.batch_id -> production_batches.id', COUNT(*)
FROM production_batch_lines child
LEFT JOIN production_batches parent ON parent.id = child.batch_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'production_batch_lines.ingredient_id -> ingredients.id', COUNT(*)
FROM production_batch_lines child
LEFT JOIN ingredients parent ON parent.id = child.ingredient_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'sales_invoices.buyer_id -> buyers.id', COUNT(*)
FROM sales_invoices child
LEFT JOIN buyers parent ON parent.id = child.buyer_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'sales_invoice_lines.invoice_id -> sales_invoices.id', COUNT(*)
FROM sales_invoice_lines child
LEFT JOIN sales_invoices parent ON parent.id = child.invoice_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'sales_invoice_lines.product_id -> products.id', COUNT(*)
FROM sales_invoice_lines child
LEFT JOIN products parent ON parent.id = child.product_id
WHERE parent.id IS NULL
UNION ALL
SELECT 'stock_layer_allocations.stock_layer_id -> stock_layers.id', COUNT(*)
FROM stock_layer_allocations child
LEFT JOIN stock_layers parent ON parent.id = child.stock_layer_id
WHERE parent.id IS NULL;

SELECT 'buyers.id fits signed int' AS check_name, COUNT(*) AS out_of_range_count
FROM buyers
WHERE id > 2147483647
UNION ALL
SELECT 'ingredient_purchase_lines.id fits signed int', COUNT(*)
FROM ingredient_purchase_lines
WHERE id > 2147483647
UNION ALL
SELECT 'ingredient_purchases.id fits signed int', COUNT(*)
FROM ingredient_purchases
WHERE id > 2147483647
UNION ALL
SELECT 'ingredients.id fits signed int', COUNT(*)
FROM ingredients
WHERE id > 2147483647
UNION ALL
SELECT 'production_batch_lines.id fits signed int', COUNT(*)
FROM production_batch_lines
WHERE id > 2147483647
UNION ALL
SELECT 'production_batches.id fits signed int', COUNT(*)
FROM production_batches
WHERE id > 2147483647
UNION ALL
SELECT 'products.id fits signed int', COUNT(*)
FROM products
WHERE id > 2147483647
UNION ALL
SELECT 'suppliers.id fits signed int', COUNT(*)
FROM suppliers
WHERE id > 2147483647;
