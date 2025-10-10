import { DollarSign, Users, Bus, Route } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { RecentBookings } from "@/components/dashboard/RecentBookings";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value="$45,231.89"
          icon={DollarSign}
          description="+20.1% from last month"
        />
        <KpiCard
          title="Total Passengers"
          value="+2350"
          icon={Users}
          description="+180.1% from last month"
        />
        <KpiCard
          title="Active Buses"
          value="12"
          icon={Bus}
          description="2 currently in maintenance"
        />
        <KpiCard
          title="Trips this Month"
          value="573"
          icon={Route}
          description="+19% from last month"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <OverviewChart />
        <RecentBookings />
      </div>
    </div>
  );
}
