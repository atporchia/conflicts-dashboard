// Database types generated from Supabase schema
// This is a placeholder - in production, generate from actual schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ConflictType = 'interstate' | 'civil_war' | 'insurgency' | 'terrorism' | 'territorial_dispute';
export type ConflictStatus = 'escalating' | 'ongoing' | 'de-escalating' | 'frozen';
export type ConflictIntensity = 'low' | 'medium' | 'high';
export type PartyType = 'state' | 'rebel_group' | 'militia' | 'terrorist_organization' | 'international_organization' | 'other';
export type AnalysisType = 'think_tank' | 'research' | 'background' | 'academic' | 'news_analysis';
export type SourceType = 'rss' | 'gdelt' | 'api' | 'manual';
export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';
export type IngestionStatus = 'running' | 'success' | 'failed' | 'partial';

export interface Database {
  public: {
    Tables: {
      conflicts: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          type: ConflictType;
          status: ConflictStatus;
          intensity: ConflictIntensity;
          start_date: string;
          end_date: string | null;
          latitude: number | null;
          longitude: number | null;
          region: string | null;
          countries_involved: string[];
          created_at: string;
          updated_at: string;
          last_news_update: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          type: ConflictType;
          status: ConflictStatus;
          intensity: ConflictIntensity;
          start_date: string;
          end_date?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          region?: string | null;
          countries_involved: string[];
          created_at?: string;
          updated_at?: string;
          last_news_update?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          type?: ConflictType;
          status?: ConflictStatus;
          intensity?: ConflictIntensity;
          start_date?: string;
          end_date?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          region?: string | null;
          countries_involved?: string[];
          created_at?: string;
          updated_at?: string;
          last_news_update?: string | null;
          metadata?: Json;
        };
      };
      parties: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: PartyType;
          description: string | null;
          country: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type: PartyType;
          description?: string | null;
          country?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          type?: PartyType;
          description?: string | null;
          country?: string | null;
          created_at?: string;
        };
      };
      conflict_parties: {
        Row: {
          conflict_id: string;
          party_id: string;
          role: string | null;
        };
        Insert: {
          conflict_id: string;
          party_id: string;
          role?: string | null;
        };
        Update: {
          conflict_id?: string;
          party_id?: string;
          role?: string | null;
        };
      };
      news_items: {
        Row: {
          id: string;
          conflict_id: string | null;
          headline: string;
          url: string;
          source: string;
          published_at: string;
          fetched_at: string;
          summary: string | null;
          sentiment: SentimentType | null;
          relevance_score: number | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          conflict_id?: string | null;
          headline: string;
          url: string;
          source: string;
          published_at: string;
          fetched_at?: string;
          summary?: string | null;
          sentiment?: SentimentType | null;
          relevance_score?: number | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          conflict_id?: string | null;
          headline?: string;
          url?: string;
          source?: string;
          published_at?: string;
          fetched_at?: string;
          summary?: string | null;
          sentiment?: SentimentType | null;
          relevance_score?: number | null;
          metadata?: Json;
        };
      };
      analysis_links: {
        Row: {
          id: string;
          conflict_id: string;
          title: string;
          url: string;
          source: string | null;
          type: AnalysisType;
          published_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conflict_id: string;
          title: string;
          url: string;
          source?: string | null;
          type: AnalysisType;
          published_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conflict_id?: string;
          title?: string;
          url?: string;
          source?: string | null;
          type?: AnalysisType;
          published_at?: string | null;
          created_at?: string;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          category: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          category?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          category?: string | null;
        };
      };
      conflict_tags: {
        Row: {
          conflict_id: string;
          tag_id: string;
        };
        Insert: {
          conflict_id: string;
          tag_id: string;
        };
        Update: {
          conflict_id?: string;
          tag_id?: string;
        };
      };
      news_sources: {
        Row: {
          id: string;
          name: string;
          url: string;
          type: SourceType;
          region: string | null;
          language: string;
          active: boolean;
          last_fetched: string | null;
          fetch_frequency: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          type: SourceType;
          region?: string | null;
          language?: string;
          active?: boolean;
          last_fetched?: string | null;
          fetch_frequency?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          url?: string;
          type?: SourceType;
          region?: string | null;
          language?: string;
          active?: boolean;
          last_fetched?: string | null;
          fetch_frequency?: string;
          metadata?: Json;
        };
      };
      ingestion_log: {
        Row: {
          id: string;
          source_id: string;
          started_at: string;
          completed_at: string | null;
          status: IngestionStatus;
          items_fetched: number;
          items_new: number;
          items_updated: number;
          errors: Json;
        };
        Insert: {
          id?: string;
          source_id: string;
          started_at?: string;
          completed_at?: string | null;
          status: IngestionStatus;
          items_fetched?: number;
          items_new?: number;
          items_updated?: number;
          errors?: Json;
        };
        Update: {
          id?: string;
          source_id?: string;
          started_at?: string;
          completed_at?: string | null;
          status?: IngestionStatus;
          items_fetched?: number;
          items_new?: number;
          items_updated?: number;
          errors?: Json;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      conflict_type: ConflictType;
      conflict_status: ConflictStatus;
      conflict_intensity: ConflictIntensity;
      party_type: PartyType;
      analysis_type: AnalysisType;
      source_type: SourceType;
      sentiment_type: SentimentType;
      ingestion_status: IngestionStatus;
    };
  };
}