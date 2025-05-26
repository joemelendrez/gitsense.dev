import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          github_token: string | null
          subscription_tier: 'free' | 'pro' | 'team' | 'enterprise'
          usage_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          github_token?: string | null
          subscription_tier?: 'free' | 'pro' | 'team' | 'enterprise'
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          github_token?: string | null
          subscription_tier?: 'free' | 'pro' | 'team' | 'enterprise'
          usage_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          user_id: string
          repository_url: string
          analysis_type: 'structure' | 'code_summary' | 'ai_enhanced'
          content: any
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          repository_url: string
          analysis_type: 'structure' | 'code_summary' | 'ai_enhanced'
          content: any
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          repository_url?: string
          analysis_type?: 'structure' | 'code_summary' | 'ai_enhanced'
          content?: any
          created_at?: string
        }
      }
    }
  }
}