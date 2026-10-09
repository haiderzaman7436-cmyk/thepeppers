import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, Image as ImageIcon, Database } from 'lucide-react';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

const Inventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // CRUD Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    costPrice: 0,
    salePrice: '',
    image: '',
    status: 'Available'
  });

  // Fetch data
  useEffect(() => {
    const q = query(collection(db, 'inventory'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryList = [];
      const seenNames = new Set();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const itemName = data.name ? data.name.trim() : '';
        
        if (itemName && !seenNames.has(itemName)) {
          seenNames.add(itemName);
          inventoryList.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      // Sort items logically by category
      inventoryList.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
      setItems(inventoryList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Open Modal for Create
  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({ name: '', category: '', quantity: 0, costPrice: 0, salePrice: '', image: '', status: 'Available' });
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || '',
      quantity: item.quantity || 0,
      costPrice: item.costPrice || 0,
      salePrice: item.salePrice || item.price || '', // Fallback to 'price' for older seeded data
      image: item.image || '',
      status: item.status || 'Available'
    });
    setIsModalOpen(true);
  };

  // Delete Item
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
      } catch (error) {
        console.error("Error deleting document: ", error);
        alert("Failed to delete item.");
      }
    }
  };

  // Handle Form Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update
        const itemRef = doc(db, 'inventory', editingItem.id);
        await updateDoc(itemRef, {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        // Create
        await addDoc(collection(db, 'inventory'), {
          ...formData,
          createdAt: new Date()
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Failed to save item.");
    }
  };


  return (
    <div className="animate-fade-in relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Inventory & Menu</h1>
          <p className="text-secondary text-sm mt-1">Manage your items, stock, prices, and images.</p>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={18} /> Add New Item
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="input-group" style={{ marginBottom: 0, width: '300px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input-field w-full" placeholder="Search items..." style={{ paddingLeft: '2.75rem' }} />
            </div>
          </div>
          <button className="btn btn-secondary">
            <Filter size={18} /> Filter
          </button>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-secondary font-medium">Loading inventory from secure database...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col justify-center items-center py-12 gap-4">
              <Database size={48} className="text-muted" />
              <p className="text-secondary font-medium">No items found in database.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Item Details</th>
                  <th>Quantity</th>
                  <th>Cost Price</th>
                  <th>Sale Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  // Fallback to older 'price' key if 'salePrice' isn't set yet
                  const displaySalePrice = item.salePrice || item.price || 'N/A';
                  
                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <ImageIcon size={24} className="text-secondary" />
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-xs text-secondary">{item.category}</div>
                      </td>
                      <td className="font-medium">{item.quantity !== undefined ? item.quantity : 'N/A'}</td>
                      <td>{item.costPrice ? `PKR ${item.costPrice}` : 'N/A'}</td>
                      <td className="font-bold text-primary">{displaySalePrice}</td>
                      <td>
                        <span className={`badge ${
                          item.status === 'Available' ? 'badge-success' : 
                          item.status === 'Low Stock' ? 'badge-warning' : 'badge-danger'
                        }`}>
                          {item.status || 'Available'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(item)} className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Edit">
                            <Edit size={16} className="text-info" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="btn btn-secondary" style={{ padding: '0.5rem' }} title="Delete">
                            <Trash2 size={16} className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CRUD Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setIsModalOpen(false)} 
              style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--text-secondary)' }}
            >
              <X size={24} />
            </button>
            
            <h2 className="text-xl font-bold mb-6">{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
            
            <form onSubmit={handleSubmit} className="flex-col gap-4">
              <div className="input-group">
                <label>Item Name</label>
                <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="input-group">
                <label>Category</label>
                <input type="text" className="input-field" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required />
              </div>

              <div className="input-group">
                <label>Image URL</label>
                <input type="url" className="input-field" placeholder="https://example.com/image.jpg" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                <p className="text-xs text-secondary mt-1">Provide a direct link to an image. Leave blank for a placeholder.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Quantity</label>
                  <input type="number" className="input-field" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} required />
                </div>
                <div className="input-group">
                  <label>Status</label>
                  <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Available">Available</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="input-group">
                  <label>Cost Price (PKR)</label>
                  <input type="number" className="input-field" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})} required />
                </div>
                <div className="input-group">
                  <label>Sale Price (Display String)</label>
                  <input type="text" className="input-field" placeholder="e.g. PKR 450" value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: e.target.value})} required />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingItem ? 'Save Changes' : 'Create Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
