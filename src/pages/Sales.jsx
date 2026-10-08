import React, { useState, useEffect } from 'react';
import { Download, Search, Database, Plus, RotateCcw, X } from 'lucide-react';
import { collection, onSnapshot, query, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

import { useNavigate } from 'react-router-dom';

const Sales = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'sales'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Arrange so it starts with 1 and is ordered correctly
      salesList.sort((a, b) => {
        const idA = a.invoiceNumber !== undefined ? a.invoiceNumber : 0;
        const idB = b.invoiceNumber !== undefined ? b.invoiceNumber : 0;
        return idA - idB;
      });
      setSalesData(salesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching sales: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReturn = async (id) => {
    if (window.confirm("Are you sure you want to process a return for this item?")) {
      try {
        const saleRef = doc(db, 'sales', id);
        await updateDoc(saleRef, { status: 'Returned' });
      } catch (error) {
        console.error("Error updating sale status: ", error);
        alert("Failed to process return.");
      }
    }
  };


  return (
    <div className="relative animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales History</h1>
          <p className="text-secondary text-sm mt-1">View and manage recent transactions and returns.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-secondary">
            <Download size={18} /> Export CSV
          </button>
          <button className="btn btn-primary shadow-md font-bold" onClick={() => navigate('/pos')} style={{ gap: '6px' }}>
            <Plus size={20} /> New POS Order
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="input-group" style={{ marginBottom: 0, width: '300px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input
                type="text"
                className="input-field w-full"
                placeholder="Search orders..."
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-secondary font-medium">Loading sales data...</p>
            </div>
          ) : salesData.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12 gap-4">
              <Database size={48} className="text-muted" />
              <p className="text-secondary font-medium">No sales recorded yet.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((order) => {
                  const displayId = order.invoiceNumber ? order.invoiceNumber : order.id;
                  return (
                    <tr key={order.id}>
                      <td className="font-bold text-accent">{displayId}</td>
                      <td>{order.date}</td>
                      <td className="font-medium">{order.customer}</td>
                      <td>{order.items} items</td>
                      <td className="font-semibold">{order.total}</td>
                      <td>
                        <span className={`badge ${
                          order.status === 'Completed' ? 'badge-success' : 
                          order.status === 'Returned' ? 'badge-danger' :
                          order.status === 'Pending' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        {order.status !== 'Returned' && (
                          <button 
                            onClick={() => handleReturn(order.id)} 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.6rem' }} 
                            title="Process Return"
                          >
                            <RotateCcw size={16} className="text-warning" />
                            <span className="text-xs ml-1 font-medium text-warning">Return</span>
                          </button>
                        )}
                        {order.status === 'Returned' && (
                          <span className="text-xs text-secondary italic font-medium">Processed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sales;
