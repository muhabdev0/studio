
"use client";

import * as React from "react";
import Image from "next/image";
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
import { collection, Timestamp, doc, updateDoc, arrayRemove, arrayUnion, getDoc, addDoc, deleteDoc } from "firebase/firestore";

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
import type { Trip, TicketBooking, FinanceRecord } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useDataCache } from "@/lib/data-cache";

function EditBookingDialog({
    open,
    onOpenChange,
    booking,
    trips,
    onBookingUpdated,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking: TicketBooking | null;
    trips: Trip[];
    onBookingUpdated: (bookingId: string, oldTripId: string, oldSeat: number, updatedData: Partial<TicketBooking>) => Promise<void>;
}) {
    const [customerName, setCustomerName] = React.useState("");
    const [idNumber, setIdNumber] = React.useState("");
    const [selectedTripId, setSelectedTripId] = React.useState<string | undefined>();
    const [selectedSeat, setSelectedSeat] = React.useState<number | undefined>();
    const [status, setStatus] = React.useState<TicketBooking['status'] | undefined>();
    const [customerPhotoUrl, setCustomerPhotoUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const { toast } = useToast();
    const selectedTrip = trips.find(t => t.id === selectedTripId);

    const availableSeats = React.useMemo(() => {
        if (!selectedTrip) return [];
        const booked = selectedTrip.bookedSeats || [];
        const allSeats = Array.from({ length: selectedTrip.totalSeats }, (_, i) => i + 1);
        // If we are editing a booking for the currently selected trip, the original seat is also available.
        if (booking && booking.tripId === selectedTripId) {
            return allSeats.filter(seat => !booked.includes(seat) || seat === booking.seatNumber);
        }
        return allSeats.filter(seat => !booked.includes(seat));
    }, [selectedTrip, booking]);

    React.useEffect(() => {
        if (booking) {
            setCustomerName(booking.customerName);
            setIdNumber(booking.idNumber);
            setSelectedTripId(booking.tripId);
            setSelectedSeat(booking.seatNumber);
            setStatus(booking.status);
            setCustomerPhotoUrl(booking.customerPhotoUrl || null);
        }
    }, [booking]);
    
    // When trip changes, if the selected seat is not available, reset it
    React.useEffect(() => {
        if (selectedTrip && selectedSeat && !availableSeats.includes(selectedSeat)) {
            setSelectedSeat(undefined);
        }
    }, [selectedTrip, availableSeats, selectedSeat]);
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCustomerPhotoUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
    };


    const handleUpdateBooking = async () => {
        if (!booking || !customerName || !idNumber || !selectedTripId || !selectedSeat || !status) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields."});
            return;
        }

        setIsLoading(true);
        const updatedData: Partial<TicketBooking> = {
            customerName,
            idNumber,
            tripId: selectedTripId,
            seatNumber: selectedSeat,
            status,
            price: trips.find(t => t.id === selectedTripId)?.price || booking.price,
            customerPhotoUrl: customerPhotoUrl || `https://picsum.photos/seed/${customerName}/100/100`,
        };
        
        try {
            await onBookingUpdated(booking.id, booking.tripId, booking.seatNumber, updatedData);
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (!booking) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Booking</DialogTitle>
                    <DialogDescription>
                        Update the customer's booking details. Click save when you're done.
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
                        <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a trip" />
                        </SelectTrigger>
                        <SelectContent>
                            {trips.filter(t => t.status === "Scheduled").map((trip) => (
                            <SelectItem key={trip.id} value={trip.id}>
                                {trip.from} to {trip.to} ({trip.dateTime.toDate().toLocaleDateString('en-US')})
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    {selectedTrip && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="seat" className="text-right">
                            Seat
                            </Label>
                            <Select value={selectedSeat ? String(selectedSeat) : undefined} onValueChange={(val) => setSelectedSeat(Number(val))}>
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
                    )}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="status" className="text-right">
                            Status
                        </Label>
                        <Select value={status} onValueChange={(value) => setStatus(value as TicketBooking['status'])}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Confirmed">Confirmed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="image" className="text-right">
                        Photo
                        </Label>
                        <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
                    </div>
                    {customerPhotoUrl && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Preview</Label>
                            <div className="col-span-3">
                                <Image src={customerPhotoUrl} alt="Customer preview" width={100} height={100} className="rounded-md object-cover" />
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleUpdateBooking} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function BookingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { 
    bookingsData, 
    tripsData, 
    isLoading: isCacheLoading 
  } = useDataCache();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isNewBookingDialogOpen, setIsNewBookingDialogOpen] = React.useState(false);
  const [isEditBookingDialogOpen, setIsEditBookingDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedBooking, setSelectedBooking] = React.useState<TicketBooking | null>(null);

  const handleBookingCreated = async (newBooking: Omit<TicketBooking, "id">) => {
    if (!firestore) return;
    const bookingsCollection = collection(firestore, 'ticketBookings');
    const financeCollection = collection(firestore, 'financeRecords');
    const tripRef = doc(firestore, 'trips', newBooking.tripId);
    
    try {
        await addDoc(bookingsCollection, newBooking);

        // Update trip's booked seats
        const tripSnap = await getDoc(tripRef);
        if (tripSnap.exists()) {
            await updateDoc(tripRef, { bookedSeats: arrayUnion(newBooking.seatNumber) });
        }

        // Create finance record
        const financeRecord: Omit<FinanceRecord, "id"> = {
            type: "Income",
            category: "Ticket Sale",
            amount: newBooking.price,
            date: newBooking.bookingDate,
            description: `Ticket sale for ${newBooking.customerName} on trip ${newBooking.tripId}`
        };
        await addDoc(financeCollection, financeRecord);

        toast({ title: "Booking Created", description: "The new booking has been successfully created." });
    } catch (error) {
        console.error("Error creating booking:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not create the booking." });
    }
  };

  const handleBookingUpdated = async (bookingId: string, oldTripId: string, oldSeat: number, updatedData: Partial<TicketBooking>) => {
    if (!firestore) return;
    const bookingRef = doc(firestore, 'ticketBookings', bookingId);
    
    try {
        await updateDoc(bookingRef, updatedData);

        const newTripId = updatedData.tripId;
        const newSeat = updatedData.seatNumber;

        // Handle seat changes if trip or seat has changed
        if (newTripId && newSeat && (newTripId !== oldTripId || newSeat !== oldSeat)) {
            // Free up old seat
            const oldTripRef = doc(firestore, 'trips', oldTripId);
            const oldTripSnap = await getDoc(oldTripRef);
            if (oldTripSnap.exists()) {
                await updateDoc(oldTripRef, { bookedSeats: arrayRemove(oldSeat) });
            }

            // Book new seat
            const newTripRef = doc(firestore, 'trips', newTripId);
            const newTripSnap = await getDoc(newTripRef);
            if (newTripSnap.exists()) {
                await updateDoc(newTripRef, { bookedSeats: arrayUnion(newSeat) });
            }
        }
        toast({ title: "Booking Updated", description: "The booking has been successfully updated." });
    } catch (error) {
        console.error("Error updating booking:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update the booking." });
    }
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking || !firestore) return;
    const bookingRef = doc(firestore, "ticketBookings", selectedBooking.id);
    const tripRef = doc(firestore, 'trips', selectedBooking.tripId);
    
    try {
        await deleteDoc(bookingRef);

        // Free up the seat on the trip
        const tripSnap = await getDoc(tripRef);
        if (tripSnap.exists()) {
            await updateDoc(tripRef, {
                bookedSeats: arrayRemove(selectedBooking.seatNumber)
            });
        }
        toast({ title: "Booking Deleted", description: "The booking has been removed." });
    } catch (error) {
        console.error("Error deleting booking:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete the booking." });
    }

    setIsDeleteDialogOpen(false);
    setSelectedBooking(null);
  };

  const openEditDialog = (booking: TicketBooking) => {
    setSelectedBooking(booking);
    setIsEditBookingDialogOpen(true);
  };

  const openDeleteDialog = (booking: TicketBooking) => {
    setSelectedBooking(booking);
    setIsDeleteDialogOpen(true);
  };
  
  const columns: ColumnDef<TicketBooking>[] = [
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
      header: "Trip",
      cell: ({ row }) => {
        const trip = tripsData?.find(t => t.id === row.original.tripId);
        return <div className="truncate w-40">{trip ? `${trip.from} to ${trip.to}` : row.original.tripId}</div>
      }
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
          return <div>{timestamp.toDate().toLocaleDateString('en-US')}</div>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const booking = row.original;
  
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
              <DropdownMenuItem onClick={() => openEditDialog(booking)}>
                Edit Booking
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => openDeleteDialog(booking)}
              >
                Delete Booking
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(booking.id)}
              >
                Copy Ticket ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

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
                  {isCacheLoading ? (
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
      <EditBookingDialog
        open={isEditBookingDialogOpen}
        onOpenChange={setIsEditBookingDialogOpen}
        booking={selectedBooking}
        trips={tripsData ?? []}
        onBookingUpdated={handleBookingUpdated}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the booking
              and free up the seat on the trip.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBooking}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NewBookingDialog({ 
    open, 
    onOpenChange,
    trips,
    onBookingCreated
}: { 
    open: boolean, 
    onOpenChange: (open: boolean) => void,
    trips: Trip[],
    onBookingCreated: (booking: Omit<TicketBooking, "id">) => Promise<void>
}) {
  const [customerName, setCustomerName] = React.useState("");
  const [idNumber, setIdNumber] = React.useState("");
  const [selectedTripId, setSelectedTripId] = React.useState<string | undefined>();
  const [selectedSeat, setSelectedSeat] = React.useState<number | undefined>();
  const [customerPhotoUrl, setCustomerPhotoUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { toast } = useToast();
  const selectedTrip = trips.find(t => t.id === selectedTripId);

  const availableSeats = React.useMemo(() => {
    if (!selectedTrip) return [];
    const booked = selectedTrip.bookedSeats || [];
    const allSeats = Array.from({ length: selectedTrip.totalSeats }, (_, i) => i + 1);
    return allSeats.filter(seat => !booked.includes(seat));
  }, [selectedTrip]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCustomerPhotoUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };
  
  const resetForm = () => {
    setCustomerName("");
    setIdNumber("");
    setSelectedTripId(undefined);
    setSelectedSeat(undefined);
    setCustomerPhotoUrl(null);
  }

  const handleCreateBooking = async () => {
    if (!customerName || !idNumber || !selectedTrip || !selectedSeat) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields."});
        return;
    }

    setIsLoading(true);
    const newBooking = {
        tripId: selectedTrip.id,
        customerName,
        idNumber,
        seatNumber: selectedSeat,
        price: selectedTrip.price,
        bookingDate: Timestamp.now(),
        status: "Confirmed" as const,
        customerPhotoUrl: customerPhotoUrl || `https://picsum.photos/seed/${customerName}/100/100`,
    };

    try {
        await onBookingCreated(newBooking);
        onOpenChange(false);
        resetForm();
    } finally {
        setIsLoading(false);
    }
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
                    {trip.from} to {trip.to} ({trip.dateTime.toDate().toLocaleDateString('en-US')})
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
                  {selectedTrip.dateTime.toDate().toLocaleString('en-US')}
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
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(selectedTrip.price)}
                </div>
              </div>
            </>
          )}
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                Photo
                </Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
            </div>
            {customerPhotoUrl && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Preview</Label>
                    <div className="col-span-3">
                        <Image src={customerPhotoUrl} alt="Customer preview" width={100} height={100} className="rounded-md object-cover" />
                    </div>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreateBooking} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
