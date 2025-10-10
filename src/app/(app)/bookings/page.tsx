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
import { collection, Timestamp, doc, updateDoc } from "firebase/firestore";

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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trip, TicketBooking } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";

export const columns: ColumnDef<TicketBooking>[] = [
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
    accessorKey: "customerName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Customer
          <CaretSortIcon className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("customerName")}</div>,
  },
    {
    accessorKey: "idNumber",
    header: "ID Number",
  },
  {
    accessorKey: "tripId",
    header: "Trip ID",
  },
  {
    accessorKey: "seatNumber",
    header: "Seat",
  },
  {
    accessorKey: "price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
    {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variant = {
        "Confirmed": "default",
        "Pending": "secondary",
        "Cancelled": "destructive",
      }[status] ?? "outline" as "default" | "secondary" | "destructive" | "outline";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    accessorKey: "bookingDate",
    header: "Booking Date",
    cell: ({ row }) => {
        const timestamp = row.getValue("bookingDate") as Timestamp;
        return <div>{timestamp.toDate().toLocaleDateString()}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original;

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
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy Ticket ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View trip details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

function NewBookingDialog({ 
    open, 
    onOpenChange,
    trips,
    onBookingCreated
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    trips: Trip[],
    onBookingCreated: (booking: Omit<TicketBooking, "id">) => void
}) {
  const [customerName, setCustomerName] = React.useState("");
  const [idNumber, setIdNumber] = React.useState("");
  const [selectedTripId, setSelectedTripId] = React.useState<string | undefined>();
  const [selectedSeat, setSelectedSeat] = React.useState<number | undefined>();
  
  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const availableSeats = React.useMemo(() => {
    if (!selectedTrip) return [];
    const booked = selectedTrip.bookedSeats || [];
    const allSeats = Array.from({ length: selectedTrip.totalSeats }, (_, i) => i + 1);
    return allSeats.filter(seat => !booked.includes(seat));
  }, [selectedTrip]);

  const handleCreateBooking = () => {
    if (!customerName || !idNumber || !selectedTrip || !selectedSeat) return;

    const newBooking: Omit<TicketBooking, "id"> = {
        tripId: selectedTrip.id,
        customerName,
        idNumber,
        seatNumber: selectedSeat,
        price: selectedTrip.ticketPrice,
        bookingDate: Timestamp.now(),
        status: "Confirmed",
    };
    onBookingCreated(newBooking);
    onOpenChange(false);
    // Reset form
    setCustomerName("");
    setIdNumber("");
    setSelectedTripId(undefined);
    setSelectedSeat(undefined);
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>
            Book a new trip for a customer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customerName" className="text-right">
              Customer Name
            </Label>
            <Input id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="idNumber" className="text-right">
              ID Number
            </Label>
            <Input id="idNumber" value={idNumber} onChange={e => setIdNumber(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="trip" className="text-right">
              Trip
            </Label>
            <Select onValueChange={setSelectedTripId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a trip" />
              </SelectTrigger>
              <SelectContent>
                {trips.filter(t => t.status === "Scheduled").map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.from} to {trip.to} ({trip.dateTime.toDate().toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedTrip && (
            <>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Trip Date</Label>
                <div className="col-span-3 font-medium">
                  {selectedTrip.dateTime.toDate().toLocaleString()}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seat" className="text-right">
                  Seat
                </Label>
                <Select onValueChange={(val) => setSelectedSeat(Number(val))}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a seat" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSeats.map(seat => (
                      <SelectItem key={seat} value={String(seat)}>
                        Seat {seat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Price</Label>
                <div className="col-span-3 font-medium">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(selectedTrip.ticketPrice)}
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreateBooking}>Create Booking</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function BookingsPage() {
  const firestore = useFirestore();

  const bookingsQuery = useMemoFirebase(() => collection(firestore, "ticketBookings"), [firestore]);
  const { data: bookingsData, isLoading: isLoadingBookings } = useCollection<TicketBooking>(bookingsQuery);
  
  const tripsQuery = useMemoFirebase(() => collection(firestore, "trips"), [firestore]);
  const { data: tripsData, isLoading: isLoadingTrips } = useCollection<Trip>(tripsQuery);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isNewBookingDialogOpen, setIsNewBookingDialogOpen] = React.useState(false);


  const table = useReactTable({
    data: bookingsData ?? [],
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

  const handleBookingCreated = (newBooking: Omit<TicketBooking, "id">) => {
    const bookingsCollection = collection(firestore, 'ticketBookings');
    addDocumentNonBlocking(bookingsCollection, newBooking)
      .then(docRef => {
        if (docRef) {
          const tripRef = doc(firestore, 'trips', newBooking.tripId);
          const trip = tripsData?.find(t => t.id === newBooking.tripId);
          if (trip) {
            const updatedBookedSeats = [...(trip.bookedSeats || []), newBooking.seatNumber];
            updateDoc(tripRef, { bookedSeats: updatedBookedSeats });
          }
        }
      });
  }

  const isLoading = isLoadingBookings || isLoadingTrips;

  return (
    <>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Ticket Bookings</CardTitle>
                    <CardDescription>
                    Here you can view and manage all ticket bookings.
                    </CardDescription>
                </div>
                <Button onClick={() => setIsNewBookingDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> New Booking
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter by customer name..."
                value={
                  (table.getColumn("customerName")?.getFilterValue() as string) ??
                  ""
                }
                onChange={(event) =>
                  table
                    .getColumn("customerName")
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
                          {column.id}
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
      <NewBookingDialog 
        open={isNewBookingDialogOpen} 
        onOpenChange={setIsNewBookingDialogOpen}
        trips={tripsData ?? []}
        onBookingCreated={handleBookingCreated}
      />
    </>
  );
}
