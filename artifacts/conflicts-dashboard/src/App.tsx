import { Switch, Route, Router as WouterRouter, useSearch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

const queryClient = new QueryClient();

function Home() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const country = params.get('country');
  return <DashboardClient selectedCountry={country} />;
}

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <p className="text-gray-400 mb-6">Page not found</p>
        <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="bg-gray-950 text-gray-100 min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
