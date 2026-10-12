import * as jspdfModule from 'jspdf';
import html2canvasLib from 'html2canvas';
import { formatCurrency } from './thermalPrinter';

// Robust cross-bundler resolver for jsPDF constructor
const createPDFInstance = (options) => {
  const Constructor = jspdfModule.jsPDF || jspdfModule.default?.jsPDF || jspdfModule.default;
  if (typeof Constructor !== 'function') {
    throw new Error('PDF generator library could not be initialized.');
  }
  return new Constructor(options);
};

// Robust cross-bundler resolver for html2canvas
const getHtml2Canvas = () => {
  const fn = html2canvasLib.default || html2canvasLib;
  if (typeof fn !== 'function') {
    throw new Error('Canvas renderer library could not be initialized.');
  }
  return fn;
};

/**
 * Normalizes any invoice data structure (Firestore invoice, POS cart, receipt modal)
 */
export const normalizeInvoiceData = (raw) => {
  if (!raw) return null;
  const orderNumber = raw.orderNumber || raw.invoiceNumber || 'N/A';
  
  // Format date & time
  let date = raw.date || new Date().toLocaleDateString();
  let time = raw.time || '';
  if (!time && raw.createdAt) {
    if (typeof raw.createdAt.toDate === 'function') {
      time = raw.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (raw.createdAt instanceof Date) {
      time = raw.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  if (!time) {
    time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Safely extract item array:
  // In Firestore invoices, raw.cartDetails is the item array, while raw.items is often a numeric item count.
  let rawList = [];
  if (Array.isArray(raw.cartDetails)) {
    rawList = raw.cartDetails;
  } else if (Array.isArray(raw.items)) {
    rawList = raw.items;
  } else if (Array.isArray(raw.products)) {
    rawList = raw.products;
  } else if (raw.cartDetails && typeof raw.cartDetails === 'object') {
    rawList = Object.values(raw.cartDetails);
  } else if (raw.items && typeof raw.items === 'object') {
    rawList = Object.values(raw.items);
  }

  let items = rawList.map(item => ({
    name: item.name || item.title || 'Item',
    quantity: Number(item.quantity || item.qty) || 1,
    price: Number(item.price || item.parsedPrice) || 0
  }));

  // Fallback if no item array was stored (e.g. legacy invoice with only total & count)
  if (items.length === 0) {
    const rawTotalNum = typeof raw.total === 'string' 
      ? parseInt(raw.total.replace(/\D/g, ''), 10) || 0 
      : Number(raw.total) || 0;
    const count = typeof raw.items === 'number' ? raw.items : 1;
    items = [{
      name: `Order Items (${count})`,
      quantity: count,
      price: count > 0 ? Math.round(rawTotalNum / count) : rawTotalNum
    }];
  }

  const customer = raw.customer || 'Walk-in Customer';
  const orderType = raw.orderType || 'Dine In';
  const paymentMethod = raw.paymentMethod || 'Cash';
  const total = raw.total || 0;

  return {
    orderNumber,
    date,
    time,
    customer,
    orderType,
    paymentMethod,
    items,
    total,
    storeInfo: raw.storeInfo || {
      name: "THE PEPPER'S",
      tagline: "Flavor & Spice",
      category: "Fast Food • Pizza • Burgers • Platters",
      phone: "0300-1234567",
      address: "Main Branch, Food Street"
    }
  };
};

/**
 * Creates an off-screen DOM element positioned within layout coordinates for reliable canvas rasterization
 */
const createOffscreenInvoiceElement = (htmlContent, width = 300) => {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = `${width}px`;
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-99999';
  container.style.pointerEvents = 'none';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);
  return container;
};

/**
 * Self-contained HTML with full inline styles for the 3-Inch (80mm) Thermal Receipt
 */
export const generateThermalReceiptSnippetHTML = (data) => {
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

  const itemsList = items.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price || item.parsedPrice) || 0;
    const lineTotal = price * qty;
    return `
      <div style="margin-bottom: 6px; font-size: 12px; line-height: 1.35;">
        <div style="font-weight: 900; color: #000; word-break: break-word;">${idx + 1}. ${item.name}</div>
        <div style="display: flex; justify-content: space-between; padding-left: 10px; font-size: 11px; color: #333;">
          <span>${qty} x ${formatCurrency(price)}</span>
          <span style="font-weight: 800; color: #000;">${formatCurrency(lineTotal)}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="width: 290px; padding: 18px 14px 24px 14px; background: #ffffff; color: #000000; font-family: 'Courier New', Courier, monospace; box-sizing: border-box; font-size: 12px; line-height: 1.35;">
      <!-- Store Header -->
      <div style="text-align: center; margin-bottom: 8px;">
        <div style="font-size: 22px; font-weight: 900; letter-spacing: 1px; line-height: 1.1; margin-bottom: 2px;">${storeInfo.name}</div>
        <div style="font-size: 11px; font-style: italic; color: #444; margin-bottom: 2px;">~ ${storeInfo.tagline} ~</div>
        <div style="font-size: 10px; color: #555;">${storeInfo.category}</div>
        <div style="font-size: 10px; color: #555;">Tel: ${storeInfo.phone}</div>
        <div style="font-size: 10px; color: #555;">${storeInfo.address}</div>
        
        <div style="display: inline-block; font-size: 12px; font-weight: 900; letter-spacing: 2px; padding: 2px 10px; border: 1.5px solid #000; margin: 8px auto 4px auto; text-transform: uppercase;">
          *** ${orderType.toUpperCase()} ***
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

      <!-- Order Metadata -->
      <div style="font-size: 11px; margin-bottom: 3px;">
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px; margin-bottom: 3px;">
          <span>ORDER #: ${orderNumber}</span>
          <span>${paymentMethod.toUpperCase()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #333;">
          <span>Date: ${date}</span>
          <span>Time: ${time}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #333;">
          <span>Customer: <strong style="color: #000;">${customer}</strong></span>
          <span>POS-01</span>
        </div>
      </div>

      <!-- Items Header -->
      <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 11px; padding: 4px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; margin: 6px 0;">
        <span>ITEM DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>

      <!-- Items List -->
      <div style="margin: 6px 0;">
        ${itemsList}
      </div>

      <div style="border-top: 1px dashed #000; margin: 6px 0;"></div>

      <!-- Totals -->
      <div style="font-size: 11px; margin-bottom: 3px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Total Items / Qty:</span>
          <span style="font-weight: 800;">${totalQty}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Subtotal:</span>
          <span>${formattedTotal}</span>
        </div>

        <div style="border-top: 2px solid #000; margin: 5px 0;"></div>

        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; padding: 2px 0;">
          <span>TOTAL DUE:</span>
          <span>${formattedTotal}</span>
        </div>

        <div style="border-top: 2px solid #000; margin: 5px 0;"></div>

        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Payment:</span>
          <span style="font-weight: 800;">PAID (${paymentMethod.toUpperCase()})</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000; margin: 8px 0 6px 0;"></div>

      <!-- Footer Barcode -->
      <div style="text-align: center; margin-top: 6px;">
        <div style="font-family: monospace; font-size: 18px; letter-spacing: 3px; font-weight: 900; line-height: 1;">
          ||| | |||| | ||| |||| | ||
        </div>
        <div style="font-size: 10px; letter-spacing: 2px; color: #444; margin: 3px 0 6px 0;">
          *TP-${String(orderNumber).padStart(5, '0')}*
        </div>
        <div style="font-weight: 800; font-size: 11px;">Thank You For Dining With Us!</div>
        <div style="font-size: 10px; color: #555; margin-top: 1px;">Please Visit Us Again Soon</div>
        <div style="font-size: 9px; color: #777; margin-top: 4px;">The Pepper's POS • 3-Inch (80mm) Thermal</div>
      </div>
    </div>
  `;
};

/**
 * Generates executive A4 format HTML for full-page invoices
 */
export const generateA4InvoiceHTML = (data) => {
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

  const tableRows = items.map((item, idx) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price || item.parsedPrice) || 0;
    const lineTotal = price * qty;
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 16px; font-weight: 600; color: #1e293b;">${idx + 1}. ${item.name}</td>
        <td style="padding: 12px 16px; text-align: center; color: #475569; font-weight: 600;">${qty}</td>
        <td style="padding: 12px 16px; text-align: right; color: #475569;">${formatCurrency(price)}</td>
        <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #0f172a;">${formatCurrency(lineTotal)}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="width: 794px; min-height: 1050px; padding: 48px; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-sizing: border-box;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 28px; border-bottom: 2px solid #e2e8f0;">
        <div>
          <h1 style="font-size: 32px; font-weight: 900; color: #dc2626; margin: 0 0 4px 0; letter-spacing: -0.5px;">${storeInfo.name}</h1>
          <p style="font-size: 14px; color: #64748b; margin: 0 0 6px 0; font-style: italic;">${storeInfo.tagline}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">${storeInfo.category}</p>
          <p style="font-size: 12px; color: #64748b; margin: 2px 0 0 0;">${storeInfo.address} • Tel: ${storeInfo.phone}</p>
        </div>
        <div style="text-align: right;">
          <div style="display: inline-block; background: #fee2e2; color: #b91c1c; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px;">
            TAX INVOICE
          </div>
          <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0;">INV #${orderNumber}</h2>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Date: ${date} ${time}</p>
        </div>
      </div>

      <!-- Bill Info Section -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 28px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div>
          <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin: 0 0 6px 0;">Billed To / Customer</p>
          <p style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">${customer}</p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Order Type: <strong style="color: #334155;">${orderType}</strong></p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin: 0 0 6px 0;">Payment Details</p>
          <p style="font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 4px 0;">Status: <span style="color: #16a34a;">PAID</span></p>
          <p style="font-size: 12px; color: #64748b; margin: 0;">Payment Mode: <strong style="color: #334155;">${paymentMethod.toUpperCase()}</strong></p>
        </div>
      </div>

      <!-- Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
        <thead>
          <tr style="background: #f1f5f9; border-top: 1px solid #e2e8f0; border-bottom: 2px solid #cbd5e1;">
            <th style="padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Item Description</th>
            <th style="padding: 12px 16px; text-align: center; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Qty</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Unit Price</th>
            <th style="padding: 12px 16px; text-align: right; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>

      <!-- Summary -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 36px;">
        <div style="width: 320px; background: #f8fafc; padding: 18px 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 8px;">
            <span>Total Items:</span>
            <span style="font-weight: 700; color: #0f172a;">${totalQty}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 12px;">
            <span>Subtotal:</span>
            <span style="font-weight: 700; color: #0f172a;">${formattedTotal}</span>
          </div>
          <div style="border-top: 2px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 18px; font-weight: 900; color: #dc2626;">
            <span>Grand Total:</span>
            <span>${formattedTotal}</span>
          </div>
        </div>
      </div>

      <!-- Footer Note -->
      <div style="margin-top: 48px; padding-top: 24px; border-top: 1px dashed #cbd5e1; text-align: center; color: #64748b; font-size: 12px;">
        <p style="margin: 0 0 4px 0; font-weight: 700; color: #334155;">Thank you for your business!</p>
        <p style="margin: 0;">For inquiries or bulk catering orders, contact us at ${storeInfo.phone}.</p>
        <div style="margin-top: 16px; font-family: monospace; font-size: 14px; letter-spacing: 2px; color: #94a3b8;">
          *TP-${String(orderNumber).padStart(5, '0')}*
        </div>
      </div>
    </div>
  `;
};

/**
 * Downloads invoice as a 3-Inch (80mm) Thermal Receipt PDF
 */
export const downloadThermalReceiptPDF = async (data) => {
  const safeData = normalizeInvoiceData(data);
  const htmlContent = generateThermalReceiptSnippetHTML(safeData);
  const container = createOffscreenInvoiceElement(htmlContent, 290);
  const html2canvas = getHtml2Canvas();

  try {
    const canvas = await html2canvas(container, {
      scale: 2.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 80; // 80mm standard thermal roll width
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = createPDFInstance({
      orientation: 'portrait',
      unit: 'mm',
      format: [imgWidth, imgHeight + 4]
    });

    pdf.addImage(imgData, 'PNG', 0, 2, imgWidth, imgHeight);
    const filename = `Invoice-TP-${safeData.orderNumber || 'Receipt'}.pdf`;
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error("Error generating Thermal Receipt PDF:", err);
    throw err;
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Downloads invoice as full A4 Standard Invoice PDF
 */
export const downloadA4InvoicePDF = async (data) => {
  const safeData = normalizeInvoiceData(data);
  const htmlContent = generateA4InvoiceHTML(safeData);
  const container = createOffscreenInvoiceElement(htmlContent, 794);
  const html2canvas = getHtml2Canvas();

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = createPDFInstance({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
    const filename = `Invoice-TP-${safeData.orderNumber || 'Bill'}-A4.pdf`;
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error("Error generating A4 Invoice PDF:", err);
    throw err;
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Downloads invoice as a crisp PNG image (ready for WhatsApp / photo viewer)
 */
export const downloadInvoiceImage = async (data) => {
  const safeData = normalizeInvoiceData(data);
  const htmlContent = generateThermalReceiptSnippetHTML(safeData);
  const container = createOffscreenInvoiceElement(htmlContent, 290);
  const html2canvas = getHtml2Canvas();

  try {
    const canvas = await html2canvas(container, {
      scale: 3, // Ultra-sharp 3x retina resolution for mobile screens
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Invoice-TP-${safeData.orderNumber || 'Receipt'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error("Error generating Invoice Image:", err);
    throw err;
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Default convenient single-click download (downloads thermal receipt PDF)
 */
export const downloadInvoice = async (data, format = 'receipt-pdf') => {
  if (format === 'a4-pdf') {
    return downloadA4InvoicePDF(data);
  } else if (format === 'image') {
    return downloadInvoiceImage(data);
  } else {
    return downloadThermalReceiptPDF(data);
  }
};
