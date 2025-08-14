import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helper functions
export const signUp = async (email: string, password: string, fullName: string, businessType: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        business_type: businessType,
      },
      // Disable email confirmation requirement
      emailRedirectTo: undefined
    }
  })
  
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  return { data, error }
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/account`
    }
  })
  
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  
  return { data, error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback)
}

// User profile functions
export const getUserProfile = async () => {
  const { data, error } = await supabase.rpc('get_my_profile')
  return { data, error }
}

export const updateUserProfile = async (updates: {
  full_name?: string
  business_type?: string
  avatar_url?: string
  phone?: string
  company_name?: string
}) => {
  const { data, error } = await supabase.rpc('update_my_profile', updates)
  return { data, error }
}

// Get user metadata from auth (fallback for existing users)
export const getUserMetadata = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return { data: null, error }
  
  return { 
    data: user?.user_metadata || null, 
    error: null 
  }
}