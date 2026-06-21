-- Run this in Supabase SQL Editor AFTER seed-data.sql
-- This updates the news_sources with the comprehensive source list

-- First, clear the placeholder sources
DELETE FROM news_sources;

-- Insert all news sources from the user's list
INSERT INTO news_sources (name, url, type, region, language, active) VALUES

-- Daily/ongoing assessment sources
('Institute for the Study of War', 'https://www.understandingwar.org/rss.xml', 'rss', 'global', 'en', true),
('War on the Rocks', 'https://warontherocks.com/feed/', 'rss', 'global', 'en', true),

-- Non-US think tanks (genuinely different vantage points)
('International Crisis Group', 'https://www.crisisgroup.org/rss.xml', 'rss', 'global', 'en', true),
('RUSI', 'https://rusi.org/rss.xml', 'rss', 'global', 'en', true),
('IISS', 'https://www.iiss.org/rss.xml', 'rss', 'global', 'en', true),
('Chatham House', 'https://www.chathamhouse.org/rss.xml', 'rss', 'global', 'en', true),
('SWP Berlin', 'https://www.swp-berlin.org/en/rss.xml', 'rss', 'europe', 'en', true),
('ISS Africa', 'https://issafrica.org/rss.xml', 'rss', 'africa', 'en', true),

-- Open-source verification & raw data sources (no RSS but listed for manual curation)
-- Bellingcat: reports published periodically, no standard RSS
-- Oryx: equipment tracking, no RSS
-- ACLED: has API (free tier), no RSS
-- Liveuamap: no public API
-- Airwars: publishes reports, no standard RSS

-- Russia/Ukraine specific, independent and exile press
('Meduza', 'https://meduza.io/en/rss', 'rss', 'europe', 'en', true),
('Texty.org.ua', 'https://texty.org.ua/feed/', 'rss', 'europe', 'en', true),

-- Middle East / Global South
('Middle East Eye', 'https://www.middleeasteye.net/rss', 'rss', 'middle_east', 'en', true),
('Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml', 'rss', 'global', 'en', true),

-- Major wire services (for broader coverage)
('Reuters', 'https://www.reutersagency.com/feed/', 'rss', 'global', 'en', true),
('BBC World', 'https://feeds.bbci.co.uk/news/world/rss.xml', 'rss', 'global', 'en', true),
('Associated Press', 'https://rsshub.app/apnews/topics/apf-topnews', 'rss', 'global', 'en', true),

-- Additional context sources
('Bellingcat', 'https://www.bellingcat.com/feed/', 'rss', 'global', 'en', true);