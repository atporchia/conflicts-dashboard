import { cn } from '@/lib/utils/cn';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('border-t border-gray-800 bg-gray-950 mt-auto', className)}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Global Conflict Dashboard. Data sourced from public news feeds.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a
              href="/about"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              About & Methodology
            </a>
            <span className="text-gray-600">|</span>
            <span className="text-sm text-gray-500">
              Built with Next.js & Supabase
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}