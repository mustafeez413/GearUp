"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, ImagePlus } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

const REASON_OPTIONS = [
    { value: 'product not received', label: 'Product not received' },
    { value: 'damaged product', label: 'Damaged / broken product' },
    { value: 'incorrect item', label: 'Wrong item received' },
    { value: 'wrong quantity', label: 'Wrong quantity' },
    { value: 'delayed shipment', label: 'Delayed shipment' },
    { value: 'other', label: 'Other' }
];

export default function DisputeModal({ order, disputeItem, onClose, onSuccess }) {
    const [reason, setReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [notes, setNotes] = useState('');
    const [sellerId, setSellerId] = useState(disputeItem?.sellerId || order?.sellers?.[0]?.id || '');
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    const sellers = order?.sellers || [];

    useEffect(() => {
        setMounted(true);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, []);

    useEffect(() => {
        if (disputeItem?.sellerId) {
            setSellerId(disputeItem.sellerId);
            return;
        }
        if (order?.sellers?.[0]?.id) {
            setSellerId(order.sellers[0].id);
        }
    }, [order, disputeItem]);

    const uploadFile = async (file) => {
        const token = localStorage.getItem('token');
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${getApiBaseUrl()}/api/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form
        });
        const data = await res.json();
        if (!res.ok || !data.filePath) {
            throw new Error(data.error || 'Upload failed');
        }
        return data.filePath;
    };

    const handleFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        setError('');
        try {
            const uploaded = [];
            for (const file of files) {
                uploaded.push(await uploadFile(file));
            }
            setImages((prev) => [...prev, ...uploaded]);
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const removeImage = (index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalReason = reason === 'other' ? customReason.trim() : reason;
        if (!finalReason) {
            setError('Please select or describe the issue.');
            return;
        }
        if (sellers.length > 1 && !sellerId) {
            setError('Select which seller this dispute is about.');
            return;
        }
        if (!disputeItem?.productId) {
            setError('Could not determine which item to dispute. Please refresh and try again.');
            return;
        }
        const resolvedSellerId = sellerId || disputeItem?.sellerId || sellers[0]?.id;
        if (!resolvedSellerId) {
            setError('Could not determine seller for this order. Please refresh and try again.');
            return;
        }

        setSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${getApiBaseUrl()}/api/disputes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    orderId: order._id,
                    productId: disputeItem.productId,
                    sellerId: resolvedSellerId,
                    reason: finalReason,
                    notes,
                    description: notes,
                    evidence: images[0],
                    evidenceImages: images
                })
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || 'Could not submit dispute');
            }
            onSuccess?.(data.data);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!mounted) return null;

    const modal = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispute-modal-title"
        >
            <button
                type="button"
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                aria-label="Close"
                onClick={onClose}
            />
            <div
                className="relative bg-white rounded-3xl w-full max-w-xl max-h-[min(90vh,720px)] shadow-2xl flex flex-col overflow-hidden border border-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-100 shrink-0">
                    <div>
                        <h2
                            id="dispute-modal-title"
                            className="font-heading font-black text-xl text-slate-900 flex items-center gap-2"
                        >
                            <AlertCircle className="text-rose-500 shrink-0" size={22} />
                            Report issue / refund
                        </h2>
                        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                            You are disputing a <strong>single line item</strong> on this order. Upload photos of damaged or wrong items — admin and seller will both see them.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-6 pt-4 space-y-4 overflow-y-auto flex-1">
                        {disputeItem && (
                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                                    {disputeItem.image ? (
                                        <img
                                            src={disputeItem.image}
                                            alt={disputeItem.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold uppercase text-slate-400">
                                            No image
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Disputing item</span>
                                    <p className="font-heading font-bold text-slate-900 mt-1 truncate">{disputeItem.name}</p>
                                </div>
                            </div>
                        )}

                        {sellers.length > 1 && !disputeItem?.sellerId && (
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Seller</label>
                                <select
                                    value={sellerId}
                                    onChange={(e) => setSellerId(e.target.value)}
                                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 bg-white"
                                    required
                                >
                                    <option value="">Select seller…</option>
                                    {sellers.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {(sellers.length === 1 || disputeItem?.sellerId) && (
                            <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Seller</span>
                                <p className="font-bold text-slate-800 mt-0.5">
                                    {disputeItem?.sellerName || sellers.find((s) => s.id === sellerId)?.name || sellers[0]?.name}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Reason</label>
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 bg-white"
                                required
                            >
                                <option value="">Select a reason…</option>
                                {REASON_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {reason === 'other' && (
                            <div>
                                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Describe issue</label>
                                <input
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="Brief description"
                                    className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Details</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                className="mt-1.5 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm resize-none"
                                placeholder="What went wrong? Include any details for admin review."
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Evidence photos</label>
                            <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors">
                                <ImagePlus className="text-slate-400 mb-2" size={28} />
                                <span className="text-xs font-bold text-slate-600">
                                    {uploading ? 'Uploading…' : 'Click to upload images'}
                                </span>
                                <span className="text-[10px] text-slate-400 mt-1">JPG, PNG — visible to admin & seller</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFiles}
                                    disabled={uploading}
                                />
                            </label>
                            {images.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-3">
                                    {images.map((src, i) => (
                                        <div key={i} className="relative group">
                                            <img
                                                src={`${getApiBaseUrl()}${src}`}
                                                alt={`Evidence ${i + 1}`}
                                                className="w-20 h-20 object-cover rounded-xl border border-slate-200"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs shadow-md"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="text-sm text-rose-600 font-medium px-3 py-2 bg-rose-50 rounded-xl border border-rose-100">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="p-6 pt-0 border-t border-slate-100 shrink-0 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || uploading}
                            className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                        >
                            {submitting ? 'Submitting…' : 'Submit dispute'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
