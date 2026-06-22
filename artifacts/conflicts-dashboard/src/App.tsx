import { Switch, Route, Router as WouterRouter, useSearch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardClient } from '@/components/dashboard/dashboard-client';

const queryClient = new QueryClient();

function Home() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const country = params.get('country');
  return <DashboardClient selectedCountry={country} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <div className="bg-gray-950 text-gray-100 min-h-screen">
          <Switch>
            <Route path="/" component={Home} />
            <Route component={Home} />
          </Switch>
        </div>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
