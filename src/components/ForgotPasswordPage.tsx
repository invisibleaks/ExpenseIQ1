import React, { useState } from 'react';
import { ArrowLeft, Brain, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';

interface ForgotPasswordFormData {
  email: string;
}

interface ForgotPasswordErrors {
  email?: string;
  submit?: string;
}

interface ForgotPasswordPageProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ 
  onBack, 
  onNavigateToLogin 
}) => {
  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    email: ''
  });

  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Validation function
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ email: value });

    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }

    // Real-time validation for touched field
    if (touched) {
      const error = validateEmail(value);
      setErrors(prev => ({ ...prev, email: error }));
    }
  };

  // Handle field blur
  const handleBlur = () => {
    setTouched(true);
    const error = validateEmail(formData.email);
    setErrors(prev => ({ ...prev, email: error }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched(true);

    // Validate email
    const emailError = validateEmail(formData.email);
    setErrors({ email: emailError });

    if (emailError) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success state
      setShowSuccess(true);
      
    } catch (error) {
      setErrors({ 
        submit: 'Something went wrong. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get field status for styling
  const getFieldStatus = () => {
    if (!touched) return 'default';
    if (errors.email) return 'error';
    if (formData.email) return 'success';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-brand-light-beige">
      {/* Header */}
      <header className="bg-brand-darker-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back to Login Link */}
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-brand-muted-teal hover:text-brand-warm-beige transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Login</span>
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-brand-dark-teal" />
              </div>
              <span className="text-xl font-bold text-brand-text-light">Expense IQ</span>
            </div>

            {/* Spacer for centering */}
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Hero Copy */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-text-dark mb-4">
              Reset your password
            </h1>
            <p className="text-lg text-brand-text-dark">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-brand-cream rounded-2xl shadow-lg border border-brand-soft-gray/20 p-8">
            {!showSuccess ? (
              <>
                {/* Reset Form */}
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Email Address */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-brand-text-dark mb-2">
                      Email Address <span className="text-brand-muted-teal">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      disabled={isSubmitting}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        getFieldStatus() === 'error' 
                          ? 'border-red-500 bg-red-50' 
                          : getFieldStatus() === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-brand-muted-teal hover:border-brand-dark-teal hover:shadow-sm'
                      }`}
                      placeholder="Enter your email address"
                      required
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && touched && (
                      <div id="email-error" className="mt-2 flex items-center space-x-1 text-sm text-red-600" role="alert">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.email}</span>
                      </div>
                    )}
                    {!errors.email && touched && formData.email && (
                      <div className="mt-2 flex items-center space-x-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Valid email address</span>
                      </div>
                    )}
                  </div>

                  {/* Submit Error */}
                  {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-600">{errors.submit}</p>
                      </div>
                    </div>
                  )}

                  {/* Primary CTA */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !!errors.email}
                    className="w-full bg-brand-dark-teal text-brand-text-light py-3 px-6 rounded-xl font-semibold hover:bg-brand-dark-teal/90 focus:ring-2 focus:ring-brand-dark-teal focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Sending reset link...</span>
                      </>
                    ) : (
                      <span>Send reset link</span>
                    )}
                  </button>
                </form>

                {/* Back to Login Link */}
                <div className="mt-8 text-center">
                  <p className="text-sm text-brand-text-muted">
                    Remember your password?{' '}
                    <button
                      onClick={onNavigateToLogin}
                      disabled={isSubmitting}
                      className="text-brand-muted-teal hover:text-brand-dark-teal hover:underline font-medium transition-colors disabled:opacity-50"
                    >
                      Back to login
                    </button>
                  </p>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-brand-text-dark mb-4">
                  Check your email
                </h2>
                <p className="text-brand-text-muted mb-6">
                  We've sent a password reset link to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-brand-text-muted mb-8">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setTouched(false);
                      setErrors({});
                    }}
                    className="text-brand-muted-teal hover:text-brand-dark-teal hover:underline font-medium transition-colors"
                  >
                    try again
                  </button>
                </p>
                <button
                  onClick={onNavigateToLogin}
                  className="text-brand-muted-teal hover:text-brand-dark-teal hover:underline font-medium transition-colors"
                >
                  Back to login
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-light-beige py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-brand-soft-gray">
            Need help?{' '}
            <button className="text-brand-muted-teal hover:text-brand-dark-teal hover:underline transition-colors">
              Contact Support
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;