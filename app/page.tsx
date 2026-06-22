import { DashboardClient } from '@/components/dashboard/dashboard-client';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const { country } = await searchParams;
  return <DashboardClient selectedCountry={country ?? null} />;
}
