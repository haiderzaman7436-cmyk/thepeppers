/**
 * 3-Inch (80mm) Thermal Receipt & NokoPrint Tablet Utility
 * Specially optimized for Tablets using the NokoPrint Android/iOS mobile application
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
 * Generates plain text receipt formatted specifically for 40/48-column thermal printers in NokoPrint
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
      name: "THE PEPPER'S",
      tagline: "Flavor & Spice",
      category: "Fast Food • Pizza • Burgers",
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
  text += '       Thank You For Your Order!        \n';
  text += '        Please Visit Us Again!          \n';
  text += `              *TP-${String(orderNumber).padStart(5, '0')}*              \n`;
  text += '========================================\n';

  return text;
};

/**
 * Generates high-contrast 3-inch (80mm) HTML for thermal printers
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
      name: "THE PEPPER'S",
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
      <div style="margin-bottom: 5px; font-size: 12px;">
        <div style="font-weight: 900; word-break: break-word;">${index + 1}. ${item.name}</div>
        <div style="display: flex; justify-content: space-between; padding-left: 10px; font-size: 11px;">
          <span>${qty} x ${formatCurrency(price)}</span>
          <span style="font-weight: bold;">${formatCurrency(lineTotal)}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <title>Invoice #${orderNumber} - The Peppers</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          width: 3in;
          max-width: 3in;
          margin: 0 auto;
          padding: 6px 4px 18px 4px;
          background: #ffffff;
          color: #000000;
          font-family: 'Courier New', Courier, 'Lucida Console', monospace;
          font-size: 12px;
          line-height: 1.35;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .bolder { font-weight: 900; }
        
        .divider-dashed {
          border-top: 1px dashed #000;
          margin: 5px 0;
        }
        .divider-solid {
          border-top: 2px solid #000;
          margin: 5px 0;
        }

        .brand-name {
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 1px;
          line-height: 1.1;
          margin-bottom: 2px;
        }
        .tagline {
          font-size: 11px;
          font-style: italic;
          margin-bottom: 2px;
        }
        .store-sub {
          font-size: 10px;
          line-height: 1.3;
        }

        .badge-type {
          display: inline-block;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 2px;
          padding: 2px 8px;
          border: 1.5px solid #000;
          margin: 5px auto;
          text-transform: uppercase;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .items-header {
          display: flex;
          justify-content: space-between;
          font-weight: 900;
          font-size: 11px;
          padding: 4px 0;
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          margin: 5px 0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 3px;
        }

        .grand-total {
          display: flex;
          justify-content: space-between;
          font-size: 16px;
          font-weight: 900;
          padding: 4px 0;
        }

        .barcode {
          font-family: monospace;
          font-size: 18px;
          letter-spacing: 3px;
          font-weight: 900;
          text-align: center;
          margin-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="brand-name">${storeInfo.name}</div>
        <div class="tagline">~ ${storeInfo.tagline} ~</div>
        <div class="store-sub">${storeInfo.category}</div>
        <div class="store-sub">Tel: ${storeInfo.phone}</div>
        <div class="store-sub">${storeInfo.address}</div>
        
        <div class="badge-type">*** ${orderType.toUpperCase()} ***</div>
      </div>

      <div class="divider-dashed"></div>

      <div class="meta-row">
        <span style="font-size: 14px; font-weight: 900;">ORDER #: ${orderNumber}</span>
        <span class="bold">${paymentMethod.toUpperCase()}</span>
      </div>
      <div class="meta-row">
        <span>Date: ${date}</span>
        <span>Time: ${time}</span>
      </div>
      <div class="meta-row">
        <span>Customer: <b>${customer}</b></span>
        <span>Counter: POS-01</span>
      </div>

      <div class="items-header">
        <span>ITEM DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>

      <div>
        ${itemsHtml}
      </div>

      <div class="divider-dashed"></div>

      <div class="summary-row">
        <span>Total Items / Qty:</span>
        <span class="bold">${totalQty}</span>
      </div>
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>${formattedTotal}</span>
      </div>

      <div class="divider-solid"></div>

      <div class="grand-total">
        <span>TOTAL DUE:</span>
        <span>${formattedTotal}</span>
      </div>

      <div class="divider-solid"></div>

      <div class="summary-row">
        <span>Payment Status:</span>
        <span class="bold">PAID (${paymentMethod})</span>
      </div>

      <div class="divider-dashed"></div>

      <div class="barcode">||| | |||| | ||| |||| | ||</div>
      <div class="text-center" style="font-size: 10px; letter-spacing: 2px;">
        *TP-${String(orderNumber).padStart(5, '0')}*
      </div>

      <div class="text-center" style="font-size: 11px; font-weight: bold; margin-top: 8px;">
        Thank You For Dining With Us!
      </div>
      <div class="text-center" style="font-size: 10px; color: #444;">
        Please Visit Us Again Soon
      </div>
      <div class="text-center" style="font-size: 9px; color: #777; margin-top: 5px;">
        NokoPrint • 3-Inch (80mm) Thermal Format
      </div>
    </body>
    </html>
  `;
};

/**
 * Triggers printing optimized for Tablet Browsers & NokoPrint
 */
export const printThermalReceipt = (data) => {
  return new Promise((resolve) => {
    try {
      const htmlContent = generateReceiptHTML(data);
      const isTabletOrMobile = /Android|iPad|iPhone|iPod|Tablet/i.test(navigator.userAgent) || 
                               (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

      // On Tablets: inject into hidden printable DOM container or use window.print()
      // This is the #1 most reliable mechanism for Android Tablet Print Spooler (NokoPrint driver)
      let printContainer = document.getElementById('nokoprint-print-container');
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = 'nokoprint-print-container';
        document.body.appendChild(printContainer);
      }
      
      // Inject raw HTML for print media query
      printContainer.innerHTML = htmlContent;

      if (isTabletOrMobile) {
        // Tablet Android / iOS: Directly trigger browser print dialog
        // NokoPrint is the registered print driver in the tablet system
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

      // Desktop fallback: hidden iframe
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

  // Method 2: Web Share API (native sheet showing NokoPrint on tablet)
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Order #${data.orderNumber} - The Pepper's`,
        text: receiptText
      });
      return true;
    } catch (shareErr) {
      console.log("Share dismissed or failed", shareErr);
    }
  }

  // Method 3: Fallback to printThermalReceipt
  return printThermalReceipt(data);
};
