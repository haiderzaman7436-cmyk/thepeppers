import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer, CheckCircle, X, Receipt, Smartphone } from 'lucide-react';
import { printThermalReceipt, openDirectNokoPrint, formatCurrency } from '../utils/thermalPrinter';
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
      name: "THE PEPPERS",
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

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.75)', 
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full max-w-[460px] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxHeight: '92vh',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)' 
        }}
      >
        {/* Modal Top Header Bar */}
        <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-200 flex justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-100 text-[var(--accent-primary)] shrink-0">
              <Receipt size={18} />
            </div>
            <div>
              <div className="font-extrabold text-gray-900 text-sm sm:text-base leading-none">
                Thermal Slip (80mm × 210mm)
              </div>
              <div className="text-[10px] text-gray-500 font-bold mt-1">
                NokoPrint & Thermal Printer Format
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 hover:bg-gray-200 p-1.5 rounded-xl transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Paper Slip Preview Container */}
        <div className="p-4 sm:p-5 overflow-y-auto bg-gray-200/90 flex justify-center items-start flex-1 min-h-0">
          
          {/* THE 80mm x 210mm THERMAL PAPER SLIP */}
          <div 
            className="bg-white text-black shadow-2xl relative select-text my-1"
            style={{ 
              width: '302px', 
              minWidth: '302px',
              maxWidth: '302px',
              boxSizing: 'border-box',
              padding: '18px 14px 24px 14px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, monospace',
              fontSize: '12px',
              lineHeight: 1.35,
              fontWeight: 800,
              color: '#000000',
              border: '2px solid #000000',
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
                className="w-16 h-16 object-contain mx-auto mb-2 rounded-full border-2 border-black shadow-sm"
              />
              <h1 className="font-black text-2xl tracking-tight m-0 leading-tight text-black">
                {storeInfo.name}
              </h1>
              <p className="text-xs italic text-black font-extrabold m-0">~ {storeInfo.tagline} ~</p>
              <p className="text-[11px] text-black font-extrabold m-0 mt-1 leading-snug">{storeInfo.category}</p>
              <p className="text-[11px] text-black font-extrabold m-0">Tel: {storeInfo.phone}</p>
              <p className="text-[11px] text-black font-extrabold m-0">{storeInfo.address}</p>
            </div>

            {/* Order Type Badge */}
            <div className="text-center my-2">
              <span className="inline-block border-2 border-black px-3.5 py-0.5 font-black text-xs tracking-widest uppercase text-black">
                *** {orderType.toUpperCase()} ***
              </span>
            </div>

            <div className="border-t-2 border-dashed border-black my-2" />

            {/* Order Metadata */}
            <div className="text-[12px] mb-2 leading-tight font-extrabold text-black">
              <div className="flex justify-between font-black text-sm mb-1 pb-1 border-b border-dashed border-black">
                <span>ORDER #: {orderNumber}</span>
                <span>{paymentMethod.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-black font-extrabold">
                <span>Date: {date}</span>
                <span>Time: {time}</span>
              </div>
              <div className="flex justify-between text-black font-extrabold">
                <span>Customer: <strong className="font-black">{customer}</strong></span>
                <span>Counter: POS-01</span>
              </div>
            </div>

            {/* Items Header */}
            <div className="flex justify-between font-black text-[12px] py-1 border-t-2 border-b-2 border-dashed border-black my-2 uppercase text-black">
              <span>ITEM DESCRIPTION</span>
              <span>AMOUNT</span>
            </div>

            {/* Items List */}
            <div className="flex flex-col gap-2 my-2 text-black">
              {items.map((item, idx) => {
                const qty = Number(item.quantity) || 1;
                const price = Number(item.price || item.parsedPrice) || 0;
                const lineTotal = price * qty;
                return (
                  <div key={idx} className="flex flex-col">
                    <div className="font-black text-xs break-words text-black">
                      {idx + 1}. {item.name}
                    </div>
                    <div className="flex justify-between pl-3 text-[12px] font-extrabold text-black">
                      <span>{qty} × {formatCurrency(price)}</span>
                      <span className="font-black text-black">{formatCurrency(lineTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t-2 border-dashed border-black my-2" />

            {/* Total Summary */}
            <div className="text-[12px] font-extrabold text-black">
              <div className="flex justify-between mb-1">
                <span>Total Items / Qty:</span>
                <span className="font-black">{totalQty}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Subtotal:</span>
                <span className="font-black">{formattedTotal}</span>
              </div>

              <div className="border-t-4 border-double border-black my-2" />

              <div className="flex justify-between text-lg font-black py-0.5 text-black items-center">
                <span>TOTAL DUE:</span>
                <span className="text-xl font-black">{formattedTotal}</span>
              </div>

              <div className="border-t-4 border-double border-black my-2" />

              <div className="flex justify-between text-[12px] font-extrabold text-black">
                <span>Payment:</span>
                <span className="font-black">PAID ({paymentMethod.toUpperCase()})</span>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-black mt-3 pt-2 text-center text-black">
              <div className="text-lg font-mono tracking-widest font-black leading-none my-1 select-none">
                ||| | |||| | ||| |||| | ||
              </div>
              <div className="text-[11px] tracking-wider text-black font-extrabold mb-2">
                *TP-${String(orderNumber).padStart(5, '0')}*
              </div>

              <p className="font-black text-[12px] uppercase m-0">Thank You For Dining With Us!</p>
              <p className="text-[11px] font-extrabold m-0 mt-0.5">Please Visit Us Again Soon</p>
              <p className="text-[10px] font-extrabold mt-2 m-0 tracking-wide">
                Thermal Slip • 80mm × 210mm
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
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0">
          <button 
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={handleOpenNokoApp}
              className="px-2.5 sm:px-3 py-2 rounded-xl font-bold text-xs text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 active:scale-95 shadow-sm"
              title="Open directly in NokoPrint on Tablet"
            >
              <Smartphone size={14} /> <span>NokoPrint</span>
            </button>

            <InvoiceDownloadButton 
              invoice={data} 
              variant="compact" 
              label="Download" 
            />

            <button 
              onClick={handlePrintOnly}
              className="px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm text-white bg-gray-900 hover:bg-black transition-colors flex items-center gap-1.5 active:scale-95 shadow-sm"
              title="Print directly to NokoPrint or thermal printer"
            >
              <Printer size={15} /> {printSuccess ? 'Printing...' : 'Print (80mm)'}
            </button>

            {showConfirmButton && (
              <button 
                onClick={handleConfirmAndPrint}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md flex items-center gap-1.5 transition-transform active:scale-95"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {isProcessing ? 'Processing...' : (
                  <>
                    <CheckCircle size={16} /> {confirmButtonText}
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
