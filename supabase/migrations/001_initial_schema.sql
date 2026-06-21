-- Global Conflict Dashboard - Initial Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE conflict_type AS ENUM ('interstate', 'civil_war', 'insurgency', 'terrorism', 'territorial_dispute');
CREATE TYPE conflict_status AS ENUM ('escalating', 'ongoing', 'de-escalating', 'frozen');
CREATE TYPE conflict_intensity AS ENUM ('low', 'medium', 'high');
CREATE TYPE party_type AS ENUM ('state', 'rebel_group', 'militia', 'terrorist_organization', 'international_organization', 'other');
CREATE TYPE analysis_type AS ENUM ('think_tank', 'research', 'background', 'academic', 'news_analysis');
CREATE TYPE source_type AS ENUM ('rss', 'gdelt', 'api', 'manual');
CREATE TYPE sentiment_type AS ENUM ('positive', 'negative', 'neutral', 'mixed');
CREATE TYPE ingestion_status AS ENUM ('running', 'success', 'failed', 'partial');

-- Conflicts table
CREATE TABLE conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    type conflict_type NOT NULL,
    status conflict_status NOT NULL,
    intensity conflict_intensity NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    region TEXT,
    countries_involved TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_news_update TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Parties table
CREATE TABLE parties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    type party_type NOT NULL,
    description TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conflict-Party relationship
CREATE TABLE conflict_parties (
    conflict_id UUID REFERENCES conflicts(id) ON DELETE CASCADE,
    party_id UUID REFERENCES parties(id) ON DELETE CASCADE,
    role TEXT,
    PRIMARY KEY (conflict_id, party_id)
);

-- News items table
CREATE TABLE news_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_id UUID REFERENCES conflicts(id) ON DELETE SET NULL,
    headline TEXT NOT NULL,
    url TEXT NOT NULL,
    source TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    summary TEXT,
    sentiment sentiment_type,
    relevance_score DECIMAL(3,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(url, published_at)
);

-- Analysis links table
CREATE TABLE analysis_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conflict_id UUID REFERENCES conflicts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source TEXT,
    type analysis_type NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT
);

-- Conflict-Tag relationship
CREATE TABLE conflict_tags (
    conflict_id UUID REFERENCES conflicts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (conflict_id, tag_id)
);

-- News sources table
CREATE TABLE news_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type source_type NOT NULL,
    region TEXT,
    language TEXT DEFAULT 'en',
    active BOOLEAN DEFAULT true,
    last_fetched TIMESTAMPTZ,
    fetch_frequency INTERVAL DEFAULT '1 hour',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Ingestion log table
CREATE TABLE ingestion_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID REFERENCES news_sources(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status ingestion_status NOT NULL,
    items_fetched INTEGER DEFAULT 0,
    items_new INTEGER DEFAULT 0,
    items_updated INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb
);

-- User preferences table (for future auth)
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_conflicts_status ON conflicts(status);
CREATE INDEX idx_conflicts_type ON conflicts(type);
CREATE INDEX idx_conflicts_region ON conflicts(region);
CREATE INDEX idx_conflicts_updated ON conflicts(updated_at DESC);
CREATE INDEX idx_conflicts_location ON conflicts(latitude, longitude);

CREATE INDEX idx_news_conflict ON news_items(conflict_id);
CREATE INDEX idx_news_published ON news_items(published_at DESC);
CREATE INDEX idx_news_source ON news_items(source);

CREATE INDEX idx_analysis_conflict ON analysis_links(conflict_id);

CREATE INDEX idx_ingestion_source ON ingestion_log(source_id);
CREATE INDEX idx_ingestion_started ON ingestion_log(started_at DESC);

-- Enable Row Level Security
ALTER TABLE conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON conflicts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON parties FOR SELECT USING (true);
CREATE POLICY "Public read access" ON conflict_parties FOR SELECT USING (true);
CREATE POLICY "Public read access" ON news_items FOR SELECT USING (true);
CREATE POLICY "Public read access" ON analysis_links FOR SELECT USING (true);
CREATE POLICY "Public read access" ON tags FOR SELECT USING (true);
CREATE POLICY "Public read access" ON conflict_tags FOR SELECT USING (true);
CREATE POLICY "Public read access" ON news_sources FOR SELECT USING (true);
CREATE POLICY "Public read access" ON ingestion_log FOR SELECT USING (true);
CREATE POLICY "Public read access" ON user_preferences FOR SELECT USING (true);

-- Service role can write
CREATE POLICY "Service role write" ON conflicts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON parties FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON conflict_parties FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON news_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON analysis_links FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON tags FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON conflict_tags FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON news_sources FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON ingestion_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role write" ON user_preferences FOR ALL USING (auth.role() = 'service_role');