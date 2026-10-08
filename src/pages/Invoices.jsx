import React, { useState, useEffect } from 'react';
import { FileText, Printer, Mail, Database } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

const Invoices = () => {
  const [invoicesData, setInvoicesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'invoices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setInvoicesData(invoicesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching invoices: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-secondary text-sm mt-1">Manage billing and client invoices.</p>
        </div>
        <button className="btn btn-primary">
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-secondary font-medium">Loading invoices...</p>
          </div>
        ) : invoicesData.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12 gap-4">
            <Database size={48} className="text-muted" />
            <p className="text-secondary font-medium">No invoices created yet.</p>
          </div>
        ) : (
          invoicesData.map((invoice) => (
            <div key={invoice.id} className="card flex items-center justify-between" style={{ padding: '1rem 1.5rem' }}>
              <div className="flex items-center gap-4 w-full">
                <div className="avatar" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', width: '48px', height: '48px' }}>
                  <FileText size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex justify-between items-center w-full mb-1">
                    <h3 className="font-semibold">{invoice.client}</h3>
                    <span className="font-bold text-lg">{invoice.amount}</span>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <p className="text-sm text-secondary">{invoice.id} • {invoice.date}</p>
                    <span className={`badge ${
                      invoice.status === 'Paid' ? 'badge-success' : 
                      invoice.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <Printer size={18} />
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                    <Mail size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Invoices;
