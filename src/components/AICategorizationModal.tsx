import React, { useState, useEffect } from 'react';
import { X, Brain, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { aiCategorizationService, AICategorizationResult, ExpenseContext, DEFAULT_CATEGORIES } from '../lib/ai-categorization';

interface AICategorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseContext;
  onAccept: (result: AICategorizationResult) => void;
  onManualOverride: () => void;
}

const AICategorizationModal: React.FC<AICategorizationModalProps> = ({
  isOpen,
  onClose,
  expense,
  onAccept,
  onManualOverride
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AICategorizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAIAvailable, setIsAIAvailable] = useState(false);

  useEffect(() => {
    if (isOpen && expense.merchant) {
      setIsAIAvailable(aiCategorizationService.isAvailable());
      if (isAIAvailable) {
        categorizeExpense();
      }
    }
  }, [isOpen, expense.merchant, isAIAvailable]);

  const categorizeExpense = async () => {
    if (!expense.merchant.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const aiResult = await aiCategorizationService.categorizeExpense(expense);
      setResult(aiResult);
    } catch (err: any) {
      setError(err.message || 'AI categorization failed');
    } finally {
      setIsLoading(false);
    }
  }

  const handleAccept = () => {
    if (result) {
      onAccept(result);
      onClose();
    }
  };

  const handleRetry = () => {
    categorizeExpense();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600';
    if (confidence >= 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.7) return 'Medium';
    return 'Low';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Categorization</h2>
              <p className="text-sm text-gray-500">Smart expense categorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Expense Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Expense Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div><span className="font-medium">Merchant:</span> {expense.merchant}</div>
              <div><span className="font-medium">Amount:</span> {expense.currency} {expense.amount}</div>
              {expense.date && <div><span className="font-medium">Date:</span> {expense.date}</div>}
              {expense.notes && <div><span className="font-medium">Notes:</span> {expense.notes}</div>}
            </div>
          </div>

          {/* AI Status */}
          {!isAIAvailable && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">AI Not Available</p>
                  <p className="text-xs text-yellow-700">
                    Add VITE_OPENAI_API_KEY to your environment variables to enable AI categorization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="mb-6 p-6 text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Analyzing expense with AI...</p>
              <p className="text-xs text-gray-500 mt-1">This may take a few seconds</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Categorization Failed</p>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* AI Result */}
          {result && !isLoading && !error && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">AI Suggestion</h3>
              </div>

              {/* Category */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Category</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getConfidenceColor(result.confidence)} bg-white`}>
                      {getConfidenceLabel(result.confidence)} Confidence
                    </span>
                    <span className="text-xs text-gray-500">
                      {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-lg font-bold text-blue-900">{result.category}</div>
                <p className="text-sm text-gray-600 mt-1">{result.reasoning}</p>
              </div>

              {/* Payment Method Suggestion */}
              {result.suggestedPaymentMethod && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <span className="text-sm font-medium text-gray-700">Suggested Payment Method</span>
                  <div className="text-lg font-bold text-green-900 mt-1">{result.suggestedPaymentMethod}</div>
                </div>
              )}

              {/* Confidence Explanation */}
              <div className="text-xs text-gray-500 text-center">
                {result.confidence >= 0.9 && "AI is very confident about this categorization"}
                {result.confidence >= 0.8 && result.confidence < 0.9 && "AI is confident about this categorization"}
                {result.confidence >= 0.7 && result.confidence < 0.8 && "AI is somewhat confident, but you may want to review"}
                {result.confidence < 0.7 && "AI has low confidence, please review carefully"}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {result && !isLoading && !error && (
              <button
                onClick={handleAccept}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Accept AI Suggestion</span>
              </button>
            )}

            <button
              onClick={onManualOverride}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all"
            >
              Choose Manually
            </button>

            <button
              onClick={onClose}
              className="w-full text-gray-500 py-2 px-6 rounded-xl font-medium hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>

          {/* AI Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <Brain className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">How AI Categorization Works</span>
            </div>
            <p className="text-xs text-gray-600">
              Our AI analyzes the merchant name, amount, and context to suggest the most appropriate category. 
              It learns from patterns and improves over time. You can always override the suggestion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICategorizationModal;
