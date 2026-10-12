import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, CheckCircle, X, Receipt, Smartphone, Type } from 'lucide-react';
import { 
  printThermalReceipt, 
  openDirectNokoPrint, 
  formatCurrency, 
  generateBarcodeSVG,
  RECEIPT_FONTS,
  RECEIPT_SIZES
} from '../utils/thermalPrinter';
import { LOGO_BASE64 } from '../assets/logoBase64';
import InvoiceDownloadButton from './InvoiceDownloadButton';

const ThermalReceiptModal = ({
  isOpen,
  onClose,
  data,
  onConfirm,
  isProcessing = false,
  showConfirmButton = false,
  confirmButtonText = "Confirm & Print"
}) => {
  const [printSuccess, setPrintSuccess] = useState(false);

  // User-customizable typography preferences (persisted in localStorage)
  const [fontStyle, setFontStyle] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('thepeppers_thermal_font_style') || 'sans';
    }
    return 'sans';
  });

  const [fontSize, setFontSize] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('thepeppers_thermal_font_size') || 'standard';
    }
    return 'standard';
  });

  if (!isOpen || !data) return null;

  const handleFontStyleChange = (style) => {
    setFontStyle(style);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('thepeppers_thermal_font_style', style);
    }
  };

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('thepeppers_thermal_font_size', size);
    }
  };

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
  const activeReceiptFont = RECEIPT_FONTS[fontStyle] || RECEIPT_FONTS.sans;
  const activeSizeConfig = RECEIPT_SIZES[fontSize] || RECEIPT_SIZES.standard;

  const handlePrintOnly = async () => {
    setPrintSuccess(true);
    await printThermalReceipt(data, { fontStyle, fontSize });
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  const handleOpenNokoApp = async () => {
    setPrintSuccess(true);
    await openDirectNokoPrint(data);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  const handleConfirmAndPrint = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      handlePrintOnly();
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)', 
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[480px] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxHeight: '94vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)' 
        }}
      >
        {/* Modal Top Header Bar with Live Typography Controls */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex justify-between items-center gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-red-100 text-[var(--accent-primary)] shrink-0">
                <Receipt size={17} />
              </div>
              <div>
                <div className="font-extrabold text-gray-900 text-sm leading-none">
                  Thermal Slip (80mm Roll)
                </div>
                <div className="text-[10px] text-gray-500 font-semibold mt-0.5">
                  Auto-Height • Crisp Centered Format
                </div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1 rounded-lg transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Typography Customization Toolbar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/70 text-xs">
            {/* Font Style Switcher */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mr-0.5">
                <Type size={12} /> Font:
              </span>
              <button
                type="button"
                onClick={() => handleFontStyleChange('sans')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                  fontStyle === 'sans'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
                title="Clean, modern, ultra-readable receipt font (Inter / Segoe UI)"
              >
                Modern Sans
              </button>
              <button
                type="button"
                onClick={() => handleFontStyleChange('mono')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all font-mono ${
                  fontStyle === 'mono'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                }`}
                title="Classic receipt printer monospace font (Consolas / JetBrains Mono)"
              >
                Classic Mono
              </button>
            </div>

            {/* Font Size Switcher */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-gray-500 mr-0.5">Size:</span>
              {(['compact', 'standard', 'large']).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleFontSizeChange(sz)}
                  className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-bold capitalize transition-all ${
                    fontSize === sz
                      ? 'bg-[var(--accent-primary)] text-white shadow-xs'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                  title={`${sz.charAt(0).toUpperCase() + sz.slice(1)} size for 80mm thermal paper`}
                >
                  {sz === 'standard' ? 'Std' : sz.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Paper Slip Preview Container */}
        <div className="p-3 sm:p-4 overflow-y-auto bg-gray-200/90 flex justify-center items-start flex-1 min-h-0">
          
          {/* THE 80mm x 210mm THERMAL PAPER SLIP */}
          <div 
            className="bg-white text-black shadow-2xl relative select-text my-1 mx-auto"
            style={{ 
              width: '276px', 
              minWidth: '276px',
              maxWidth: '276px',
              boxSizing: 'border-box',
              padding: '14px 10px 18px 10px',
              fontFamily: activeReceiptFont,
              fontSize: activeSizeConfig.base,
              lineHeight: 1.35,
              color: '#000000',
              border: '1.5px solid #000000',
              borderRadius: '2px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.22)'
            }}
          >
            {/* Top serrated tear paper edge decoration */}
            <div 
              style={{
                position: 'absolute',
                top: '-7px',
                left: 0,
                right: 0,
                height: '7px',
                background: 'radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%)',
                backgroundSize: '14px 14px',
              }}
            />

            {/* Restaurant Brand Header with Original Logo */}
            <div className="text-center mb-2">
              <img 
                src={LOGO_BASE64} 
                alt="The Peppers Logo" 
                className="w-13 h-13 object-contain mx-auto mb-1.5 rounded-full border-[1.5px] border-black shadow-xs"
              />
              <h1 
                className="font-extrabold tracking-wide m-0 text-black uppercase"
                style={{ fontSize: activeSizeConfig.brand, lineHeight: 1.15 }}
              >
                {storeInfo.name}
              </h1>
              <p className="italic text-gray-900 font-medium m-0 mt-0.5" style={{ fontSize: activeSizeConfig.sub }}>
                ~ {storeInfo.tagline} ~
              </p>
              <p className="text-gray-900 font-medium m-0 mt-0.5" style={{ fontSize: activeSizeConfig.sub }}>
                {storeInfo.category}
              </p>
              <p className="text-black font-bold m-0" style={{ fontSize: `calc(${activeSizeConfig.sub} + 1px)` }}>
                Tel: {storeInfo.phone}
              </p>
              <p className="text-gray-900 font-medium m-0" style={{ fontSize: activeSizeConfig.sub }}>
                {storeInfo.address}
              </p>
            </div>

            {/* Order Type Badge */}
            <div className="text-center my-1.5">
              <span 
                className="inline-block border-[1.5px] border-black px-3 py-0.5 font-bold tracking-widest uppercase text-black rounded-xs"
                style={{ fontSize: `calc(${activeSizeConfig.base} - 0.5px)` }}
              >
                *** {orderType.toUpperCase()} ***
              </span>
            </div>

            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

            {/* Order Metadata */}
            <div className="mb-1 text-black">
              <div 
                className="flex justify-between font-bold pb-1 mb-1 border-b border-dashed border-black"
                style={{ fontSize: activeSizeConfig.heading }}
              >
                <span>ORDER #: {orderNumber}</span>
                <span className="tabular-nums">{paymentMethod.toUpperCase()}</span>
              </div>
              <div 
                className="flex justify-between text-gray-900 font-medium mb-0.5"
                style={{ fontSize: `calc(${activeSizeConfig.base} - 0.5px)` }}
              >
                <span>Date: {date}</span>
                <span>Time: {time}</span>
              </div>
              <div 
                className="flex justify-between text-gray-900 font-medium"
                style={{ fontSize: `calc(${activeSizeConfig.base} - 0.5px)` }}
              >
                <span>Customer: <strong className="font-semibold text-black">{customer}</strong></span>
                <span>Counter: POS-01</span>
              </div>
            </div>

            {/* Items Header */}
            <div 
              className="flex justify-between font-bold py-1 my-1.5 uppercase text-black tracking-wide"
              style={{ 
                fontSize: `calc(${activeSizeConfig.base} - 1px)`,
                borderTop: '1px dashed #000000',
                borderBottom: '1px dashed #000000'
              }}
            >
              <span>ITEM DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>

            {/* Items List */}
            <div className="flex flex-col gap-1.5 my-1.5 text-black">
              {items.map((item, idx) => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price || item.parsedPrice) || 0;
                const lineTotal = price * qty;
                return (
                  <div key={idx} className="flex flex-col">
                    <div 
                      className="font-semibold break-words text-black leading-snug"
                      style={{ fontSize: activeSizeConfig.base }}
                    >
                      ${idx + 1}. {item.name}
                    </div>
                    <div 
                      className="flex justify-between pl-2 font-medium text-gray-800 tabular-nums mt-0.5"
                      style={{ fontSize: `calc(${activeSizeConfig.base} - 0.5px)` }}
                    >
                      <span className="font-normal">{qty} × {formatCurrency(price)}</span>
                      <span className="font-bold text-black">{formatCurrency(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

            {/* Total Summary */}
            <div className="text-black mb-1">
              <div 
                className="flex justify-between font-medium text-gray-800 mb-0.5"
                style={{ fontSize: `calc(${activeSizeConfig.base} - 0.5px)` }}
              >
                <span>Total Items / Qty:</span>
                <span className="font-semibold text-black tabular-nums">{totalQty}</span>
              </div>
              <div 
                className="flex justify-between font-medium text-gray-800 mb-0.5"
                style={{ fontSize: `calc(${activeSizeConfig.base} - 0.5px)` }}
              >
                <span>Subtotal:</span>
                <span className="font-semibold text-black tabular-nums">{formattedTotal}</span>
              </div>

              {/* Clean Double Border Divider */}
              <div style={{ borderTop: '1.5px solid #000000', borderBottom: '1.5px solid #000000', height: '3px', margin: '5px 0' }} />

              <div 
                className="flex justify-between font-extrabold py-0.5 text-black items-baseline tabular-nums tracking-wide"
                style={{ fontSize: activeSizeConfig.total }}
              >
                <span>TOTAL DUE:</span>
                <span>{formattedTotal}</span>
              </div>

              <div style={{ borderTop: '1.5px solid #000000', borderBottom: '1.5px solid #000000', height: '3px', margin: '5px 0' }} />

              <div 
                className="flex justify-between font-medium text-gray-800"
                style={{ fontSize: `calc(${activeSizeConfig.base} - 0.5px)` }}
              >
                <span>Payment Status:</span>
                <span className="font-semibold text-black">PAID ({paymentMethod.toUpperCase()})</span>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #000000', margin: '7px 0 5px 0' }} />

            {/* Barcode & Footer Greeting */}
            <div className="text-center text-black">
              <div 
                className="my-1 flex justify-center"
                dangerouslySetInnerHTML={{ __html: generateBarcodeSVG(orderNumber) }}
              />
              <div 
                className="font-mono tracking-widest text-black font-semibold mb-2"
                style={{ fontSize: '11px' }}
              >
                *TP-${String(orderNumber).padStart(5, '0')}*
              </div>

              <p 
                className="font-bold uppercase m-0 tracking-wide text-black"
                style={{ fontSize: `calc(${activeSizeConfig.base} - 1px)` }}
              >
                Thank You For Dining With Us!
              </p>
              <p className="font-medium text-gray-800 m-0 mt-0.5" style={{ fontSize: activeSizeConfig.sub }}>
                Please Visit Us Again Soon
              </p>
              <p className="font-normal text-gray-600 mt-2 m-0 tracking-wide" style={{ fontSize: `calc(${activeSizeConfig.sub} - 1.5px)` }}>
                Thermal Slip • 80mm Thermal Roll
              </p>
            </div>

            {/* Bottom serrated tear paper edge decoration */}
            <div 
              style={{
                position: 'absolute',
                bottom: '-7px',
                left: 0,
                right: 0,
                height: '7px',
                background: 'radial-gradient(circle, transparent, transparent 50%, #ffffff 50%, #ffffff 100%)',
                backgroundSize: '14px 14px',
              }}
            />
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="bg-gray-50 px-3 sm:px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0">
          <button 
            onClick={onClose}
            className="px-3 py-2 rounded-xl font-bold text-xs sm:text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={handleOpenNokoApp}
              className="px-2.5 sm:px-3 py-2 rounded-xl font-bold text-xs text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 active:scale-95 shadow-xs"
              title="Open directly in NokoPrint on Tablet"
            >
              <Smartphone size={14} /> <span className="hidden sm:inline">NokoPrint</span>
            </button>

            <InvoiceDownloadButton 
              invoice={data} 
              variant="compact" 
              label="Download" 
              options={{ fontStyle, fontSize }}
            />

            <button 
              onClick={handlePrintOnly}
              className="px-3 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-gray-900 hover:bg-black transition-colors flex items-center gap-1.5 active:scale-95 shadow-xs"
              title="Print directly to thermal printer"
            >
              <Printer size={15} /> {printSuccess ? 'Printing...' : 'Print (80mm)'}
            </button>

            {showConfirmButton && (
              <button 
                onClick={handleConfirmAndPrint}
                disabled={isProcessing}
                className="px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    <CheckCircle size={15} /> {confirmButtonText}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default ThermalReceiptModal;
