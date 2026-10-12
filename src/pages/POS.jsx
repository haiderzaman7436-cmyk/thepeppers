import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Grid, Tag, Pizza, Sandwich, Utensils, Cookie, CupSoda, PlusCircle, Coffee, X, CreditCard, DollarSign, Smartphone, RotateCw, Printer, Eye, ChevronRight } from 'lucide-react';
import ThermalReceiptModal from '../components/ThermalReceiptModal';
import { printThermalReceipt } from '../utils/thermalPrinter';

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
  const [orderSuccessMessage, setOrderSuccessMessage] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({}); // Keeps track of dropdown selections
  const [currentOrderNumber, setCurrentOrderNumber] = useState(1);
  const [mobileTab, setMobileTab] = useState('menu'); // 'menu' | 'cart' for iPad Portrait / small screens
  
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
    'Sauces': ['Sauces']
  };

  const mainCategories = ['All', 'Deals', 'Pizzas', 'Burgers & Wraps', 'Platters', 'Snacks', 'Drinks', 'Sauces'];

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
        let snapshot;
        try {
          const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(15));
          snapshot = await getDocs(q);
        } catch {
          snapshot = await getDocs(query(collection(db, 'invoices'), limit(25)));
        }
        let maxId = 0;
        snapshot.forEach(doc => {
          const data = doc.data();
          const num = data.invoiceNumber || data.orderNumber || 0;
          if (typeof num === 'number' && num > maxId) {
            maxId = num;
          } else if (typeof num === 'string') {
            const parsed = parseInt(num.replace(/\D/g, ''), 10);
            if (!isNaN(parsed) && parsed > maxId) maxId = parsed;
          }
        });
        if (maxId > 0) {
          setCurrentOrderNumber(maxId + 1);
        }
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
    if (cart.length === 0 || isProcessing) return;
    // DIRECT PRINT: Execute checkout and send directly to printer without opening preview modal!
    confirmCheckout();
  };

  const confirmCheckout = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);

    try {
      const totalAmount = calculateTotal();
      const totalCost = cart.reduce((acc, curr) => acc + ((curr.costPrice ? parseInt(curr.costPrice.toString().replace(/\D/g, ''), 10) || 0 : 0) * curr.quantity), 0);
      
      const orderNum = currentOrderNumber;
      const custName = customerName.trim() || 'Walk-in Customer';

      const newSale = {
        invoiceNumber: orderNum,
        orderNumber: orderNum,
        customer: custName,
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

      // Prepare 3-inch receipt data
      const receiptData = {
        orderNumber: orderNum,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customer: custName,
        orderType: orderType,
        paymentMethod: paymentMethod,
        items: cart.map(c => ({
          name: c.name,
          quantity: c.quantity,
          price: c.parsedPrice
        })),
        total: `Rs ${totalAmount}`
      };

      // DIRECT PRINT: Send directly to thermal printer immediately with zero preview modal delay!
      printThermalReceipt(receiptData);

      // Async Firestore invoice write
      const salePromise = addDoc(collection(db, 'invoices'), newSale);

      // Concurrently update inventory stock levels in parallel (super fast)
      const stockUpdates = cart.map(async (cartItem) => {
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
      });

      await Promise.all([salePromise, ...stockUpdates]);

      // Increment order number for next transaction
      setCurrentOrderNumber(prev => prev + 1);
      
      // Clear inputs for next customer instantly
      setCart([]);
      setCustomerName('');
      setShowInvoicePreview(false);

      // Fast visual confirmation toast
      setOrderSuccessMessage(`Order #${orderNum} completed & sent directly to printer!`);
      setTimeout(() => setOrderSuccessMessage(null), 3500);

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
    <div className="flex flex-col lg:flex-row h-full gap-3 lg:gap-4 animate-fade-in w-full pb-2 sm:pb-3 bg-white px-2 sm:px-3 relative overflow-hidden">
      
      {/* Mobile / iPad Portrait View Switcher Tabs (< 1024px) */}
      <div className="flex lg:hidden items-center justify-between bg-gray-100 p-1 rounded-xl mb-1 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('menu')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            mobileTab === 'menu'
              ? 'bg-white text-black shadow-xs'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          🍽️ Menu Items ({filteredItems.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'cart'
              ? 'bg-[var(--accent-primary)] text-white shadow-xs'
              : 'text-gray-600 hover:text-black'
          }`}
        >
          <ShoppingCart size={14} />
          <span>Order ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && <span className="font-extrabold">• Rs {calculateTotal()}</span>}
        </button>
      </div>

      {/* Items Area */}
      <div className={`flex-1 flex-col h-full overflow-hidden bg-white pt-1 min-w-0 ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Main Categories Navbar (Scrollable single line) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar mb-2 pb-1.5 pt-0.5 px-0.5 shrink-0">
          {mainCategories.map(cat => (
            <button
              key={cat}
              onClick={() => handleMainCategoryClick(cat)}
              className={`flex-shrink-0 flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all border ${
                mainCategory === cat 
                  ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md shadow-red-500/20' 
                  : 'bg-white text-black border-gray-100 hover:border-red-200 hover:text-[var(--accent-primary)] shadow-2xs'
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
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar mb-2.5 pb-1 px-0.5 shrink-0">
            <button
              onClick={() => setSubCategory('All')}
              className={`flex-shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all border ${
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
                className={`flex-shrink-0 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap transition-all border ${
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
        <div className="flex-1 overflow-y-auto no-scrollbar pb-24 lg:pb-4">
          {loading ? (
             <div className="flex justify-center items-center h-full text-lg font-bold text-black opacity-50">Loading Menu...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
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

      {/* Floating Bottom Cart Bar on iPad Portrait & Mobile (< 1024px) */}
      {mobileTab === 'menu' && cart.length > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 sm:left-20 right-3 z-40 bg-gray-900 text-white rounded-2xl p-2.5 sm:p-3 shadow-2xl flex items-center justify-between animate-fade-in border border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-xs">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </div>
            <div>
              <div className="text-[11px] text-gray-300 font-medium leading-tight">Current Order</div>
              <div className="text-sm font-black text-white">Rs {calculateTotal()}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <span>View Order & Pay</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Column 3: Cart */}
      <div className={`w-full lg:w-[320px] xl:w-[360px] flex-col bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 h-full overflow-hidden shrink-0 ${mobileTab === 'menu' ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 flex justify-between items-center border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setMobileTab('menu')}
              className="lg:hidden text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              ← Menu
            </button>
            <h2 className="font-bold text-lg sm:text-xl text-black">Current Order</h2>
            <button 
              type="button"
              onClick={() => window.location.reload()}
              className="text-gray-400 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              title="Reload POS page"
            >
              <RotateCw size={15} />
            </button>
          </div>
          <button 
            onClick={() => setCart([])}
            className="text-[var(--accent-primary)] font-bold text-sm flex items-center gap-1.5 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            <Trash2 size={14} /> Clear All
          </button>
        </div>

        {/* Instant Order Success Notification Banner */}
        {orderSuccessMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-green-50 border border-green-200 text-green-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs">
            <CheckCircle size={16} className="text-green-600 shrink-0" />
            <span>{orderSuccessMessage}</span>
          </div>
        )}

        {/* Customer & Order Details Form */}
        <div className="px-6 py-4 flex flex-col gap-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Customer Name (Default: Walk-in)" 
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-black focus:outline-none focus:border-[var(--accent-primary)] transition-colors bg-white"
            />
            <button
              type="button"
              onClick={() => setCustomerName('Walk-in')}
              className="px-3 py-2 bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
              title="Quick Walk-in Customer"
            >
              Walk-in
            </button>
          </div>
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
          
          <div className="flex justify-between items-center pt-2 border-gray-100 mb-4">
            <span className="font-bold text-lg text-black">Total</span>
            <span className="font-black text-2xl text-[var(--accent-primary)] tracking-tight">Rs {calculateTotal()}</span>
          </div>
          
          <button 
            onClick={confirmCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full py-4 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-red-500/20 cursor-pointer"
            style={{ 
              backgroundColor: cart.length === 0 ? '#e5e7eb' : 'var(--accent-primary)', 
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              color: cart.length === 0 ? '#9ca3af' : '#ffffff'
            }}
          >
            <Printer size={18} /> {isProcessing ? "Processing & Printing..." : "Direct Pay & Print"}
          </button>

          {cart.length > 0 && (
            <div className="flex justify-center mt-2">
              <button 
                type="button"
                onClick={() => setShowInvoicePreview(true)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors py-0.5 cursor-pointer"
                title="Optional: Preview slip before printing"
              >
                <Eye size={13} /> <span>Optional: Preview Slip</span>
              </button>
            </div>
          )}
          
          <div className="flex justify-between gap-3 mt-3">
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

      {/* 3-Inch Professional Thermal Receipt Modal (NokoPrint Ready) */}
      <ThermalReceiptModal 
        isOpen={showInvoicePreview}
        onClose={() => setShowInvoicePreview(false)}
        data={{
          orderNumber: currentOrderNumber,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          customer: customerName || 'Walk-in Customer',
          orderType: orderType,
          paymentMethod: paymentMethod,
          items: cart.map(c => ({
            name: c.name,
            quantity: c.quantity,
            price: c.parsedPrice
          })),
          total: `Rs ${calculateTotal()}`
        }}
        showConfirmButton={true}
        confirmButtonText="Confirm & Print"
        onConfirm={confirmCheckout}
        isProcessing={isProcessing}
      />

    </div>
  );
};

export default POS;
