import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Image, Printer, Check, Loader2 } from 'lucide-react';
import { 
  downloadThermalReceiptPDF, 
  downloadInvoiceImage 
} from '../utils/invoiceDownloader';

const InvoiceDownloadButton = ({
  invoice,
  variant = 'button', // 'button' | 'compact'
  className = '',
  label = 'Download Slip',
  options = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingType, setLoadingType] = useState(null); // 'pdf' | 'image' | null
  const [successType, setSuccessType] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownload = async (e, type) => {
    e.stopPropagation();
    if (!invoice || loadingType) return;

    try {
      setLoadingType(type);
      setIsOpen(false);

      if (type === 'pdf') {
        await downloadThermalReceiptPDF(invoice, options);
      } else if (type === 'image') {
        await downloadInvoiceImage(invoice, options);
      }

      setSuccessType(type);
      setTimeout(() => setSuccessType(null), 2500);
    } catch (error) {
      console.error('Thermal slip download failed:', error);
      alert('Failed to generate thermal slip download. Please try again.');
    } finally {
      setLoadingType(null);
    }
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Compact variant (ideal for table rows & cards)
  if (variant === 'compact') {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={toggleDropdown}
          disabled={!!loadingType}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm border ${
            successType 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
              : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300 active:scale-95'
          }`}
          title="Download 80x210 Thermal Slip"
        >
          {loadingType ? (
            <Loader2 size={14} className="animate-spin text-[var(--accent-primary)]" />
          ) : successType ? (
            <Check size={14} className="text-emerald-600" />
          ) : (
            <Download size={14} className="text-[var(--accent-primary)]" />
          )}
          <span>{loadingType ? 'Generating...' : successType ? 'Downloaded!' : label}</span>
          <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div 
            className="absolute right-0 mt-1.5 w-56 rounded-xl bg-white shadow-xl border border-gray-100 py-1.5 z-50 animate-fade-in"
            style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))' }}
          >
            <div className="px-3 py-1 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
              80x210 Thermal Slip
            </div>
            
            <button
              onClick={(e) => handleDownload(e, 'pdf')}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-800 hover:bg-red-50 hover:text-[var(--accent-primary)] flex items-center gap-2.5 transition-colors"
            >
              <div className="p-1 rounded bg-red-50 text-[var(--accent-primary)]">
                <Printer size={14} />
              </div>
              <div>
                <div className="font-bold">Thermal Slip (PDF)</div>
                <div className="text-[10px] text-gray-500">80mm × 210mm roll size</div>
              </div>
            </button>

            <button
              onClick={(e) => handleDownload(e, 'image')}
              className="w-full text-left px-3 py-2 text-xs font-medium text-gray-800 hover:bg-red-50 hover:text-[var(--accent-primary)] flex items-center gap-2.5 transition-colors"
            >
              <div className="p-1 rounded bg-amber-50 text-amber-600">
                <Image size={14} />
              </div>
              <div>
                <div className="font-bold">Slip Image (PNG)</div>
                <div className="text-[10px] text-gray-500">For WhatsApp & sharing</div>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Standard Button variant
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div className="inline-flex rounded-xl shadow-sm">
        <button
          type="button"
          onClick={(e) => handleDownload(e, 'pdf')}
          disabled={!!loadingType}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-l-xl text-xs font-bold transition-all border border-r-0 ${
            successType 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
              : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200 hover:border-gray-300 active:scale-95'
          }`}
          title="Download 80x210 Thermal Slip PDF"
        >
          {loadingType ? (
            <Loader2 size={15} className="animate-spin text-[var(--accent-primary)]" />
          ) : successType ? (
            <Check size={15} className="text-emerald-600" />
          ) : (
            <Download size={15} className="text-[var(--accent-primary)]" />
          )}
          <span>{loadingType ? 'Generating...' : successType ? 'Downloaded!' : `${label} (80×210)`}</span>
        </button>

        <button
          type="button"
          onClick={toggleDropdown}
          disabled={!!loadingType}
          className="px-2.5 py-2.5 rounded-r-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-800 transition-colors"
          title="More download formats"
        >
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-60 rounded-xl bg-white shadow-xl border border-gray-100 py-2 z-50 animate-fade-in"
          style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.12))' }}
        >
          <div className="px-3.5 py-1 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
            Select Thermal Slip Format
          </div>

          <button
            onClick={(e) => handleDownload(e, 'pdf')}
            className="w-full text-left px-3.5 py-2.5 text-xs text-gray-800 hover:bg-red-50 hover:text-[var(--accent-primary)] flex items-center gap-3 transition-colors"
          >
            <div className="p-1.5 rounded-lg bg-red-50 text-[var(--accent-primary)]">
              <Printer size={15} />
            </div>
            <div>
              <div className="font-bold text-gray-900">Thermal Slip (PDF)</div>
              <div className="text-[10px] text-gray-500">80mm × 210mm roll size</div>
            </div>
          </button>

          <button
            onClick={(e) => handleDownload(e, 'image')}
            className="w-full text-left px-3.5 py-2.5 text-xs text-gray-800 hover:bg-red-50 hover:text-[var(--accent-primary)] flex items-center gap-3 transition-colors"
          >
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Image size={15} />
            </div>
            <div>
              <div className="font-bold text-gray-900">Slip Image (PNG)</div>
              <div className="text-[10px] text-gray-500">Crisp image for WhatsApp / SMS</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default InvoiceDownloadButton;
