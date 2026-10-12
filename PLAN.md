# Counter implementation plan

1. Local architecture: Angular UI, isolated Electron IPC and SQL.js SQLite file; no server.
2. Billing: menu autocomplete and shortcuts, full/half availability, quantities, draft recovery, discounts, tax, payment method and immutable invoice snapshots.
3. Menu administration: create/edit categories, shortcut uniqueness, full/half prices and hide items.
4. Reports: today, Monday-based current week, current month, custom inclusive dates; totals, payment breakdown, charts, invoice history, CSV export and full invoice refund records.
5. Printer abstraction: system-driver adapter; configurable installed printer, receipt width, copies, print dialog/direct mode, test print and reprint.
6. Reliability: atomic file replacement, checkout token deduplication, durable invoice numbering, daily startup backups, export/restore with pre-restore copy and single application instance.
7. Delivery: compile Angular, exercise storage/calculation tests, desktop startup smoke test and local run documentation.

Future extensions: ESC/POS adapter for direct cutter/drawer commands, table order management, kitchen tickets, split payments, staff permissions, inventory, per-item tax and shared multi-terminal server. These are not implemented in this initial single-counter version.
