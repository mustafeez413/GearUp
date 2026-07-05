"use client";

import React from 'react';

const PageShell = ({ children, className = '' }) => (
  <div className={`space-y-6 w-full animate-in fade-in duration-300 ${className}`}>
    {children}
  </div>
);

export default PageShell;
