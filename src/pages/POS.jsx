import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Grid, Tag, Pizza, Sandwich, Utensils, Cookie, CupSoda, PlusCircle, Coffee, X, CreditCard, DollarSign, Smartphone } from 'lucide-react';

const POS = () => {
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('Dine In');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState({}); // Keeps track of dropdown selections
  const [currentOrderNumber, setCurrentOrderNumber] = useState(1);
  
  // Two-tier navigation state
  const [mainCategory, setMainCategory] = useState('All');
  const [subCategory, setSubCategory] = useState('All');

  // Parse price string like "Rs 899" or "899" to integer
  const parsePrice = (priceStr) => {
    if (!priceStr) return 0;
    const num = parseInt(priceStr.toString().replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  // 2-Tier Category Architecture
  const categoryHierarchy = {
    'Deals': ['Student Deal', 'Zinger Deal', 'Shawarma Deal', 'Pizza Deal'],
    'Pizzas': ['Pizzas', 'Premium Pizzas', 'Platinum Pizzas'],
    'Burgers & Wraps': ['Budget Bites', 'Premium Burgers', 'Wraps & Shawarma'],
    'Platters': ['Platers', 'Platters'],
    'Snacks': ['Snacks & Stakes'],
    'Drinks': ['Drinks'],
    'Sauces': ['Sauces'],
    'Other': ['Other']
  };

  const mainCategories = ['All', 'Deals', 'Pizzas', 'Burgers & Wraps', 'Platters', 'Snacks', 'Drinks', 'Sauces', 'Other'];

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'inventory'), (snapshot) => {
      const items = [];
      const seenNames = new Set();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let itemName = data.name ? data.name.trim() : '';
        
        // Dynamically strip size suffixes to consolidate duplicate pizza items from old DB data
        if (itemName.toLowerCase().includes('pizza') && !itemName.toLowerCase().includes('deal')) {
          itemName = itemName.replace(/\s*\((Small|Medium|Large|E\.Large|Extra Large)\)/ig, '').trim();
        }
        
        if (itemName && !seenNames.has(itemName)) {
          seenNames.add(itemName);
          items.push({
            id: doc.id,
            ...data,
            name: itemName, // Use the clean name
            posCategory: data.category || 'Other'
          });
        }
      });
      
      // Sort items alphabetically by name so deals and items appear in logical order (e.g. Deal 1, Deal 2)
      items.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      
      setInventory(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching inventory:", error);
      setLoading(false);
    });

    const fetchLatestOrderNumber = async () => {
      try {
        const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
        let maxId = 0;
        invoicesSnapshot.forEach(doc => {
          const data = doc.data();
          const num = data.invoiceNumber || data.orderNumber || 0;
          if (typeof num === 'number' && num > maxId) {
            maxId = num;
          } else if (typeof num === 'string' && !isNaN(parseInt(num, 10))) {
            const parsed = parseInt(num, 10);
            if (parsed > maxId) maxId = parsed;
          }
        });
        setCurrentOrderNumber(maxId + 1);
      } catch (err) {
        console.error("Error fetching max order number:", err);
      }
    };
    fetchLatestOrderNumber();

    return () => unsubscribe();
  }, []);

  const addToCart = (item, explicitSize = null, explicitPrice = null) => {
    setCart(prevCart => {
      let finalName = item.name;
      let finalId = item.id;
      let price = parsePrice(item.salePrice || item.price || 0);

      // Handle Pizzas using the dropdown state
      if (item.posCategory && item.posCategory.toLowerCase().includes('pizza') && !item.posCategory.toLowerCase().includes('deal')) {
        const sizes = getPizzaSizes(item);
        const selectedSize = explicitSize || selectedSizes[item.id] || sizes[0].label;
        const sizeObj = sizes.find(s => s.label === selectedSize);
        
        finalName = `${item.name} (${selectedSize})`;
        finalId = `${item.id}-${selectedSize}`;
        price = explicitPrice !== null ? explicitPrice : (sizeObj ? sizeObj.price : price);
      } else {
        if (explicitSize) {
          finalName = `${item.name} (${explicitSize})`;
          finalId = `${item.id}-${explicitSize}`;
        }
        if (explicitPrice !== null) {
          price = explicitPrice;
        }
      }

      const existingItem = prevCart.find(cartItem => cartItem.id === finalId);
      if (existingItem) {
        return prevCart.map(cartItem => 
          cartItem.id === finalId 
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, id: finalId, name: finalName, quantity: 1, parsedPrice: price }];
    });
  };
  
  // Calculate smart prices based on category and range
  const getPizzaSizes = (item) => {
    const isPremium = item.posCategory && item.posCategory.toLowerCase().includes('premium');
    const isPlatinum = item.posCategory && item.posCategory.toLowerCase().includes('platinum');
    
    if (isPlatinum) {
      return [
        { label: 'Small', price: 700 },
        { label: 'Medium', price: 1050 },
        { label: 'Large', price: 1400 },
        { label: 'E.Large', price: 1800 }
      ];
    }
    
    if (isPremium) {
      return [
        { label: 'Small', price: 500 },
        { label: 'Medium', price: 850 },
        { label: 'Large', price: 1200 },
        { label: 'E.Large', price: 1600 }
      ];
    }
    
    // Default Regular Pizza Pricing
    return [
      { label: 'Small', price: 400 },
      { label: 'Medium', price: 750 },
      { label: 'Large', price: 999 },
      { label: 'E.Large', price: 1400 }
    ];
  };

  const updateQuantity = (id, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.parsedPrice * item.quantity), 0);
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setShowInvoicePreview(true);
  };

  const confirmCheckout = async () => {
    setIsProcessing(true);

    try {
      const totalAmount = calculateTotal();
      const totalCost = cart.reduce((acc, curr) => acc + ((curr.costPrice ? parseInt(curr.costPrice.toString().replace(/\D/g, ''), 10) || 0 : 0) * curr.quantity), 0);
      
      const newSale = {
        invoiceNumber: currentOrderNumber,
        orderNumber: currentOrderNumber,
        customer: customerName || 'Walk-in Customer',
        orderType: orderType,
        paymentMethod: paymentMethod,
        items: cart.reduce((acc, curr) => acc + curr.quantity, 0),
        total: `Rs ${totalAmount}`,
        totalCost: totalCost,
        cartDetails: cart.map(c => ({ 
          id: c.id, 
          name: c.name, 
          quantity: c.quantity, 
          price: c.parsedPrice,
          costPrice: c.costPrice ? parseInt(c.costPrice.toString().replace(/\D/g, ''), 10) || 0 : 0
        })),
        date: new Date().toISOString().split('T')[0],
        status: 'Completed',
        createdAt: new Date()
      };
      await addDoc(collection(db, 'invoices'), newSale);
      
      // Update inventory stock levels
      for (const cartItem of cart) {
        try {
          const baseId = cartItem.id.split('-')[0];
          const docRef = doc(db, 'inventory', baseId);
          const inventoryItem = inventory.find(i => i.id === baseId);
          if (inventoryItem && typeof inventoryItem.quantity === 'number') {
            const newQuantity = Math.max(0, inventoryItem.quantity - cartItem.quantity);
            await updateDoc(docRef, { quantity: newQuantity });
          }
        } catch (e) {
          console.error("Failed to update stock for item", cartItem.name, e);
        }
      }
      
      // Increment order number for next transaction
      setCurrentOrderNumber(prev => prev + 1);
      
      setCart([]);
      setCustomerName('');
      setShowInvoicePreview(false);
    } catch (error) {
      console.error("Error during checkout: ", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getCategoryIcon = (category) => {
    // Icons are kept simple and subtle
    if (category === 'All') return <Grid size={16} />;
    if (category === 'More' || category === 'Platters') return <Utensils size={16} />;
    if (category.includes('Deal') || category === 'Deals') return <Tag size={16} />;
    if (category.includes('Pizza')) return <Pizza size={16} />;
    if (category.includes('Burger') || category.includes('Wrap')) return <Sandwich size={16} />;
    if (category.includes('Snack')) return <Cookie size={16} />;
    if (category === 'Drinks') return <CupSoda size={16} />;
    if (category === 'Sauces') return <PlusCircle size={16} />;
    return <Grid size={16} />;
  };

  const getFilteredItems = () => {
    if (mainCategory === 'All') return inventory;

    const allowedSubCategories = categoryHierarchy[mainCategory] || [];
    
    return inventory.filter(item => {
      // If a specific subcategory is selected, only show that
      if (subCategory !== 'All') {
        return item.posCategory === subCategory;
      }
      // Otherwise, show all items that belong to ANY subcategory of the selected main category
      return allowedSubCategories.includes(item.posCategory);
    });
  };

  const filteredItems = getFilteredItems();

  const handleMainCategoryClick = (cat) => {
    setMainCategory(cat);
    setSubCategory('All'); // Reset subcategory when switching main tabs
  };

  return (
    <div className="flex flex-row h-full gap-5 animate-fade-in w-full pb-4 pr-4 bg-white pl-4">
      
      {/* Items Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white pt-1">
        
        {/* Main Categories Navbar (Wraps to multiple lines) */}
        <div className="flex flex-wrap items-center gap-3 mb-3 pb-2 pt-1 px-1">
          {mainCategories.map(cat => (
            <button
              key={cat}
              onClick={() => handleMainCategoryClick(cat)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                mainCategory === cat 
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md shadow-red-500/20' 
                  : 'bg-white text-black border-gray-100 hover:border-red-200 hover:text-[var(--accent-primary)] shadow-sm'
              }`}
            >
              <span style={{ opacity: mainCategory === cat ? 1 : 0.6 }}>
                {getCategoryIcon(cat)}
              </span>
              {cat}
            </button>
          ))}
        </div>

        {/* Top Horizontal Sub Categories */}
        {mainCategory !== 'All' && categoryHierarchy[mainCategory] && (
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mb-4 pb-2 px-1">
            <button
              onClick={() => setSubCategory('All')}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full font-bold text-sm transition-all border ${
                subCategory === 'All'
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md shadow-red-500/20'
                  : 'bg-white text-black border-gray-200 hover:border-red-300 hover:text-[var(--accent-primary)]'
              }`}
            >
              All {mainCategory}
            </button>
            {categoryHierarchy[mainCategory].map(sub => (
              <button
                key={sub}
                onClick={() => setSubCategory(sub)}
                className={`flex-shrink-0 px-6 py-2.5 rounded-full font-bold text-sm transition-all border ${
                  subCategory === sub
                    ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md shadow-red-500/20'
                    : 'bg-white text-black border-gray-200 hover:border-red-300 hover:text-[var(--accent-primary)]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
          {loading ? (
             <div className="flex justify-center items-center h-full text-lg font-bold text-black opacity-50">Loading Menu...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredItems.map(item => {
                const isPizza = item.posCategory && item.posCategory.toLowerCase().includes('pizza') && !item.posCategory.toLowerCase().includes('deal');
                const pizzaSizes = isPizza ? getPizzaSizes(item) : [];
                
                let displayPrice = item.salePrice || item.price || 'N/A';
                
                if (isPizza && pizzaSizes.length > 0) {
                  const minPrice = Math.min(...pizzaSizes.map(s => s.price));
                  const maxPrice = Math.max(...pizzaSizes.map(s => s.price));
                  displayPrice = `${minPrice} - ${maxPrice}`;
                } else if (typeof displayPrice === 'string') {
                  // Format price cleanly (remove existing text like Rs/PKR)
                  const numMatch = displayPrice.match(/\d+/g);
                  if (numMatch) {
                    displayPrice = numMatch.join(' - ');
                  }
                }
                
                const currentSelectedSize = selectedSizes[item.id] || (pizzaSizes.length > 0 ? pizzaSizes[0].label : null);
                
                // Premium Kiosk Formatting
                const renderItemName = (name) => {
                  let title = name;
                  let descParts = [];

                  if (name.includes(':')) {
                    const parts = name.split(':');
                    title = parts[0].trim();
                    descParts = parts.slice(1).join(':').split('|').map(p => p.trim()).filter(Boolean);
                  } else if (name.includes('|')) {
                    const parts = name.split('|').map(p => p.trim()).filter(Boolean);
                    title = parts[0];
                    descParts = parts.slice(1);
                  }

                  return (
                    <div className="w-full flex flex-col items-start text-left">
                      <div className="font-bold text-sm leading-snug mb-1 text-black group-hover:text-[var(--accent-primary)] group-active:text-white transition-colors">
                        {title}
                      </div>
                      {descParts.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-1">
                          {descParts.map((part, i) => (
                            <div key={i} className="text-[11px] font-medium text-gray-500 group-active:text-white/80 transition-colors">
                              {part}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                };

                return (
                  <div 
                    key={item.id} 
                    onClick={() => addToCart(item)}
                    className="flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-[var(--accent-primary)] active:border-[var(--accent-primary)] p-4 h-full cursor-pointer group"
                    style={{ minHeight: '150px' }}
                  >
                    <div className="flex-1 flex flex-col items-start justify-start text-left w-full">
                      {/* Title & Details */}
                      <div className="w-full flex flex-col items-start mb-3">
                        {renderItemName(item.name)}
                      </div>
                      
                      {/* Price, Dropdown & Action */}
                      <div className="w-full flex flex-col mt-auto gap-3">
                        {isPizza && pizzaSizes.length > 0 && (
                          <div className="w-full">
                            <select 
                              value={currentSelectedSize}
                              onChange={(e) => {
                                e.stopPropagation();
                                setSelectedSizes(prev => ({ ...prev, [item.id]: e.target.value }));
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full p-1.5 text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg text-black focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              {pizzaSizes.map(size => (
                                <option key={size.label} value={size.label}>
                                  {size.label} (Rs {size.price})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        <div className="w-full flex justify-between items-center">
                          <span className="font-bold text-base text-black transition-colors">
                            Rs {displayPrice}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                            className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center hover:scale-110 active:bg-red-700 transition-all shadow-sm cursor-pointer"
                          >
                            <Plus size={18} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Cart */}
      <div className="w-[340px] xl:w-[380px] flex flex-col bg-white rounded-3xl shadow-lg border border-gray-200 h-full overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100">
          <h2 className="font-bold text-xl text-black">Current Order</h2>
          <button 
            onClick={() => setCart([])}
            className="text-[var(--accent-primary)] font-bold text-sm flex items-center gap-1.5 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        {/* Customer & Order Details Form */}
        <div className="px-6 py-4 flex flex-col gap-3 border-b border-gray-100 bg-gray-50/50">
          <input 
            type="text" 
            placeholder="Customer Name (Required)" 
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-black focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
          <select 
            value={orderType}
            onChange={(e) => setOrderType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-black focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-white cursor-pointer"
          >
            <option value="Dine In">🍽️ Dine In</option>
            <option value="Takeaway">🛍️ Takeaway</option>
            <option value="Delivery">🛵 Delivery</option>
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 bg-white">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-black opacity-30">
              <ShoppingCart size={64} className="mb-4" />
              <p className="text-xl font-medium">Tap items to add to order</p>
            </div>
          ) : (
            cart.map(item => {
              let cartName = item.name;
              if (cartName.includes(':')) {
                cartName = cartName.split(':')[0].trim();
              } else if (cartName.includes('|')) {
                cartName = cartName.split('|')[0].trim();
              }

              return (
                <div key={item.id} className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-black pr-4 leading-tight">{cartName}</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-[var(--accent-primary)] mt-0.5">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-gray-500">Rs {item.parsedPrice}</span>
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded text-black hover:bg-gray-100 hover:text-[var(--accent-primary)] transition-colors">
                        <Minus size={14} />
                      </button>
                      <span className="font-bold text-sm w-4 text-center text-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded text-black hover:bg-gray-100 hover:text-[var(--accent-primary)] transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-black text-sm text-black w-16 text-right">Rs {item.parsedPrice * item.quantity}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Footer / Checkout */}
        <div className="px-6 py-5 border-t border-gray-100 bg-white shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
          
          <div className="flex justify-between items-center pt-2 border-gray-100 mb-5">
            <span className="font-bold text-lg text-black">Total</span>
            <span className="font-black text-2xl text-[var(--accent-primary)] tracking-tight">Rs {calculateTotal()}</span>
          </div>
          
          <button 
            onClick={handleCheckoutClick}
            disabled={cart.length === 0 || !customerName.trim()}
            className="w-full py-4 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-red-500/20"
            style={{ 
              backgroundColor: (cart.length === 0 || !customerName.trim()) ? '#e5e7eb' : 'var(--accent-primary)', 
              cursor: (cart.length === 0 || !customerName.trim()) ? 'not-allowed' : 'pointer',
              color: (cart.length === 0 || !customerName.trim()) ? '#9ca3af' : '#ffffff'
            }}
          >
            <CreditCard size={18} /> {(!customerName.trim()) ? "Enter Name to Pay" : "Pay Now"}
          </button>
          
          <div className="flex justify-between gap-3 mt-4">
            <button 
              onClick={() => setPaymentMethod('Cash')}
              className={`flex-1 py-2.5 flex flex-col items-center gap-1.5 border rounded-xl text-xs font-bold transition-colors ${paymentMethod === 'Cash' ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'bg-white text-black border-gray-200 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] active:bg-[var(--accent-primary)] active:text-white group'}`}
            >
              <DollarSign size={16} className={paymentMethod === 'Cash' ? 'text-white' : 'group-active:text-white'} /> Cash
            </button>
            <button 
              onClick={() => setPaymentMethod('Online')}
              className={`flex-1 py-2.5 flex flex-col items-center gap-1.5 border rounded-xl text-xs font-bold transition-colors ${paymentMethod === 'Online' ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'bg-white text-black border-gray-200 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] active:bg-[var(--accent-primary)] active:text-white group'}`}
            >
              <Smartphone size={16} className={paymentMethod === 'Online' ? 'text-white' : 'group-active:text-white'} /> Online
            </button>
          </div>
        </div>
      </div>

      {/* Modal removed in favor of dropdowns */}

      {/* Invoice Preview Modal */}
      {showInvoicePreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in" style={{ width: '100%', maxWidth: '450px', maxHeight: '90vh' }}>
            
            {/* Modal Header */}
            <div className="bg-gray-50 p-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-color)' }}>
              <h2 className="text-xl font-bold">Invoice Preview</h2>
              <button onClick={() => setShowInvoicePreview(false)} className="text-secondary hover:text-danger">
                <Trash2 size={24} />
              </button>
            </div>

            {/* Receipt Content */}
            <div className="p-6 overflow-y-auto flex-1 font-mono text-sm" style={{ backgroundColor: '#fff' }}>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-black mb-1">THE PEPPER'S</h1>
                <p className="text-secondary">Flavor & Spice</p>
                <p className="text-secondary mt-2">Order / Invoice #: <span className="font-bold text-black">{currentOrderNumber}</span></p>
                <p className="text-secondary">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-secondary">Customer: {customerName || 'Walk-in Customer'}</p>
              </div>

              <div className="border-t border-b py-3 mb-4 border-dashed" style={{ borderColor: '#ccc' }}>
                <div className="flex justify-between font-bold mb-2">
                  <span>Item</span>
                  <span>Total</span>
                </div>
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between mb-2">
                    <div className="flex-1 pr-4">
                      {item.quantity}x {item.name}
                    </div>
                    <div>Rs {item.parsedPrice * item.quantity}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-xl mt-4">
                <span>TOTAL DUE</span>
                <span>Rs {calculateTotal()}</span>
              </div>
              <div className="text-center mt-8 text-secondary italic">
                Thank you for your visit!
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t flex gap-4 bg-gray-50" style={{ borderColor: 'var(--border-color)' }}>
              <button 
                onClick={() => setShowInvoicePreview(false)}
                className="flex-1 py-3 rounded-xl font-bold text-secondary bg-white border hover:bg-gray-100 transition-colors"
                style={{ borderColor: 'var(--border-color)' }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmCheckout}
                disabled={isProcessing}
                className="flex-1 py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--success)' }}
              >
                {isProcessing ? 'Saving...' : (
                  <>
                    <CheckCircle size={20} /> Confirm & Print
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default POS;
