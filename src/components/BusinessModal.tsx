import React, { useState } from 'react';
import { 
  X, 
  Building, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBusinessCreated: (business: any) => void;
  user: any;
}

const BusinessModal: React.FC<BusinessModalProps> = ({ 
  isOpen, 
  onClose, 
  onBusinessCreated, 
  user 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    businessType: 'freelancer'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const businessTypes = [
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'solopreneur', label: 'Solopreneur' },
    { value: 'small-business', label: 'Small Business' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Business name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccess('');

      // Create the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert([
          {
            name: formData.name.trim(),
            created_by: user.id
          }
        ])
        .select('*')
        .single();

      if (workspaceError) {
        throw workspaceError;
      }

      // Create workspace membership for the creator
      const { error: membershipError } = await supabase
        .from('workspace_members')
        .insert([
          {
            workspace_id: workspace.id,
            user_id: user.id,
            role: 'owner'
          }
        ]);

      if (membershipError) {
        throw membershipError;
      }

      setSuccess('Business created successfully!');
      
      // Call the callback with the new business
      onBusinessCreated(workspace);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setFormData({ name: '', description: '', businessType: 'freelancer' });
        setSuccess('');
      }, 1500);

    } catch (error) {
      console.error('Error creating business:', error);
      setError('Failed to create business. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setFormData({ name: '', description: '', businessType: 'freelancer' });
      setError('');
      setSuccess('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-brand-soft-gray/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-dark-teal/10 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-brand-dark-teal" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-text-dark">Create New Business</h2>
              <p className="text-sm text-brand-text-muted">Set up your first workspace</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-brand-soft-gray hover:text-brand-text-dark transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700">{success}</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Business Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-brand-text-dark mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50"
              placeholder="e.g., My Consulting LLC"
              required
            />
          </div>

          {/* Business Type */}
          <div>
            <label htmlFor="businessType" className="block text-sm font-medium text-brand-text-dark mb-2">
              Business Type
            </label>
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50"
            >
              {businessTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-brand-text-dark mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isSubmitting}
              rows={3}
              className="w-full px-4 py-3 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent disabled:opacity-50 resize-none"
              placeholder="Brief description of your business..."
            />
          </div>

          {/* Info Box */}
          <div className="p-4 bg-brand-soft-gray/10 rounded-lg">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-brand-muted-teal mt-0.5" />
              <div className="text-sm text-brand-text-muted">
                <p className="font-medium text-brand-text-dark mb-1">What happens next?</p>
                <ul className="space-y-1">
                  <li>• Your business workspace will be created</li>
                  <li>• You'll be set as the owner</li>
                  <li>• You can start adding expenses immediately</li>
                  <li>• Invite team members later if needed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-brand-soft-gray/30 text-brand-text-muted rounded-lg hover:border-brand-muted-teal hover:text-brand-dark-teal transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim()}
              className="flex-1 px-4 py-3 bg-brand-dark-teal text-white rounded-lg hover:bg-brand-dark-teal/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Building className="w-4 h-4" />
                  <span>Create Business</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BusinessModal;
