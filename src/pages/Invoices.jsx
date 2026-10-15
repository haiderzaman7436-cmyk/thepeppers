import React, { useState, useEffect } from 'react';
import { FileText, Printer, Mail, Database, ChevronDown, ChevronUp, Search, RotateCw, Sliders, Smartphone } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import ThermalReceiptModal from '../components/ThermalReceiptModal';
import InvoiceDownloadButton from '../components/InvoiceDownloadButton';
import { printThermalReceipt, printWithBRRawPrinter, DEFAULT_STORE_INFO } from '../utils/thermalPrinter';

const Invoices = () => {
  const [invoicesData, setInvoicesData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [receiptModalInvoice, setReceiptModalInvoice] = useState(null);

  useEffect(() => {
    // We listen to invoices
    const q = query(collection(db, 'invoices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Sort by date/time descending
      invoicesList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setInvoicesData(invoicesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching invoices: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleExpand = (id) => {
    if (expandedInvoice === id) {
      setExpandedInvoice(null);
    } else {
      setExpandedInvoice(id);
    }
  };

  const filteredInvoices = invoicesData.filter(inv => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const orderNum = String(inv.orderNumber || inv.invoiceNumber || '').toLowerCase();
    const customer = String(inv.customer || '').toLowerCase();
    const date = String(inv.date || '').toLowerCase();
    return orderNum.includes(term) || customer.includes(term) || date.includes(term);
  });

  const handleReload = () => {
    setIsReloading(true);
    setLoading(true);
    setTimeout(() => {
      setIsReloading(false);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices Archive</h1>
          <p className="text-secondary text-sm mt-1">Complete historical record of all transactions.</p>
        </div>

        {/* Quick Search & Reload */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice #, customer..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--accent-primary)] shadow-sm transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleReload}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all shrink-0 cursor-pointer"
            title="Reload Invoices list"
          >
            <RotateCw size={15} className={isReloading ? "animate-spin text-[var(--accent-primary)]" : ""} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-secondary font-medium">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12 gap-4">
            <Database size={48} className="text-gray-300" />
            <p className="text-gray-400 font-medium">
              {searchTerm ? 'No matching invoices found.' : 'No invoices found in database.'}
            </p>
          </div>
        ) : (
          filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(invoice.id)}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 text-[var(--accent-primary)] shrink-0">
                    <FileText size={24} />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Order / Invoice</p>
                      <p className="font-bold">#{invoice.orderNumber || invoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Date & Time</p>
                      <p className="font-medium text-gray-700">
                        {invoice.date} {invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Customer</p>
                      <p className="font-medium text-gray-700 truncate">{invoice.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Total</p>
                      <p className="font-black text-[var(--accent-primary)]">{invoice.total}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pr-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const receiptData = {
                          orderNumber: invoice.orderNumber || invoice.invoiceNumber || 'N/A',
                          date: invoice.date || new Date().toLocaleDateString(),
                          time: invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (invoice.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                          customer: invoice.customer || 'Walk-in Customer',
                          orderType: invoice.orderType || 'Dine In',
                          paymentMethod: invoice.paymentMethod || 'Cash',
                          storeInfo: invoice.storeInfo || DEFAULT_STORE_INFO,
                          items: invoice.cartDetails || invoice.items || [],
                          total: invoice.total || '0'
                        };
                        printThermalReceipt(receiptData);
                      }}
                      className="p-2 text-gray-600 hover:text-[var(--accent-primary)] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="LAN Thermal Print"
                    >
                      <Printer size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const receiptData = {
                          orderNumber: invoice.orderNumber || invoice.invoiceNumber || 'N/A',
                          date: invoice.date || new Date().toLocaleDateString(),
                          time: invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (invoice.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                          customer: invoice.customer || 'Walk-in Customer',
                          orderType: invoice.orderType || 'Dine In',
                          paymentMethod: invoice.paymentMethod || 'Cash',
                          storeInfo: invoice.storeInfo || DEFAULT_STORE_INFO,
                          items: invoice.cartDetails || invoice.items || [],
                          total: invoice.total || '0'
                        };
                        printWithBRRawPrinter(receiptData);
                      }}
                      className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Print with BR RawPrinter iOS / Bluetooth"
                    >
                      <Smartphone size={16} />
                    </button>

                    <InvoiceDownloadButton 
                      invoice={invoice} 
                      variant="compact" 
                      label="Download" 
                    />
                    <button 
                      onClick={() => toggleExpand(invoice.id)}
                      className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
                    >
                      {expandedInvoice === invoice.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details Area */}
              {expandedInvoice === invoice.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-6 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h3 className="font-bold text-lg mb-1">Order Details</h3>
                      <p className="text-sm text-gray-500">Order Type: <span className="font-bold text-gray-700">{invoice.orderType || 'N/A'}</span> • Payment: <span className="font-bold text-gray-700">{invoice.paymentMethod || 'Cash'}</span></p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <InvoiceDownloadButton 
                        invoice={invoice} 
                        variant="button" 
                        label="Download" 
                      />

                      <button 
                        onClick={() => {
                          const receiptData = {
                            orderNumber: invoice.orderNumber || invoice.invoiceNumber || 'N/A',
                            date: invoice.date || new Date().toLocaleDateString(),
                            time: invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (invoice.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                            customer: invoice.customer || 'Walk-in Customer',
                            orderType: invoice.orderType || 'Dine In',
                            paymentMethod: invoice.paymentMethod || 'Cash',
                            storeInfo: invoice.storeInfo || DEFAULT_STORE_INFO,
                            items: invoice.cartDetails || invoice.items || [],
                            total: invoice.total || '0'
                          };
                          printThermalReceipt(receiptData);
                        }}
                        className="btn btn-primary flex items-center gap-1.5 shadow-sm text-xs font-bold" 
                        style={{ padding: '0.6rem 1rem' }}
                        title="Send directly to LAN thermal printer"
                      >
                        <Printer size={15} /> LAN Print
                      </button>

                      <button 
                        onClick={() => {
                          const receiptData = {
                            orderNumber: invoice.orderNumber || invoice.invoiceNumber || 'N/A',
                            date: invoice.date || new Date().toLocaleDateString(),
                            time: invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (invoice.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
                            customer: invoice.customer || 'Walk-in Customer',
                            orderType: invoice.orderType || 'Dine In',
                            paymentMethod: invoice.paymentMethod || 'Cash',
                            storeInfo: invoice.storeInfo || DEFAULT_STORE_INFO,
                            items: invoice.cartDetails || invoice.items || [],
                            total: invoice.total || '0'
                          };
                          printWithBRRawPrinter(receiptData);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 shadow-sm transition-all active:scale-95 cursor-pointer" 
                        title="Print using BR RawPrinter iOS Application"
                      >
                        <Smartphone size={15} className="text-indigo-600" /> BR RawPrinter
                      </button>

                      <button 
                        onClick={() => setReceiptModalInvoice(invoice)}
                        className="btn btn-secondary flex items-center gap-1.5 shadow-sm text-xs font-bold hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]" 
                        style={{ padding: '0.6rem 1rem' }}
                        title="Preview slip and adjust receipt preferences"
                      >
                        <Sliders size={15} /> Settings & Preview
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase">Item Name</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">Quantity</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Price</th>
                          <th className="p-3 text-xs font-bold text-gray-500 uppercase text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoice.cartDetails?.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100 last:border-0">
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-center font-bold text-gray-600">{item.quantity}</td>
                            <td className="p-3 text-right text-gray-600">Rs {item.price}</td>
                            <td className="p-3 text-right font-bold">Rs {item.price * item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                          <td colSpan="3" className="p-3 text-right font-bold text-gray-600">Total Due:</td>
                          <td className="p-3 text-right font-black text-[var(--accent-primary)] text-lg">{invoice.total}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 3-Inch Professional Thermal Receipt Modal */}
      <ThermalReceiptModal 
        isOpen={!!receiptModalInvoice}
        onClose={() => setReceiptModalInvoice(null)}
        data={receiptModalInvoice ? {
          orderNumber: receiptModalInvoice.orderNumber || receiptModalInvoice.invoiceNumber,
          date: receiptModalInvoice.date,
          time: receiptModalInvoice.createdAt?.toDate ? receiptModalInvoice.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          customer: receiptModalInvoice.customer,
          orderType: receiptModalInvoice.orderType || 'Dine In',
          paymentMethod: receiptModalInvoice.paymentMethod || 'Cash',
          items: receiptModalInvoice.cartDetails || [],
          total: receiptModalInvoice.total
        } : null}
      />
    </div>
  );
};

export default Invoices;
