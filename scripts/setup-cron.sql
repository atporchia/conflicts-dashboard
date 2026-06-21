-- Run this in Supabase SQL Editor AFTER deploying the Edge Function
-- This schedules the ingest-news Edge Function to run every 30 minutes

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the ingest-news function to run every 30 minutes
SELECT cron.schedule(
  'ingest-news-every-30-min',  -- job name
  '*/30 * * * *',              -- every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://eemqlvewfqjrbxyouxuv.supabase.co/functions/v1/ingest-news',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  ) AS request_id;
  $$
);

-- Also schedule a daily cleanup job (runs at 2 AM every Sunday)
SELECT cron.schedule(
  'cleanup-old-news-weekly',
  '0 2 * * 0',
  $$
  DELETE FROM news_items
  WHERE published_at < NOW() - INTERVAL '30 days'
  AND conflict_id IS NULL;  -- only remove unmatched news
  $$
);

-- View scheduled jobs
SELECT * FROM cron.job;