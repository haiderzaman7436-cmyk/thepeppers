import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Banknote, 
  ShoppingBag,
  Database,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const StatCard = ({ title, value, icon, subtitle }) => (
  <div className="card">
    <div className="flex justify-between items-center mb-4">
      <div>
        <p className="text-secondary text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
      <div className="avatar" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--accent-primary)' }}>
        {icon}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-success">
        {subtitle}
      </span>
    </div>
  </div>
);

const Dashboard = () => {
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  
  // Edit Modal State
  const [editingInvoice, setEditingInvoice] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'invoices'), (snapshot) => {
      const invoices = [];
      snapshot.forEach(doc => invoices.push({ id: doc.id, ...doc.data() }));
      
      // Sort invoices by created date descending
      invoices.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      
      setAllInvoices(invoices);
      setLoading(false);
      
      // Auto-select the latest day with records if no date is currently selected
      if (!selectedDate && invoices.length > 0) {
        setSelectedDate(invoices[0].date);
      } else if (invoices.length === 0) {
        setSelectedDate(new Date().toISOString().split('T')[0]);
      }
    });
    return () => unsubscribe();
  }, [selectedDate]);

  const handlePreviousDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleStartNewDay = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Filter invoices for selected date
  const todaysInvoices = allInvoices.filter(inv => inv.date === selectedDate);
  
  // Compute Stats
  const totalRevenue = todaysInvoices.reduce((acc, curr) => {
    const price = parseInt(curr.total.replace(/\D/g, ''), 10) || 0;
    return acc + price;
  }, 0);
  const totalCost = todaysInvoices.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const totalOrders = todaysInvoices.length;
  const totalItemsSold = todaysInvoices.reduce((acc, curr) => acc + (curr.items || 0), 0);

  // Edit Handlers
  const handleDeleteInvoice = async (id) => {
    if (window.confirm("Are you sure you want to completely delete this invoice?")) {
      await deleteDoc(doc(db, 'invoices', id));
      setEditingInvoice(null);
    }
  };

  const handleRemoveItemFromInvoice = async (invoice, itemIndex) => {
    const updatedCart = [...invoice.cartDetails];
    updatedCart.splice(itemIndex, 1);
    
    if (updatedCart.length === 0) {
      handleDeleteInvoice(invoice.id);
      return;
    }
    
    const newTotal = updatedCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const newItemsCount = updatedCart.reduce((acc, item) => acc + item.quantity, 0);
    const newTotalCost = updatedCart.reduce((acc, item) => acc + ((item.costPrice || 0) * item.quantity), 0);
    
    await updateDoc(doc(db, 'invoices', invoice.id), {
      cartDetails: updatedCart,
      total: `Rs ${newTotal}`,
      totalCost: newTotalCost,
      items: newItemsCount
    });
    
    setEditingInvoice({ ...invoice, cartDetails: updatedCart, total: `Rs ${newTotal}`, totalCost: newTotalCost, items: newItemsCount });
  };

  const handleChangeItemQuantity = async (invoice, itemIndex, delta) => {
    const updatedCart = [...invoice.cartDetails];
    const item = updatedCart[itemIndex];
    const newQuantity = item.quantity + delta;
    
    if (newQuantity <= 0) {
      handleRemoveItemFromInvoice(invoice, itemIndex);
      return;
    }
    
    item.quantity = newQuantity;
    const newTotal = updatedCart.reduce((acc, it) => acc + (it.price * it.quantity), 0);
    const newItemsCount = updatedCart.reduce((acc, it) => acc + it.quantity, 0);
    const newTotalCost = updatedCart.reduce((acc, it) => acc + ((it.costPrice || 0) * it.quantity), 0);
    
    await updateDoc(doc(db, 'invoices', invoice.id), {
      cartDetails: updatedCart,
      total: `Rs ${newTotal}`,
      totalCost: newTotalCost,
      items: newItemsCount
    });
    
    setEditingInvoice({ ...invoice, cartDetails: updatedCart, total: `Rs ${newTotal}`, totalCost: newTotalCost, items: newItemsCount });
  };

  return (
    <div className="animate-fade-in pb-10">
      {/* Day Controls */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={handlePreviousDay} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={24} /></button>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-gray-400">Viewing Records For</span>
            <span className="text-xl font-black text-[var(--accent-primary)] flex items-center gap-2">
              <Calendar size={20} /> {selectedDate}
            </span>
          </div>
          <button onClick={handleNextDay} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={24} /></button>
        </div>
        
        <button onClick={handleStartNewDay} className="btn btn-primary shadow-md shadow-red-500/20">
          Start New Day (Today)
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Daily Revenue" 
          value={`Rs ${totalRevenue.toLocaleString()}`} 
          icon={<Banknote size={24} />} 
          subtitle={`${totalOrders} Sales`}
        />
        <StatCard 
          title="Total Cost" 
          value={`Rs ${totalCost.toLocaleString()}`} 
          icon={<ShoppingBag size={24} />} 
          subtitle="Inventory Cost"
        />
        <StatCard 
          title="Total Profit" 
          value={`Rs ${totalProfit.toLocaleString()}`} 
          icon={<TrendingUp size={24} />} 
          subtitle="Gross Margin"
        />
        <StatCard 
          title="Items Sold" 
          value={totalItemsSold} 
          icon={<Database size={24} />} 
          subtitle="Individual products"
        />
      </div>

      {/* Invoices List */}
      <div className="card">
        <h3 className="font-bold mb-4 text-xl flex items-center gap-2">
          <Database size={20} className="text-[var(--accent-primary)]" />
          Order Invoices for {selectedDate}
        </h3>
        
        {loading ? (
           <div className="p-10 text-center text-gray-500">Loading records...</div>
        ) : todaysInvoices.length === 0 ? (
           <div className="p-10 text-center text-gray-400">No orders found for this day.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="p-3 text-gray-500 font-bold">Order #</th>
                  <th className="p-3 text-gray-500 font-bold">Time</th>
                  <th className="p-3 text-gray-500 font-bold">Customer</th>
                  <th className="p-3 text-gray-500 font-bold">Items</th>
                  <th className="p-3 text-gray-500 font-bold">Total</th>
                  <th className="p-3 text-gray-500 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {todaysInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-bold text-black">#{invoice.orderNumber || invoice.invoiceNumber}</td>
                    <td className="p-3 text-gray-600">
                      {invoice.createdAt?.toDate ? invoice.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
                    </td>
                    <td className="p-3 font-medium text-black">{invoice.customer}</td>
                    <td className="p-3 text-gray-600">{invoice.items} items</td>
                    <td className="p-3 font-bold text-[var(--accent-primary)]">{invoice.total}</td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => setEditingInvoice(invoice)}
                        className="p-2 text-[var(--accent-primary)] bg-red-50 hover:bg-red-100 rounded-lg font-bold text-sm transition-colors"
                      >
                        Edit Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-fade-in">
            <div className="bg-[var(--accent-primary)] p-4 flex justify-between items-center text-white">
              <h2 className="text-xl font-bold">Edit Order #{editingInvoice.orderNumber || editingInvoice.invoiceNumber}</h2>
              <button onClick={() => setEditingInvoice(null)} className="hover:bg-white/20 p-1 rounded-md transition-colors"><X size={24} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-600">Customer: {editingInvoice.customer}</span>
                <span className="font-black text-2xl text-[var(--accent-primary)]">{editingInvoice.total}</span>
              </div>
              
              <div className="space-y-3">
                {editingInvoice.cartDetails?.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="font-bold flex-1">{item.name} <span className="text-gray-400 font-normal ml-2">(Rs {item.price})</span></div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <button onClick={() => handleChangeItemQuantity(editingInvoice, index, -1)} className="px-3 py-1 hover:bg-gray-100 font-bold">-</button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <button onClick={() => handleChangeItemQuantity(editingInvoice, index, 1)} className="px-3 py-1 hover:bg-gray-100 font-bold">+</button>
                      </div>
                      <button onClick={() => handleRemoveItemFromInvoice(editingInvoice, index)} className="text-gray-400 hover:text-red-500 p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between">
              <button 
                onClick={() => handleDeleteInvoice(editingInvoice.id)}
                className="px-6 py-2.5 rounded-xl font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border border-red-100"
              >
                <Trash2 size={18} /> Delete Entire Order
              </button>
              <button 
                onClick={() => setEditingInvoice(null)}
                className="px-8 py-2.5 rounded-xl font-bold text-white bg-[var(--accent-primary)] hover:bg-red-700 shadow-md transition-all"
              >
                Done Editing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
