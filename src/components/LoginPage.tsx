import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  submit?: string;
}

interface LoginTouched {
  email: boolean;
  password: boolean;
}

interface LoginPageProps {
  onBack: () => void;
  onNavigateToSignup: () => void;
  onNavigateToForgotPassword: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ 
  onBack, 
  onNavigateToSignup, 
  onNavigateToForgotPassword 
}) => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [touched, setTouched] = useState<LoginTouched>({
    email: false,
    password: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get next parameter from URL for redirect after login
  const getNextParam = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('next') || '/app';
  };

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    return undefined;
  };

  // Real-time validation
  const validateField = (name: keyof LoginFormData, value: string): string | undefined => {
    switch (name) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      default:
        return undefined;
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof LoginFormData;
    
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }

    // Real-time validation for touched fields
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const fieldName = e.target.name as keyof LoginFormData;
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validateField(fieldName, formData[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      email: true,
      password: true
    });

    // Validate all fields
    const newErrors: LoginErrors = {
      email: validateEmail(formData.email),
      password: validatePassword(formData.password)
    };

    setErrors(newErrors);

    // Check if there are any validation errors
    const hasValidationErrors = Object.values(newErrors).some(error => error !== undefined);
    if (hasValidationErrors) return;

    setIsSubmitting(true);

    try {
      // Simulate API call with potential failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate random failure for demo (remove in production)
          if (Math.random() > 0.7) {
            reject(new Error('Invalid credentials'));
          } else {
            resolve(true);
          }
        }, 1500);
      });
      
      // Show success state briefly
      setShowSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        const nextUrl = getNextParam();
        console.log('Login successful, redirecting to:', nextUrl);
        // In a real app, you would redirect here
        // window.location.href = nextUrl;
        alert(`Login successful! Would redirect to: ${nextUrl}`);
      }, 1000);
      
    } catch (error) {
      // Generic error message for security (don't reveal if email exists)
      setErrors({ 
        submit: 'Check your email or password and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    
    try {
      // Simulate Google OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setShowSuccess(true);
      setTimeout(() => {
        const nextUrl = getNextParam();
        console.log('Google login successful, redirecting to:', nextUrl);
        alert(`Google login successful! Would redirect to: ${nextUrl}`);
      }, 1000);
      
    } catch (error) {
      setErrors({ 
        submit: 'Google login failed. Please try again.' 
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Get field status for styling
  const getFieldStatus = (fieldName: keyof LoginFormData) => {
    if (!touched[fieldName]) return 'default';
    if (errors[fieldName]) return 'error';
    if (formData[fieldName]) return 'success';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-brand-light-beige">
      {/* Header */}
      <header className="bg-brand-darker-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back to Home Link */}
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-brand-muted-teal hover:text-brand-warm-beige transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
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
              Welcome back
            </h1>
            <p className="text-lg text-brand-text-dark">
              Save hours every month with AI‑powered expense management.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-brand-cream rounded-2xl shadow-lg border border-brand-soft-gray/20 p-8">
            {!showSuccess ? (
              <>
                {/* Login Form */}
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
                      disabled={isSubmitting || isGoogleLoading}
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        getFieldStatus('email') === 'error' 
                          ? 'border-red-500 bg-red-50' 
                          : getFieldStatus('email') === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-brand-muted-teal hover:border-brand-dark-teal hover:shadow-sm'
                      }`}
                      placeholder="Enter your email address"
                      required
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && touched.email && (
                      <div id="email-error" className="mt-2 flex items-center space-x-1 text-sm text-red-600" role="alert">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.email}</span>
                      </div>
                    )}
                    {!errors.email && touched.email && formData.email && (
                      <div className="mt-2 flex items-center space-x-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Valid email address</span>
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-brand-text-dark mb-2">
                      Password <span className="text-brand-muted-teal">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        disabled={isSubmitting || isGoogleLoading}
                        className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                          getFieldStatus('password') === 'error' 
                            ? 'border-red-500 bg-red-50' 
                            : getFieldStatus('password') === 'success'
                            ? 'border-green-500 bg-green-50'
                            : 'border-brand-muted-teal hover:border-brand-dark-teal hover:shadow-sm'
                        }`}
                        placeholder="Enter your password"
                        required
                        aria-describedby={errors.password ? 'password-error' : undefined}
                        aria-invalid={!!errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting || isGoogleLoading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-soft-gray hover:text-brand-muted-teal transition-colors disabled:opacity-50"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <div id="password-error" className="mt-2 flex items-center space-x-1 text-sm text-red-600" role="alert">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.password}</span>
                      </div>
                    )}
                    {!errors.password && touched.password && formData.password && (
                      <div className="mt-2 flex items-center space-x-1 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Password entered</span>
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
                    disabled={isSubmitting || isGoogleLoading || Object.values(errors).some(error => error !== undefined)}
                    className="w-full bg-brand-dark-teal text-brand-text-light py-3 px-6 rounded-xl font-semibold hover:bg-brand-dark-teal/90 focus:ring-2 focus:ring-brand-dark-teal focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>Continue</span>
                    )}
                  </button>

                  {/* Forgot Password Link */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={onNavigateToForgotPassword}
                      disabled={isSubmitting || isGoogleLoading}
                      className="text-brand-text-muted hover:text-brand-dark-teal hover:underline transition-colors disabled:opacity-50"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>

                {/* Divider */}
                <div className="my-8 flex items-center">
                  <div className="flex-1 border-t border-brand-soft-gray/30"></div>
                  <span className="px-4 text-sm text-brand-text-muted">or</span>
                  <div className="flex-1 border-t border-brand-soft-gray/30"></div>
                </div>

                {/* Google Login */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting || isGoogleLoading}
                  className="w-full border-2 border-brand-muted-teal text-brand-text-dark py-3 px-6 rounded-xl font-semibold hover:border-brand-dark-teal hover:bg-brand-dark-teal/5 focus:ring-2 focus:ring-brand-dark-teal focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                {/* Footer Row */}
                <div className="mt-8 text-center">
                  <p className="text-sm text-brand-text-muted">
                    Don't have an account?{' '}
                    <button
                      onClick={onNavigateToSignup}
                      disabled={isSubmitting || isGoogleLoading}
                      className="text-brand-muted-teal hover:text-brand-dark-teal hover:underline font-medium transition-colors disabled:opacity-50"
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-brand-text-dark mb-4">
                  Welcome back!
                </h2>
                <p className="text-brand-text-muted mb-6">
                  Redirecting you to your dashboard...
                </p>
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-dark-teal" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-light-beige py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-brand-soft-gray">
            By signing in, you agree to our{' '}
            <button className="text-brand-muted-teal hover:text-brand-dark-teal hover:underline transition-colors">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-brand-muted-teal hover:text-brand-dark-teal hover:underline transition-colors">
              Privacy Policy
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;