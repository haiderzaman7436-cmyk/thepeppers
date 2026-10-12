import { LOGO_BASE64 } from '../assets/logoBase64';

/**
 * 80mm x 210mm Professional Thermal Receipt & NokoPrint Utility
 * Optimized for 80mm (3-Inch) Thermal Printers, Tablets & NokoPrint App
 */

export const formatCurrency = (amount) => {
  if (typeof amount === 'string') {
    const num = parseInt(amount.replace(/\D/g, ''), 10);
    return isNaN(num) ? amount : `Rs ${num.toLocaleString()}`;
  }
  const num = Number(amount) || 0;
  return `Rs ${num.toLocaleString()}`;
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
  const formattedTotal = typeof total === 'string' && total.startsWith('Rs') ? total : formatCurrency(total);

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
  text += `Payment: PAID (${paymentMethod.toUpperCase()})\n`;
  text += '----------------------------------------\n';
  text += '       THANK YOU FOR DINING WITH US!    \n';
  text += '          PLEASE VISIT US AGAIN!        \n';
  text += `              *TP-${String(orderNumber).padStart(5, '0')}*              \n`;
  text += '========================================\n';

  return text;
};

/**
 * Generates high-contrast 80mm x 210mm HTML for thermal printing
 * Everything is styled BOLD and deep black for maximum thermal clarity
 */
export const generateReceiptHTML = (data) => {
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
  const formattedTotal = typeof total === 'string' && total.startsWith('Rs') ? total : formatCurrency(total);

  const itemsHtml = items.map((item, index) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price || item.parsedPrice) || 0;
    const lineTotal = price * qty;

    return `
      <div style="margin-bottom: 6px; font-size: 13px; line-height: 1.3;">
        <div style="font-weight: 900; color: #000000; word-break: break-word;">
          ${index + 1}. ${item.name}
        </div>
        <div style="display: flex; justify-content: space-between; padding-left: 8px; font-size: 12px; font-weight: 800; color: #000000;">
          <span>${qty} × ${formatCurrency(price)}</span>
          <span style="font-weight: 900;">${formatCurrency(lineTotal)}</span>
        </div>
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
      <style>
        @page {
          size: 80mm 210mm;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-weight: 800 !important;
          color: #000000 !important;
        }
        html, body {
          width: 80mm;
          max-width: 80mm;
          min-height: 210mm;
          margin: 0 auto;
          padding: 6mm 4mm 8mm 4mm;
          background: #ffffff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, monospace;
          font-size: 12px;
          line-height: 1.35;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        .logo-img {
          width: 60px;
          height: 60px;
          object-fit: contain;
          margin: 0 auto 6px auto;
          display: block;
          border-radius: 50%;
          border: 2px solid #000000;
        }
        
        .divider-dashed {
          border-top: 1.5px dashed #000000;
          margin: 6px 0;
        }
        .divider-solid {
          border-top: 2px solid #000000;
          margin: 6px 0;
        }
        .divider-double {
          border-top: 3px double #000000;
          margin: 6px 0;
        }

        .brand-name {
          font-size: 21px;
          font-weight: 900 !important;
          letter-spacing: 0.5px;
          line-height: 1.1;
          margin-bottom: 2px;
        }
        .tagline {
          font-size: 11px;
          font-style: italic;
          margin-bottom: 2px;
        }
        .store-sub {
          font-size: 10.5px;
          line-height: 1.3;
        }

        .badge-type {
          display: inline-block;
          font-size: 13px;
          font-weight: 900 !important;
          letter-spacing: 2px;
          padding: 3px 10px;
          border: 2px solid #000000;
          margin: 6px auto;
          text-transform: uppercase;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .items-header {
          display: flex;
          justify-content: space-between;
          font-weight: 900 !important;
          font-size: 12px;
          padding: 4px 0;
          border-top: 1.5px dashed #000000;
          border-bottom: 1.5px dashed #000000;
          margin: 6px 0;
          text-transform: uppercase;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 3px;
        }

        .grand-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 18px;
          font-weight: 900 !important;
          padding: 4px 0;
        }

        .barcode {
          font-family: monospace;
          font-size: 18px;
          letter-spacing: 4px;
          font-weight: 900 !important;
          text-align: center;
          margin-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <img src="${LOGO_BASE64}" alt="The Peppers" class="logo-img" />
        <div class="brand-name">${storeInfo.name}</div>
        <div class="tagline">~ ${storeInfo.tagline} ~</div>
        <div class="store-sub">${storeInfo.category}</div>
        <div class="store-sub">Tel: ${storeInfo.phone}</div>
        <div class="store-sub">${storeInfo.address}</div>
        
        <div class="badge-type">*** ${orderType.toUpperCase()} ***</div>
      </div>

      <div class="divider-dashed"></div>

      <div class="meta-row" style="font-size: 14px; margin-bottom: 4px;">
        <span style="font-weight: 900;">ORDER #: ${orderNumber}</span>
        <span style="font-weight: 900;">${paymentMethod.toUpperCase()}</span>
      </div>
      <div class="meta-row">
        <span>Date: ${date}</span>
        <span>Time: ${time}</span>
      </div>
      <div class="meta-row">
        <span>Customer: ${customer}</span>
        <span>Counter: POS-01</span>
      </div>

      <div class="items-header">
        <span>ITEM DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>

      <div style="margin: 4px 0;">
        ${itemsHtml}
      </div>

      <div class="divider-dashed"></div>

      <div class="summary-row">
        <span>Total Items / Qty:</span>
        <span>${totalQty}</span>
      </div>
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>${formattedTotal}</span>
      </div>

      <div class="divider-double"></div>

      <div class="grand-total">
        <span>TOTAL DUE:</span>
        <span style="font-size: 20px;">${formattedTotal}</span>
      </div>

      <div class="divider-double"></div>

      <div class="summary-row">
        <span>Payment Status:</span>
        <span>PAID (${paymentMethod.toUpperCase()})</span>
      </div>

      <div class="divider-dashed"></div>

      <div class="barcode">||| | |||| | ||| |||| | ||</div>
      <div class="text-center" style="font-size: 11px; letter-spacing: 2px; margin-bottom: 6px;">
        *TP-${String(orderNumber).padStart(5, '0')}*
      </div>

      <div class="text-center" style="font-size: 12px; margin-top: 6px; text-transform: uppercase;">
        Thank You For Dining With Us!
      </div>
      <div class="text-center" style="font-size: 11px; margin-top: 2px;">
        Please Visit Us Again Soon
      </div>
      <div class="text-center" style="font-size: 10px; margin-top: 6px;">
        Thermal Slip • 80mm x 210mm
      </div>
    </body>
    </html>
  `;
};

/**
 * Triggers printing strictly formatted as 80mm x 210mm
 * Optimized for Desktop browsers, Tablets & NokoPrint
 */
export const printThermalReceipt = (data) => {
  return new Promise((resolve) => {
    try {
      const htmlContent = generateReceiptHTML(data);
      const isTabletOrMobile = /Android|iPad|iPhone|iPod|Tablet/i.test(navigator.userAgent) || 
                               (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

      // On Tablets & Mobile: Use hidden print container and window.print()
      if (isTabletOrMobile) {
        let printContainer = document.getElementById('nokoprint-print-container');
        if (!printContainer) {
          printContainer = document.createElement('div');
          printContainer.id = 'nokoprint-print-container';
          // Ensure container is strictly hidden on normal screen view
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
            console.error("Tablet window.print error:", e);
            resolve(false);
          }
        }, 100);
        return;
      }

      // On Desktop: Use an offscreen hidden iframe to avoid interfering with current UI
      const existingFrame = document.getElementById('thermal-print-frame');
      if (existingFrame && existingFrame.parentNode) {
        existingFrame.parentNode.removeChild(existingFrame);
      }

      const printFrame = document.createElement('iframe');
      printFrame.id = 'thermal-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
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
