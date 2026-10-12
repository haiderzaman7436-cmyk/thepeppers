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

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(x)} 28" width="140" height="24" style="display:block;margin:0 auto;" shape-rendering="crispEdges">${bars.join('')}</svg>`;
};

/**
 * Generates plain text receipt formatted for 40/48-column thermal printers in NokoPrint
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
    storeInfo = {
      name: "THE PEPPERS",
      tagline: "Flavor & Spice",
      category: "Fast Food • Pizza • Burgers • Platters",
      phone: "0300-1234567",
      address: "Main Branch, Food Street"
    }
  } = data;

  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const formattedTotal = formatCurrency(total);

  let text = '';
  text += '========================================\n';
  text += `             ${storeInfo.name}             \n`;
  text += `          ~ ${storeInfo.tagline} ~        \n`;
  text += `        ${storeInfo.category}           \n`;
  text += `           Tel: ${storeInfo.phone}      \n`;
  text += `        ${storeInfo.address}            \n`;
  text += '========================================\n';
  text += `            *** ${orderType.toUpperCase()} ***           \n`;
  text += '----------------------------------------\n';
  text += `ORDER #: ${orderNumber}            PAY: ${paymentMethod.toUpperCase()}\n`;
  text += `Date: ${date}      Time: ${time}\n`;
  text += `Customer: ${customer}\n`;
  text += `Counter: POS-01\n`;
  text += '----------------------------------------\n';
  text += 'ITEM                       QTY    AMOUNT\n';
  text += '----------------------------------------\n';

  items.forEach((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price || item.parsedPrice) || 0;
    const lineTotal = price * qty;
    text += `${idx + 1}. ${item.name}\n`;
    text += `   ${qty} x ${formatCurrency(price)}`.padEnd(26) + `${formatCurrency(lineTotal)}\n`;
  });

  text += '----------------------------------------\n';
  text += `Total Items / Qty: ${totalQty}\n`;
  text += `Subtotal:`.padEnd(26) + `${formattedTotal}\n`;
  text += '========================================\n';
  text += `TOTAL DUE:`.padEnd(26) + `${formattedTotal}\n`;
  text += '========================================\n';
  text += `Payment Status: PAID (${paymentMethod.toUpperCase()})\n`;
  text += '----------------------------------------\n';
  text += '       THANK YOU FOR DINING WITH US!    \n';
  text += '          PLEASE VISIT US AGAIN!        \n';
  text += `              *TP-${String(orderNumber).padStart(5, '0')}*              \n`;
  text += '========================================\n';

  return text;
};

/**
 * Generates high-legibility 80mm x 210mm HTML for thermal printing
 * Uses calibrated, professional typography designed to eliminate ink bleeding and comic-like faux-bolding
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
    storeInfo = {
      name: "THE PEPPERS",
      tagline: "Flavor & Spice",
      category: "Fast Food • Pizza • Burgers • Platters",
      phone: "0325 7233444",
      address: "Gondlanwala Road, Rajkot Main Bazar Near Babu Bakers Gujranwala"
    }
  } = data;

  // Retrieve user customization preferences
  let fontPref = options.fontStyle;
  let sizePref = options.fontSize;
  let paperLengthPref = options.paperLength;
  const showLogo = options.showLogo !== undefined ? options.showLogo : true;
  const showStoreInfo = options.showStoreInfo !== undefined ? options.showStoreInfo : true;
  const showBarcode = options.showBarcode !== undefined ? options.showBarcode : true;

  if (!fontPref && typeof window !== 'undefined' && window.localStorage) {
    fontPref = window.localStorage.getItem('thepeppers_thermal_font_style');
  }
  if (!sizePref && typeof window !== 'undefined' && window.localStorage) {
    sizePref = window.localStorage.getItem('thepeppers_thermal_font_size');
  }
  if (!paperLengthPref && typeof window !== 'undefined' && window.localStorage) {
    paperLengthPref = window.localStorage.getItem('thepeppers_thermal_paper_length');
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
          letter-spacing: 0.8px;
          line-height: 1.15;
          text-transform: uppercase;
          color: #000000;
          margin-bottom: 2px;
        }
        .tagline {
          font-size: ${sizeConfig.sub};
          font-weight: 500;
          font-style: italic;
          letter-spacing: 0.3px;
          color: #111111;
          margin-bottom: 2px;
        }
        .store-sub {
          font-size: ${sizeConfig.sub};
          font-weight: 500;
          line-height: 1.3;
          color: #222222;
        }
        .store-phone {
          font-size: calc(${sizeConfig.sub} + 1px);
          font-weight: 700;
          line-height: 1.3;
          color: #000000;
        }

        .badge-type {
          display: inline-block;
          font-size: calc(${sizeConfig.base} - 0.5px);
          font-weight: 700;
          letter-spacing: 1.5px;
          padding: 2.5px 12px;
          border: 1.5px solid #000000;
          border-radius: 2px;
          margin: 6px auto 3px auto;
          text-transform: uppercase;
          color: #000000;
        }

        .divider-dashed {
          border-top: 1px dashed #000000;
          margin: 6px 0;
        }
        .divider-solid {
          border-top: 1.5px solid #000000;
          margin: 6px 0;
        }
        .divider-double {
          border-top: 1.5px solid #000000;
          border-bottom: 1.5px solid #000000;
          height: 3px;
          margin: 6px 0;
        }

        .order-title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: ${sizeConfig.heading};
          font-weight: 700;
          letter-spacing: 0.3px;
          margin-bottom: 3px;
          padding-bottom: 3px;
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
          letter-spacing: 0.5px;
          padding: 3.5px 0;
          border-top: 1px dashed #000000;
          border-bottom: 1px dashed #000000;
          margin: 6px 0 3px 0;
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
          margin: 2px 0 4px 0;
        }
        .item-row {
          display: flex;
          align-items: flex-start;
          padding: 3.5px 0;
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
          line-height: 1.3;
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
 * Triggers printing strictly formatted as 80mm x 210mm
 * Optimized for Desktop browsers, Tablets & NokoPrint
 */
export const printThermalReceipt = (data, options = {}) => {
  return new Promise((resolve) => {
    try {
      const htmlContent = generateReceiptHTML(data, options);
      // Strictly detect mobile devices (Android / iOS phones/tablets) - never falsely match Windows touchscreens
      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      // On Tablets & Mobile (Android / NokoPrint): Use hidden print container and window.print()
      if (isMobileDevice) {
        let printContainer = document.getElementById('nokoprint-print-container');
        if (!printContainer) {
          printContainer = document.createElement('div');
          printContainer.id = 'nokoprint-print-container';
          printContainer.style.display = 'none';
          document.body.appendChild(printContainer);
        }

        printContainer.innerHTML = htmlContent;

        window.focus();
        setTimeout(() => {
          try {
            window.print();
            resolve(true);
          } catch (e) {
            console.error("Mobile window.print error:", e);
            resolve(false);
          }
        }, 120);
        return;
      }

      // On Desktop (Windows / Mac): Use isolated hidden iframe for pure 80mm roll print without browser headers/footers
      const existingFrame = document.getElementById('thermal-print-frame');
      if (existingFrame && existingFrame.parentNode) {
        existingFrame.parentNode.removeChild(existingFrame);
      }

      const printFrame = document.createElement('iframe');
      printFrame.id = 'thermal-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '72mm';
      printFrame.style.height = '100px';
      printFrame.style.border = '0';
      printFrame.style.zIndex = '-9999';
      printFrame.style.visibility = 'hidden';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(htmlContent);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (printErr) {
          window.print();
        }
        setTimeout(() => {
          if (printFrame && printFrame.parentNode) {
            document.body.removeChild(printFrame);
          }
          resolve(true);
        }, 1500);
      }, 300);

    } catch (err) {
      console.error("Thermal printing error: ", err);
      window.print();
      resolve(false);
    }
  });
};

/**
 * Direct launch / share to NokoPrint application on Tablets
 */
export const openDirectNokoPrint = async (data) => {
  const receiptText = generateReceiptText(data);

  // Method 1: Android Intent targeting com.nokoprint directly
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    try {
      const intentUrl = `intent:#Intent;action=android.intent.action.SEND;type=text/plain;S.android.intent.extra.TEXT=${encodeURIComponent(receiptText)};package=com.nokoprint;end`;
      window.location.href = intentUrl;
      return true;
    } catch (intentErr) {
      console.warn("NokoPrint intent redirect error, falling back to Web Share", intentErr);
    }
  }

  // Method 2: Web Share API (native share sheet showing NokoPrint on tablet)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Order #${data.orderNumber} - The Peppers`,
        text: receiptText
      });
      return true;
    } catch (shareErr) {
      console.log("Share dismissed or failed", shareErr);
    }
  }

  // Method 3: Fallback to standard thermal print flow
  return printThermalReceipt(data);
};
