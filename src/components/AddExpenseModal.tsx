import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Upload, Camera, Edit3, ArrowLeft, DollarSign, Calendar, Building, FileText, Tag, CreditCard, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { voiceAnalysisService, VoiceAnalysisResult } from '../lib/voice-analysis';
import { supabase } from '../lib/supabase';
import { AICategorizationResult } from '../lib/ai-categorization';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspaceId: string | null;
  currentUser: { id: string } | null;
  onExpenseAdded?: () => void;
}

interface FormData {
  date: string;
  merchant: string;
  amount: string;
  description: string;
  categoryId: string;
  customCategory: string;
  paymentMethodId: string;
  notes: string;
  isReimbursable: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface FormErrors {
  merchant?: string;
  amount?: string;
  description?: string;
  categoryId?: string;
  customCategory?: string;
  submit?: string;
}

type ModalView = 'main' | 'voice' | 'manual' | 'upload' | 'camera' | 'form';

const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  activeWorkspaceId,
  currentUser,
  onExpenseAdded
}) => {
  const [currentView, setCurrentView] = useState<ModalView>('main');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<VoiceAnalysisResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [expenseSource, setExpenseSource] = useState<'voice' | 'manual'>('manual');
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    merchant: '',
    amount: '',
    description: '',
    categoryId: '',
    customCategory: '',
    paymentMethodId: '',
    notes: '',
    isReimbursable: false
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<AICategorizationResult | null>(null);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const aiCategorizationTimeout = useRef<NodeJS.Timeout | null>(null);

  const isFormDisabled = !activeWorkspaceId || !currentUser;

  // Load categories and payment methods
  useEffect(() => {
    if (activeWorkspaceId && currentUser && isOpen) {
      loadFormData();
    }
  }, [activeWorkspaceId, currentUser, isOpen]);

  // Reset date to today when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (aiCategorizationTimeout.current) {
        clearTimeout(aiCategorizationTimeout.current);
      }
    };
  }, []);

  const loadFormData = async () => {
    setIsLoadingData(true);
    try {
      const [categoriesResult, paymentMethodsResult] = await Promise.all([
        supabase.from('global_categories').select('*').order('name'),
        supabase.from('payment_methods').select('*').eq('workspace_id', activeWorkspaceId).order('name')
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (paymentMethodsResult.data) setPaymentMethods(paymentMethodsResult.data);
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleClose = () => {
    setCurrentView('main');
    setVoiceResult(null);
    setVoiceError(null);
    setExpenseSource('manual');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      amount: '',
      description: '',
      categoryId: '',
      customCategory: '',
      paymentMethodId: '',
      notes: '',
      isReimbursable: false
    });
    setErrors({});
    setAiResult(null);
    onClose();
  };

  const handleVoiceInput = async (voiceText: string) => {
    console.log('🎤 Voice input handler called with:', voiceText);
    setIsVoiceProcessing(true);
    setVoiceError(null);
    
    try {
      console.log('🎤 Processing voice input:', voiceText);
      
      // Analyze the voice input using our voice analysis service
      const analysisResult = await voiceAnalysisService.analyzeVoiceInput(voiceText);
      console.log('🔍 Voice analysis result:', analysisResult);
      
      if ('error' in analysisResult) {
        console.error('Voice analysis failed:', analysisResult);
        setVoiceError(analysisResult.message);
        return;
      }
      
      console.log('✅ Voice analysis successful:', analysisResult);
      setVoiceResult(analysisResult);
      
      // Populate form with voice data
      populateFormFromVoice(analysisResult);
      
      // Set the source as voice
      setExpenseSource('voice');
      
      // Show success message briefly before switching to form view
      setTimeout(() => {
        setCurrentView('form');
        setVoiceResult(null); // Clear the voice result once we're in form view
      }, 2000);
      
    } catch (error) {
      console.error('Voice processing failed:', error);
      setVoiceError('Failed to process voice input. Please try again.');
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  const populateFormFromVoice = (voiceData: VoiceAnalysisResult) => {
    setFormData(prev => ({
      ...prev,
      merchant: voiceData.merchant || prev.merchant,
      amount: voiceData.amount ? voiceData.amount.toString() : prev.amount,
      description: voiceData.description || prev.description,
      date: voiceData.date || prev.date,
      notes: voiceData.notes || prev.notes
    }));
    
    // Clear any previous AI results when using voice input
    setAiResult(null);
    
    // Trigger AI categorization after a 2-second delay
    setTimeout(() => {
      triggerVoiceAICategorization(voiceData);
    }, 2000);
  };

  const triggerVoiceAICategorization = async (voiceData: VoiceAnalysisResult) => {
    if (!activeWorkspaceId || !currentUser) return;
    
    try {
      console.log('🤖 Triggering AI categorization for voice input');
      
      // Use the AI categorization service directly with voice data
      const aiCategorizationService = await import('../lib/ai-categorization');
      
      if (aiCategorizationService.aiCategorizationService.isAvailable()) {
        const expenseContext = {
          merchant: voiceData.merchant,
          amount: voiceData.amount,
          description: voiceData.description,
          date: voiceData.date,
          currency: 'INR',
          notes: voiceData.notes
        };
        
        const aiResult = await aiCategorizationService.aiCategorizationService.categorizeExpense(expenseContext);
        
        if (aiResult && !('error' in aiResult)) {
          console.log('✅ AI categorization successful:', aiResult);
          setAiResult(aiResult);
          
          // Auto-select the suggested category if available
          if (aiResult.category && categories.length > 0) {
            const suggestedCategory = categories.find(cat => cat.name === aiResult.category);
            if (suggestedCategory) {
              setFormData(prev => ({
                ...prev,
                categoryId: suggestedCategory.id
              }));
              console.log('✅ Auto-selected category:', suggestedCategory.name);
            }
          }
          
          // Auto-select the suggested payment method if available
          if (aiResult.suggestedPaymentMethod && paymentMethods.length > 0) {
            const suggestedPaymentMethod = paymentMethods.find(pm => pm.name === aiResult.suggestedPaymentMethod);
            if (suggestedPaymentMethod) {
              setFormData(prev => ({
                ...prev,
                paymentMethodId: suggestedPaymentMethod.id
              }));
              console.log('✅ Auto-selected payment method:', suggestedPaymentMethod.name);
            }
          }
        }
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
    }
  };

  const handleManualEntry = () => {
    console.log('Manual entry selected');
    setExpenseSource('manual');
    setCurrentView('form');
  };

  const handleUpload = () => {
    // TODO: Implement file upload functionality
    console.log('Upload selected');
  };

  const handleCameraCapture = () => {
    // TODO: Implement camera capture functionality
    console.log('Camera capture selected');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Trigger AI categorization for manual entry when key fields are filled
    if (expenseSource === 'manual' && ['merchant', 'amount', 'description'].includes(name)) {
      // Debounce AI categorization to avoid too many requests
      if (aiCategorizationTimeout.current) {
        clearTimeout(aiCategorizationTimeout.current);
      }
      aiCategorizationTimeout.current = setTimeout(() => {
        triggerManualAICategorization();
      }, 2000); // 2-second delay
    }
  };

  const triggerManualAICategorization = async () => {
    if (!activeWorkspaceId || !currentUser || expenseSource !== 'manual') return;
    
    // Only trigger if we have sufficient data
    if (!formData.merchant || !formData.amount || !formData.description) return;
    
    try {
      console.log('🤖 Triggering AI categorization for manual entry');
      
      // Use the AI categorization service directly
      const aiCategorizationService = await import('../lib/ai-categorization');
      
      if (aiCategorizationService.aiCategorizationService.isAvailable()) {
        const expenseContext = {
          merchant: formData.merchant,
          amount: parseFloat(formData.amount),
          description: formData.description,
          date: formData.date,
          currency: 'INR'
        };
        
        const aiResult = await aiCategorizationService.aiCategorizationService.categorizeExpense(expenseContext);
        
        if (aiResult && !('error' in aiResult)) {
          console.log('✅ AI categorization successful:', aiResult);
          setAiResult(aiResult);
          
          // Auto-select the suggested category if available and user hasn't selected one yet
          if (aiResult.category && !formData.categoryId && categories.length > 0) {
            const suggestedCategory = categories.find(cat => cat.name === aiResult.category);
            if (suggestedCategory) {
              setFormData(prev => ({
                ...prev,
                categoryId: suggestedCategory.id
              }));
              console.log('✅ Auto-selected category:', suggestedCategory.name);
            }
          }
          
          // Auto-select the suggested payment method if available and user hasn't selected one yet
          if (aiResult.suggestedPaymentMethod && !formData.paymentMethodId && paymentMethods.length > 0) {
            const suggestedPaymentMethod = paymentMethods.find(pm => pm.name === aiResult.suggestedPaymentMethod);
            if (suggestedPaymentMethod) {
              setFormData(prev => ({
                ...prev,
                paymentMethodId: suggestedPaymentMethod.id
              }));
              console.log('✅ Auto-selected payment method:', suggestedPaymentMethod.name);
            }
          }
        }
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    
    if (!formData.merchant.trim()) {
      newErrors.merchant = 'Merchant name is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }
    
    if (formData.categoryId && categories.find(cat => cat.id === formData.categoryId)?.name === 'Other' && !formData.customCategory.trim()) {
      newErrors.customCategory = 'Please specify the custom category';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting || isFormDisabled) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const expenseData = {
        merchant: formData.merchant.trim(),
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        txn_date: formData.date,
        global_category_id: formData.categoryId,
        payment_method_id: formData.paymentMethodId || null,
        notes: formData.notes.trim() || null,
        is_reimbursable: formData.isReimbursable,
        workspace_id: activeWorkspaceId,
        user_id: currentUser?.id,
        currency: 'INR',
        source: expenseSource, // Tag correctly based on source
        status: 'unreviewed' as const,
        category_confidence: aiResult?.confidence || 0,
        category_source: aiResult ? 'ai' : 'manual',
        payment_method_source: aiResult ? 'ai' : 'manual',
      };
      
      console.log('💾 Submitting expense data:', expenseData);
      
      const { error } = await supabase.from('expenses').insert([expenseData]);
      
      if (error) {
        console.error('Error creating expense:', error);
        let errorMessage = 'Failed to create expense. Please try again.';
        
        // Provide more specific error messages
        if (error.message.includes('global_category_id')) {
          errorMessage = 'Please select a valid category.';
        } else if (error.message.includes('workspace_id')) {
          errorMessage = 'Invalid workspace. Please refresh and try again.';
        } else if (error.message.includes('user_id')) {
          errorMessage = 'Authentication error. Please log in again.';
        } else if (error.message.includes('payment_method_id')) {
          errorMessage = 'Invalid payment method selected.';
        }
        
        setErrors({ submit: errorMessage });
        return;
      }
      
      console.log('✅ Expense created successfully');
      setShowSuccessToast(true);
      
      // Call onExpenseAdded callback
      if (onExpenseAdded) {
        onExpenseAdded();
      }
      
      // Close modal after a brief delay
      setTimeout(() => {
        handleClose();
        setShowSuccessToast(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error submitting expense:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {currentView !== 'main' && (
              <button
                onClick={() => setCurrentView('main')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-xl font-bold text-gray-900">
              {currentView === 'main' && 'Add Expense'}
              {currentView === 'voice' && 'Voice Input'}
              {currentView === 'manual' && 'Manual Entry'}
              {currentView === 'upload' && 'Upload Receipt'}
              {currentView === 'camera' && 'Camera Capture'}
              {currentView === 'form' && 'Expense Details'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentView === 'main' && (
            <div className="space-y-4">
              <p className="text-gray-600 text-center mb-6">
                Choose how you'd like to add your expense
              </p>
              
              {/* Voice Input Card */}
              <button
                onClick={() => setCurrentView('voice')}
                disabled={isFormDisabled}
                className="w-full p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-purple-100 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800">Voice Input</h3>
                    <p className="text-sm text-gray-600">Speak your expense details</p>
                  </div>
                </div>
              </button>

              {/* Manual Entry Card */}
              <button
                onClick={handleManualEntry}
                disabled={isFormDisabled}
                className="w-full p-6 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl hover:from-green-100 hover:to-teal-100 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                    <Edit3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800">Manual Entry</h3>
                    <p className="text-sm text-gray-600">Enter expense details manually</p>
                  </div>
                </div>
              </button>

              {/* Upload Receipt Card */}
              <button
                onClick={handleUpload}
                disabled={isFormDisabled}
                className="w-full p-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800">Upload Receipt</h3>
                    <p className="text-sm text-gray-600">Upload receipt image or PDF</p>
                  </div>
                </div>
              </button>

              {/* Camera Capture Card */}
              <button
                onClick={handleCameraCapture}
                disabled={isFormDisabled}
                className="w-full p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-800">Camera Capture</h3>
                    <p className="text-sm text-gray-600">Take photo with camera</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {currentView === 'voice' && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Voice Input</h3>
                <p className="text-sm text-gray-600">Speak your expense details clearly</p>
              </div>
              
              {/* Voice Input Interface */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <div className="text-center">
                  <button
                    onClick={() => {
                      // Start voice recognition
                      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                        const recognition = new SpeechRecognition();
                        
                        recognition.continuous = false;
                        recognition.interimResults = false;
                        recognition.lang = 'en-US';
                        
                        recognition.onstart = () => {
                          setIsVoiceProcessing(true);
                          setVoiceError(null);
                        };
                        
                        recognition.onresult = (event) => {
                          const transcript = event.results[0][0].transcript;
                          handleVoiceInput(transcript);
                        };
                        
                        recognition.onerror = () => {
                          setVoiceError('Voice recognition failed. Please try again.');
                          setIsVoiceProcessing(false);
                        };
                        
                        recognition.onend = () => {
                          setIsVoiceProcessing(false);
                        };
                        
                        recognition.start();
                      } else {
                        setVoiceError('Voice recognition is not supported in this browser.');
                      }
                    }}
                    disabled={isVoiceProcessing || isFormDisabled}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg flex items-center justify-center space-x-3"
                  >
                    <Mic className="w-6 h-6" />
                    <span>{isVoiceProcessing ? 'Listening...' : 'Click to Start Voice Input'}</span>
                  </button>
                  
                  {isVoiceProcessing && (
                    <p className="mt-4 text-sm text-blue-600">Listening... Speak now!</p>
                  )}
                </div>
              </div>
              
              {/* Voice Processing Status */}
              {isVoiceProcessing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-sm text-blue-700">Processing your voice input...</span>
                  </div>
                </div>
              )}
              
              {/* Voice Error */}
              {voiceError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-red-700">{voiceError}</span>
                  </div>
                </div>
              )}
              
              {/* Voice Success */}
              {voiceResult && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-green-700">
                      Voice input processed successfully! Closing in 2 seconds...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'manual' && (
            <div className="text-center py-8">
              <p className="text-gray-600">Redirecting to manual entry form...</p>
            </div>
          )}

          {currentView === 'upload' && (
            <div className="text-center py-8">
              <p className="text-gray-600">Upload functionality coming soon...</p>
            </div>
          )}

          {currentView === 'camera' && (
            <div className="text-center py-8">
              <p className="text-gray-600">Camera capture functionality coming soon...</p>
            </div>
          )}

          {currentView === 'form' && (
            <div className="space-y-4">
              {/* Loading Data Banner */}
              {isLoadingData && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <p className="text-sm text-blue-700 font-medium">
                      Loading categories and payment methods...
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date Field */}
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      disabled={isFormDisabled || isSubmitting}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Merchant Field */}
                <div>
                  <label htmlFor="merchant" className="block text-sm font-semibold text-gray-700 mb-2">
                    Merchant <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="merchant"
                      name="merchant"
                      value={formData.merchant}
                      onChange={handleInputChange}
                      disabled={isFormDisabled || isSubmitting}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        errors.merchant ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Enter merchant name"
                      required
                    />
                  </div>
                  {errors.merchant && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.merchant}</span>
                    </p>
                  )}
                </div>

                {/* Amount Field */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      disabled={isFormDisabled || isSubmitting}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        errors.amount ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.amount}</span>
                    </p>
                  )}
                </div>

                {/* Description Field */}
                <div>
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      disabled={isFormDisabled || isSubmitting}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        errors.description ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="What was this expense for?"
                      required
                    />
                  </div>
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.description}</span>
                    </p>
                  )}
                </div>

                {/* Category Field */}
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                    {aiResult && aiResult.category && (
                      <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        AI Suggested
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      disabled={isFormDisabled || isSubmitting || isLoadingData}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        errors.categoryId ? 'border-red-500 bg-red-50' : 
                        aiResult && categories.find(cat => cat.name === aiResult.category)?.id === formData.categoryId ? 'border-blue-500 bg-blue-50' :
                        'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                          {aiResult && aiResult.category === category.name && ' (AI Suggested)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.categoryId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.categoryId}</span>
                    </p>
                  )}
                  {aiResult && aiResult.category && aiResult.confidence && (
                    <p className="mt-1 text-xs text-blue-600">
                      AI confidence: {Math.round(aiResult.confidence * 100)}%
                    </p>
                  )}
                </div>

                {/* Custom Category Field (only shown when "Other" is selected) */}
                {formData.categoryId && categories.find(cat => cat.id === formData.categoryId)?.name === 'Other' && (
                  <div>
                    <label htmlFor="customCategory" className="block text-sm font-semibold text-gray-700 mb-2">
                      Custom Category <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="customCategory"
                      name="customCategory"
                      value={formData.customCategory}
                      onChange={handleInputChange}
                      disabled={isFormDisabled || isSubmitting}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        errors.customCategory ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="Specify your custom category"
                      required
                    />
                    {errors.customCategory && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.customCategory}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Method Field */}
                <div>
                  <label htmlFor="paymentMethodId" className="block text-sm font-semibold text-gray-700 mb-2">
                    Payment Method
                    {aiResult && aiResult.suggestedPaymentMethod && (
                      <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        AI Suggested
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      id="paymentMethodId"
                      name="paymentMethodId"
                      value={formData.paymentMethodId}
                      onChange={handleInputChange}
                      disabled={isFormDisabled || isSubmitting || isLoadingData}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        aiResult && paymentMethods.find(pm => pm.name === aiResult.suggestedPaymentMethod)?.id === formData.paymentMethodId ? 'border-green-500 bg-green-50' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select payment method (optional)</option>
                      {paymentMethods.map((method) => (
                        <option key={method.id} value={method.id}>
                          {method.name}
                          {aiResult && aiResult.suggestedPaymentMethod === method.name && ' (AI Suggested)'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reimbursable Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isReimbursable"
                    name="isReimbursable"
                    checked={formData.isReimbursable}
                    onChange={handleInputChange}
                    disabled={isFormDisabled || isSubmitting}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                  />
                  <label htmlFor="isReimbursable" className="text-sm font-medium text-gray-700">
                    This expense is reimbursable
                  </label>
                </div>

                {/* Notes Field */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                    Notes <span className="text-gray-500">(optional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      disabled={isFormDisabled || isSubmitting}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all resize-none"
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
                  disabled={isFormDisabled || isSubmitting || isLoadingData}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
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
          )}
        </div>

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-1 z-50 animate-in slide-in-from-bottom-2">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Expense added successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddExpenseModal;
