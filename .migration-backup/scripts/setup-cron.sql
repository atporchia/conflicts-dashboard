-- Schedule RSS ingestion every 4 hours
-- Runs at 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC

SELECT cron.schedule(
  'ingest-news',
  '0 */4 * * *',
  $$
  SELECT net.http_post(
    'https://eemqlvewfqjrbxyouxuv.supabase.co/functions/v1/ingest-news',
    '{}'::jsonb,
    '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlbXFsdmV3ZnFqcmJ4eW91eHV2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTk2ODQ4MSwiZXhwIjoyMDk3NTQ0NDgxfQ.X7XKEOzIgAAAgJoUfD203qn8BzJCP2takp0WIsOJoHk"}'::jsonb
  ) AS request_id;
  $$
);

-- Clean up old news articles weekly (keep last 90 days)
SELECT cron.schedule(
  'cleanup-old-news',
  '0 2 * * 0',  -- Every Sunday at 2 AM
  $$
  DELETE FROM news_items 
  WHERE published_at < NOW() - INTERVAL '90 days';
  $$
);