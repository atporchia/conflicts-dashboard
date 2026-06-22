import { NewsItem } from '@/lib/types';

interface RecentUpdatesProps {
  news: NewsItem[];
}

export function RecentUpdates({ news }: RecentUpdatesProps) {
  if (!news || news.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No recent news updates. Connect to Supabase and run seed data to see updates.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {news.slice(0, 5).map((item) => (
        <div
          key={item.id}
          className="border-l-2 border-gray-700 pl-4 py-2 hover:border-blue-500 transition-colors"
        >
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-white font-medium hover:text-blue-400 transition-colors">
              {item.headline}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
              <span>{item.source}</span>
              <span>•</span>
              <span>{new Date(item.published_at).toLocaleDateString()}</span>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
}
