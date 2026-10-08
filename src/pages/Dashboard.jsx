import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Banknote, 
  ShoppingBag,
  Database
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

const StatCard = ({ title, value, icon, trend, isPositive }) => (
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
      <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-danger'}`}>
        {trend}
      </span>
      <span className="text-sm text-secondary">vs last week</span>
    </div>
  </div>
);

const Dashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would aggregate this data from Firestore
    // For now, we just listen to the sales collection
    const q = query(collection(db, 'sales'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Logic to aggregate sales per day would go here
      setSalesData([]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <button className="btn btn-primary">Generate Report</button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <StatCard 
          title="Total Revenue" 
          value="PKR 0" 
          icon={<Banknote size={20} />} 
          trend="0%" 
          isPositive={true} 
        />
        <StatCard 
          title="Total Orders" 
          value="0" 
          icon={<ShoppingBag size={20} />} 
          trend="0%" 
          isPositive={true} 
        />
        <StatCard 
          title="Active Customers" 
          value="0" 
          icon={<Users size={20} />} 
          trend="0%" 
          isPositive={false} 
        />
        <StatCard 
          title="Growth" 
          value="0%" 
          icon={<TrendingUp size={20} />} 
          trend="0%" 
          isPositive={true} 
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4 text-lg">Revenue Overview</h3>
          <div style={{ height: 300 }}>
            {loading ? (
               <div className="flex justify-center items-center h-full text-secondary">Loading...</div>
            ) : salesData.length === 0 ? (
               <div className="flex flex-col justify-center items-center h-full gap-2">
                 <Database size={32} className="text-muted" />
                 <p className="text-secondary text-sm">No revenue data</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                  <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4 text-lg">Orders by Day</h3>
          <div style={{ height: 300 }}>
            {loading ? (
               <div className="flex justify-center items-center h-full text-secondary">Loading...</div>
            ) : salesData.length === 0 ? (
               <div className="flex flex-col justify-center items-center h-full gap-2">
                 <Database size={32} className="text-muted" />
                 <p className="text-secondary text-sm">No order data</p>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                  <YAxis stroke="var(--text-secondary)" tick={{fill: 'var(--text-secondary)'}} />
                  <Tooltip 
                    cursor={{fill: 'var(--bg-main)'}}
                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="orders" fill="var(--info)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
