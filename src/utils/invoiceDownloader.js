import * as jspdfModule from 'jspdf';
import html2canvasLib from 'html2canvas';
import { formatCurrency, RECEIPT_FONTS, RECEIPT_SIZES, generateBarcodeSVG } from './thermalPrinter';
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
 * Designed with original logo, calibrated typography, and crisp SVG barcode
 */
export const generateThermalReceiptSnippetHTML = (data, options = {}) => {
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

  const itemsList = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price || item.parsedPrice) || 0;
    const lineTotal = price * qty;
    return `
      <div style="display: flex; align-items: flex-start; padding: 3.5px 0; border-bottom: 0.5px dashed #cccccc;">
        <div style="width: 32px; min-width: 32px; font-weight: 700; font-size: ${sizeConfig.base}; color: #000000; text-align: left; padding-top: 0.5px;">
          ${qty}x
        </div>
        <div style="flex: 1; padding: 0 4px; text-align: left;">
          <div style="font-weight: 600; font-size: ${sizeConfig.base}; color: #000000; word-break: break-word; line-height: 1.3;">
            ${item.name}
          </div>
          ${qty > 1 ? `<div style="font-size: calc(${sizeConfig.base} - 1.5px); font-weight: 500; color: #333333; margin-top: 1px;">@ ${formatCurrency(price)} each</div>` : ''}
        </div>
        <div style="width: 78px; min-width: 78px; text-align: right; font-weight: 700; font-size: ${sizeConfig.base}; color: #000000; font-variant-numeric: tabular-nums; padding-top: 0.5px;">
          ${formatCurrency(lineTotal)}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="width: 272px; min-height: ${isFixedLength ? '700px' : 'auto'}; height: auto; margin: 0 auto; padding: 12px 10px 16px 10px; background: #ffffff; color: #000000; font-family: ${fontFamily}; box-sizing: border-box; font-size: ${sizeConfig.base}; line-height: 1.35; -webkit-font-smoothing: antialiased;">
      <!-- Store Header with Original Logo -->
      <div style="text-align: center; margin-bottom: 6px;">
        ${showLogo ? `<img src="${LOGO_BASE64}" alt="The Peppers" style="width: 52px; height: 52px; object-fit: contain; margin: 0 auto 5px auto; display: block; border-radius: 50%; border: 1.5px solid #000000;" />` : ''}
        <div style="font-size: ${sizeConfig.brand}; font-weight: 800; letter-spacing: 0.8px; line-height: 1.15; margin-bottom: 2px; text-transform: uppercase; color: #000000;">${storeInfo.name}</div>
        ${showStoreInfo ? `
          <div style="font-size: ${sizeConfig.sub}; font-style: italic; color: #111111; margin-bottom: 2px; font-weight: 500;">~ ${storeInfo.tagline} ~</div>
          <div style="font-size: ${sizeConfig.sub}; color: #222222; font-weight: 500; line-height: 1.3;">${storeInfo.category}</div>
          <div style="font-size: calc(${sizeConfig.sub} + 1px); color: #000000; font-weight: 700;">Tel: ${storeInfo.phone}</div>
          <div style="font-size: ${sizeConfig.sub}; color: #222222; font-weight: 500;">${storeInfo.address}</div>
        ` : ''}
        
        <div style="display: inline-block; font-size: calc(${sizeConfig.base} - 0.5px); font-weight: 700; letter-spacing: 1.5px; padding: 2.5px 12px; border: 1.5px solid #000000; border-radius: 2px; margin: 6px auto 3px auto; text-transform: uppercase; color: #000000;">
          *** ${orderType.toUpperCase()} ***
        </div>
      </div>

      <div style="border-top: 1px dashed #000000; margin: 6px 0;"></div>

      <!-- Order Metadata -->
      <div style="margin-bottom: 3px; color: #000000;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: ${sizeConfig.heading}; margin-bottom: 3px; padding-bottom: 3px; border-bottom: 1px dashed #000000;">
          <span>ORDER #: ${orderNumber}</span>
          <span>${paymentMethod.toUpperCase()}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: calc(${sizeConfig.base} - 0.5px); font-weight: 500; color: #111111; margin-bottom: 2px;">
          <span>Date: ${date}</span>
          <span>Time: ${time}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: calc(${sizeConfig.base} - 0.5px); font-weight: 500; color: #111111;">
          <span>Customer: <strong style="font-weight: 600; color: #000000;">${customer}</strong></span>
          <span>Counter: POS-01</span>
        </div>
      </div>

      <!-- Items Header -->
      <div style="display: flex; align-items: center; font-weight: 700; font-size: calc(${sizeConfig.base} - 1px); padding: 3.5px 0; border-top: 1px dashed #000000; border-bottom: 1px dashed #000000; margin: 6px 0 3px 0; text-transform: uppercase; color: #000000; letter-spacing: 0.5px;">
        <span style="width: 32px; text-align: left;">QTY</span>
        <span style="flex: 1; padding: 0 4px; text-align: left;">ITEM DESCRIPTION</span>
        <span style="width: 78px; text-align: right;">AMOUNT</span>
      </div>

      <!-- Items List -->
      <div style="margin: 2px 0 4px 0;">
        ${itemsList}
      </div>

      <div style="border-top: 1px dashed #000000; margin: 6px 0;"></div>

      <!-- Totals -->
      <div style="margin-bottom: 3px; color: #000000;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: calc(${sizeConfig.base} - 0.5px); font-weight: 500; color: #111111;">
          <span>Total Items / Qty:</span>
          <span style="font-weight: 600; color: #000000;">${totalQty}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: calc(${sizeConfig.base} - 0.5px); font-weight: 500; color: #111111;">
          <span>Subtotal:</span>
          <span style="font-weight: 600; color: #000000;">${formattedTotal}</span>
        </div>

        <div style="border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000; height: 3px; margin: 6px 0;"></div>

        <div style="display: flex; justify-content: space-between; align-items: baseline; font-size: ${sizeConfig.total}; font-weight: 800; letter-spacing: 0.5px; padding: 2px 0; color: #000000;">
          <span>TOTAL DUE:</span>
          <span>${formattedTotal}</span>
        </div>

        <div style="border-top: 1.5px solid #000000; border-bottom: 1.5px solid #000000; height: 3px; margin: 6px 0;"></div>

        <div style="display: flex; justify-content: space-between; font-size: calc(${sizeConfig.base} - 0.5px); font-weight: 500; color: #111111;">
          <span>Payment Status:</span>
          <span style="font-weight: 600; color: #000000;">PAID (${paymentMethod.toUpperCase()})</span>
        </div>
      </div>

      <div style="border-top: 1px dashed #000000; margin: 6px 0;"></div>

      <!-- Footer Barcode & Notes -->
      <div style="text-align: center; margin-top: 6px; color: #000000;">
        ${showBarcode ? `
          <div style="margin: 4px 0 2px 0;">
            ${barcodeSvg}
          </div>
          <div style="font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace; font-size: 11px; letter-spacing: 2px; margin: 3px 0 6px 0; font-weight: 600; color: #000000;">
            *TP-${String(orderNumber).padStart(5, '0')}*
          </div>
        ` : ''}
        <div style="font-weight: 700; font-size: calc(${sizeConfig.base} - 1px); text-transform: uppercase; letter-spacing: 0.5px; color: #000000;">THANK YOU FOR DINING WITH US!</div>
        <div style="font-size: ${sizeConfig.sub}; margin-top: 2px; font-weight: 500; color: #222222;">PLEASE VISIT US AGAIN SOON</div>
      </div>
    </div>
  `;
};

/**
 * Downloads invoice strictly as an 80mm x 210mm Thermal Slip PDF
 */
export const downloadThermalReceiptPDF = async (data, options = {}) => {
  const safeData = normalizeInvoiceData(data);
  const htmlContent = generateThermalReceiptSnippetHTML(safeData, options);
  const container = createOffscreenInvoiceElement(htmlContent, 272);
  const html2canvas = getHtml2Canvas();

  try {
    const canvas = await html2canvas(container, {
      scale: 3, // Ultra-sharp 3x retina scaling for crystal clear text & logo
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Dynamic height matching content length perfectly
    const pageWidth = 80;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;
    const pageHeight = isFixedLength ? 210 : Math.max(Math.ceil(imgHeight), 50);

    const pdf = createPDFInstance({
      orientation: 'portrait',
      unit: 'mm',
      format: [pageWidth, pageHeight]
    });

    // Render within dynamic page bounds
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    
    const filename = `ThePeppers-Receipt-80mm-TP${safeData.orderNumber || 'Invoice'}.pdf`;
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
export const downloadInvoiceImage = async (data, options = {}) => {
  const safeData = normalizeInvoiceData(data);
  const htmlContent = generateThermalReceiptSnippetHTML(safeData, options);
  const container = createOffscreenInvoiceElement(htmlContent, 272);
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
export const downloadInvoice = async (data, format = 'pdf', options = {}) => {
  if (format === 'image') {
    return downloadInvoiceImage(data, options);
  } else {
    return downloadThermalReceiptPDF(data, options);
  }
};

