"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Package, Clock, Factory, ChevronLeft, ChevronRight, MessageSquare, Eye } from 'lucide-react';
import { fetchSponsoredProducts, trackAdEvent } from '@/lib/advertisingApi';
import { getApiBaseUrl } from '@/lib/api';

export default function HomepageFeaturedSlider() {
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const trackedRef = useRef(new Set());

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // Fetch top ads for the slider
        const res = await fetchSponsoredProducts({ placement: 'homepage_featured', limit: 5 });
        if (mounted) {
          setAds(res.data || []);
        }
      } catch (err) {
        if (mounted) setAds([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (ads.length > 0) {
      const currentAd = ads[activeIndex];
      const id = currentAd?.advertisementId || currentAd?._id;
      if (id && !trackedRef.current.has(id)) {
        trackedRef.current.add(id);
        trackAdEvent(id, 'impression', { placement: 'homepage_featured' });
      }
    }
  }, [activeIndex, ads]);

  // Auto-advance logic
  useEffect(() => {
    if (ads.length <= 1 || isHovered) return;

    const timerId = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ads.length);
    }, 3000);

    return () => clearInterval(timerId);
  }, [ads.length, isHovered]);

  // Reset index manually via dots or arrows
  const handleSetIndex = (newIndex) => {
    setActiveIndex(newIndex);
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    handleSetIndex((activeIndex + 1) % ads.length);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    handleSetIndex((activeIndex - 1 + ads.length) % ads.length);
  };

  const handleAdClick = (ad) => {
    const id = ad.advertisementId || ad._id;
    if (id) trackAdEvent(id, 'click', { placement: 'homepage_featured' });
    
    const token = localStorage.getItem('token');
    const targetUrl = ad.productId ? `/wholesaler/marketplace/product/${ad.productId}` : '/login';
    
    if (!token) {
      localStorage.setItem('redirectAfterLogin', targetUrl);
      router.push('/login');
    } else if (ad.productId) {
      router.push(targetUrl);
    }
  };

  const handleInquiryClick = (e, ad) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    const targetUrl = `/wholesaler/chats/${ad.manufacturerId || ad.manufacturer?._id || ''}`;
    if (!token) {
      localStorage.setItem('redirectAfterLogin', targetUrl);
      router.push('/login');
    } else {
      router.push(targetUrl);
    }
  };

  const getMediaUrl = (ad) => {
    if (!ad) return null;
    let media = ad.customMedia || ad.product?.image || ad.product?.images?.[0] || ad.productId?.image || ad.productId?.images?.[0];
    
    // Safely handle if media is an array
    if (Array.isArray(media)) media = media[0];
    
    if (!media || typeof media !== 'string') return null;
    return media.startsWith('http') ? media : `${getApiBaseUrl()}${media}`;
  };

  const isVideo = (url) => typeof url === 'string' && (url.endsWith('.mp4') || url.endsWith('.webm'));

  if (loading) return null;
  if (!ads || ads.length === 0) return null;

  const currentAd = ads[activeIndex] || ads[0];
  if (!currentAd) return null;

  const mediaUrl = getMediaUrl(currentAd);

  // Split title to style the first word differently (optional premium touch)
  const rawTitle = currentAd.title || currentAd.product?.name || currentAd.productId?.name || 'Premium Product';
  const title = String(rawTitle);
  const titleParts = title.split(' ');
  const firstWord = titleParts[0];
  const restWords = titleParts.slice(1).join(' ');

  return (
    <div 
      className="w-full relative overflow-hidden font-sans py-16 px-4 md:px-8 max-w-7xl mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style>{`
        @keyframes customFadeSlide {
          0% { opacity: 0; transform: translateY(15px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up {
          animation: customFadeSlide 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fillProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress-fill {
          animation: fillProgress 3000ms linear forwards;
        }
      `}</style>

      {/* Container Background with Glassmorphism */}
      <div className="relative w-full rounded-[24px] lg:rounded-[32px] bg-[#0b101e] border border-slate-700/50 shadow-[0_30px_100px_-15px_rgba(0,0,0,0.8)] overflow-hidden group flex flex-col lg:flex-row min-h-[500px]">
        
        {/* Left Side: Hero Media Showcase */}
        <div className="w-full lg:w-[45%] relative bg-[#040710] flex items-center justify-center p-12 overflow-hidden cursor-pointer border-b lg:border-b-0 lg:border-r border-slate-800" onClick={() => handleAdClick(currentAd)}>
          
          {/* Top Edge Progress Bar for Active Slide */}
          {ads.length > 1 && (
            <div className="absolute top-0 left-0 w-full h-[4px] bg-slate-800/40 z-50">
              {!isHovered ? (
                <div 
                  key={`progress-${activeIndex}`}
                  className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-progress-fill"
                />
              ) : (
                <div className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] w-full opacity-30 transition-opacity" />
              )}
            </div>
          )}

          {/* Ambient Radial Glow behind the product */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-80" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none" />

          <div key={`media-${activeIndex}`} className="relative z-10 w-full aspect-square md:aspect-auto md:h-[400px] flex items-center justify-center animate-fade-in-up">
            {mediaUrl ? (
              isVideo(mediaUrl) ? (
                <video 
                  src={mediaUrl} 
                  autoPlay loop muted playsInline
                  className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                />
              ) : (
                <img 
                  src={mediaUrl} 
                  alt={title}
                  className="max-w-full max-h-full object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.8)] hover:scale-105 transition-transform duration-700 ease-out"
                />
              )
            ) : (
              <Package size={100} className="text-slate-700 opacity-50 drop-shadow-2xl" />
            )}
          </div>

            {/* Pagination / Slide Controls over Image */}
            {ads.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={handlePrev} className="p-2.5 rounded-full bg-black/50 text-white hover:bg-emerald-600 backdrop-blur-md transition-colors shadow-lg border border-white/10">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={handleNext} className="p-2.5 rounded-full bg-black/50 text-white hover:bg-emerald-600 backdrop-blur-md transition-colors shadow-lg border border-white/10">
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Premium Details Hub */}
          <div className="w-full lg:w-[55%] p-10 lg:p-16 flex flex-col justify-center relative z-10 bg-gradient-to-br from-[#0c1222] to-[#0a0f1c]">
            
            {/* Soft Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] to-transparent pointer-events-none" />

            <div key={`content-${activeIndex}`} className="flex flex-col space-y-6 animate-fade-in-up relative z-10">
              
              {/* Verified Badge & Brand Label */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)] w-max">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px] font-semibold tracking-wide uppercase">
                    Verified Manufacturer
                  </span>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-sm font-semibold tracking-[0.2em] uppercase">
                  <Factory size={14} className="text-slate-500" />
                  {currentAd.manufacturer?.name || currentAd.manufacturerId?.name || 'Verified Brand'}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-4xl lg:text-5xl font-black tracking-tight leading-[1.15] cursor-pointer hover:opacity-90 transition-opacity" onClick={() => handleAdClick(currentAd)}>
                <span className="text-white drop-shadow-sm">{firstWord}</span>{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600 drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">{restWords}</span>
              </h2>

              {/* Description */}
              <p className="text-slate-300 text-lg leading-relaxed font-medium border-l-[3px] border-emerald-500/60 pl-5 py-1">
                {currentAd.description || 'Premium export quality material. Suitable for professional environments and large scale distribution networks.'}
              </p>

              {/* Meta Info Pills */}
              <div className="flex flex-wrap gap-3 pt-2 pb-4">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/40 text-slate-200 text-sm font-semibold backdrop-blur-md">
                  <Package size={16} className="text-emerald-400" />
                  MOQ: {currentAd.product?.minimumOrderQuantity || currentAd.productId?.minimumOrderQuantity || currentAd.product?.moq || '100'} units
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700/50 bg-slate-800/40 text-slate-200 text-sm font-semibold backdrop-blur-md">
                  <Clock size={16} className="text-amber-400" />
                  Lead: {currentAd.product?.leadTime || currentAd.productId?.leadTime || '14 days'}
                </div>
              </div>

              {/* CTA Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => handleAdClick(currentAd)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-1"
                >
                  <Eye size={18} /> View Product Details
                </button>
                <button 
                  onClick={(e) => handleInquiryClick(e, currentAd)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-transparent hover:bg-white/5 text-white font-bold transition-all border border-white/20 hover:border-emerald-500/70 shadow-lg hover:-translate-y-1"
                >
                  <MessageSquare size={18} /> Contact Manufacturer
                </button>
              </div>

            </div>
          </div>


        {/* Pagination Dots (Bottom Right) */}
        {ads.length > 1 && (
          <div className="absolute bottom-6 right-8 flex items-center gap-2 z-20">
            {ads.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); handleSetIndex(idx); }}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === activeIndex 
                    ? 'w-8 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' 
                    : 'w-2 bg-slate-600 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
