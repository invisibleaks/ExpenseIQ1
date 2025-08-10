import React, { useState } from 'react';
import { ArrowLeft, DollarSign, Calendar, Building, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ManualExpensePageProps {
  onBack: () => void;
  activeWorkspaceId: string | null;
  currentUser: { id: string } | null;
}

interface FormData {
  date: string;
  merchant: string;
  amount: string;
  notes: string;
}

interface FormErrors {
  merchant?: string;
  amount?: string;
  submit?: string;
}

const ManualExpensePage: React.FC<ManualExpensePageProps> = ({
  onBack,
  activeWorkspaceId,
  currentUser
}) => {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0], // Today's date
    merchant: '',
    amount: '',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Check if form should be disabled
  const isFormDisabled = !activeWorkspaceId || !currentUser;
  
  // Debug: Check Supabase configuration
  React.useEffect(() => {
    console.log('ManualExpensePage Debug Info:', {
      activeWorkspaceId,
      currentUser: currentUser?.id,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
    });
  }, [activeWorkspaceId, currentUser]);

  // Validation functions
  const validateMerchant = (merchant: string): string | undefined => {
    if (!merchant.trim()) return 'Merchant name is required';
    if (merchant.trim().length < 2) return 'Merchant name must be at least 2 characters';
    return undefined;
  };

  const validateAmount = (amount: string): string | undefined => {
    if (!amount.trim()) return 'Amount is required';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 'Please enter a valid number';
    if (numAmount <= 0) return 'Amount must be greater than 0';
    if (numAmount > 999999.99) return 'Amount is too large';
    return undefined;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear submit error when user starts typing
    if (errors.submit) {
      setErrors(prev => ({ ...prev, submit: undefined }));
    }

    // Real-time validation for touched fields
    if (touched[name]) {
      let error: string | undefined;
      if (name === 'merchant') error = validateMerchant(value);
      if (name === 'amount') error = validateAmount(value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  // Handle field blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    let error: string | undefined;
    if (name === 'merchant') error = validateMerchant(value);
    if (name === 'amount') error = validateAmount(value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  // Clear form
  const clearForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      amount: '',
      notes: ''
    });
    setErrors({});
    setTouched({});
  };

  // Show success toast
  const showToast = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isFormDisabled) return;

    // Mark all required fields as touched
    setTouched({ merchant: true, amount: true });

    // Validate all fields
    const merchantError = validateMerchant(formData.merchant);
    const amountError = validateAmount(formData.amount);

    setErrors({
      merchant: merchantError,
      amount: amountError
    });

    // Check if there are validation errors
    if (merchantError || amountError) return;

    setIsSubmitting(true);

    try {
      // Debug: Log the data being inserted
      const insertData = {
        workspace_id: activeWorkspaceId,
        user_id: currentUser!.id,
        source: 'manual',
        status: 'unreviewed',
        txn_date: formData.date,
        merchant: formData.merchant.trim(),
        amount: parseFloat(formData.amount),
        notes: formData.notes.trim() || null,
        currency: 'INR' // Default currency
      };
      
      console.log('Attempting to insert expense:', insertData);
      
      // Insert into Supabase
      const { error } = await supabase
        .from('expenses')
        .insert(insertData);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Success
      showToast();
      clearForm();

    } catch (error: any) {
      console.error('Error saving expense:', error);
      
      // Provide more specific error messages
      let errorMessage = "Couldn't save. Please try again.";
      
      if (error?.message) {
        if (error.message.includes('RLS')) {
          errorMessage = "Access denied. Please check your workspace permissions.";
        } else if (error.message.includes('foreign key')) {
          errorMessage = "Invalid workspace or user. Please refresh and try again.";
        } else if (error.message.includes('type')) {
          errorMessage = "Invalid data format. Please check your entries.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get field status for styling
  const getFieldStatus = (fieldName: string) => {
    if (!touched[fieldName]) return 'default';
    if (errors[fieldName as keyof FormErrors]) return 'error';
    if (formData[fieldName as keyof FormData]) return 'success';
    return 'default';
  };

  return (
    <div className="min-h-screen bg-brand-light-beige">
      {/* Header */}
      <header className="bg-brand-darker-teal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-brand-muted-teal hover:text-brand-warm-beige transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>

            {/* Title */}
            <h1 className="text-xl font-bold text-brand-text-light">Add Expense</h1>

            {/* Spacer */}
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Disabled Banner */}
          {isFormDisabled && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-700 font-medium">
                  Select a business to add expenses.
                </p>
              </div>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-brand-soft-gray/20 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-brand-dark-teal/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <DollarSign className="w-6 h-6 text-brand-dark-teal" />
              </div>
              <h2 className="text-xl font-bold text-brand-text-dark">Manual Entry</h2>
              <p className="text-sm text-brand-text-muted">Add expense details manually</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date Field */}
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Date <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    disabled={isFormDisabled || isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-brand-soft-gray/50 rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    required
                  />
                </div>
              </div>

              {/* Merchant Field */}
              <div>
                <label htmlFor="merchant" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Merchant <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <input
                    type="text"
                    id="merchant"
                    name="merchant"
                    value={formData.merchant}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isFormDisabled || isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      getFieldStatus('merchant') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('merchant') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal'
                    }`}
                    placeholder="Enter merchant name"
                    required
                  />
                </div>
                {errors.merchant && touched.merchant && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.merchant}</span>
                  </p>
                )}
              </div>

              {/* Amount Field */}
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Amount <span className="text-brand-muted-teal">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-brand-soft-gray" />
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isFormDisabled || isSubmitting}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                      getFieldStatus('amount') === 'error' 
                        ? 'border-red-500 bg-red-50' 
                        : getFieldStatus('amount') === 'success'
                        ? 'border-green-500 bg-green-50'
                        : 'border-brand-soft-gray/50 hover:border-brand-muted-teal'
                    }`}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    max="999999.99"
                    required
                  />
                </div>
                {errors.amount && touched.amount && (
                  <p className="mt-2 text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.amount}</span>
                  </p>
                )}
              </div>

              {/* Notes Field */}
              <div>
                <label htmlFor="notes" className="block text-sm font-semibold text-brand-text-dark mb-2">
                  Notes <span className="text-brand-soft-gray">(optional)</span>
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-brand-soft-gray" />
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    disabled={isFormDisabled || isSubmitting}
                    className="w-full pl-10 pr-4 py-3 border border-brand-soft-gray/50 rounded-xl focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.submit}</span>
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isFormDisabled || isSubmitting || !!errors.merchant || !!errors.amount}
                className="w-full bg-brand-dark-teal text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-dark-teal/90 focus:ring-2 focus:ring-brand-dark-teal focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Add Expense</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 z-50 animate-in slide-in-from-bottom-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Expense added</span>
        </div>
      )}
    </div>
  );
};

export default ManualExpensePage;