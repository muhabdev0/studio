"use client";

import { DollarSign, Users, Bus, Route } from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { RecentBookings } from "@/components/dashboard/RecentBookings";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { FinanceRecord, TicketBooking, Bus as BusType, Trip } from "@/lib/types";
import { useMemo } from "react";

export default function DashboardPage() {
  const firestore = useFirestore();

  const financeQuery = useMemoFirebase(() => collection(firestore, "financeRecords"), [firestore]);
  const { data: financeData, isLoading: isLoadingFinance } = useCollection<FinanceRecord>(financeQuery);

  const bookingsQuery = useMemoFirebase(() => collection(firestore, "ticketBookings"), [firestore]);
  const { data: bookingsData, isLoading: isLoadingBookings } = useCollection<TicketBooking>(bookingsQuery);

  const busesQuery = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: busesData, isLoading: isLoadingBuses } = useCollection<BusType>(busesQuery);

  const tripsQuery = useMemoFirebase(() => collection(firestore, "trips"), [firestore]);
  const { data: tripsData, isLoading: isLoadingTrips } = useCollection<Trip>(tripsQuery);

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

  const isLoading = isLoadingFinance || isLoadingBookings || isLoadingBuses || isLoadingTrips;

  return (
    <div className="flex-1 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalRevenue)}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <KpiCard
          title="Total Passengers"
          value={totalPassengers.toString()}
          icon={Users}
          isLoading={isLoading}
        />
        <KpiCard
          title="Active Buses"
          value={activeBuses.toString()}
          icon={Bus}
          description={`${busesData?.filter(b => b.maintenanceStatus === "Maintenance").length ?? 0} in maintenance`}
          isLoading={isLoading}
        />
        <KpiCard
          title="Trips this Month"
          value={tripsThisMonth.toString()}
          icon={Route}
          isLoading={isLoading}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <OverviewChart financeData={financeData} isLoading={isLoadingFinance} />
        <RecentBookings bookingsData={bookingsData?.slice(0, 5)} isLoading={isLoadingBookings} />
      </div>
    </div>
  );
}
