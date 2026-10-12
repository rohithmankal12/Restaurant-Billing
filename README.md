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

## Installer and client setup guide

The installer must be built for the operating system on which it will be installed. Build the Windows `.exe` on Windows and the macOS `.dmg` on macOS. The generated installers are written to the `release` directory and can be copied to the client computer using a USB drive or another trusted transfer method.

### Prepare the build computer

1. Install [Node.js 24 LTS](https://nodejs.org/) and Git.
2. Download or clone this repository.
3. Open Terminal, PowerShell or Command Prompt inside the project directory.
4. Install the exact dependencies and run the checks:

```sh
npm ci
npm test
npm run build
```

An internet connection is required for `npm ci` and the first installer build. The installed billing application works locally without an internet connection.

### Generate the Windows `.exe`

Run these commands on a Windows computer:

```powershell
git clone https://github.com/rohithmankal12/Restaurant-Billing.git
cd Restaurant-Billing
npm ci
npm test
npm run dist
```

The NSIS setup file is generated in `release`, with a name similar to `Counter Billing Setup 1.0.0.exe`. Give this setup file to the client; do not copy the complete source project or `node_modules`.

On the client Windows computer:

1. Install the official Epson TM-T82 Windows driver and connect the printer.
2. Print a Windows test page and set the driver paper size to the installed roll width, normally 80 mm.
3. Run `Counter Billing Setup 1.0.0.exe`. Because this installer is currently unsigned, Windows SmartScreen may show **Windows protected your PC**. Confirm that the file came from the trusted build computer, select **More info**, then **Run anyway**.
4. Open **Counter Billing** from the Start menu or desktop shortcut.
5. Create the owner login on first launch.
6. Open **Settings**, enter the restaurant details, select the Epson TM-T82, select the matching paper width, save, and print a test receipt.
7. Add or edit menu items before live billing. Create a sample invoice and confirm the item columns, total, paper alignment, cut and silent printing.

Application data is stored in the signed-in Windows user's application-data directory, separate from the installation folder. Updating or reinstalling the application should retain it, but export a backup before replacing a live installation. Uninstalling the application does not serve as a backup procedure.

### Generate the macOS `.dmg`

Run these commands on a Mac:

```sh
git clone https://github.com/rohithmankal12/Restaurant-Billing.git
cd Restaurant-Billing
npm ci
npm test
npm run dist
```

The disk image is generated in `release`, with a name similar to `Counter Billing-1.0.0.dmg`. Build on the same CPU family as the client Mac unless universal/architecture-specific targets are added later.

On the client Mac:

1. Install a compatible Epson TM-T82 macOS driver, connect the printer, add it in **System Settings → Printers & Scanners**, and print a system test page.
2. Open the `.dmg` and drag **Counter Billing** into **Applications**.
3. The application is currently unsigned. On first launch, Control-click the application, choose **Open**, then confirm **Open**. If macOS blocks it, use **System Settings → Privacy & Security → Open Anyway** only after confirming the installer came from the trusted build computer.
4. Create the owner login.
5. Open **Settings**, enter the restaurant details, select the Epson printer and matching paper width, save, and print a test receipt.

Application data is stored in the current macOS user's Application Support directory, separate from the application bundle. Export a backup before an update or migration.

### Updating a client installation

1. Export a database backup from the current application and copy it to a separate drive.
2. Build a new installer from the updated `main` branch on the matching operating system.
3. Close Counter Billing on the client computer.
4. Run the new Windows installer, or replace the macOS application using the new `.dmg`.
5. Open the application and confirm the menu, recent invoices, printer selection and one test receipt. Use **Restore backup** only if the existing data is missing or damaged.

### Other build commands

```sh
npm run package
npm run smoke
```

`npm run package` creates an unpacked application in `release`; it is useful for local testing but is not the client installer. `npm run smoke` checks that the Electron window can start after a successful web build. `npm run dev` provides a browser UI preview only and does not provide the desktop database or printer integration.

The installers are unsigned until Windows code-signing and Apple Developer signing credentials are configured. Always verify a real receipt on the client printer before live billing.

See PLAN.md for delivered scope and future extensions. This version is a single-counter application without staff login, inventory, kitchen tickets or multi-terminal synchronization. Receipt tax configuration is generic rather than a country-specific compliance engine.

## Reference receipt

The printed layout follows the supplied restaurant receipt: restaurant header, bill number/time/date, item line count, Item Name/F/H/Qty/Rate/Amount columns and bold total. Zero tax and zero discount rows are omitted. Defaults on a fresh database use the restaurant details from the sample and Chicken Biryani full price of 270; its half portion is unconfigured. Other sample items/prices are placeholders to edit. Existing databases are never overwritten with new defaults.

Dependency audit: the current desktop runtime is patched; eight moderate advisories remain in the optional installer build tooling through its logging dependencies. Avoid npm audit fix --force without reviewing the resulting tool versions. No installer has been verified with a physical printer.
