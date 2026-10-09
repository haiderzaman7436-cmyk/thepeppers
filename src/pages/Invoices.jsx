import React, { useState, useEffect } from 'react';
import { FileText, Printer, Mail, Database, ChevronDown, ChevronUp } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const Invoices = () => {
  const [invoicesData, setInvoicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvoice, setExpandedInvoice] = useState(null);

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

  return (
    <div className="animate-fade-in pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices Archive</h1>
          <p className="text-secondary text-sm mt-1">Complete historical record of all transactions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-secondary font-medium">Loading invoices...</p>
          </div>
        ) : invoicesData.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12 gap-4">
            <Database size={48} className="text-gray-300" />
            <p className="text-gray-400 font-medium">No invoices found in database.</p>
          </div>
        ) : (
          invoicesData.map((invoice) => (
            <div key={invoice.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(invoice.id)}
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-50 text-[var(--accent-primary)] shrink-0">
                    <FileText size={24} />
                  </div>
                  
                  <div className="flex-1 grid grid-cols-4 gap-4 items-center">
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
                  
                  <div className="text-gray-400 pr-2">
                    {expandedInvoice === invoice.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </div>
              </div>

              {/* Expanded Details Area */}
              {expandedInvoice === invoice.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-6 animate-fade-in">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-lg mb-1">Order Details</h3>
                      <p className="text-sm text-gray-500">Order Type: <span className="font-bold text-gray-700">{invoice.orderType || 'N/A'}</span> • Payment: <span className="font-bold text-gray-700">{invoice.paymentMethod || 'Cash'}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn btn-secondary flex items-center gap-2 shadow-sm text-sm" style={{ padding: '0.5rem 1rem' }}>
                        <Printer size={16} /> Print Receipt
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
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
    </div>
  );
};

export default Invoices;
