import React, { useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Database } from 'lucide-react';

const inventoryItems = [
  // PLATERS
  { name: 'Platter 1: 1 Small Pizza | 1 Patty Burger | 1 Fries | 3 Wings | 2 NR Drink', category: 'Platers', quantity: 100, costPrice: 0, salePrice: 'Rs 899', status: 'Available' },
  { name: 'Platter 2: 1 Zinger Burger | 1 Wrap | 1 Fries | 2 NR Drink', category: 'Platers', quantity: 100, costPrice: 0, salePrice: 'Rs 999', status: 'Available' },
  { name: 'Platter 3: 1 Loaded Fries | 1 Grill Wrap | 2 Zinger Burger | 1.5 Liter Drink', category: 'Platers', quantity: 100, costPrice: 0, salePrice: 'Rs 1599', status: 'Available' },
  { name: 'Platter 4: 1 Medium Pizza | 1 Zinger Burger | 1 Zinger Loaded Fries | Nuggets | 1 Liter Drink', category: 'Platers', quantity: 100, costPrice: 0, salePrice: 'Rs 1799', status: 'Available' },
  { name: 'Platter 5: 1 Large Pizza | 2 Shawarma | 6 Wings | Fries | 1.5 Ltr Drink', category: 'Platers', quantity: 100, costPrice: 0, salePrice: 'Rs 1999', status: 'Available' },
  { name: 'Platter 6: 1 Large Pizza | 1 Cheesey Loaded Fries | 1 Wrap | 2 Zinger Burger | 1.5 Ltr Drink', category: 'Platers', quantity: 100, costPrice: 0, salePrice: 'Rs 2699', status: 'Available' },
  { name: 'Platter 7: E.Large Pizza | 2 Shawarma | 2 Zinger Burger | Fries | 6pcs Wings | 1.5 Liter Drink (2)', category: 'Platers', quantity: 100, costPrice: 0, salePrice: 'Rs 3299', status: 'Available' },

  // STUDENT DEAL
  { name: 'Student Deal 1: 1 Patty Burger | 1 Fries | 1 NR Drink', category: 'Student Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 299', status: 'Available' },
  { name: 'Student Deal 2: 1 Chicken Chapli Burger | 1 Fries | 1 NR Drink', category: 'Student Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 299', status: 'Available' },
  { name: 'Student Deal 3: 2 Chicken Shami Burger | 1 Fries | 2 NR Drink', category: 'Student Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 450', status: 'Available' },

  // ZINGER DEAL
  { name: 'Zinger Deal 1: 1 Zinger Burger | 1 Fries | 1 NR Drink', category: 'Zinger Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 450', status: 'Available' },
  { name: 'Zinger Deal 2: 2 Zinger Burger | 1 Fries | 2 NR Drink', category: 'Zinger Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 850', status: 'Available' },
  { name: 'Zinger Deal 3: 4 Zinger Burger | 1 Fries | 1.5 Liter Drink', category: 'Zinger Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 1599', status: 'Available' },

  // SHAWARMA DEAL
  { name: 'Shawarma Deal 1: 2 Shawarma | 3 Chicken Wings | 2 NR Drink', category: 'Shawarma Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 850', status: 'Available' },
  { name: 'Shawarma Deal 2: 4 Shawarma | 6 Chicken Wings | 1.5 Liter Drink', category: 'Shawarma Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 1599', status: 'Available' },

  // PIZZA DEAL
  { name: 'Pizza Deal 1: 2 Medium Pizza | 1 Liter Drink', category: 'Pizza Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 1499', status: 'Available' },
  { name: 'Pizza Deal 2: 2 Large Pizza | 1.5 Liter Drink', category: 'Pizza Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 1999', status: 'Available' },
  { name: 'Pizza Deal 3: 2 Extra Large Pizza | 2 Liter Drink', category: 'Pizza Deal', quantity: 100, costPrice: 0, salePrice: 'Rs 2799', status: 'Available' },

  // PIZZAS (Base prices shown, sizes are picked in POS)
  { name: 'Chicken Tikka Pizza', category: 'Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 400', status: 'Available' },
  { name: 'Fajita Pizza', category: 'Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 400', status: 'Available' },
  { name: 'Hot & Spicy Pizza', category: 'Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 400', status: 'Available' },
  { name: 'Supreme Pizza', category: 'Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 400', status: 'Available' },

  // PREMIUM PIZZAS (Base prices shown)
  { name: 'Creamy Pizza', category: 'Premium Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 500', status: 'Available' },
  { name: 'Malai Boti Pizza', category: 'Premium Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 500', status: 'Available' },
  { name: 'Kababesh Pizza', category: 'Premium Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 500', status: 'Available' },
  { name: 'Crown Crust Pizza', category: 'Premium Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 500', status: 'Available' },

  // PLATINUM PIZZAS (Base prices shown)
  { name: 'Chicken Stuffed Pizza', category: 'Platinum Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 700', status: 'Available' },
  { name: 'Kabab Stuffed Pizza', category: 'Platinum Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 700', status: 'Available' },
  { name: 'Cheese Stuffed Pizza', category: 'Platinum Pizzas', quantity: 100, costPrice: 0, salePrice: 'Rs 700', status: 'Available' },

  // DRINKS
  { name: 'NR Drink', category: 'Drinks', quantity: 100, costPrice: 0, salePrice: 'Rs 80', status: 'Available' },
  { name: 'Liter Drink', category: 'Drinks', quantity: 100, costPrice: 0, salePrice: 'Rs 160', status: 'Available' },
  { name: '1.5 Liter Drink', category: 'Drinks', quantity: 100, costPrice: 0, salePrice: 'Rs 200', status: 'Available' },
  { name: 'Water Small', category: 'Drinks', quantity: 100, costPrice: 0, salePrice: 'Rs 60', status: 'Available' },
  { name: 'Water Large', category: 'Drinks', quantity: 100, costPrice: 0, salePrice: 'Rs 130', status: 'Available' },

  // SAUCES
  { name: 'Thousand EyeLand Sauce', category: 'Sauces', quantity: 100, costPrice: 0, salePrice: 'Rs 50', status: 'Available' },
  { name: 'Garlic Mayo Sauce', category: 'Sauces', quantity: 100, costPrice: 0, salePrice: 'Rs 50', status: 'Available' },
  { name: 'Chipotle Sauce', category: 'Sauces', quantity: 100, costPrice: 0, salePrice: 'Rs 50', status: 'Available' },
  { name: 'Extra Cheese Slice', category: 'Sauces', quantity: 100, costPrice: 0, salePrice: 'Rs 50', status: 'Available' },

  // BURGERS (Budget Bites)
  { name: 'Chicken Shami Burger', category: 'Budget Bites', quantity: 100, costPrice: 0, salePrice: 'Rs 170', status: 'Available' },
  { name: 'Chicken Pati Burger', category: 'Budget Bites', quantity: 100, costPrice: 0, salePrice: 'Rs 250', status: 'Available' },
  { name: 'Chicken Chapli Burger', category: 'Budget Bites', quantity: 100, costPrice: 0, salePrice: 'Rs 250', status: 'Available' },
  { name: 'Classic Zinger Burger', category: 'Budget Bites', quantity: 100, costPrice: 0, salePrice: 'Rs 350', status: 'Available' },

  // BURGERS (Premium Burgers)
  { name: 'Supreme Zinger Burger', category: 'Premium Burgers', quantity: 100, costPrice: 0, salePrice: 'Rs 450', status: 'Available' },
  { name: 'Tender Fillet Burger', category: 'Premium Burgers', quantity: 100, costPrice: 0, salePrice: 'Rs 450', status: 'Available' },
  { name: 'Charcoal Grill Burger', category: 'Premium Burgers', quantity: 100, costPrice: 0, salePrice: 'Rs 450', status: 'Available' },
  { name: 'Mighty Zinger Burger', category: 'Premium Burgers', quantity: 100, costPrice: 0, salePrice: 'Rs 700', status: 'Available' },

  // WRAPS
  { name: 'Crunchy Zinger Wrap', category: 'Wraps & Shawarma', quantity: 100, costPrice: 0, salePrice: 'Rs 450', status: 'Available' },
  { name: 'Arabic Chicken Wrap', category: 'Wraps & Shawarma', quantity: 100, costPrice: 0, salePrice: 'Rs 450', status: 'Available' },
  { name: 'Spicy Grill Wrap', category: 'Wraps & Shawarma', quantity: 100, costPrice: 0, salePrice: 'Rs 450', status: 'Available' },

  // SHAWARMA
  { name: 'Chicken Shawarma', category: 'Wraps & Shawarma', quantity: 100, costPrice: 0, salePrice: 'Rs 300', status: 'Available' },
  { name: 'Zinger Shawarma', category: 'Wraps & Shawarma', quantity: 100, costPrice: 0, salePrice: 'Rs 300', status: 'Available' },
  { name: 'Open Shawarma', category: 'Wraps & Shawarma', quantity: 100, costPrice: 0, salePrice: 'Rs 500', status: 'Available' },

  // SNACKS & STAKES
  { name: 'Fries (Medium)', category: 'Snacks & Stakes', quantity: 100, costPrice: 0, salePrice: 'Rs 130', status: 'Available' },
  { name: 'Fries (Large)', category: 'Snacks & Stakes', quantity: 100, costPrice: 0, salePrice: 'Rs 250', status: 'Available' },
  { name: 'Zinger Loaded Fries', category: 'Snacks & Stakes', quantity: 100, costPrice: 0, salePrice: 'Rs 449', status: 'Available' },
  { name: 'Fillet Loaded Fries', category: 'Snacks & Stakes', quantity: 100, costPrice: 0, salePrice: 'Rs 449', status: 'Available' },
  { name: 'Cheese Loaded Fries', category: 'Snacks & Stakes', quantity: 100, costPrice: 0, salePrice: 'Rs 549', status: 'Available' },
  { name: 'Crispy Wings (6Pcs)', category: 'Snacks & Stakes', quantity: 100, costPrice: 0, salePrice: 'Rs 399', status: 'Available' },
  { name: 'Nuggets (6Pcs)', category: 'Snacks & Stakes', quantity: 100, costPrice: 0, salePrice: 'Rs 300', status: 'Available' },
  { name: 'Crispy Strips (4Pcs)', category: 'Snacks & Stakes', quantity: 100, costPrice: 0, salePrice: 'Rs 399', status: 'Available' }
];

const SeedMenu = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const handleSeed = async () => {
    if (!window.confirm("This will WIPE all existing inventory items and re-seed from scratch. Are you sure?")) {
      return;
    }
    
    setLoading(true);
    setErrorMessage(null);
    try {
      const inventoryRef = collection(db, 'inventory');
      
      // 1. Delete all existing items
      const querySnapshot = await getDocs(inventoryRef);
      const deletePromises = [];
      querySnapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, 'inventory', document.id)));
      });
      await Promise.all(deletePromises);
      
      // 2. Add new clean items
      for (const item of inventoryItems) {
        await addDoc(inventoryRef, { ...item, createdAt: new Date() });
      }
      setSuccess(true);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Database Seeder</h1>
      <p>Click below to WIPE the current inventory and securely seed the deduplicated menu into Firestore.</p>
      <br/>
      <button 
        className="btn btn-primary" 
        onClick={handleSeed} 
        disabled={loading || success}
        style={{ backgroundColor: success ? 'green' : 'blue', color: 'white', padding: '1rem', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        {loading ? 'Wiping & Seeding...' : success ? 'Seeded Successfully!' : 'Clear & Reseed Database'}
      </button>
      {errorMessage && (
        <div style={{ marginTop: '1rem', color: 'red', fontWeight: 'bold' }}>
          Error: {errorMessage}
        </div>
      )}
    </div>
  );
};

export default SeedMenu;

