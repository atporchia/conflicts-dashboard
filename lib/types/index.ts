// Core entity types based on database schema

export type ConflictType = 'interstate' | 'civil_war' | 'insurgency' | 'terrorism' | 'territorial_dispute';
export type ConflictStatus = 'escalating' | 'ongoing' | 'de-escalating' | 'frozen';
export type ConflictIntensity = 'low' | 'medium' | 'high';
export type PartyType = 'state' | 'rebel_group' | 'militia' | 'terrorist_organization' | 'international_organization' | 'other';
export type AnalysisType = 'think_tank' | 'research' | 'background' | 'academic' | 'news_analysis';
export type SourceType = 'rss' | 'gdelt' | 'api' | 'manual';
export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';
export type IngestionStatus = 'running' | 'success' | 'failed' | 'partial';

export interface Conflict {
  id: string;
  name: string;
  slug: string;
  description?: string;
  type: ConflictType;
  status: ConflictStatus;
  intensity: ConflictIntensity;
  start_date: string;
  end_date?: string;
  latitude?: number;
  longitude?: number;
  region?: string;
  countries_involved: string[];
  created_at: string;
  updated_at: string;
  last_news_update?: string;
  metadata?: Record<string, any>;
}

export interface Party {
  id: string;
  name: string;
  slug: string;
  type: PartyType;
  description?: string;
  country?: string;
  created_at: string;
}

export interface ConflictParty {
  conflict_id: string;
  party_id: string;
  role?: string;
  party?: Party;
}

export interface NewsItem {
  id: string;
  conflict_id?: string;
  headline: string;
  url: string;
  source: string;
  published_at: string;
  fetched_at: string;
  summary?: string;
  sentiment?: SentimentType;
  relevance_score?: number;
  metadata?: Record<string, any>;
}

export interface AnalysisLink {
  id: string;
  conflict_id: string;
  title: string;
  url: string;
  source?: string;
  type: AnalysisType;
  published_at?: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  category?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: SourceType;
  region?: string;
  language: string;
  active: boolean;
  last_fetched?: string;
  fetch_frequency: string;
  metadata?: Record<string, any>;
}

export interface IngestionLog {
  id: string;
  source_id: string;
  started_at: string;
  completed_at?: string;
  status: IngestionStatus;
  items_fetched: number;
  items_new: number;
  items_updated: number;
  errors: any[];
}

export interface UserPreferences {
  id: string;
  user_id?: string;
  preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    has_more: boolean;
  };
}

export interface ConflictWithDetails extends Conflict {
  parties?: ConflictParty[];
  tags?: Tag[];
  latest_news?: NewsItem[];
  analysis?: AnalysisLink[];
  news_count?: number;
  parties_count?: number;
}

export interface ConflictFilters {
  status?: ConflictStatus | ConflictStatus[];
  type?: ConflictType | ConflictType[];
  intensity?: ConflictIntensity | ConflictIntensity[];
  region?: string | string[];
  countries?: string | string[];
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface Statistics {
  total_conflicts: number;
  by_status: Record<ConflictStatus, number>;
  by_type: Record<ConflictType, number>;
  by_intensity: Record<ConflictIntensity, number>;
  by_region: Record<string, number>;
  recent_updates: Conflict[];
  top_headlines: NewsItem[];
}