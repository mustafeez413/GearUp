"use client";

import React from 'react';
import { X, Printer, Building, CheckCircle2 } from 'lucide-react';
import { formatPKR } from '@/lib/financeUtils';
import { formatMoqDisplay } from '@/utils/moq';

const InvoiceModal = ({ order, viewMode = 'buyer', sellerId, onClose }) => {
    if (!order) return null;

    const isSellerMode = viewMode === 'seller' && sellerId;
    const currentUserId = sellerId?.toString();

    const filteredItems = order.items.filter(item => {
        if (!isSellerMode) return true;
        const itemSellerId = (item.seller?._id || item.seller)?.toString();
        return itemSellerId === currentUserId;
    });

    const subtotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const commissionRate = Number(order.commissionRate) || 0;
    const platformFee = isSellerMode
        ? filteredItems.reduce((sum, item) => {
            const itemTotal = item.price * item.quantity;
            return sum + (itemTotal * (commissionRate / 100));
        }, 0)
        : (order.platformCommissionTotal || 0);
    const grandTotal = isSellerMode ? subtotal : (order.totalAmount || subtotal + platformFee);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getDueDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        date.setDate(date.getDate() + 15);
        return formatDate(date);
    };

    const invoiceNumber = `INV-${order._id.substring(order._id.length - 8).toUpperCase()}`;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #invoice-print-area, #invoice-print-area * { visibility: visible; }
                    #invoice-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white;
                        color: black;
                        padding: 0px !important;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 no-print">
                    <span className="font-heading text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Building size={14} className="text-emerald-600" />
                        {isSellerMode ? 'Sales Invoice' : 'Purchase Invoice'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-all flex items-center gap-1.5 font-body font-bold text-xs"
                        >
                            <Printer size={16} /> Print
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 rounded-xl transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div id="invoice-print-area" className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 select-text">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-6">
                        <div>
                            <span className="font-heading text-2xl font-black italic tracking-tighter text-slate-900">
                                GEAR<span className="text-emerald-600">UP</span>
                            </span>
                            <p className="font-body text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1">Pakistan B2B Sports Marketplace</p>
                        </div>
                        <div className="text-left sm:text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                order.paymentStatus === 'verified' || order.isPaymentVerified
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                            }`}>
                                {order.paymentStatus === 'verified' || order.isPaymentVerified ? 'PAID' : 'PAYMENT PENDING'}
                            </span>
                            <h2 className="font-heading text-lg font-black text-slate-900 uppercase tracking-wider mt-2">{invoiceNumber}</h2>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 text-sm">
                        <div>
                            <h4 className="font-heading text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bill To</h4>
                            <div className="font-body font-bold text-slate-800 text-xs">
                                <div className="text-sm font-black text-slate-900">{order.buyer?.name || 'Buyer'}</div>
                                {order.buyer?.businessDetails?.name && <div>{order.buyer.businessDetails.name}</div>}
                                <div>{order.shippingAddress?.address}</div>
                                <div>{order.shippingAddress?.city}</div>
                                <div>Phone: {order.shippingAddress?.phone}</div>
                            </div>
                        </div>
                        <div className="md:text-right space-y-2 text-xs font-body font-bold text-slate-700">
                            <div>
                                <span className="font-heading text-[9px] font-black text-slate-400 uppercase tracking-widest block">Issue Date</span>
                                <span className="text-slate-900 font-black">{formatDate(order.createdAt)}</span>
                            </div>
                            <div>
                                <span className="font-heading text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-2">Payment Terms</span>
                                <span className="text-slate-900 font-black">Net 15 Days</span>
                            </div>
                            <div>
                                <span className="font-heading text-[9px] font-black text-slate-400 uppercase tracking-widest block mt-2">Due Date</span>
                                <span className="text-slate-900 font-black">{getDueDate(order.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 font-heading text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-4 py-3">Product</th>
                                    <th className="px-4 py-3">SKU</th>
                                    {!isSellerMode && <th className="px-4 py-3">Supplier</th>}
                                    <th className="px-4 py-3 text-center">Qty</th>
                                    <th className="px-4 py-3">Unit</th>
                                    <th className="px-4 py-3 text-right">Unit Price</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item, idx) => {
                                    const unitLabel = formatMoqDisplay(1, item.bulkUnit || 'Unit').primary.replace(/^1 /, '');
                                    return (
                                        <tr key={idx} className="border-b border-slate-100 last:border-0 font-body text-xs font-bold text-slate-700">
                                            <td className="px-4 py-3 text-slate-900">
                                                <div>{item.name || 'Product'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{item.sku || '—'}</td>
                                            {!isSellerMode && (
                                                <td className="px-4 py-3 text-slate-500">{item.seller?.name || 'Manufacturer'}</td>
                                            )}
                                            <td className="px-4 py-3 text-center text-slate-900">{item.quantity}</td>
                                            <td className="px-4 py-3 text-slate-600">{unitLabel}</td>
                                            <td className="px-4 py-3 text-right">{formatPKR(item.price)}</td>
                                            <td className="px-4 py-3 text-right text-slate-900">{formatPKR(item.price * item.quantity)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {(order.notes || order.deliveryNotes) && (
                        <div className="grid md:grid-cols-2 gap-4">
                            {order.notes && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="font-heading text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Delivery Notes</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">{order.notes}</p>
                                </div>
                            )}
                            {order.deliveryNotes && (
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="font-heading text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Loading Instructions</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">{order.deliveryNotes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row justify-between gap-6 pt-4 border-t border-slate-100">
                        <div className="max-w-xs text-[10px] font-body text-slate-400 leading-relaxed">
                            <h4 className="font-heading font-black text-slate-500 uppercase tracking-widest mb-1">Order Summary</h4>
                            This invoice reflects your confirmed bulk order on GearUp. Contact support for billing questions.
                        </div>
                        <div className="w-full md:w-64 space-y-2 text-xs font-body font-bold text-slate-600">
                            <div className="flex justify-between items-center">
                                <span>Subtotal</span>
                                <span className="text-slate-900 font-black">{formatPKR(subtotal)}</span>
                            </div>
                            {!isSellerMode && platformFee > 0 && (
                                <div className="flex justify-between items-center">
                                    <span>Platform Fee ({commissionRate}%)</span>
                                    <span className="text-slate-900 font-black">{formatPKR(platformFee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-heading font-black text-slate-900">
                                <span>Total</span>
                                <span className="text-emerald-600">{formatPKR(grandTotal)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-slate-100">
                        <div>
                            <span className="font-heading text-[8px] font-black text-slate-400 uppercase tracking-widest block">Payment Method</span>
                            <span className="font-body text-xs font-black text-slate-800 uppercase tracking-widest">
                                {order.paymentMethod === 'platform_wallet' ? 'Wallet Payment' : 'Bank Transfer'}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            <span className="font-heading text-[8px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                                GEARUP VERIFIED
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
