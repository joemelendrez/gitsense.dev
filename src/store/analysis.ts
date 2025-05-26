import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Fix: Update interface to match database schema
interface Analysis {
  id: string;
  user_id: string; // This was missing or incorrectly named
  repository_url: string;
  analysis_type: 'structure' | 'code_summary' | 'ai_enhanced';
  content: any;
  created_at: string;
}

interface AnalysisState {
  analyses: Analysis[];
  currentAnalysis: Analysis | null;
  loading: boolean;
  // Fix: Update the saveAnalysis parameter type
  saveAnalysis: (
    analysis: Omit<Analysis, 'id' | 'created_at'>
  ) => Promise<void>;
  loadAnalyses: (userId: string) => Promise<void>;
  deleteAnalysis: (id: string) => Promise<void>;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  analyses: [],
  currentAnalysis: null,
  loading: false,

  saveAnalysis: async (analysis) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('analyses')
        .insert(analysis)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        analyses: [data, ...state.analyses],
        loading: false,
      }));
    } catch (error) {
      console.error('Error saving analysis:', error);
      set({ loading: false });
      throw error;
    }
  },

  loadAnalyses: async (userId: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ analyses: data || [], loading: false });
    } catch (error) {
      console.error('Error loading analyses:', error);
      set({ loading: false });
    }
  },

  deleteAnalysis: async (id: string) => {
    try {
      const { error } = await supabase.from('analyses').delete().eq('id', id);

      if (error) throw error;

      set((state) => ({
        analyses: state.analyses.filter((a) => a.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting analysis:', error);
      throw error;
    }
  },
}));
