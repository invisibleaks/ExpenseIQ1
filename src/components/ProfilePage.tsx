import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  ArrowLeft, 
  User, 
  Edit3, 
  Save, 
  X, 
  Camera, 
  Mail, 
  Phone, 
  Building,
  Briefcase,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { supabase, getUserProfile, updateUserProfile, getUserMetadata } from '../lib/supabase';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  business_type: string;
  avatar_url?: string;
  phone?: string;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

interface ProfilePageProps {
  onBack: () => void;
  user: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onBack, user }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form state for editing
  const [editForm, setEditForm] = useState({
    full_name: '',
    business_type: '',
    phone: '',
    company_name: ''
  });

  const businessTypes = [
    { value: 'freelancer', label: 'Freelancer' },
    { value: 'solopreneur', label: 'Solopreneur' },
    { value: 'small-business', label: 'Small Business' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch user profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError('');

      // Try to get profile from the new user_profiles table
      const { data: profileData, error: profileError } = await getUserProfile();
      
      if (profileError) {
        console.log('Profile not found, trying metadata fallback:', profileError);
        
        // Fallback to user metadata for existing users
        const { data: metadata, error: metadataError } = await getUserMetadata();
        
        if (metadataError) {
          throw metadataError;
        }

        if (metadata) {
          // Create a profile object from metadata
          const fallbackProfile: UserProfile = {
            id: user.id,
            user_id: user.id,
            full_name: metadata.full_name || 'Unknown',
            business_type: metadata.business_type || 'other',
            avatar_url: metadata.avatar_url,
            phone: metadata.phone,
            company_name: metadata.company_name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          setProfile(fallbackProfile);
          setEditForm({
            full_name: fallbackProfile.full_name,
            business_type: fallbackProfile.business_type,
            phone: fallbackProfile.phone || '',
            company_name: fallbackProfile.company_name || ''
          });
        }
      } else if (profileData && profileData.length > 0) {
        const profileRecord = profileData[0];
        setProfile(profileRecord);
        setEditForm({
          full_name: profileRecord.full_name,
          business_type: profileRecord.business_type,
          phone: profileRecord.phone || '',
          company_name: profileRecord.company_name || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    if (profile) {
      setEditForm({
        full_name: profile.full_name,
        business_type: profile.business_type,
        phone: profile.phone || '',
        company_name: profile.company_name || ''
      });
    }
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const { data, error } = await updateUserProfile({
        full_name: editForm.full_name,
        business_type: editForm.business_type,
        phone: editForm.phone || null,
        company_name: editForm.company_name || null
      });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        const updatedProfile = data[0];
        setProfile(updatedProfile);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-light-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-brand-dark-teal rounded-lg flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <p className="text-brand-text-dark">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-brand-light-beige flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-brand-text-dark">Profile not found</p>
          <button
            onClick={fetchUserProfile}
            className="mt-4 px-4 py-2 bg-brand-dark-teal text-white rounded-lg hover:bg-brand-dark-teal/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light-beige">
      {/* Header */}
      <header className="bg-white border-b border-brand-soft-gray/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button */}
            <button 
              onClick={onBack}
              className="flex items-center space-x-2 text-brand-muted-teal hover:text-brand-dark-teal transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-dark-teal rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-brand-text-dark">Expense IQ</span>
            </div>

            {/* Spacer */}
            <div className="w-24"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-text-dark mb-2">Profile Settings</h1>
          <p className="text-brand-text-muted">Manage your account information and preferences</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-700">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-soft-gray/20 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-brand-dark-teal to-brand-muted-teal p-6 text-white">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.full_name}</h2>
                <p className="text-white/80 capitalize">{profile.business_type.replace('-', ' ')}</p>
                <p className="text-white/60 text-sm">Member since {formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="p-6">
            {!isEditing ? (
              /* View Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-brand-muted-teal" />
                      <div>
                        <p className="text-sm text-brand-text-muted">Full Name</p>
                        <p className="font-medium text-brand-text-dark">{profile.full_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-brand-muted-teal" />
                      <div>
                        <p className="text-sm text-brand-text-muted">Email</p>
                        <p className="font-medium text-brand-text-dark">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-5 h-5 text-brand-muted-teal" />
                      <div>
                        <p className="text-sm text-brand-text-muted">Business Type</p>
                        <p className="font-medium text-brand-text-dark capitalize">
                          {profile.business_type.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {profile.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-brand-muted-teal" />
                        <div>
                          <p className="text-sm text-brand-text-muted">Phone</p>
                          <p className="font-medium text-brand-text-dark">{profile.phone}</p>
                        </div>
                      </div>
                    )}

                    {profile.company_name && (
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-brand-muted-teal" />
                        <div>
                          <p className="text-sm text-brand-text-muted">Company</p>
                          <p className="font-medium text-brand-text-dark">{profile.company_name}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-brand-muted-teal" />
                      <div>
                        <p className="text-sm text-brand-text-muted">Last Updated</p>
                        <p className="font-medium text-brand-text-dark">{formatDate(profile.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-soft-gray/20">
                  <button
                    onClick={handleEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-dark-teal text-white rounded-lg hover:bg-brand-dark-teal/90 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-text-dark mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="full_name"
                        value={editForm.full_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-text-dark mb-2">
                        Business Type
                      </label>
                      <select
                        name="business_type"
                        value={editForm.business_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                        required
                      >
                        {businessTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-brand-text-dark mb-2">
                        Phone (Optional)
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={editForm.phone}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-brand-text-dark mb-2">
                        Company Name (Optional)
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={editForm.company_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-brand-soft-gray/30 rounded-lg focus:ring-2 focus:ring-brand-dark-teal focus:border-transparent"
                        placeholder="Your Company LLC"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-soft-gray/20 flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 bg-brand-dark-teal text-white rounded-lg hover:bg-brand-dark-teal/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>

                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-4 py-2 border border-brand-soft-gray/30 text-brand-text-muted rounded-lg hover:border-brand-muted-teal hover:text-brand-dark-teal transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
