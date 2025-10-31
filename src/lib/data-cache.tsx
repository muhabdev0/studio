
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Trip, Bus, Employee, TicketBooking, FinanceRecord } from '@/lib/types';

interface DataCacheContextType {
    tripsData: Trip[] | null;
    busesData: Bus[] | null;
    employeesData: Employee[] | null;
    bookingsData: TicketBooking[] | null;
    financeData: FinanceRecord[] | null;
    isLoading: boolean;
    error: Error | null;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export function DataCacheProvider({ children }: { children: ReactNode }) {
    const firestore = useFirestore();

    const tripsQuery = useMemoFirebase(() => query(collection(firestore, "trips"), orderBy("dateTime", "desc")), [firestore]);
    const { data: tripsData, isLoading: isLoadingTrips, error: tripsError } = useCollection<Trip>(tripsQuery);
    
    const busesQuery = useMemoFirebase(() => query(collection(firestore, "buses"), orderBy("name", "asc")), [firestore]);
    const { data: busesData, isLoading: isLoadingBuses, error: busesError } = useCollection<Bus>(busesQuery);
    
    const employeesQuery = useMemoFirebase(() => query(collection(firestore, "employees"), orderBy("fullName", "asc")), [firestore]);
    const { data: employeesData, isLoading: isLoadingEmployees, error: employeesError } = useCollection<Employee>(employeesQuery);

    const bookingsQuery = useMemoFirebase(() => query(collection(firestore, "ticketBookings"), orderBy("bookingDate", "desc")), [firestore]);
    const { data: bookingsData, isLoading: isLoadingBookings, error: bookingsError } = useCollection<TicketBooking>(bookingsQuery);

    const financeQuery = useMemoFirebase(() => query(collection(firestore, "financeRecords"), orderBy("date", "desc")), [firestore]);
    const { data: financeData, isLoading: isLoadingFinance, error: financeError } = useCollection<FinanceRecord>(financeQuery);


    const isLoading = isLoadingTrips || isLoadingBuses || isLoadingEmployees || isLoadingBookings || isLoadingFinance;
    const error = tripsError || busesError || employeesError || bookingsError || financeError;

    const value = {
        tripsData,
        busesData,
        employeesData,
        bookingsData,
        financeData,
        isLoading,
        error: error ? (error as Error) : null,
    };

    return (
        <DataCacheContext.Provider value={value}>
            {children}
        </DataCacheContext.Provider>
    );
}

export function useDataCache() {
    const context = useContext(DataCacheContext);
    if (context === undefined) {
        throw new Error('useDataCache must be used within a DataCacheProvider');
    }
    return context;
}
