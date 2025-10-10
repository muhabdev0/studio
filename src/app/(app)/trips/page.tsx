"use client";

import * as React from "react";
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PlusCircle } from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Trip, Bus, Employee } from "@/lib/types";

// Mock data, in a real app this would come from an API
const initialTrips: Trip[] = [
  {
    id: "TRIP-101",
    from: "New York, NY",
    to: "Boston, MA",
    dateTime: "2023-11-15T08:00:00Z",
    busId: "BUS-01",
    driverId: "DRV-A",
    status: "Completed",
    ticketPrice: 45.5,
    totalSeats: 50,
    bookedSeats: [1, 2, 3],
  },
  {
    id: "TRIP-102",
    from: "Los Angeles, CA",
    to: "San Francisco, CA",
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    busId: "BUS-02",
    driverId: "DRV-B",
    status: "Scheduled",
    ticketPrice: 35.0,
    totalSeats: 45,
    bookedSeats: [],
  },
  {
    id: "TRIP-103",
    from: "Chicago, IL",
    to: "Detroit, MI",
    dateTime: "2023-11-14T09:30:00Z",
    busId: "BUS-03",
    driverId: "DRV-C",
    status: "Completed",
    ticketPrice: 60.0,
    totalSeats: 55,
    bookedSeats: [1],
  },
  {
    id: "TRIP-104",
    from: "Miami, FL",
    to: "Orlando, FL",
    dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    busId: "BUS-04",
    driverId: "DRV-D",
    status: "Scheduled",
    ticketPrice: 50.0,
    totalSeats: 40,
    bookedSeats: [],
  },
  {
    id: "TRIP-105",
    from: "Denver, CO",
    to: "Salt Lake City, UT",
    dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    busId: "BUS-05",
    driverId: "DRV-E",
    status: "Cancelled",
    ticketPrice: 25.75,
    totalSeats: 60,
    bookedSeats: [],
  },
  {
    id: "TRIP-106",
    from: "Boston, MA",
    to: "New York, NY",
    dateTime: "2023-11-15T18:00:00Z",
    busId: "BUS-01",
    driverId: "DRV-A",
    status: "Completed",
    ticketPrice: 45.5,
    totalSeats: 50,
    bookedSeats: [5, 8],
  },
];

const buses: Omit<Bus, 'imageUrl'>[] = [
  { id: "BUS-01", name: "City Cruiser 1", plateNumber: "NYC-1234", capacity: 50, maintenanceStatus: "Operational" },
  { id: "BUS-02", name: "MetroLink 5", plateNumber: "LA-5678", capacity: 45, maintenanceStatus: "Operational" },
  { id: "BUS-03", name: "Downtown Express", plateNumber: "CHI-9101", capacity: 55, maintenanceStatus: "Maintenance" },
];

const drivers: Employee[] = [
  { id: "DRV-A", fullName: "Bob Williams", role: "Driver", contactInfo: "555-1234", salary: 50000 },
  { id: "DRV-B", fullName: "Charlie Brown", role: "Driver", contactInfo: "555-5678", salary: 52000 },
  { id: "DRV-C", fullName: "Diana Miller", role: "Admin", contactInfo: "diana@example.com", salary: 80000 },
  { id: "DRV-D", fullName: "Alex Ray", role: "Driver", contactInfo: "555-4321", salary: 51000 },
  { id: "DRV-E", fullName: "Sam Wilson", role: "Driver", contactInfo: "555-8765", salary: 53000 },
];

export const columns: ColumnDef<Trip>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "Trip ID",
  },
  {
    accessorKey: "route",
    header: "Route",
    cell: ({ row }) => {
      const trip = row.original;
      return `${trip.from} → ${trip.to}`;
    },
  },
  {
    accessorKey: "dateTime",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date/Time
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div>{new Date(row.getValue("dateTime")).toLocaleString()}</div>
    ),
  },
  {
    accessorKey: "busId",
    header: "Bus",
  },
  {
    accessorKey: "driverId",
    header: "Driver",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant =
        {
          Scheduled: "secondary",
          "In Progress": "default",
          Completed: "outline",
          Cancelled: "destructive",
        }[status] ?? ("default" as "default" | "secondary" | "destructive" | "outline");
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const trip = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(trip.id)}
            >
              Copy Trip ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Trip</DropdownMenuItem>
             <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">Delete Trip</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function NewTripDialog({ open, onOpenChange, onAddTrip }: { open: boolean, onOpenChange: (open: boolean) => void, onAddTrip: (newTrip: Trip) => void }) {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [dateTime, setDateTime] = React.useState<Date>();
  const [busId, setBusId] = React.useState<string>();
  const [driverId, setDriverId] = React.useState<string>();
  const [ticketPrice, setTicketPrice] = React.useState<number>(0);

  const selectedBus = buses.find(b => b.id === busId);
  const availableDrivers = drivers.filter(d => d.role === "Driver");

  const handleCreateTrip = () => {
    if (!from || !to || !dateTime || !busId || !driverId || !ticketPrice || !selectedBus) return;
    
    const newTrip: Trip = {
      id: `TRIP-${Date.now()}`,
      from,
      to,
      dateTime: dateTime.toISOString(),
      busId,
      driverId,
      status: new Date(dateTime) > new Date() ? "Scheduled" : "Completed",
      ticketPrice,
      totalSeats: selectedBus.capacity,
      bookedSeats: [],
    };
    onAddTrip(newTrip);
    onOpenChange(false);
    // Reset form
    setFrom("");
    setTo("");
    setDateTime(undefined);
    setBusId(undefined);
    setDriverId(undefined);
    setTicketPrice(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Trip</DialogTitle>
          <DialogDescription>
            Create a new trip by providing the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="from" className="text-right">From</Label>
            <Input id="from" value={from} onChange={e => setFrom(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="to" className="text-right">To</Label>
            <Input id="to" value={to} onChange={e => setTo(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !dateTime && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTime ? format(dateTime, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTime} onSelect={setDateTime} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bus" className="text-right">Bus</Label>
            <Select onValueChange={setBusId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.filter(b => b.maintenanceStatus === "Operational").map(bus => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.name} ({bus.plateNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="driver" className="text-right">Driver</Label>
            <Select onValueChange={setDriverId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map(driver => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Ticket Price</Label>
            <Input id="price" type="number" value={ticketPrice} onChange={e => setTicketPrice(Number(e.target.value))} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreateTrip}>Create Trip</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function TripsPage() {
  const [trips, setTrips] = React.useState<Trip[]>(initialTrips);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isNewTripDialogOpen, setIsNewTripDialogOpen] = React.useState(false);

  const table = useReactTable({
    data: trips,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTrips(prevTrips =>
        prevTrips.map(trip => {
          const tripDate = new Date(trip.dateTime);
          if (trip.status === "Scheduled" && tripDate < new Date()) {
            return { ...trip, status: "Completed" };
          }
          return trip;
        })
      );
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const handleAddTrip = (newTrip: Trip) => {
    setTrips(prevTrips => [newTrip, ...prevTrips]);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                  <CardTitle>Trip Management</CardTitle>
                  <CardDescription>
                  Here you can view, add, and manage all trips.
                  </CardDescription>
              </div>
              <Button onClick={() => setIsNewTripDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Trip
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter by route..."
                value={
                  (table.getColumn("route")?.getFilterValue() as string) ??
                  ""
                }
                onChange={(event) =>
                  table
                    .getColumn("route")
                    ?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id === 'dateTime' ? 'Date/Time' : column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <NewTripDialog 
        open={isNewTripDialogOpen} 
        onOpenChange={setIsNewTripDialogOpen}
        onAddTrip={handleAddTrip}
      />
    </>
  );
}
