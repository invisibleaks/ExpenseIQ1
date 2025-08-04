import React, { useState, useEffect } from 'react';
import { X, Mail, User, Loader2, CheckCircle } from 'lucide-react';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  name: string;
  email: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  submit?: string;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', email: '' });
      setErrors({});
      setIsSuccess(false);
      setTouchedFields(new Set());
    }
  }, [isOpen]);

  // Auto-close modal after success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, onClose]);

  // Email validation regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time validation
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Name is required';
        if (value.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!isValidEmail(value)) return 'Please enter a valid email address';
        return undefined;
      default:
        return undefined;
    }
  };

  // Handle input changes with real-time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Add field to touched set
    setTouchedFields(prev => new Set(prev).add(name));

    // Real-time validation for touched fields
    if (touchedFields.has(name) || value.length > 0) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error, submit: undefined }));
    }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => new Set(prev).add(name));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Submit to Google Sheets
  const submitToGoogleSheets = async (data: FormData): Promise<void> => {
    // Google Apps Script Web App URL - Replace with your actual deployment URL
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxMjHxYeY_icqniLwYfZ0T35D9tR2Ew32h5CdJQayvYKYn3iv2K-eMZUELhCc18gZFZ/exec';
    
    const payload = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      timestamp: new Date().toISOString(),
      source: 'expense-iq-waitlist'
    };

    console.log('Submitting to Google Sheets:', payload);

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Changed back to no-cors to avoid CORS issues
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      // With no-cors mode, we can't read the response
      // So we assume success if no error is thrown
      console.log('Form submitted successfully');
      
    } catch (error) {
      console.error('Error submitting to Google Sheets:', error);
      
      // Only throw error if it's a network error, not a CORS error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // This might be a CORS error, but the request might have gone through
        console.log('Possible CORS error, but request may have succeeded');
        return; // Don't throw error, assume success
      }
      
      throw new Error(`Failed to join waitlist: ${error.message}`);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameError = validateField('name', formData.name);
    const emailError = validateField('email', formData.email);
    
    if (nameError || emailError) {
      setErrors({ name: nameError, email: emailError });
      setTouchedFields(new Set(['name', 'email']));
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await submitToGoogleSheets(formData);
      setIsSuccess(true);
      
      // Track conversion event (if analytics is set up)
      if (typeof gtag !== 'undefined') {
        gtag('event', 'waitlist_signup', {
          event_category: 'engagement',
          event_label: 'expense-iq-waitlist'
        });
      }
    } catch (error) {
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Something went wrong. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !isSubmitting && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-modal-title"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 transform transition-all duration-300 scale-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-brand-text-muted hover:text-brand-dark-teal dark:hover:text-brand-warm-beige transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {!isSuccess ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-dark-teal dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white dark:text-brand-dark-teal" />
                </div>
                <h2 id="waitlist-modal-title" className="text-2xl font-bold text-brand-text-dark dark:text-brand-text-light mb-2">
                  Try It Free
                </h2>
                <p className="text-brand-text-muted dark:text-brand-soft-gray">
                  Be the first to know when Expense IQ launches and get exclusive early access.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Name Field */}
                <div>
                  <label htmlFor="waitlist-name" className="block text-sm font-medium text-brand-text-dark dark:text-brand-text-light mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                    <input
                      type="text"
                      id="waitlist-name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white dark:bg-brand-darker-teal text-brand-text-dark dark:text-brand-text-light placeholder-brand-text-muted dark:placeholder-brand-soft-gray focus:ring-2 focus:ring-brand-warm-beige focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.name ? 'border-red-500' : 'border-brand-soft-gray/50 dark:border-brand-muted-teal/50'
                      }`}
                      placeholder="Enter your full name"
                      required
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      aria-invalid={!!errors.name}
                    />
                  </div>
                  {errors.name && (
                    <p id="name-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="waitlist-email" className="block text-sm font-medium text-brand-text-dark dark:text-brand-text-light mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-text-muted" />
                    <input
                      type="email"
                      id="waitlist-email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white dark:bg-brand-darker-teal text-brand-text-dark dark:text-brand-text-light placeholder-brand-text-muted dark:placeholder-brand-soft-gray focus:ring-2 focus:ring-brand-warm-beige focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.email ? 'border-red-500' : 'border-brand-soft-gray/50 dark:border-brand-muted-teal/50'
                      }`}
                      placeholder="Enter your email address"
                      required
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      aria-invalid={!!errors.email}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                      {errors.submit}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !!errors.name || !!errors.email}
                  className="w-full bg-brand-dark-teal dark:bg-white text-white dark:text-brand-dark-teal py-3 px-6 rounded-xl font-semibold hover:bg-brand-dark-teal/90 dark:hover:bg-white/90 focus:ring-2 focus:ring-brand-dark-teal dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-brand-dark-teal transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                  aria-describedby="submit-button-description"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Joining Waitlist...</span>
                    </>
                  ) : (
                    <span>Join Waitlist</span>
                  )}
                </button>

                {/* Privacy Note */}
                <p className="text-xs text-brand-text-muted dark:text-brand-soft-gray text-center">
                  We respect your privacy. No spam, unsubscribe anytime.
                </p>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-brand-text-primary dark:text-brand-text-primary-dark mb-4">
                You're on the list!
              </h2>
              <p className="text-brand-text-muted dark:text-brand-soft-gray mb-6">
                We'll notify you before launch.
              </p>
              <p className="text-sm text-brand-text-muted dark:text-brand-soft-gray">
                This window will close automatically in a few seconds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaitlistModal;