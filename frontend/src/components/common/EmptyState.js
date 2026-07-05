"use client";

import React from 'react';
import Button from './Button';

const EmptyState = ({
  title = "No Data Available",
  description = "There are currently no items to display in this list.",
  icon: Icon,
  actionLabel,
  onActionClick,
  actionIcon,
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-300 ${className}`}>
      {Icon && (
        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 select-none shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
          <Icon size={20} className="stroke-[1.5]" />
        </div>
      )}
      
      <h4 className="font-heading font-black text-slate-900 text-sm tracking-tight select-none">
        {title}
      </h4>
      
      <p className="font-body text-[10px] text-slate-400 font-medium max-w-[260px] mt-1.5 leading-normal select-none">
        {description}
      </p>

      {actionLabel && onActionClick && (
        <Button
          variant="primary"
          size="sm"
          onClick={onActionClick}
          icon={actionIcon}
          className="mt-5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
