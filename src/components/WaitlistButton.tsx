import React from 'react';
import { ArrowRight } from 'lucide-react';

interface WaitlistButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const WaitlistButton: React.FC<WaitlistButtonProps> = ({ 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}) => {
  const baseClasses = "group font-semibold transition-all transform hover:scale-105 focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 flex items-center justify-center space-x-2 rounded-xl";
  
  const variantClasses = {
    primary: "bg-brand-dark-teal dark:bg-white text-white dark:text-brand-dark-teal hover:bg-brand-dark-teal/90 dark:hover:bg-white/90 focus:ring-brand-dark-teal dark:focus:ring-white shadow-lg hover:shadow-xl",
    secondary: "border-2 border-brand-soft-gray dark:border-brand-muted-teal text-brand-text-muted dark:text-brand-soft-gray hover:border-brand-dark-teal hover:text-brand-dark-teal dark:hover:border-brand-warm-beige dark:hover:text-brand-warm-beige focus:ring-brand-warm-beige"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label="Join waitlist for early access to Expense IQ"
    >
      <span>Try It Free</span>
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </button>
  );
};

export default WaitlistButton;