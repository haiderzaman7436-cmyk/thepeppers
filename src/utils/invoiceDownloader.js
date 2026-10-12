import * as jspdfModule from 'jspdf';
import html2canvasLib from 'html2canvas';
import { formatCurrency } from './thermalPrinter';
import { LOGO_BASE64 } from '../assets/logoBase64';

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

  // Safely extract item array
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
      name: "THE PEPPERS",
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
const createOffscreenInvoiceElement = (htmlContent, width = 302) => {
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
 * Self-contained HTML with full inline styles for the 80mm x 210mm Thermal Receipt
 * Designed with original logo, bold typography, and authentic thermal layout
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
      name: "THE PEPPERS",
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
      <div style="margin-bottom: 6px; font-size: 13px; line-height: 1.3;">
        <div style="font-weight: 900; color: #000000; word-break: break-word;">
          ${idx + 1}. ${item.name}
        </div>
        <div style="display: flex; justify-content: space-between; padding-left: 8px; font-size: 12px; font-weight: 800; color: #000000;">
          <span>${qty} × ${formatCurrency(price)}</span>
          <span style="font-weight: 900;">${formatCurrency(lineTotal)}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="width: 302px; min-height: 794px; padding: 22px 16px 28px 16px; background: #ffffff; color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, monospace; box-sizing: border-box; font-size: 12px; line-height: 1.35; font-weight: 800;">
      <!-- Store Header with Original Logo -->
      <div style="text-align: center; margin-bottom: 8px;">
        <img src="${LOGO_BASE64}" alt="The Peppers" style="width: 60px; height: 60px; object-fit: contain; margin: 0 auto 6px auto; display: block; border-radius: 50%; border: 2px solid #000000;" />
        <div style="font-size: 21px; font-weight: 900; letter-spacing: 0.5px; line-height: 1.1; margin-bottom: 2px; color: #000000;">${storeInfo.name}</div>
        <div style="font-size: 11px; font-style: italic; color: #000000; margin-bottom: 2px; font-weight: 800;">~ ${storeInfo.tagline} ~</div>
        <div style="font-size: 10.5px; color: #000000; font-weight: 800;">${storeInfo.category}</div>
        <div style="font-size: 10.5px; color: #000000; font-weight: 800;">Tel: ${storeInfo.phone}</div>
        <div style="font-size: 10.5px; color: #000000; font-weight: 800;">${storeInfo.address}</div>
        
        <div style="display: inline-block; font-size: 13px; font-weight: 900; letter-spacing: 2px; padding: 3px 12px; border: 2px solid #000000; margin: 8px auto 4px auto; text-transform: uppercase; color: #000000;">
          *** ${orderType.toUpperCase()} ***
        </div>
      </div>

      <div style="border-top: 1.5px dashed #000000; margin: 6px 0;"></div>

      <!-- Order Metadata -->
      <div style="font-size: 12px; margin-bottom: 3px; font-weight: 800; color: #000000;">
        <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 14px; margin-bottom: 3px;">
          <span>ORDER #: ${orderNumber}</span>
          <span>${paymentMethod.toUpperCase()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #000000; font-weight: 800;">
          <span>Date: ${date}</span>
          <span>Time: ${time}</span>
        </div>
        <div style="display: flex; justify-content: space-between; color: #000000; font-weight: 800;">
          <span>Customer: <strong>${customer}</strong></span>
          <span>Counter: POS-01</span>
        </div>
      </div>

      <!-- Items Header -->
      <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 12px; padding: 4px 0; border-top: 1.5px dashed #000000; border-bottom: 1.5px dashed #000000; margin: 6px 0; text-transform: uppercase; color: #000000;">
        <span>ITEM DESCRIPTION</span>
        <span>AMOUNT</span>
      </div>

      <!-- Items List -->
      <div style="margin: 4px 0;">
        ${itemsList}
      </div>

      <div style="border-top: 1.5px dashed #000000; margin: 6px 0;"></div>

      <!-- Totals -->
      <div style="font-size: 12px; margin-bottom: 3px; font-weight: 800; color: #000000;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Total Items / Qty:</span>
          <span style="font-weight: 900;">${totalQty}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>Subtotal:</span>
          <span style="font-weight: 900;">${formattedTotal}</span>
        </div>

        <div style="border-top: 3px double #000000; margin: 6px 0;"></div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 18px; font-weight: 900; padding: 2px 0; color: #000000;">
          <span>TOTAL DUE:</span>
          <span style="font-size: 20px;">${formattedTotal}</span>
        </div>

        <div style="border-top: 3px double #000000; margin: 6px 0;"></div>

        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 800;">
          <span>Payment:</span>
          <span style="font-weight: 900;">PAID (${paymentMethod.toUpperCase()})</span>
        </div>
      </div>

      <div style="border-top: 1.5px dashed #000000; margin: 8px 0 6px 0;"></div>

      <!-- Footer Barcode & Notes -->
      <div style="text-align: center; margin-top: 6px; font-weight: 800; color: #000000;">
        <div style="font-family: monospace; font-size: 18px; letter-spacing: 4px; font-weight: 900; line-height: 1;">
          ||| | |||| | ||| |||| | ||
        </div>
        <div style="font-size: 11px; letter-spacing: 2px; margin: 3px 0 6px 0; font-weight: 900;">
          *TP-${String(orderNumber).padStart(5, '0')}*
        </div>
        <div style="font-weight: 900; font-size: 12px; text-transform: uppercase;">THANK YOU FOR DINING WITH US!</div>
        <div style="font-size: 11px; margin-top: 2px; font-weight: 800;">PLEASE VISIT US AGAIN SOON</div>
        <div style="font-size: 10px; margin-top: 6px; font-weight: 800;">Thermal Slip • 80mm x 210mm</div>
      </div>
    </div>
  `;
};

/**
 * Downloads invoice strictly as an 80mm x 210mm Thermal Slip PDF
 */
export const downloadThermalReceiptPDF = async (data) => {
  const safeData = normalizeInvoiceData(data);
  const htmlContent = generateThermalReceiptSnippetHTML(safeData);
  const container = createOffscreenInvoiceElement(htmlContent, 302);
  const html2canvas = getHtml2Canvas();

  try {
    const canvas = await html2canvas(container, {
      scale: 3, // Ultra-sharp 3x retina scaling for crystal clear text & logo
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Exact 80mm x 210mm Thermal Receipt document size
    const pageWidth = 80;
    const pageHeight = 210;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    const pdf = createPDFInstance({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight]
    });

    // Center or render within the 80x210 page
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
    
    const filename = `ThePeppers-Receipt-80x210-TP${safeData.orderNumber || 'Invoice'}.pdf`;
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error("Error generating 80x210 Thermal Receipt PDF:", err);
    throw err;
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Downloads invoice as a crisp 80mm x 210mm PNG thermal slip image (ready for WhatsApp / Sharing)
 */
export const downloadInvoiceImage = async (data) => {
  const safeData = normalizeInvoiceData(data);
  const htmlContent = generateThermalReceiptSnippetHTML(safeData);
  const container = createOffscreenInvoiceElement(htmlContent, 302);
  const html2canvas = getHtml2Canvas();

  try {
    const canvas = await html2canvas(container, {
      scale: 3, // Ultra-sharp 3x retina resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `ThePeppers-Receipt-80x210-TP${safeData.orderNumber || 'Invoice'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error("Error generating Thermal Receipt Image:", err);
    throw err;
  } finally {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Single-point download handler — exclusively outputs the 80mm x 210mm thermal slip
 */
export const downloadInvoice = async (data, format = 'pdf') => {
  if (format === 'image') {
    return downloadInvoiceImage(data);
  } else {
    return downloadThermalReceiptPDF(data);
  }
};
