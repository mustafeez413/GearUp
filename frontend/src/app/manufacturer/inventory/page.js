"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/api';
import Skeleton from '@/components/common/Skeleton';
import { useAuth } from '@/context/AuthContext';
import useReadOnlyMode from '@/hooks/useReadOnlyMode';
import { useRouter } from 'next/navigation';
import { isLowStock, isOutOfStock, isHealthyStock } from '@/utils/inventory';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import {
    Package, Banknote, AlertCircle, HeartPulse, TrendingUp, RefreshCw,
    ShoppingCart, ArrowRight, Eye, ShieldAlert, CheckCircle2, Activity, Sparkles
} from 'lucide-react';
import { isSellerOnOrder, resolveUserId } from '@/lib/dashboardAnalytics';
import { formatPKR } from '@/lib/financeUtils';

const COLORS = ['#00A878', '#3B82F6', '#F59E0B', '#F43F5E', '#8B5CF6'];

export default function InventoryOverviewPage() {
    const { user } = useAuth();
    const { isReadOnlyMode } = useReadOnlyMode();
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const uid = resolveUserId(user);
            const productsUrl = uid
                ? `${getApiBaseUrl()}/api/products?manufacturer=${uid}&scope=inventory`
                : `${getApiBaseUrl()}/api/products`;

            const productsRes = await fetch(productsUrl, { headers });
            const productsData = await productsRes.json();

            const ordersRes = await fetch(`${getApiBaseUrl()}/api/orders`, { headers });
            const ordersData = await ordersRes.json();

            if (productsData.success) {
                setProducts(productsData.data || []);
            }
            if (ordersData.success) {
                const mySales = ordersData.data.filter((o) => isSellerOnOrder(o, uid));
                setOrders(mySales);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [user?.id, user?._id]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [fetchData, user]);

    const handleSync = async () => {
        setSyncing(true);
        await fetchData();
        setTimeout(() => setSyncing(false), 600);
    };

    // Derived Metrics
    const {
        totalProducts,
        inventoryValue,
        lowStockProducts,
        criticalStockProducts,
        healthyStockProducts,
        categoryData,
        fastMovingProducts,
        outOfStockProducts
    } = useMemo(() => {
        const totalProducts = products.length;
        let inventoryValue = 0;
        let lowStockCount = 0;
        let criticalStockCount = 0;
        let healthyStockCount = 0;
        let outOfStockCount = 0;
        const categoryCount = {};

        // Calculate sales velocity from recent orders
        const productSales = {};
        orders.forEach(o => {
            if (new Date(o.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) { // Last 30 days
                (o.items || []).forEach(item => {
                    const pid = item.product?._id || item.product;
                    if (!productSales[pid]) productSales[pid] = 0;
                    productSales[pid] += (item.quantity || 1);
                });
            }
        });

        products.forEach(p => {
            const stock = p.stock || 0;
            inventoryValue += (stock * (p.pricePerBulkUnit || 0));

            if (stock === 0) outOfStockCount++;
            else if (stock < 10) criticalStockCount++;
            else if (stock < 30) lowStockCount++;
            else healthyStockCount++;

            const cat = p.category || 'Other';
            if (!categoryCount[cat]) categoryCount[cat] = 0;
            categoryCount[cat] += stock;
        });

        // Format category data for chart
        const categoryData = Object.entries(categoryCount)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Fast moving products (sold more than 50 units in last 30 days)
        const fastMovingProducts = Object.values(productSales).filter(qty => qty >= 50).length;

        const outOfStockItems = products.filter(isOutOfStock);
        const lowStockItems = products.filter(isLowStock);

        return {
            totalProducts,
            inventoryValue,
            lowStockProducts: lowStockItems,
            criticalStockProducts: outOfStockItems,
            healthyStockProducts: products.filter(isHealthyStock),
            categoryData,
            fastMovingProducts,
            outOfStockProducts: outOfStockItems
        };
    }, [products, orders]);

    const inventoryHealthPercentage = totalProducts > 0 
        ? Math.round((healthyStockProducts.length / totalProducts) * 100) 
        : 0;

    const healthData = [
        { name: 'Healthy', value: healthyStockProducts.length },
        { name: 'Low Stock', value: lowStockProducts.length },
        { name: 'Critical/Out', value: outOfStockProducts.length }
    ];

    // Business Insights Logic
    const getInsights = () => {
        const insights = [];
        if (criticalStockProducts.length > 0) {
            insights.push({
                type: 'critical',
                message: `${criticalStockProducts.length} products are critically low or out of stock. Immediate restock recommended to prevent revenue loss.`,
            });
        }
        if (fastMovingProducts > 0) {
            insights.push({
                type: 'success',
                message: `${fastMovingProducts} products are moving fast this month. Ensure raw materials are procured to sustain demand.`
            });
        }
        if (lowStockProducts.length > 0) {
            insights.push({
                type: 'warning',
                message: `${lowStockProducts.length} items are running low. Consider planning your next production run soon.`
            });
        }
        if (inventoryHealthPercentage > 80) {
            insights.push({
                type: 'healthy',
                message: `Inventory is healthy (${inventoryHealthPercentage}% optimized). Stock levels are well balanced against current demand.`
            });
        }
        return insights;
    };

    const insights = getInsights();

    if (loading) {
        return (
                <div className="p-6"><Skeleton variant="chart" /></div>
        );
    }

    return (
            <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
                
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="font-heading text-3xl font-black text-[#0F172A] tracking-tight">Inventory Overview</h1>
                        <p className="text-slate-500 font-medium text-sm mt-1 max-w-xl leading-relaxed">
                            Track stock health, inventory performance, and warehouse activity in real time.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleSync}
                            disabled={syncing}
                            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm outline-none"
                        >
                            <RefreshCw size={16} className={`${syncing ? 'animate-spin text-[#00A878]' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Inventory'}
                        </button>
                        {!isReadOnlyMode && (
                        <button 
                            onClick={() => router.push('/manufacturer/products/new')}
                            className="flex items-center gap-2 bg-[#00A878] hover:bg-[#0DBB85] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-[0_4px_12px_-4px_rgba(0,200,117,0.4)] hover:shadow-[0_8px_16px_-6px_rgba(0,200,117,0.5)] hover:-translate-y-0.5 outline-none"
                        >
                            <ShoppingCart size={16} /> Replenish Stock
                        </button>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    {[
                        { label: 'Total Products', value: totalProducts, icon: Package, color: 'text-purple-600', bg: 'bg-purple-50', link: '/manufacturer/products' },
                        { label: 'Inventory Value', value: formatPKR(inventoryValue), icon: Banknote, color: 'text-blue-600', bg: 'bg-blue-50', link: '/manufacturer/analytics/profit' },
                        { label: 'Low Stock Alerts', value: lowStockProducts.length + criticalStockProducts.length, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', link: '#low-stock' },
                        { label: 'Health Score', value: `${inventoryHealthPercentage}%`, icon: HeartPulse, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '#health' },
                        { label: 'Fast Moving', value: fastMovingProducts, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/manufacturer/analytics/top-products' },
                        { label: 'Out of Stock', value: outOfStockProducts.length, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', link: '#low-stock' }
                    ].map((kpi, i) => (
                        <div 
                            key={i} 
                            onClick={() => {
                                if (kpi.link.startsWith('#')) {
                                    document.querySelector(kpi.link)?.scrollIntoView({ behavior: 'smooth' });
                                } else {
                                    router.push(kpi.link);
                                }
                            }}
                            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${kpi.bg} group-hover:scale-110 transition-transform`}>
                                    <kpi.icon size={18} className={kpi.color} />
                                </div>
                                <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0" />
                            </div>
                            <div>
                                <p className="font-heading text-[22px] font-black text-slate-800 tracking-tight leading-none mb-1 group-hover:text-[#00A878] transition-colors">{kpi.value}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Analytics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    
                    {/* Category Allocation */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[420px]">
                        <h3 className="font-heading text-lg font-bold text-slate-800 mb-6">Stock Allocation by Category</h3>
                        <div className="flex-1 w-full min-h-0">
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                                        <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#334155', fontSize: 12, fontWeight: 600}} width={100} />
                                        <RechartsTooltip 
                                            cursor={{fill: '#F8FAFC'}}
                                            contentStyle={{borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                                            itemStyle={{color: '#0F172A', fontWeight: 600}}
                                        />
                                        <Bar dataKey="value" fill="#00A878" radius={[0, 4, 4, 0]} maxBarSize={32}>
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 font-medium">No category data available</div>
                            )}
                        </div>
                    </div>

                    {/* Inventory Health Overview */}
                    <div id="health" className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[420px]">
                        <h3 className="font-heading text-lg font-bold text-slate-800 mb-6">Inventory Health Overview</h3>
                        <div className="flex-1 w-full flex items-center justify-center min-h-0 relative">
                            {totalProducts > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={healthData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={90}
                                                outerRadius={130}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill="#00A878" />
                                                <Cell fill="#F59E0B" />
                                                <Cell fill="#F43F5E" />
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', fontWeight: 600, color: '#475569'}} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-18px]">
                                        <p className="font-heading text-4xl font-black text-slate-800 leading-none">{inventoryHealthPercentage}%</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Healthy</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-slate-400 font-medium">No inventory data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Inventory Insights */}
                <div className="bg-[#0F172A] rounded-3xl p-8 mb-8 relative overflow-hidden shadow-xl border border-slate-800">
                    <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-[#00A878]/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <h3 className="font-heading text-xl font-bold text-white mb-6 flex items-center gap-2 relative z-10">
                        <Sparkles size={20} className="text-[#00A878]" /> Inventory Insights
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        {insights.length > 0 ? insights.map((insight, idx) => (
                            <div key={idx} className="bg-white/10 backdrop-blur-sm border border-white/10 p-4 rounded-2xl flex items-start gap-4">
                                <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                                    ${insight.type === 'critical' ? 'bg-rose-500/20 text-rose-400' : 
                                      insight.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 
                                      insight.type === 'healthy' ? 'bg-emerald-500/20 text-emerald-400' : 
                                      'bg-blue-500/20 text-blue-400'}`}>
                                    {insight.type === 'critical' ? <ShieldAlert size={16} /> :
                                     insight.type === 'warning' ? <AlertCircle size={16} /> :
                                     insight.type === 'healthy' ? <CheckCircle2 size={16} /> :
                                     <TrendingUp size={16} />}
                                </div>
                                <div>
                                    <p className="text-white text-sm font-medium leading-relaxed">{insight.message}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-slate-400 text-sm">Gathering actionable business insights...</div>
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts & Recent Activity Grid */}
                <div id="low-stock" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    {/* Low Stock Table */}
                    <div className="xl:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-heading text-lg font-bold text-slate-800 flex items-center gap-2">
                                <AlertCircle size={18} className="text-rose-500" /> Action Required: Low Stock
                            </h3>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                        <th className="px-6 py-4">Product Name</th>
                                        <th className="px-6 py-4">Category</th>
                                        <th className="px-6 py-4 text-center">Remaining Stock</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[...criticalStockProducts, ...lowStockProducts].slice(0, 8).map((product) => (
                                        <tr key={product._id} className="hover:bg-slate-50/50 transition-colors text-sm font-medium text-slate-700">
                                            <td className="px-6 py-4 max-w-[200px] truncate" title={product.name}>{product.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{product.category || 'N/A'}</td>
                                            <td className="px-6 py-4 text-center font-bold text-slate-900">{product.stock || 0}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                                                    (product.stock === 0) ? 'bg-rose-100 text-rose-700' :
                                                    (product.stock < 10) ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {(product.stock === 0) ? 'Out of Stock' : (product.stock < 10) ? 'Critical' : 'Low'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => router.push(`/manufacturer/products/edit/${product._id}`)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                                                >
                                                    Update
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {criticalStockProducts.length === 0 && lowStockProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center text-slate-400">
                                                    <CheckCircle2 size={32} className="mb-2 text-emerald-400" />
                                                    <p className="font-bold text-sm text-slate-600">All stock levels are healthy.</p>
                                                    <p className="text-xs">No immediate restocking required.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Recent Inventory Activity */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col">
                        <h3 className="font-heading text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Activity size={18} className="text-blue-500" /> Recent Activity
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                            {products.slice(0, 6).map((product, idx) => (
                                <div key={product._id} className="flex gap-4 relative">
                                    {idx !== 5 && <div className="absolute left-4 top-8 bottom-[-24px] w-0.5 bg-slate-100"></div>}
                                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 z-10">
                                        <Package size={14} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">
                                            Inventory logged for <span className="font-bold">{product.name}</span>
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Stock: {product.stock}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(product.createdAt || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div className="text-sm text-slate-500 text-center py-10">No recent activity found.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
    );
}
