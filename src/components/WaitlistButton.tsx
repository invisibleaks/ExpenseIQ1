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
    primary: "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:from-purple-700 hover:to-cyan-600 focus:ring-purple-500 shadow-lg hover:shadow-xl",
    secondary: "border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 focus:ring-purple-500"
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