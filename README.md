# Counter — local restaurant billing

Angular + Electron + SQLite. Runs on one desktop without an internet connection after installation. No backend server or cloud account required.

## Run on this computer

Use Node.js 24 LTS and npm. From Terminal:

```sh
cd /Users/rohithmankal/ai-assistant/restaurant-billing
npm start
```

On another computer, copy the project excluding `node_modules`, `dist`, `.angular`, and `release`, then run:

```sh
npm ci
npm start
```

If npm reports that Electron's install script was blocked, run `node node_modules/electron/install.js` and try again. Initial dependency/runtime downloads need internet; normal operation does not.

## First setup

1. On first launch, create the owner username and password. Passwords require at least eight characters and are stored as salted hashes. Keep these credentials safe; there is no remote password recovery for this offline app.
2. Open Settings, enter restaurant name/address/phone, currency and applicable tax rate. Tax defaults to zero and is added after discount; one rate applies to the whole bill.
3. Install the Epson driver in your operating system. Select the installed printer in Settings. Choose 80 mm or 58 mm, set matching paper width in the driver's preferences, save and test print.
4. Edit the sample menu. Give each item a unique shortcut. Half portions are unavailable unless a half price is configured. Hide unavailable items rather than deleting their history.
5. Add items, choose Cash/UPI/Card, then Complete bill. The selected payment means the cashier has received payment; this app does not verify UPI or process card transactions.

The application requires login on every launch. Use **Sign out** when leaving the counter unattended. Five failed attempts temporarily pause login for 30 seconds. The owner password can be changed in Settings.

## Billing

- The home page opens with New Invoice, Sales Report, Add Item and Restaurant Setup actions, plus today's collections and recent invoices.
- A new invoice uses clear columns for item name, Full/Half, quantity, unit price and line amount.
- Search names, starting letters or shortcuts. `CB` and `Chic` both suggest Chicken Biryani; exact shortcuts and name prefixes rank first.
- Selecting an item fills its price. Changing Full/Half or quantity recalculates that row and the invoice total.
- Up/down browses search results; Enter selects an item. After choosing the quantity, Enter adds the row.
- F2 opens billing/search; F4 changes default Full/Half; F9 completes the bill.
- The Full/Half buttons on each item add that exact portion. Half is disabled for unsupported items.
- Quantity is the number of portions. Two half portions remain two half portions on the invoice.
- Drafts save after a 300 ms pause. One current draft is supported.
- Completed invoices preserve restaurant details, names, prices and tax even when the menu changes.
- Invoice numbering restarts at 1 each local calendar day and uses the compact `MMDD-01` format, for example `1010-01`, `1010-02`.
- A failed/cancelled print does not cancel the sale. Reprint from the receipt or invoice history.
- Select **Save receipt as PDF in Downloads** when a physical printer is unavailable. The app selects this automatically when it detects no system printers and names the file with the invoice number.

## Reports and bill cancellation

Today/current week/current month/custom date ranges use the desktop's local timezone. Weeks start Monday. Reports include payments, tax, average bill, daily collections and CSV export.

Cancelling a bill preserves the original invoice and records the cancellation time. A reason can be entered but is optional. Cancelled bills are excluded from collections and item sales, grouped by their original bill date. Previously refunded invoices are shown as cancelled for compatibility with existing data.

## Storage and backups

Settings displays the actual database path. It is Electron's user-data directory, outside the source folder, in `restaurant.sqlite`. SQLite is managed with SQL.js and saved atomically after changes; suitable for a single counter. Invoice retention defaults to 30 days and can be configured from 1 to 3650 days. Older invoices are permanently deleted at startup and when settings are saved; a daily backup is created before startup cleanup.

Daily startup backups live in the adjacent `backups` directory; the newest 30 are retained. Export a backup to an external drive regularly. Restore validates required tables, asks before replacing data and saves a pre-restore copy. Automatic backups on the same disk do not protect against disk failure.

## Printing and extension

`electron/printer.cjs` separates receipt layout (`receiptHtml`) from the `SystemDriverPrinter` adapter (`list`/`print`). Printer selection, copies, width and direct printing are settings. A replacement with an OS-supported driver typically needs only driver installation and selection. Cutter and drawer configuration currently belong to the driver. Raw USB/network ESC/POS is a future adapter, not implemented.

The driver must support receipt media size; the app changes layout width but does not override the driver's paper definition. Verify a real test receipt before live billing. Print success means submission to the OS, not proof paper came out.

The renderer has no Node access; the preload exposes an allowlisted API and the main process validates price/portion/discount at checkout.

## Build, tests and installers

```sh
npm test
npm run build
npm run package
npm run dist
```

`package` creates an unpacked desktop application; `dist` creates an installer for the current OS in `release`. Build Windows installers on Windows, macOS installers on macOS. Installers are unsigned unless you add your signing credentials. The source and local run workflow are the primary delivery.

`npm run dev` offers UI preview only, not desktop database/printer functionality.

See PLAN.md for delivered scope and future extensions. This version is a single-counter application without staff login, inventory, kitchen tickets or multi-terminal synchronization. Receipt tax configuration is generic rather than a country-specific compliance engine.

## Reference receipt

The printed layout follows the supplied restaurant receipt: restaurant header, bill number/time/date, item line count, Item Name/F/H/Qty/Rate/Amount columns and bold total. Zero tax and zero discount rows are omitted. Defaults on a fresh database use the restaurant details from the sample and Chicken Biryani full price of 270; its half portion is unconfigured. Other sample items/prices are placeholders to edit. Existing databases are never overwritten with new defaults.

Dependency audit: the current desktop runtime is patched; eight moderate advisories remain in the optional installer build tooling through its logging dependencies. Avoid npm audit fix --force without reviewing the resulting tool versions. No installer has been verified with a physical printer.
