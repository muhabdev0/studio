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
import { enUS } from 'date-fns/locale';
import { collection, Timestamp, doc } from "firebase/firestore";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Trip, Bus, Employee, TripStatus } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";

const tripStatuses: TripStatus[] = ["Scheduled", "In Progress", "Completed", "Cancelled"];

function EditTripDialog({ 
    open, 
    onOpenChange, 
    trip, 
    onTripUpdated,
    buses,
    drivers
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    trip: Trip | null; 
    onTripUpdated: (tripId: string, updatedData: Partial<Trip>) => void;
    buses: Bus[];
    drivers: Employee[];
}) {
    const [from, setFrom] = React.useState("");
    const [to, setTo] = React.useState("");
    const [dateTime, setDateTime] = React.useState<Date>();
    const [time, setTime] = React.useState("00:00");
    const [busId, setBusId] = React.useState<string>();
    const [driverId, setDriverId] = React.useState<string>();
    const [ticketPrice, setTicketPrice] = React.useState<number>(0);
    const [status, setStatus] = React.useState<TripStatus>("Scheduled");

    const availableDrivers = drivers.filter(d => d.role === "Driver");

    React.useEffect(() => {
        if (trip) {
            setFrom(trip.from);
            setTo(trip.to);
            const tripDate = trip.dateTime.toDate();
            setDateTime(tripDate);
            setTime(format(tripDate, "HH:mm"));
            setBusId(trip.busId);
            setDriverId(trip.driverId);
            setTicketPrice(trip.ticketPrice);
            setStatus(trip.status);
        }
    }, [trip]);

    const handleUpdateTrip = () => {
        if (!trip || !from || !to || !dateTime || !busId || !driverId || !ticketPrice) return;

        const [hours, minutes] = time.split(':').map(Number);
        const combinedDateTime = new Date(dateTime);
        combinedDateTime.setHours(hours, minutes);

        const updatedData: Partial<Trip> = {
            from,
            to,
            dateTime: Timestamp.fromDate(combinedDateTime),
            busId,
            driverId,
            ticketPrice,
            status,
        };

        const selectedBus = buses.find(b => b.id === busId);
        if (selectedBus && selectedBus.capacity !== trip.totalSeats) {
            updatedData.totalSeats = selectedBus.capacity;
        }

        onTripUpdated(trip.id, updatedData);
        onOpenChange(false);
    };

    if (!trip) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Trip</DialogTitle>
                    <DialogDescription>
                        Update the details of the trip. Click save when you're done.
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
                        <Label htmlFor="date" className="text-right">Date & Time</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-2 justify-start text-left font-normal",
                                        !dateTime && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateTime ? format(dateTime, "PPP", { locale: enUS }) : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={dateTime} onSelect={setDateTime} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-1" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="bus" className="text-right">Bus</Label>
                        <Select value={busId} onValueChange={setBusId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a bus" />
                            </SelectTrigger>
                            <SelectContent>
                                {buses.filter(b => b.maintenanceStatus === "Operational" || b.id === trip.busId).map(bus => (
                                    <SelectItem key={bus.id} value={bus.id}>
                                        {bus.name} ({bus.plateNumber})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="driver" className="text-right">Driver</Label>
                        <Select value={driverId} onValueChange={setDriverId}>
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
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">Status</Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as TripStatus)}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                {tripStatuses.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleUpdateTrip}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function NewTripDialog({ 
    open, 
    onOpenChange, 
    onAddTrip,
    buses,
    drivers
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void, 
    onAddTrip: (newTrip: Omit<Trip, "id">) => void,
    buses: Bus[],
    drivers: Employee[]
}) {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [dateTime, setDateTime] = React.useState<Date>();
  const [time, setTime] = React.useState("00:00");
  const [busId, setBusId] = React.useState<string>();
  const [driverId, setDriverId] = React.useState<string>();
  const [ticketPrice, setTicketPrice] = React.useState<number>(0);

  const selectedBus = buses.find(b => b.id === busId);
  const availableDrivers = drivers.filter(d => d.role === "Driver");

  const handleCreateTrip = () => {
    if (!from || !to || !dateTime || !busId || !driverId || !ticketPrice || !selectedBus) return;
    
    const [hours, minutes] = time.split(':').map(Number);
    const combinedDateTime = new Date(dateTime);
    combinedDateTime.setHours(hours, minutes);

    const newTrip: Omit<Trip, "id"> = {
      from,
      to,
      dateTime: Timestamp.fromDate(combinedDateTime),
      busId,
      driverId,
      status: new Date(combinedDateTime) > new Date() ? "Scheduled" : "Completed",
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
    setTime("00:00");
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
            <Label htmlFor="date" className="text-right">Date & Time</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "col-span-2 justify-start text-left font-normal",
                    !dateTime && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTime ? format(dateTime, "PPP", { locale: enUS }) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTime} onSelect={setDateTime} initialFocus />
              </PopoverContent>
            </Popover>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-1" />
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
  const firestore = useFirestore();

  const tripsQuery = useMemoFirebase(() => collection(firestore, "trips"), [firestore]);
  const { data: trips, isLoading: isLoadingTrips } = useCollection<Trip>(tripsQuery);
  
  const busesQuery = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: buses, isLoading: isLoadingBuses } = useCollection<Bus>(busesQuery);
  
  const employeesQuery = useMemoFirebase(() => collection(firestore, "employees"), [firestore]);
  const { data: employees, isLoading: isLoadingEmployees } = useCollection<Employee>(employeesQuery);
  
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isNewTripDialogOpen, setIsNewTripDialogOpen] = React.useState(false);
  const [isEditTripDialogOpen, setIsEditTripDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);

  const drivers = React.useMemo(() => employees?.filter(e => e.role === "Driver") ?? [], [employees]);

  const openEditDialog = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsEditTripDialogOpen(true);
  };

  const openDeleteDialog = (trip: Trip) => {
    setSelectedTrip(trip);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteTrip = () => {
    if (!selectedTrip) return;
    const tripRef = doc(firestore, "trips", selectedTrip.id);
    deleteDocumentNonBlocking(tripRef);
    setIsDeleteDialogOpen(false);
    setSelectedTrip(null);
  };

  const columns: ColumnDef<Trip>[] = [
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
      cell: ({ row }) => {
        const timestamp = row.getValue("dateTime") as Timestamp;
        return <div>{timestamp.toDate().toLocaleString('en-US')}</div>
      },
    },
    {
      accessorKey: "busId",
      header: "Bus",
      cell: ({ row }) => {
        const bus = buses?.find(b => b.id === row.original.busId);
        return bus?.name ?? row.original.busId;
      }
    },
    {
      accessorKey: "driverId",
      header: "Driver",
      cell: ({ row }) => {
        const driver = drivers?.find(d => d.id === row.original.driverId);
        return driver?.fullName ?? row.original.driverId;
      }
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
              <DropdownMenuItem onClick={() => openEditDialog(trip)}>Edit Trip</DropdownMenuItem>
               <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => openDeleteDialog(trip)}
               >
                Delete Trip
               </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];


  const table = useReactTable({
    data: trips ?? [],
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

  const handleAddTrip = (newTrip: Omit<Trip, "id">) => {
    const tripsCollection = collection(firestore, 'trips');
    addDocumentNonBlocking(tripsCollection, newTrip);
  };
  
  const handleTripUpdated = (tripId: string, updatedData: Partial<Trip>) => {
    const tripRef = doc(firestore, 'trips', tripId);
    updateDocumentNonBlocking(tripRef, updatedData);
  };
  
  const isLoading = isLoadingTrips || isLoadingBuses || isLoadingEmployees;

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
                  {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                            Loading...
                        </TableCell>
                    </TableRow>
                   ) : table.getRowModel().rows?.length ? (
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
        buses={buses ?? []}
        drivers={employees ?? []}
      />
      <EditTripDialog
        open={isEditTripDialogOpen}
        onOpenChange={setIsEditTripDialogOpen}
        trip={selectedTrip}
        onTripUpdated={handleTripUpdated}
        buses={buses ?? []}
        drivers={drivers}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedTrip(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTrip}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
