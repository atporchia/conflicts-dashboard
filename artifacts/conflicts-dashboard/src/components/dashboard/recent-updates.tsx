import type { NewsItem } from '@/lib/types';

interface RecentUpdatesProps {
  news: NewsItem[];
}

const SENTIMENT_COLORS: Record<string, string> = {
  negative: 'text-red-400',
  positive: 'text-green-400',
  neutral: 'text-gray-400',
  mixed: 'text-yellow-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function RecentUpdates({ news }: RecentUpdatesProps) {
  if (!news || news.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-600 text-sm">No news yet.</p>
        <p className="text-gray-700 text-xs mt-1">Connect Supabase to load live updates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.slice(0, 8).map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-200 group-hover:text-white transition-colors leading-snug line-clamp-2">
                {item.headline}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 truncate">{item.source}</span>
                <span className="text-gray-700">·</span>
                <span className="text-xs text-gray-600 flex-shrink-0">{timeAgo(item.published_at)}</span>
                {item.sentiment && (
                  <>
                    <span className="text-gray-700">·</span>
                    <span className={`text-xs flex-shrink-0 ${SENTIMENT_COLORS[item.sentiment] || 'text-gray-500'}`}>
                      {item.sentiment}
                    </span>
                  </>
                )}
              </div>
            </div>
            <span className="text-gray-700 group-hover:text-gray-400 transition-colors text-sm mt-0.5 flex-shrink-0">↗</span>
          </div>
        </a>
      ))}
    </div>
  );
}
