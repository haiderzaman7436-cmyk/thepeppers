import React, { useState } from 'react';
import { Printer, CheckCircle, X, Receipt, Smartphone } from 'lucide-react';
import { printThermalReceipt, openDirectNokoPrint, formatCurrency } from '../utils/thermalPrinter';
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

  if (!isOpen || !data) return null;

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

  const handlePrintOnly = async () => {
    setPrintSuccess(true);
    await printThermalReceipt(data);
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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[94vh]"
        style={{ width: 'auto', maxWidth: '96vw' }}
      >
        {/* Modal Top Header Bar */}
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Receipt size={20} className="text-[var(--accent-primary)]" />
            <span className="font-bold text-gray-900 text-base">3-Inch Invoice Preview</span>
            <span className="bg-red-50 text-[var(--accent-primary)] text-xs font-bold px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
              <Smartphone size={12} /> NokoPrint & 80mm
            </span>
          </div>
          <div className="flex items-center gap-2">
            <InvoiceDownloadButton 
              invoice={data} 
              variant="compact" 
              label="Download" 
            />
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Paper Slip Preview Container */}
        <div className="p-4 md:p-6 overflow-y-auto bg-gray-100 flex justify-center items-start">
          
          {/* THE 3-INCH (80mm) THERMAL PAPER SLIP */}
          <div 
            className="bg-white text-black shadow-xl relative select-text"
            style={{ 
              width: '3in', 
              minWidth: '3in',
              maxWidth: '3in',
              boxSizing: 'border-box',
              padding: '16px 14px 22px 14px',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '12px',
              lineHeight: 1.35,
              border: '1px solid #cbd5e1',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
            }}
          >
            {/* Top serrated tear paper edge decoration */}
            <div 
              style={{
                position: 'absolute',
                top: '-6px',
                left: 0,
                right: 0,
                height: '6px',
                background: 'radial-gradient(circle, transparent, transparent 50%, #e2e8f0 50%, #e2e8f0 100%)',
                backgroundSize: '12px 12px',
              }}
            />

            {/* Restaurant Brand Header */}
            <div className="text-center mb-2">
              <h1 className="font-black text-2xl tracking-wider m-0 leading-tight">
                {storeInfo.name}
              </h1>
              <p className="text-xs italic text-gray-700 m-0">~ {storeInfo.tagline} ~</p>
              <p className="text-[10px] text-gray-600 m-0 mt-1 leading-snug">{storeInfo.category}</p>
              <p className="text-[10px] text-gray-600 m-0">Tel: {storeInfo.phone}</p>
              <p className="text-[10px] text-gray-600 m-0">{storeInfo.address}</p>
            </div>

            {/* Order Type Badge */}
            <div className="text-center my-2">
              <span className="inline-block border-2 border-black px-3 py-0.5 font-black text-xs tracking-widest uppercase">
                *** {orderType.toUpperCase()} ***
              </span>
            </div>

            {/* Order Metadata */}
            <div className="text-[11px] mb-2 leading-tight">
              <div className="flex justify-between font-black text-sm mb-1 pb-1 border-b border-dashed border-black">
                <span>ORDER #: {orderNumber}</span>
                <span>{paymentMethod.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Date: {date}</span>
                <span>{time}</span>
              </div>
              <div className="flex justify-between text-gray-800">
                <span>Customer: <strong className="text-black">{customer}</strong></span>
                <span>POS-01</span>
              </div>
            </div>

            {/* Items Header */}
            <div className="flex justify-between font-black text-[11px] py-1 border-t border-b border-dashed border-black my-2">
              <span>ITEM DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>

            {/* Items List */}
            <div className="flex flex-col gap-2 my-2">
              {items.map((item, idx) => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price || item.parsedPrice) || 0;
                const lineTotal = price * qty;
                return (
                  <div key={idx} className="flex flex-col">
                    <div className="font-black text-xs break-words">
                      {idx + 1}. {item.name}
                    </div>
                    <div className="flex justify-between pl-3 text-[11px] text-gray-800">
                      <span>{qty} x {formatCurrency(price)}</span>
                      <span className="font-black text-black">{formatCurrency(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Summary */}
            <div className="border-t border-dashed border-black pt-2 mt-2 text-[11px]">
              <div className="flex justify-between mb-1">
                <span>Total Items / Qty:</span>
                <span className="font-bold">{totalQty}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Subtotal:</span>
                <span>{formattedTotal}</span>
              </div>

              <div className="border-t-2 border-black my-1.5" />

              <div className="flex justify-between text-base font-black py-0.5">
                <span>TOTAL DUE:</span>
                <span>{formattedTotal}</span>
              </div>

              <div className="border-t-2 border-black my-1.5" />

              <div className="flex justify-between text-[11px]">
                <span>Payment:</span>
                <span className="font-black">PAID ({paymentMethod.toUpperCase()})</span>
              </div>
            </div>

            {/* Barcode & Footer */}
            <div className="border-t border-dashed border-black mt-3 pt-2 text-center">
              <div className="text-lg font-mono tracking-widest font-black leading-none my-1 select-none">
                ||| | |||| | ||| |||| | ||
              </div>
              <div className="text-[10px] tracking-wider text-gray-600 mb-2">
                *TP-{String(orderNumber).padStart(5, '0')}*
              </div>

              <p className="font-bold text-[11px] m-0">Thank You For Dining With Us!</p>
              <p className="text-[10px] text-gray-600 m-0">Please Visit Us Again Soon</p>
              <p className="text-[9px] text-gray-500 mt-2 m-0">The Pepper's POS • NokoPrint 3-Inch</p>
            </div>

            {/* Bottom serrated tear paper edge decoration */}
            <div 
              style={{
                position: 'absolute',
                bottom: '-6px',
                left: 0,
                right: 0,
                height: '6px',
                background: 'radial-gradient(circle, transparent, transparent 50%, #e2e8f0 50%, #e2e8f0 100%)',
                backgroundSize: '12px 12px',
              }}
            />
          </div>
        </div>

        {/* Modal Action Buttons Footer */}
        <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={handleOpenNokoApp}
              className="px-3.5 py-2.5 rounded-xl font-bold text-xs text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Open directly inside NokoPrint Application on Tablet"
            >
              <Smartphone size={15} /> Open in NokoPrint
            </button>

            <InvoiceDownloadButton 
              invoice={data} 
              variant="button" 
              label="Download" 
            />

            <button 
              onClick={handlePrintOnly}
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-gray-900 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center gap-2 active:scale-95"
              title="Print directly to NokoPrint or system thermal printer"
            >
              <Printer size={16} /> {printSuccess ? 'Sent to NokoPrint!' : 'Print (NokoPrint)'}
            </button>

            {showConfirmButton && (
              <button 
                onClick={handleConfirmAndPrint}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center gap-2 transition-transform active:scale-95"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    <CheckCircle size={18} /> {confirmButtonText}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ThermalReceiptModal;
