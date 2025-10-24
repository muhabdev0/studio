
"use client";

import { DollarSign, Users, Bus, Route } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { useDataCache } from "@/lib/data-cache";
import { useMemo } from "react";

export default function DashboardPage() {
  const { 
    financeData, 
    bookingsData, 
    busesData, 
    tripsData,
    isLoading: isCacheLoading 
  } = useDataCache();

  const { totalRevenue, totalPassengers, activeBuses, tripsThisMonth } = useMemo(() => {
    const revenue = financeData?.filter(r => r.type === "Income").reduce((acc, r) => acc + r.amount, 0) ?? 0;
    const passengers = bookingsData?.length ?? 0;
    const active = busesData?.filter(b => b.maintenanceStatus === "Operational").length ?? 0;
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const trips = tripsData?.filter(t => t.dateTime.toDate() >= startOfMonth).length ?? 0;

    return {
      totalRevenue: revenue,
      totalPassengers: passengers,
      activeBuses: active,
      tripsThisMonth: trips
    };
  }, [financeData, bookingsData, busesData, tripsData]);

  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalRevenue)}
          icon={DollarSign}
          isLoading={isCacheLoading}
        />
        <KpiCard
          title="Total Passengers"
          value={totalPassengers.toString()}
          icon={Users}
          isLoading={isCacheLoading}
        />
        <KpiCard
          title="Active Buses"
          value={activeBuses.toString()}
          icon={Bus}
          description={`${busesData?.filter(b => b.maintenanceStatus === "Maintenance").length ?? 0} in maintenance`}
          isLoading={isCacheLoading}
        />
        <KpiCard
          title="Trips this Month"
          value={tripsThisMonth.toString()}
          icon={Route}
          isLoading={isCacheLoading}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <OverviewChart financeData={financeData} isLoading={isCacheLoading} />
        <RecentBookings bookingsData={bookingsData?.slice(0, 5)} isLoading={isCacheLoading} />
      </div>
    </div>
  );
}
