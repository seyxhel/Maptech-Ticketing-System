import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  accent?: boolean;
  title?: string;
  onClick?: () => void;
}
export function Card({
  children,
  className = '',
  noPadding = false,
  accent = false,
  onClick,
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {accent &&
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#63D44A] to-[#0E8F79]" />
      }
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>);

}