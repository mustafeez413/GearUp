"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import GlobalChatbot from '../shared/GlobalChatbot';
import Footer from '../shared/Footer';
import SuspensionBanner from '../shared/SuspensionBanner';

const SIDEBAR_FULL = 240;
const SIDEBAR_COLLAPSED = 64;

const DashboardLayout = ({ children }) => {
  const router = useRouter();
  const { user, isReadOnlyMode } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user && !user.isEmailVerified && user.role !== 'admin') {
      router.replace(`/verify-email?email=${encodeURIComponent(user.email)}`);
    }
  }, [user, router]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      setIsSidebarOpen(!isSidebarOpen);
    }
  };

  const mainMargin = isMobile ? 0 : isSidebarOpen ? SIDEBAR_FULL : SIDEBAR_COLLAPSED;

  return (
    <div className="seller-workspace min-h-screen flex">
      <Sidebar
        isOpen={isMobile ? isMobileSidebarOpen : isSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isMobile={isMobile}
        widthFull={SIDEBAR_FULL}
        widthCollapsed={SIDEBAR_COLLAPSED}
      />

      <div
        className="flex-1 flex flex-col min-h-screen min-w-0 transition-[margin-left] duration-300"
        style={{ marginLeft: isMobile ? 0 : mainMargin }}
      >
        <Topbar
          onToggleSidebar={toggleSidebar}
          onAddProductClick={
            user?.role === 'manufacturer' && !isReadOnlyMode
              ? () => router.push('/manufacturer/products/new')
              : undefined
          }
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden min-w-0">
          <div className="w-full min-w-0 max-w-[1600px] mx-auto">
            <div className="min-h-[calc(100vh-10rem)] w-full">
              <SuspensionBanner />
              {children}
            </div>
          </div>
        </main>

        <Footer />
      </div>

      {user?.role !== 'admin' && <GlobalChatbot />}
    </div>
  );
};

export default DashboardLayout;
