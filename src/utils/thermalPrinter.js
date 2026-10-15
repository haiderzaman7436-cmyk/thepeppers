import { LOGO_BASE64 } from '../assets/logoBase64';
export const RECEIPT_FONTS = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', 'Consolas', 'Courier New', 'Courier', monospace"
};

export const RECEIPT_SIZES = {
  compact: {
    base: '11px',
    brand: '18px',
    total: '15px',
    heading: '12px',
    sub: '10px',
    padding: '2mm 1.5mm 3mm 1.5mm'
  },
  standard: {
    base: '12px',
    brand: '19px',
    total: '16.5px',
    heading: '13px',
    sub: '10.5px',
    padding: '2mm 1.5mm 3mm 1.5mm'
  },
  large: {
    base: '13px',
    brand: '21px',
    total: '18px',
    heading: '14px',
    sub: '11px',
    padding: '2.5mm 1.5mm 3.5mm 1.5mm'
  }
};

export const DEFAULT_STORE_INFO = {
  name: "THE PEPPERS",
  tagline: "Flavor & Spice",
  category: "Fast Food • Pizza • Burgers • Platters",
  phone: "0325 7233444",
  address: "Gondlanwala Road, Rajkot Main Bazar, Near Babu Bakers Gujranwala"
};

/**
 * Robust currency formatter ensuring all amounts consistently display with thousand separators (e.g. Rs 1,499)
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Rs 0';
  if (typeof amount === 'string') {
    const cleanStr = amount.replace(/,/g, '');
    const num = parseInt(cleanStr.replace(/[^\d.-]/g, ''), 10);
    return isNaN(num) ? amount : `Rs ${num.toLocaleString()}`;
  }
  const num = Math.round(Number(amount)) || 0;
  return `Rs ${num.toLocaleString()}`;
};

/**
 * Generates clean, crisp vector SVG barcode for thermal printing
 * Rendered with crispEdges to prevent blurry anti-aliasing on 203 DPI thermal print heads
 */
export const generateBarcodeSVG = (orderNumber) => {
  const numStr = String(orderNumber || '1').replace(/\D/g, '');
  const padded = numStr.padStart(5, '0');
  const codeStr = `TP-${padded}`;

  let x = 6;
  const bars = [];

  // Start guards
  bars.push(`<rect x="${x}" y="0" width="2" height="28" fill="#000000"/>`); x += 3.5;
  bars.push(`<rect x="${x}" y="0" width="1.5" height="28" fill="#000000"/>`); x += 3.5;

  for (let i = 0; i < codeStr.length; i++) {
    const charCode = codeStr.charCodeAt(i);
    const b1 = (charCode % 3 === 0) ? 2.5 : 1.2;
    const s1 = 1.6;
    const b2 = (charCode % 2 === 0) ? 2.0 : 1.2;
    const s2 = 1.8;
    const b3 = (charCode % 4 === 0) ? 3.0 : 1.4;
    const s3 = 2.0;

    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${b1.toFixed(1)}" height="28" fill="#000000"/>`); x += b1 + s1;
    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${b2.toFixed(1)}" height="28" fill="#000000"/>`); x += b2 + s2;
    bars.push(`<rect x="${x.toFixed(1)}" y="0" width="${b3.toFixed(1)}" height="28" fill="#000000"/>`); x += b3 + s3;
  }

  // End guards
  bars.push(`<rect x="${x.toFixed(1)}" y="0" width="2" height="28" fill="#000000"/>`); x += 3.5;
  bars.push(`<rect x="${x.toFixed(1)}" y="0" width="1.5" height="28" fill="#000000"/>`); x += 8;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(x)} 28" width="140" height="26" style="display:block;margin:0 auto;" shape-rendering="crispEdges">${bars.join('')}</svg>`;
};

/**
 * Generates plain text receipt formatted for standard 48-column 3-inch (80mm) thermal printers
 */
export const generateReceiptText = (data) => {
  const {
    orderNumber = 'N/A',
    date = new Date().toLocaleDateString(),
    time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    customer = 'Walk-in Customer',
    orderType = 'Dine In',
    paymentMethod = 'Cash',
    items = [],
    total = 0,
    storeInfo = DEFAULT_STORE_INFO
  } = data;

  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const formattedTotal = formatCurrency(total);

  let text = '';
  text += '================================================\n';
  text += `                  ${storeInfo.name}                  \n`;
  text += `              ~ ${storeInfo.tagline} ~             \n`;
  text += `   ${String(storeInfo.category).slice(0, 42)}   \n`;
  text += `                Tel: ${storeInfo.phone}                \n`;
  text += `  ${String(storeInfo.address).slice(0, 44)}  \n`;
  text += '================================================\n';
  text += `               *** ${orderType.toUpperCase()} ***               \n`;
  text += '------------------------------------------------\n';
  text += `ORDER #: ${orderNumber}`.padEnd(28, ' ') + `Date: ${date}\n`;
  text += `Customer: ${customer.slice(0, 24)}`.padEnd(28, ' ') + `Time: ${time}\n`;
  text += `Payment: ${paymentMethod.toUpperCase()} | Counter: POS-01\n`;
  text += '------------------------------------------------\n';
  text += 'QTY  ITEM DESCRIPTION                     AMOUNT\n';
  text += '------------------------------------------------\n';

  items.forEach((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price || item.parsedPrice) || 0;
    const lineTotal = price * qty;
    const itemName = String(item.name || 'Item').slice(0, 29);
    const amtStr = formatCurrency(lineTotal);
    const qtyStr = `${qty}x`.padEnd(5, ' ');
    const descStr = itemName.padEnd(31, ' ');
    const amtPadded = amtStr.padStart(12, ' ');
    text += `${qtyStr}${descStr}${amtPadded}\n`;
    if (qty > 1) {
      text += `     @ ${formatCurrency(price)} each\n`;
    }
  });

  text += '------------------------------------------------\n';
  text += `Total Items / Qty:`.padEnd(36, ' ') + `${totalQty}\n`;
  text += `Subtotal:`.padEnd(32, ' ') + `${formattedTotal.padStart(16, ' ')}\n`;
  text += '================================================\n';
  text += `TOTAL DUE:`.padEnd(28, ' ') + `${formattedTotal.padStart(20, ' ')}\n`;
  text += '================================================\n';
  text += `Payment Status: PAID (${paymentMethod.toUpperCase()})\n`;
  text += '------------------------------------------------\n';
  text += '         THANK YOU FOR DINING WITH US!          \n';
  text += '           PLEASE VISIT US AGAIN SOON           \n';
  text += `                  *TP-${String(orderNumber).padStart(5, '0')}*                  \n`;
  text += '================================================\n';

  return text;
};

/**
 * Generates high-legibility 3-inch (80mm) HTML for thermal printing
 * Uses calibrated, professional typography designed to eliminate ink bleeding and text truncation
 */
export const generateReceiptHTML = (data, options = {}) => {
  const {
    orderNumber = 'N/A',
    date = new Date().toLocaleDateString(),
    time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    customer = 'Walk-in Customer',
    orderType = 'Dine In',
    paymentMethod = 'Cash',
    items = [],
    total = 0,
    storeInfo = DEFAULT_STORE_INFO
  } = data;

  // Retrieve user customization preferences
  let fontPref = options.fontStyle;
  let sizePref = options.fontSize;
  let paperLengthPref = options.paperLength;
  let showLogo = options.showLogo;
  let showStoreInfo = options.showStoreInfo;
  let showBarcode = options.showBarcode;

  if (typeof window !== 'undefined' && window.localStorage) {
    if (!fontPref) fontPref = window.localStorage.getItem('thepeppers_thermal_font_style');
    if (!sizePref) sizePref = window.localStorage.getItem('thepeppers_thermal_font_size');
    if (!paperLengthPref) paperLengthPref = window.localStorage.getItem('thepeppers_thermal_paper_length');
    if (showLogo === undefined) {
      const val = window.localStorage.getItem('thepeppers_thermal_show_logo');
      showLogo = val !== null ? val === 'true' : true;
    }
    if (showStoreInfo === undefined) {
      const val = window.localStorage.getItem('thepeppers_thermal_show_info');
      showStoreInfo = val !== null ? val === 'true' : true;
    }
    if (showBarcode === undefined) {
      const val = window.localStorage.getItem('thepeppers_thermal_show_barcode');
      showBarcode = val !== null ? val === 'true' : true;
    }
  }

  const activeFontKey = fontPref === 'mono' ? 'mono' : 'sans';
  const activeSizeKey = ['compact', 'standard', 'large'].includes(sizePref) ? sizePref : 'standard';
  const isFixedLength = paperLengthPref === 'fixed';

  const fontFamily = RECEIPT_FONTS[activeFontKey];
  const sizeConfig = RECEIPT_SIZES[activeSizeKey];

  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const formattedTotal = formatCurrency(total);
  const barcodeSvg = generateBarcodeSVG(orderNumber);

  const itemsHtml = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price || item.parsedPrice) || 0;
    const lineTotal = price * qty;

    return `
      <div class="item-row">
        <div class="item-qty">${qty}x</div>
        <div class="item-desc">
          <div class="item-name">${item.name}</div>
          ${qty > 1 ? `<div class="item-rate">@ ${formatCurrency(price)} each</div>` : ''}
        </div>
        <div class="item-amount tabular-nums">${formatCurrency(lineTotal)}</div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Receipt #${orderNumber} - The Peppers</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: ${isFixedLength ? '80mm 210mm' : '80mm auto'};
          margin: 0mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        html {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
        body {
          width: 72mm;
          max-width: 72mm;
          height: auto;
          min-height: ${isFixedLength ? '200mm' : 'auto'};
          margin: 0 auto;
          padding: ${sizeConfig.padding};
          background: #ffffff;
          color: #000000;
          font-family: ${fontFamily};
          font-size: ${sizeConfig.base};
          line-height: 1.35;
          box-sizing: border-box;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .receipt-container {
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
          color: #000000;
        }

        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .tabular-nums {
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }

        .logo-img {
          width: 52px;
          height: 52px;
          object-fit: contain;
          margin: 0 auto 5px auto;
          display: block;
          border-radius: 50%;
          border: 1.5px solid #000000;
        }

        .brand-name {
          font-size: ${sizeConfig.brand};
          font-weight: 800;
          letter-spacing: 0.5px;
          line-height: 1.15;
          text-transform: uppercase;
          color: #000000;
          margin-bottom: 2px;
        }
        .tagline {
          font-size: ${sizeConfig.sub};
          font-weight: 500;
          font-style: italic;
          letter-spacing: 0.2px;
          color: #111111;
          margin-bottom: 2px;
        }
        .store-sub {
          font-size: ${sizeConfig.sub};
          font-weight: 500;
          line-height: 1.25;
          color: #222222;
        }
        .store-phone {
          font-size: calc(${sizeConfig.sub} + 1px);
          font-weight: 700;
          line-height: 1.25;
          color: #000000;
        }

        .badge-type {
          display: inline-block;
          font-size: calc(${sizeConfig.base} - 0.5px);
          font-weight: 700;
          letter-spacing: 1px;
          padding: 2.5px 10px;
          border: 1.5px solid #000000;
          border-radius: 2px;
          margin: 5px auto 2px auto;
          text-transform: uppercase;
          color: #000000;
        }

        .divider-dashed {
          border-top: 1px dashed #000000;
          margin: 5px 0;
        }
        .divider-solid {
          border-top: 1.5px solid #000000;
          margin: 5px 0;
        }
        .divider-double {
          border-top: 1.5px solid #000000;
          border-bottom: 1.5px solid #000000;
          height: 3px;
          margin: 5px 0;
        }

        .order-title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: ${sizeConfig.heading};
          font-weight: 700;
          letter-spacing: 0.2px;
          margin-bottom: 2.5px;
          padding-bottom: 2.5px;
          border-bottom: 1px dashed #000000;
          color: #000000;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: calc(${sizeConfig.base} - 0.5px);
          font-weight: 500;
          color: #111111;
          margin-bottom: 2px;
        }
        .meta-bold {
          font-weight: 600;
          color: #000000;
        }

        .items-header {
          display: flex;
          align-items: center;
          font-weight: 700;
          font-size: calc(${sizeConfig.base} - 1px);
          letter-spacing: 0.3px;
          padding: 3px 0;
          border-top: 1px dashed #000000;
          border-bottom: 1px dashed #000000;
          margin: 5px 0 2px 0;
          text-transform: uppercase;
          color: #000000;
        }
        .items-header-qty {
          width: 32px;
          min-width: 32px;
          text-align: left;
        }
        .items-header-desc {
          flex: 1;
          padding: 0 4px;
          text-align: left;
        }
        .items-header-amt {
          width: 78px;
          min-width: 78px;
          text-align: right;
        }

        .items-list {
          margin: 2px 0 3px 0;
        }
        .item-row {
          display: flex;
          align-items: flex-start;
          padding: 3px 0;
          border-bottom: 0.5px dashed #cccccc;
        }
        .item-row:last-child {
          border-bottom: none;
        }
        .item-qty {
          width: 32px;
          min-width: 32px;
          font-weight: 700;
          font-size: ${sizeConfig.base};
          color: #000000;
          text-align: left;
          padding-top: 0.5px;
        }
        .item-desc {
          flex: 1;
          padding: 0 4px;
          text-align: left;
        }
        .item-name {
          font-size: ${sizeConfig.base};
          font-weight: 600;
          line-height: 1.25;
          color: #000000;
          word-break: break-word;
        }
        .item-rate {
          font-size: calc(${sizeConfig.base} - 1.5px);
          font-weight: 500;
          color: #333333;
          margin-top: 1px;
        }
        .item-amount {
          width: 78px;
          min-width: 78px;
          text-align: right;
          font-size: ${sizeConfig.base};
          font-weight: 700;
          color: #000000;
          padding-top: 0.5px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: calc(${sizeConfig.base} - 0.5px);
          font-weight: 500;
          margin-bottom: 2.5px;
          color: #111111;
        }
        .summary-val {
          font-weight: 600;
          color: #000000;
        }

        .grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: ${sizeConfig.total};
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 2px 0;
          color: #000000;
        }

        .barcode-container {
          text-align: center;
          margin-top: 6px;
        }
        .order-code {
          font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
          font-size: 11px;
          letter-spacing: 2px;
          font-weight: 600;
          margin: 3px 0 6px 0;
          color: #000000;
        }

        .footer-msg {
          font-size: calc(${sizeConfig.base} - 1px);
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: #000000;
          margin-top: 4px;
        }
        .footer-sub {
          font-size: ${sizeConfig.sub};
          font-weight: 500;
          color: #222222;
          margin-top: 2px;
        }
        .footer-spec {
          font-size: calc(${sizeConfig.sub} - 1.5px);
          font-weight: 500;
          color: #444444;
          margin-top: 5px;
          letter-spacing: 0.3px;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <!-- Store Header -->
        <div class="text-center">
          ${showLogo ? `<img src="${LOGO_BASE64}" alt="The Peppers" class="logo-img" />` : ''}
          <div class="brand-name">${storeInfo.name}</div>
          ${showStoreInfo ? `
            <div class="tagline">~ ${storeInfo.tagline} ~</div>
            <div class="store-sub">${storeInfo.category}</div>
            <div class="store-phone">Tel: ${storeInfo.phone}</div>
            <div class="store-sub">${storeInfo.address}</div>
          ` : ''}
          
          <div class="badge-type">*** ${orderType.toUpperCase()} ***</div>
        </div>

        <div class="divider-dashed"></div>

        <!-- Order Metadata -->
        <div class="order-title-row">
          <span>ORDER #: ${orderNumber}</span>
          <span class="tabular-nums">${paymentMethod.toUpperCase()}</span>
        </div>
        <div class="meta-row">
          <span>Date: ${date}</span>
          <span>Time: ${time}</span>
        </div>
        <div class="meta-row">
          <span>Customer: <strong class="meta-bold">${customer}</strong></span>
          <span>Counter: POS-01</span>
        </div>

        <!-- Items Header -->
        <div class="items-header">
          <span class="items-header-qty">QTY</span>
          <span class="items-header-desc">ITEM DESCRIPTION</span>
          <span class="items-header-amt">AMOUNT</span>
        </div>

        <!-- Items List -->
        <div class="items-list">
          ${itemsHtml}
        </div>

        <div class="divider-dashed"></div>

        <!-- Summary & Totals -->
        <div class="summary-row">
          <span>Total Items / Qty:</span>
          <span class="summary-val tabular-nums">${totalQty}</span>
        </div>
        <div class="summary-row">
          <span>Subtotal:</span>
          <span class="summary-val tabular-nums">${formattedTotal}</span>
        </div>

        <div class="divider-double"></div>

        <div class="grand-total-row tabular-nums">
          <span>TOTAL DUE:</span>
          <span>${formattedTotal}</span>
        </div>

        <div class="divider-double"></div>

        <div class="summary-row">
          <span>Payment Status:</span>
          <span class="summary-val">PAID (${paymentMethod.toUpperCase()})</span>
        </div>

        <div class="divider-dashed"></div>

        <!-- Barcode & Greetings -->
        <div class="barcode-container">
          ${showBarcode ? `
            ${barcodeSvg}
            <div class="order-code">*TP-${String(orderNumber).padStart(5, '0')}*</div>
          ` : ''}
          <div class="footer-msg">THANK YOU FOR DINING WITH US!</div>
          <div class="footer-sub">Please Visit Us Again Soon</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Default LAN Printer Network Configuration
 * Ethernet / Wi-Fi thermal receipt printer IP address: 192.168.100.55 (Port: 9100)
 */
export const DEFAULT_PRINTER_IP = '192.168.100.55';
export const DEFAULT_PRINTER_PORT = 9100;

export const getPrinterConfig = () => {
  let ip = DEFAULT_PRINTER_IP;
  let port = DEFAULT_PRINTER_PORT;
  if (typeof window !== 'undefined' && window.localStorage) {
    ip = window.localStorage.getItem('thepeppers_printer_ip') || DEFAULT_PRINTER_IP;
    port = parseInt(window.localStorage.getItem('thepeppers_printer_port') || '9100', 10) || DEFAULT_PRINTER_PORT;
  }
  return { ip, port };
};

export const setPrinterConfig = (ip, port = DEFAULT_PRINTER_PORT) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem('thepeppers_printer_ip', ip);
    window.localStorage.setItem('thepeppers_printer_port', String(port));
  }
};

/**
 * Builds standard ESC/POS binary buffer for 3-inch (80mm / 48-column) network thermal printers (port 9100)
 */
export const generateESCPOSBuffer = (data) => {
  const {
    orderNumber = 'N/A',
    date = new Date().toLocaleDateString(),
    time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    customer = 'Walk-in Customer',
    orderType = 'Dine In',
    paymentMethod = 'Cash',
    items = [],
    total = 0,
    storeInfo = DEFAULT_STORE_INFO
  } = data;

  const encoder = new TextEncoder();
  const parts = [];

  const addBytes = (...bytes) => parts.push(new Uint8Array(bytes));
  const addText = (str) => parts.push(encoder.encode(str));

  // 1. Initialize printer (ESC @)
  addBytes(0x1B, 0x40);

  // 2. Code Table: PC437 Standard (ESC t 0)
  addBytes(0x1B, 0x74, 0x00);

  // 3. Center alignment (ESC a 1)
  addBytes(0x1B, 0x61, 0x01);

  // 4. Double height & width for header (GS ! 0x11)
  addBytes(0x1D, 0x21, 0x11);
  addText(`${storeInfo.name}\n`);

  // 5. Normal font size (GS ! 0x00)
  addBytes(0x1D, 0x21, 0x00);
  addText(`~ ${storeInfo.tagline} ~\n`);
  addText(`${storeInfo.category}\n`);
  addText(`Tel: ${storeInfo.phone}\n`);
  addText(`${storeInfo.address}\n\n`);

  // Order Type Banner (Bold)
  addBytes(0x1B, 0x45, 0x01);
  addText(`*** ${orderType.toUpperCase()} ***\n`);
  addBytes(0x1B, 0x45, 0x00);

  // Separator (48 chars for 80mm / 3-inch roll)
  addText("------------------------------------------------\n");

  // Align Left (ESC a 0)
  addBytes(0x1B, 0x61, 0x00);
  const orderLine = `ORDER #: ${orderNumber}`.padEnd(28, ' ') + `Date: ${date}\n`;
  addText(orderLine);
  const custLine = `Customer: ${customer.slice(0, 22)}`.padEnd(28, ' ') + `Time: ${time}\n`;
  addText(custLine);
  addText(`Payment: ${paymentMethod.toUpperCase()} | Counter: POS-01\n`);
  addText("------------------------------------------------\n");
  addText("QTY  ITEM DESCRIPTION                     AMOUNT\n");
  addText("------------------------------------------------\n");

  // Items List
  const safeItems = Array.isArray(items) ? items : [];
  safeItems.forEach(item => {
    const qty = `${String(item.quantity || 1)}x`.padEnd(5, ' ');
    const lineTotal = formatCurrency((Number(item.price || item.parsedPrice) || 0) * (Number(item.quantity) || 1));
    
    let name = String(item.name || 'Item');
    if (name.length > 29) name = name.substring(0, 27) + '..';
    const namePadded = name.padEnd(31, ' ');
    const amountPadded = lineTotal.padStart(12, ' ');

    addText(`${qty}${namePadded}${amountPadded}\n`);
  });

  addText("------------------------------------------------\n");

  // Total Due (Bold)
  addBytes(0x1B, 0x61, 0x02); // Align Right
  addBytes(0x1B, 0x45, 0x01); // Bold on
  addText(`TOTAL DUE: ${formatCurrency(total)}\n`);
  addBytes(0x1B, 0x45, 0x00); // Bold off

  addText("------------------------------------------------\n");

  // Footer (Center)
  addBytes(0x1B, 0x61, 0x01);
  addText("THANK YOU FOR DINING WITH US!\n");
  addText("PLEASE VISIT US AGAIN SOON\n");

  // Feed 4 lines
  addBytes(0x0A, 0x0A, 0x0A, 0x0A);

  // Partial Cut paper (GS V 65 0)
  addBytes(0x1D, 0x56, 0x41, 0x00);

  // Kick cash drawer (ESC p 0 25 250)
  addBytes(0x1B, 0x70, 0x00, 0x19, 0xFA);

  // Combine bytes
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

/**
 * Transmits raw ESC/POS print job directly to LAN thermal printer at 192.168.100.55:9100
 */
export const sendLanPrint = async (data, customConfig = {}) => {
  const config = { ...getPrinterConfig(), ...customConfig };
  const ip = config.ip || DEFAULT_PRINTER_IP;
  const port = config.port || DEFAULT_PRINTER_PORT;

  try {
    const escposBytes = generateESCPOSBuffer(data);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    // Direct HTTP POST / raw TCP stream to port 9100 on 192.168.100.55
    await fetch(`http://${ip}:${port}`, {
      method: 'POST',
      mode: 'no-cors',
      body: escposBytes,
      signal: controller.signal
    });

    clearTimeout(timeout);
    console.log(`[LAN Thermal Printer] Raw packet dispatched to ${ip}:${port}`);
    return { success: true, ip, port };
  } catch (err) {
    console.warn(`[LAN Thermal Printer] Attempt to ${ip}:${port}:`, err.message);
    return { success: false, ip, port, error: err.message };
  }
};

/**
 * Generates an ultra-sharp PNG Blob of the 3-inch (80mm) thermal receipt for sharing / mobile apps
 */
export const generateThermalReceiptBlob = async (data, options = {}) => {
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default || html2canvasModule;
  const htmlContent = generateReceiptHTML(data, options);
  
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = '272px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-99999';
  container.style.pointerEvents = 'none';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate thermal receipt blob"));
      }, 'image/png');
    });
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Triggers printing strictly formatted as 3-inch (80mm roll, 72mm printable width)
 * Optimized for LAN thermal printing (192.168.100.55) & Desktop/Tablet browsers
 */
export const printThermalReceipt = async (data, options = {}) => {
  // 1. Immediately send ESC/POS signal to LAN printer at 192.168.100.55:9100
  sendLanPrint(data, options).catch((err) => {
    console.log("LAN print background dispatch:", err);
  });

  // 2. Also run browser thermal print dialog via iframe (ensures 100% universal compatibility across all systems)
  return new Promise((resolve) => {
    try {
      const htmlContent = generateReceiptHTML(data, options);

      // Clean up any stale print frames
      const existingFrame = document.getElementById('thermal-print-frame');
      if (existingFrame && existingFrame.parentNode) {
        existingFrame.parentNode.removeChild(existingFrame);
      }

      // Create isolated hidden iframe for 3-inch roll (72mm body width)
      const printFrame = document.createElement('iframe');
      printFrame.id = 'thermal-print-frame';
      printFrame.setAttribute('aria-hidden', 'true');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '72mm';
      printFrame.style.height = '100px';
      printFrame.style.border = '0';
      printFrame.style.opacity = '0.01';
      printFrame.style.pointerEvents = 'none';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      const executePrint = () => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (printErr) {
          console.warn("Iframe print exception:", printErr);
        }
        setTimeout(() => {
          if (printFrame && printFrame.parentNode) {
            document.body.removeChild(printFrame);
          }
          resolve(true);
        }, 2000);
      };

      if (frameDoc.readyState === 'complete') {
        setTimeout(executePrint, 250);
      } else {
        printFrame.onload = () => setTimeout(executePrint, 250);
        setTimeout(executePrint, 500);
      }

    } catch (err) {
      console.error("Thermal printing error: ", err);
      resolve(false);
    }
  });
};

/**
 * Direct print support for BR RawPrinter iOS Application
 * Uses native iOS Share Sheet / file passing so BR RawPrinter can print via Bluetooth or LAN
 */
export const printWithBRRawPrinter = async (data, options = {}) => {
  const orderNum = data.orderNumber || data.invoiceNumber || 'Receipt';
  const receiptText = generateReceiptText(data);

  try {
    let file = null;
    try {
      const blob = await generateThermalReceiptBlob(data, options);
      file = new File([blob], `ThePeppers-Order-${orderNum}.png`, { type: 'image/png' });
    } catch (blobErr) {
      console.warn("Could not create PNG file for BR RawPrinter, falling back to text:", blobErr);
    }

    // Method 1: iOS Native Web Share with PNG file (BR RawPrinter appears directly in the native iOS share row)
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `The Peppers - Order #${orderNum}`,
        text: `Order #${orderNum} - The Peppers Receipt`
      });
      return true;
    }

    // Method 2: Web Share with receipt text
    if (navigator.share) {
      await navigator.share({
        title: `Order #${orderNum} - The Peppers`,
        text: receiptText
      });
      return true;
    }

    // Method 3: Attempt BR RawPrinter URL scheme (rawprinter:// or br-rawprinter://)
    try {
      window.location.href = `rawprinter://print?text=${encodeURIComponent(receiptText)}`;
    } catch (e) {}

    // Fallback: Trigger standard thermal print
    return printThermalReceipt(data, options);
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error("BR RawPrinter error:", err);
      return printThermalReceipt(data, options);
    }
    return false;
  }
};

/**
 * Backward-compatible alias for thermal receipt printing
 */
export const openDirectNokoPrint = (data, options = {}) => {
  return printThermalReceipt(data, options);
};
