"use client";

import { useZakat } from "@/hooks/useZakat";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ZakatChart } from "@/components/dashboard/ZakatChart";
import { RecentEntries } from "@/components/dashboard/RecentEntries";
import { getCurrentHijriYear } from "@/lib/hijri";

export default function DashboardPage() {
  const { records, loading } = useZakat();
  const hijriYear = getCurrentHijriYear();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your Zakat calculations</p>
      </div>

      <StatsCards records={records} loading={loading} currentHijriYear={hijriYear} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ZakatChart records={records} loading={loading} />
        <RecentEntries records={records} loading={loading} />
      </div>
    </div>
  );
}
