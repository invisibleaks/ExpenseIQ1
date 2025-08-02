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
    primary: "bg-gradient-to-r from-brand-charcoal to-brand-amber dark:from-brand-gold dark:to-brand-soft-gold text-white hover:from-brand-charcoal/90 hover:to-brand-amber/90 dark:hover:from-brand-gold/90 dark:hover:to-brand-soft-gold/90 focus:ring-brand-amber shadow-lg hover:shadow-xl",
    secondary: "border-2 border-brand-secondary-light dark:border-brand-secondary-dark text-brand-secondary-light dark:text-brand-secondary-dark hover:border-brand-amber hover:text-brand-amber dark:hover:text-brand-gold focus:ring-brand-amber"
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