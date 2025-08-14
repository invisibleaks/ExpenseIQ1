import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft, Brain, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { signUp, supabase } from '../lib/supabase';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  businessType: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  businessType?: string;
}

interface FormTouched {
  fullName: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
  businessType: boolean;
}

interface SignUpPageProps {
  onBack: () => void;
  onNavigateToLogin: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onBack, onNavigateToLogin }) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessType: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
    businessType: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const businessTypes = [
    { value: '', label: 'Select your business type' },
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'solopreneur', label: 'Solopreneur' },
    { value: 'small-business', label: 'Small Business' },
    { value: 'other', label: 'Other' }
  ];

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return undefined;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | undefined => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return undefined;
  };

  const validateFullName = (name: string): string | undefined => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return undefined;
  };

  const validateBusinessType = (type: string): string | undefined => {
    if (!type) return 'Please select your business type';
    return undefined;
  };

  // Real-time validation
  const validateField = (name: keyof FormData, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(value, formData.password);
      case 'businessType':
        return validateBusinessType(value);
      default:
        return undefined;
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof FormData;
    
    setFormData(prev => ({ ...prev, [fieldName]: value }));

    // Real-time validation for touched fields
    if (touched[fieldName]) {
      const error = validateField(fieldName, value);
      setErrors(prev => ({ ...prev, [fieldName]: error }));
    }

    // Special case: re-validate confirm password when password changes
    if (name === 'password' && touched.confirmPassword) {
      const confirmError = validateConfirmPassword(formData.confirmPassword, value);
      setErrors(prev => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const fieldName = e.target.name as keyof FormData;
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    const error = validateField(fieldName, formData[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
      businessType: true
    });

    // Validate all fields
    const newErrors: FormErrors = {
      fullName: validateFullName(formData.fullName),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword, formData.password),
      businessType: validateBusinessType(formData.businessType)
    };

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== undefined);
    if (hasErrors) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.businessType
      );
      
      if (error) {
        throw error;
      }
      
      // Check if user was created successfully
      if (data.user) {
        // Try to sign in immediately after signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        
        if (signInError) {
          console.log('Auto-signin failed, redirecting to login:', signInError.message);
          // Show success state and redirect to login
          setShowSuccess(true);
          setTimeout(() => {
            onNavigateToLogin();
          }, 3000);
        } else {
          // Successfully signed in, redirect to account page
          setShowSuccess(true);
          setTimeout(() => {
            onNavigateToLogin(); // This will actually go to account since user is authenticated
          }, 2000);
        }
      } else {
        // Show success state
        setShowSuccess(true);
        setTimeout(() => {
          onNavigateToLogin();
        }, 3000);
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      if (error.message?.includes('already registered')) {
        setSubmitError('An account with this email already exists. Please try logging in instead.');
      } else if (error.message?.includes('Password')) {
        setSubmitError('Password must be at least 6 characters long.');
      } else {
        setSubmitError(error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get field status for styling
  const getFieldStatus = (fieldName: keyof FormData) => {
    if (!touched[fieldName]) return 'default';
    if (errors[fieldName]) return 'error';
    if (formData[fieldName]) return 'success';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-brand-cream">
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
          {/* Headline & Subheadline */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-text-dark mb-4">
              Create Your Expense IQ Account
            </h1>
            <p className="text-lg text-brand-text-dark">
              Save 10+ hours a month with AI-powered expense tracking
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-brand-soft-gray/20 p-8">
            {!showSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Full Name <span className="text-brand-muted-teal">*</span>
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-brand-muted-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    getFieldStatus('fullName') === 'error' 
                      ? 'border-red-500 bg-red-50' 
                      : getFieldStatus('fullName') === 'success'
                      ? 'border-green-500 bg-green-50'
                      : 'border-brand-soft-gray/50 hover:border-brand-muted-teal hover:shadow-sm'
                  }`}
                  placeholder="Enter your full name"
                  required
                  aria-describedby={errors.fullName ? 'fullName-error' : 'fullName-help'}
                  aria-invalid={!!errors.fullName}
                />
                {errors.fullName && touched.fullName && (
                  <div id="fullName-error" className="mt-2 flex items-center space-x-1 text-sm text-red-600" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.fullName}</span>
                  </div>
                )}
                {!errors.fullName && touched.fullName && formData.fullName && (
                  <div className="mt-2 flex items-center space-x-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Looks good!</span>
                  </div>
                )}
              </div>

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
                  className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-brand-muted-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                    getFieldStatus('email') === 'error' 
                      ? 'border-red-500 bg-red-50' 
                      : getFieldStatus('email') === 'success'
                      ? 'border-green-500 bg-green-50'
                      : 'border-brand-soft-gray/50 hover:border-brand-muted-teal hover:shadow-sm'
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
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-brand-muted-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      getFieldStatus('password') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('password') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal hover:shadow-sm'
                    }`}
                    placeholder="Create a strong password"
                    required
                    aria-describedby={errors.password ? 'password-error' : 'password-help'}
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-soft-gray hover:text-brand-muted-teal transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {!errors.password && !touched.password && (
                  <p id="password-help" className="mt-2 text-sm text-brand-soft-gray">
                    Must be 8+ characters with uppercase, lowercase, and number
                  </p>
                )}
                {errors.password && touched.password && (
                  <div id="password-error" className="mt-2 flex items-center space-x-1 text-sm text-red-600" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.password}</span>
                  </div>
                )}
                {!errors.password && touched.password && formData.password && (
                  <div className="mt-2 flex items-center space-x-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Strong password!</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Confirm Password <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 pr-12 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-brand-muted-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      getFieldStatus('confirmPassword') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('confirmPassword') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal hover:shadow-sm'
                    }`}
                    placeholder="Confirm your password"
                    required
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    aria-invalid={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-brand-soft-gray hover:text-brand-muted-teal transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <div id="confirmPassword-error" className="mt-2 flex items-center space-x-1 text-sm text-red-600" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.confirmPassword}</span>
                  </div>
                )}
                {!errors.confirmPassword && touched.confirmPassword && formData.confirmPassword && (
                  <div className="mt-2 flex items-center space-x-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Passwords match!</span>
                  </div>
                )}
              </div>

              {/* Business Type */}
              <div>
                <label htmlFor="businessType" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Business Type <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    className={`w-full px-4 py-3 pr-10 rounded-xl border transition-all duration-200 focus:ring-2 focus:ring-brand-muted-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-white ${
                      getFieldStatus('businessType') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('businessType') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal hover:shadow-sm'
                    }`}
                    required
                    aria-describedby={errors.businessType ? 'businessType-error' : undefined}
                    aria-invalid={!!errors.businessType}
                  >
                    {businessTypes.map((type) => (
                      <option key={type.value} value={type.value} disabled={type.value === ''}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-brand-soft-gray pointer-events-none" />
                </div>
                {errors.businessType && touched.businessType && (
                  <div id="businessType-error" className="mt-2 flex items-center space-x-1 text-sm text-red-600" role="alert">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.businessType}</span>
                  </div>
                )}
                {!errors.businessType && touched.businessType && formData.businessType && (
                  <div className="mt-2 flex items-center space-x-1 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Business type selected</span>
                  </div>
                )}
              </div>

              {/* Submit Error */}
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || Object.values(errors).some(error => error !== undefined)}
                className="w-full bg-brand-dark-teal text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-dark-teal/90 focus:ring-2 focus:ring-brand-dark-teal focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-brand-soft-gray">
                  Already have an account?{' '}
                  <button
                    onClick={onNavigateToLogin}
                    disabled={isSubmitting}
                    className="text-brand-muted-teal hover:text-brand-dark-teal font-medium transition-colors"
                  >
                    Log in
                  </button>
                </p>
              </div>
            </form>
            ) : (
              /* Success State */
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-brand-text-dark mb-4">
                  Account Created Successfully!
                </h2>
                <p className="text-brand-text-muted mb-6">
                  Account created successfully! You can now log in with your credentials.
                </p>
                <p className="text-sm text-brand-text-muted">
                  Redirecting to login page...
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-light-beige py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-brand-soft-gray">
            By creating an account, you agree to our{' '}
            <button className="text-brand-muted-teal hover:text-brand-dark-teal transition-colors">
              Terms of Service
            </button>{' '}
            and{' '}
            <button className="text-brand-muted-teal hover:text-brand-dark-teal transition-colors">
              Privacy Policy
            </button>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SignUpPage;