import React from 'react';
import { Loader2 } from 'lucide-react';
interface GreenButtonProps extends
  React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  isLoading?: boolean;
  fullWidth?: boolean;
}
export function GreenButton({
  children,
  className = '',
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  disabled,
  ...props
}: GreenButtonProps) {
  const base =
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3BC25B] dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm';
  const variants = {
    primary:
    'bg-gradient-to-r from-[#63D44A] to-[#0E8F79] text-white hover:shadow-lg hover:shadow-[#3BC25B]/20 border border-transparent',
    outline:
    'bg-white dark:bg-gray-800 text-[#0E8F79] dark:text-green-400 border border-[#0E8F79] dark:border-green-500 hover:bg-[#f0fdf4] dark:hover:bg-green-900/20',
    ghost:
    'bg-transparent text-[#0E8F79] dark:text-green-400 hover:bg-[#f0fdf4] dark:hover:bg-green-900/20'
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isLoading || disabled}
      {...props}>

      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>);

}