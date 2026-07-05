"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Plus, MoreVertical, ArrowUpRight, Eye, FileText, Edit, XCircle, Activity, ChevronLeft, ChevronRight, CheckCircle2, Package, Clock } from 'lucide-react';
import EmptyState from '../common/EmptyState';
import { formatPKR } from '@/lib/financeUtils';
import { useRouter } from 'next/navigation';

const OrdersTable = ({
  orders = [],
  loading = false,
  onAddCatalogClick,
  variant = 'sales',
  viewAllHref = '/manufacturer/orders',
  purchaseViewAllHref = '/wholesaler/orders',
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  partyLabel,
  partySubLabel
}) => {
  const isPurchases = variant === 'purchases';
  const partyColumnLabel = partyLabel || (isPurchases ? 'Supplier' : 'Buyer Name');
  const cardTitle = isPurchases ? 'Recent Purchases' : 'Recent Bulk Orders';
  const cardSubtitle = isPurchases
    ? 'Your latest procurement orders and delivery status'
    : 'Active bulk order acquisitions and dealer contracts';
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 3;
  const totalPages = Math.ceil(orders.length / pageSize);
  const paginatedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate avatar initials from buyer name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  };

  const getAvatarGradient = (idx) => {
    const gradients = [
      'bg-gradient-to-br from-emerald-400 to-emerald-600',
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-amber-400 to-amber-600',
      'bg-gradient-to-br from-rose-400 to-rose-600',
      'bg-gradient-to-br from-cyan-400 to-cyan-600',
    ];
    return gradients[idx % gradients.length];
  };

  const renderBadge = (status) => {
    let config = { bg: 'bg-[#FFF7E6]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]', icon: Clock };
    
    switch (status?.toLowerCase()) {
      case 'processing':
        config = { bg: 'bg-[#EEF2FF]', text: 'text-[#4F46E5]', border: 'border-[#4F46E5]', icon: Activity };
        break;
      case 'delivered':
      case 'completed':
        config = { bg: 'bg-[#E8FFF5]', text: 'text-[#00A878]', border: 'border-[#00A878]', icon: CheckCircle2 };
        break;
      case 'cancelled':
        config = { bg: 'bg-[#FEF2F2]', text: 'text-[#EF4444]', border: 'border-[#EF4444]', icon: XCircle };
        break;
      default:
        config = { bg: 'bg-[#FFF7E6]', text: 'text-[#F59E0B]', border: 'border-[#F59E0B]', icon: Clock };
    }

    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 rounded-full border ${config.bg} ${config.text} ${config.border}`} style={{ height: '36px' }}>
        <Icon size={14} className="stroke-[2.5]" />
        <span className="text-[12px] font-semibold uppercase tracking-wider">{status || 'PENDING'}</span>
      </div>
    );
  };

  return (
    <div
      className="w-full bg-white flex flex-col"
      style={{
        borderRadius: '20px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
        padding: '24px',
      }}
    >
      {/* Premium Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#E8FFF5] text-[#00A878]">
            {isPurchases ? <Package size={24} className="stroke-[2.5]" /> : <ShoppingCart size={24} className="stroke-[2.5]" />}
          </div>
          <div>
            <h3 className="text-[20px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
              {cardTitle}
              {loading && (
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse inline-block" />
              )}
            </h3>
            <p className="text-[14px] text-[#64748B] mt-0.5 font-medium">{cardSubtitle}</p>
          </div>
        </div>
        <Link
          href={isPurchases ? purchaseViewAllHref : viewAllHref}
          className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-[14px] font-bold tracking-wide transition-all duration-250 border border-[#00A878] text-[#00A878] hover:bg-[#00A878] hover:text-white whitespace-nowrap"
        >
          <span>View all orders</span>
          <ArrowUpRight size={16} className="stroke-[2.5]" />
        </Link>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto w-full scrollbar-thin rounded-xl border border-[#F1F5F9]">
        {orders.length === 0 ? (
          <div className="py-8">
              <EmptyState
                title={emptyTitle || (isPurchases ? 'No purchases yet' : 'No Active Bulk Orders')}
                description={emptyDescription || (isPurchases ? 'Browse the marketplace to place your first bulk order.' : 'List additional wholesale product catalog quantities to secure buyer orders.')}
                icon={ShoppingCart}
                actionLabel={emptyActionLabel || (isPurchases ? 'Browse Marketplace' : 'Add Catalog Item')}
                onActionClick={onAddCatalogClick}
                actionIcon={Plus}
              />
          </div>
        ) : (
          <table className="min-w-full table-auto text-left relative border-collapse">
            <thead className="bg-[#F8FAFC] sticky top-0 z-10 border-b border-[#E5E7EB]">
              <tr>
                <th className="px-6 py-5 font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Order ID
                </th>
                <th className="px-6 py-5 font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  {partyColumnLabel}
                </th>
                <th className="hidden md:table-cell px-6 py-5 font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Products
                </th>
                <th className="px-6 py-5 font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Amount
                </th>
                <th className="px-6 py-5 font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Status
                </th>
                <th className="hidden lg:table-cell px-6 py-5 font-semibold text-[11px] uppercase tracking-[0.5px] text-[#64748B]">
                  Order Date
                </th>
                <th className="px-6 py-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {paginatedOrders.map((order, idx) => {
                const formattedDate = order.date
                  ? new Date(order.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  : '30 May 2026';

                return (
                  <tr
                    key={order.id}
                    className="group cursor-pointer transition-all duration-200 hover:bg-[#F8FFFC]"
                    style={{ height: '80px' }}
                  >
                    {/* Order ID */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-[13px] text-[#64748B] font-semibold uppercase group-hover:text-[#00A878] transition-colors duration-200">
                        #{order.id}
                      </span>
                    </td>
                    
                    {/* Buyer Name with avatar */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0 shadow-sm ${getAvatarGradient(idx)}`}>
                          {getInitials(isPurchases ? (order.supplier || order.buyer) : order.buyer)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-[#0F172A]">
                            {isPurchases ? (order.supplier || order.buyer) : order.buyer}
                            </span>
                            <span className="text-[11px] font-medium text-[#64748B]">
                                {partySubLabel || (isPurchases ? 'Manufacturer' : 'Wholesaler')}
                            </span>
                        </div>
                      </div>
                    </td>

                    {/* Products Description */}
                    <td className="hidden md:table-cell px-6 py-4 text-[#64748B] text-[13px] font-medium">
                      {order.items}
                    </td>

                    {/* Amount formatted as PKR */}
                    <td className="px-6 py-4">
                      <span className="text-[15px] font-bold text-[#0F172A] tracking-tight">
                        {formatPKR(order.amount)}
                      </span>
                    </td>

                    {/* Badge */}
                    <td className="px-6 py-4">
                      {renderBadge(order.status)}
                    </td>

                    {/* Date */}
                    <td className="hidden lg:table-cell px-6 py-4 text-[#64748B] text-[13px] font-medium">
                      {formattedDate}
                    </td>

                    {/* Action trigger */}
                    <td className="px-6 py-4 text-right relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdownId(openDropdownId === order.id ? null : order.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-all duration-200 ml-auto"
                      >
                        <MoreVertical size={20} className="stroke-[2.5]" />
                      </button>

                      {openDropdownId === order.id && (
                        <div 
                          ref={dropdownRef}
                          className="absolute right-6 top-16 w-52 bg-white border border-slate-200/80 shadow-2xl rounded-2xl z-[99] py-2 animate-in fade-in zoom-in-95 duration-200"
                          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)' }}
                        >
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`${isPurchases ? purchaseViewAllHref : '/manufacturer/orders'}/${order.fullId || order.id}`); }}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-[#E8FFF5] hover:text-[#00A878] flex items-center gap-2.5 transition-colors rounded-lg mx-1"
                            style={{ width: 'calc(100% - 8px)' }}
                          >
                            <Eye size={16} /> View Details
                          </button>
                          {!isPurchases && (
                          <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/manufacturer/orders/${order.fullId || order.id}`); }}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2.5 transition-colors rounded-lg mx-1"
                            style={{ width: 'calc(100% - 8px)' }}
                          >
                            <FileText size={16} /> View Invoice
                          </button>
                          <div className="h-px bg-slate-100 my-1.5 mx-3" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/manufacturer/orders/${order.fullId || order.id}`); }}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors rounded-lg mx-1"
                            style={{ width: 'calc(100% - 8px)' }}
                          >
                            <Activity size={16} /> Status Updates
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/manufacturer/orders/${order.fullId || order.id}`); }}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-amber-600 hover:bg-amber-50 flex items-center gap-2.5 transition-colors rounded-lg mx-1"
                            style={{ width: 'calc(100% - 8px)' }}
                          >
                            <Edit size={16} /> Edit Order
                          </button>
                          </>
                          )}
                          <div className="h-px bg-slate-100 my-1.5 mx-3" />
                          <button 
                            onClick={(e) => { e.stopPropagation(); alert('Cancellation must be processed from order details page.'); }}
                            className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors rounded-lg mx-1"
                            style={{ width: 'calc(100% - 8px)' }}
                          >
                            <XCircle size={16} /> Cancel Order
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Table Footer */}
      {orders.length > 0 && (
        <div className="flex items-center justify-between mt-6 pt-2">
            <div className="flex items-center gap-2 text-[#64748B]">
                <Package size={16} className="stroke-[2.5]" />
                <span className="text-[13px] font-medium">Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, orders.length)} of {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
            </div>
            
            <div className="flex items-center gap-1">
                  <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronLeft size={18} />
                  </button>
                  
                  {/* Page Numbers */}
                  {[...Array(totalPages)].map((_, i) => (
                      <button 
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-semibold transition-colors ${
                              currentPage === i + 1 
                              ? 'bg-[#00A878] text-white' 
                              : 'text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                          }`}
                      >
                          {i + 1}
                      </button>
                  ))}
                  
                  <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronRight size={18} />
                  </button>
              </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(OrdersTable);
