
"use client";

import * as React from "react";
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import { PlusCircle, Calendar as CalendarIcon, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
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
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table";
import { collection, Timestamp, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from "date-fns";
import { enUS } from 'date-fns/locale';
import type { DateRange } from "react-day-picker";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FinanceRecord, Employee } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDataCache } from "@/lib/data-cache";
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

const financeRecordTypes: FinanceRecord["type"][] = ["Income", "Expense"];
const financeRecordCategories: FinanceRecord["category"][] = ["Ticket Sale", "Salary", "Maintenance", "Rent", "Other"];

const getCategoryBadgeVariant = (category: FinanceRecord["category"]) => {
    switch(category) {
        case "Ticket Sale": return "default";
        case "Salary": return "destructive";
        case "Maintenance": return "secondary";
        case "Rent": return "secondary";
        default: return "outline";
    }
}

function FinanceTable({ 
    data, 
    isLoading,
    onEdit,
    onDelete,
 }: { 
    data: FinanceRecord[] | null | undefined, 
    isLoading: boolean,
    onEdit: (entry: FinanceRecord) => void,
    onDelete: (entry: FinanceRecord) => void,
}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  
  const columns: ColumnDef<FinanceRecord>[] = [
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
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => {
          const type = row.getValue("type") as "Income" | "Expense";
          return <Badge variant={type === "Income" ? "default" : "destructive"}>{type}</Badge>
      }
    },
     {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
          const category = row.getValue("category") as FinanceRecord["category"];
          if (category === 'Ticket Sale') {
            return (
              <div className="text-center">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white bg-green-600">
                  {category}
                </span>
              </div>
            );
          }
          return <Badge variant={getCategoryBadgeVariant(category)}>{category}</Badge>
      }
    },
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const timestamp = row.getValue("date") as Timestamp;
        return <div>{timestamp.toDate().toLocaleDateString('en-US')}</div>;
      },
    },
    {
      accessorKey: "amount",
      header: () => <div className="text-right">Amount</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
         const type = row.original.type;
         const colorClass = type === 'Income' ? 'text-green-600' : 'text-red-600';
  
        return <div className={`text-right font-medium ${colorClass}`}>{type === 'Income' ? '+' : '-'}{formatted}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const entry = row.original;
  
        return (
          <div className="text-right">
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
                      onClick={() => navigator.clipboard.writeText(entry.id)}
                  >
                  Copy Entry ID
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit(entry)}>Edit Entry</DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(entry)}
                  >
                      Delete Entry
                  </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data ?? [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by description..."
          value={
            (table.getColumn("description")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("description")
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
                    {column.id.replace(/([A-Z])/g, ' $1')}
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
  );
}

function EntryDialog({
    open,
    onOpenChange,
    onSave,
    entry,
} : {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (entry: Partial<FinanceRecord>) => void;
    entry?: FinanceRecord | null;
}) {
    const [type, setType] = React.useState<FinanceRecord["type"]>("Expense");
    const [category, setCategory] = React.useState<FinanceRecord["category"]>("Other");
    const [amount, setAmount] = React.useState<number>(0);
    const [date, setDate] = React.useState<Date>();
    const [description, setDescription] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    
    const { toast } = useToast();
    const isEditMode = !!entry;

    React.useEffect(() => {
        if (entry) {
            setType(entry.type);
            setCategory(entry.category);
            setAmount(entry.amount);
            setDate(entry.date.toDate());
            setDescription(entry.description);
        } else {
            // Reset for new entry
            setType("Expense");
            setCategory("Other");
            setAmount(0);
            setDate(undefined);
            setDescription("");
        }
    }, [entry, open]);

    const handleSave = async () => {
        if (!type || !category || amount <= 0 || !date || !description) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields."});
            return;
        }

        setIsLoading(true);
        const entryData: Partial<FinanceRecord> = {
            type,
            category,
            amount,
            date: Timestamp.fromDate(date),
            description,
        };
        
        try {
            await onSave(entryData);
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Finance Entry' : 'Add New Finance Entry'}</DialogTitle>
                    <DialogDescription>
                        {isEditMode ? 'Update the details of the financial record.' : 'Enter the details for the new financial record.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Type</Label>
                        <Select onValueChange={(value) => setType(value as FinanceRecord["type"])} value={type}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                            <SelectContent>
                                {financeRecordTypes.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">Category</Label>
                        <Select onValueChange={(value) => setCategory(value as FinanceRecord["category"])} value={category}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {financeRecordCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount</Label>
                        <Input id="amount" type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "col-span-3 justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: enUS }) : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? "Saving..." : (isEditMode ? "Save Changes" : "Create Entry")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function PayrollTab({ employees, onMarkAsPaid }: { employees: Employee[], onMarkAsPaid: (employee: Employee) => Promise<void> }) {
    const [isLoading, setIsLoading] = React.useState<Record<string, boolean>>({});
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = now.getDate();
  
    const upcomingPayments = React.useMemo(() => {
        return employees.filter(emp => {
            if (!emp.salaryPayday) return false;
            
            const payday = emp.salaryPayday;

            // Only consider paydays that are in the current month or have passed
            if (payday > today) return false;

            const lastPaidDate = emp.lastPaidDate?.toDate();

            // If never paid, and payday has passed, it's due
            if (!lastPaidDate && payday <= today) return true;

            if (lastPaidDate) {
                const lastPaidMonth = lastPaidDate.getMonth();
                const lastPaidYear = lastPaidDate.getFullYear();

                // If last paid in a previous month, and payday has passed, it's due
                if (lastPaidYear < currentYear || (lastPaidYear === currentYear && lastPaidMonth < currentMonth)) {
                    return true;
                }
            }

            // If never paid, it is due
            if(!lastPaidDate) return true;

            return false;
        });
    }, [employees, currentMonth, currentYear, today]);

    const handleMarkAsPaid = async (employee: Employee) => {
        setIsLoading(prev => ({ ...prev, [employee.id]: true }));
        try {
            await onMarkAsPaid(employee);
        } finally {
            setIsLoading(prev => ({ ...prev, [employee.id]: false }));
        }
    }

    if (employees.length === 0) {
        return <div className="text-center text-muted-foreground py-10">No employees found.</div>
    }

    return (
      <div className="space-y-4 pt-4">
        {upcomingPayments.length === 0 ? (
             <div className="text-center text-muted-foreground py-10">All salaries for this month have been paid or are not yet due.</div>
        ) : (
            upcomingPayments.map(emp => (
                <Card key={emp.id} className="flex items-center p-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={emp.profilePhotoUrl} alt={emp.fullName} />
                        <AvatarFallback>{emp.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 flex-grow">
                        <p className="font-semibold">{emp.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                            Payment due for: {format(new Date(currentYear, currentMonth, emp.salaryPayday), 'MMMM yyyy')}
                        </p>
                    </div>
                    <div className="text-right mr-4">
                        <p className="font-semibold">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(emp.salary)}</p>
                        <p className="text-sm text-muted-foreground">Salary</p>
                    </div>
                    <Button onClick={() => handleMarkAsPaid(emp)} disabled={isLoading[emp.id]}>
                        {isLoading[emp.id] ? "Processing..." : "Mark as Paid"}
                    </Button>
                </Card>
            ))
        )}
      </div>
    )
}

type DateRangePreset = "all" | "today" | "week" | "month" | "year" | "custom";

export default function FinancePage() {
  const firestore = useFirestore();
  const { 
    financeData: data, 
    employeesData: employees, 
    isLoading 
  } = useDataCache();

  const { toast } = useToast();
  
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = React.useState(false);
  const [isEditEntryDialogOpen, setIsEditEntryDialogOpen] = React.useState(false);
  const [isDeleteEntryDialogOpen, setIsDeleteEntryDialogOpen] = React.useState(false);
  const [selectedEntry, setSelectedEntry] = React.useState<FinanceRecord | null>(null);

  const [dateRangePreset, setDateRangePreset] = React.useState<DateRangePreset>("all");
  const [customDateRange, setCustomDateRange] = React.useState<DateRange | undefined>();

  const handlePresetChange = (value: string) => {
    const preset = value as DateRangePreset;
    setDateRangePreset(preset);
    if (preset !== 'custom') {
      setCustomDateRange(undefined);
    }
  }

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();

    if (dateRangePreset === 'custom' && customDateRange?.from) {
        startDate = startOfDay(customDateRange.from);
        endDate = customDateRange.to ? endOfDay(customDateRange.to) : endOfDay(customDateRange.from);
    } else {
        switch (dateRangePreset) {
            case "today":
                startDate = startOfDay(now);
                endDate = endOfDay(now);
                break;
            case "week":
                startDate = startOfWeek(now, { weekStartsOn: 1 });
                endDate = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case "month":
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            case "year":
                startDate = startOfYear(now);
                endDate = endOfYear(now);
                break;
            case "all":
            default:
                return data;
        }
    }

    if (!startDate || !endDate) return data;

    return data.filter(record => {
        const recordDate = record.date.toDate();
        return recordDate >= startDate! && recordDate <= endDate!;
    });
  }, [data, dateRangePreset, customDateRange]);


  const { totalIncome, totalExpenses, netBalance } = React.useMemo(() => {
    const income = filteredData.filter(d => d.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0);
    const expenses = filteredData.filter(d => d.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0);
    return {
        totalIncome: income,
        totalExpenses: expenses,
        netBalance: income - expenses,
    }
  }, [filteredData]);

  const incomeData = React.useMemo(() => filteredData.filter(d => d.type === 'Income'), [filteredData]);
  const expensesData = React.useMemo(() => filteredData.filter(d => d.type === 'Expense'), [filteredData]);
  const salariesData = React.useMemo(() => expensesData?.filter(d => d.category === 'Salary'), [expensesData]);
  const maintenanceData = React.useMemo(() => expensesData?.filter(d => d.category === 'Maintenance'), [expensesData]);

  const handleEntryCreated = async (newEntry: Partial<FinanceRecord>) => {
    const financeCollection = collection(firestore, 'financeRecords');
    try {
        await addDoc(financeCollection, newEntry);
        toast({ title: "Entry Created", description: "The new financial record has been added."});
    } catch (error) {
        console.error("Error creating finance entry:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not create the new entry."});
    }
  };

  const handleEntryUpdated = async (updatedEntry: Partial<FinanceRecord>) => {
    if (!selectedEntry) return;
    const entryRef = doc(firestore, 'financeRecords', selectedEntry.id);
    try {
        await updateDoc(entryRef, updatedEntry);
        toast({ title: "Entry Updated", description: "The financial record has been updated." });
    } catch (error) {
        console.error("Error updating entry:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update the entry." });
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    const entryRef = doc(firestore, "financeRecords", selectedEntry.id);
    try {
        await deleteDoc(entryRef);
        toast({ title: "Entry Deleted", description: "The financial record has been removed." });
    } catch (error) {
        console.error("Error deleting entry:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete the entry." });
    }
    setIsDeleteEntryDialogOpen(false);
    setSelectedEntry(null);
  };

  const handleMarkSalaryAsPaid = async (employee: Employee) => {
    const financeCollection = collection(firestore, 'financeRecords');
    const employeeRef = doc(firestore, 'employees', employee.id);
    const paymentDate = Timestamp.now();

    const salaryRecord: Omit<FinanceRecord, 'id'> = {
        type: 'Expense',
        category: 'Salary',
        amount: employee.salary,
        date: paymentDate,
        description: `Salary for ${employee.fullName} - ${format(paymentDate.toDate(), 'MMMM yyyy')}`
    };

    try {
        await addDoc(financeCollection, salaryRecord);
        await updateDoc(employeeRef, { lastPaidDate: paymentDate });
        toast({ title: "Salary Paid", description: `${employee.fullName}'s salary has been recorded as an expense.` });
    } catch (error) {
        console.error("Error marking salary as paid:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not process the salary payment." });
    }
  }
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }

  const openEditDialog = (entry: FinanceRecord) => {
    setSelectedEntry(entry);
    setIsEditEntryDialogOpen(true);
  };

  const openDeleteDialog = (entry: FinanceRecord) => {
    setSelectedEntry(entry);
    setIsDeleteEntryDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold">Financial Overview</h1>
                <p className="text-muted-foreground">
                    Track income, expenses, and view your financial health.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                                "w-[300px] justify-start text-left font-normal",
                                !customDateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customDateRange?.from ? (
                                customDateRange.to ? (
                                    <>
                                        {format(customDateRange.from, "LLL dd, y")} -{" "}
                                        {format(customDateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(customDateRange.from, "LLL dd, y")
                                )
                            ) : (
                                <span>Pick a date range</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={customDateRange?.from}
                            selected={customDateRange}
                            onSelect={(range) => {
                                setDateRangePreset('custom');
                                setCustomDateRange(range);
                            }}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
                <Select onValueChange={handlePresetChange} value={dateRangePreset}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a date range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom" disabled>Custom Range</SelectItem>
                    </SelectContent>
                </Select>
                 <Button onClick={() => setIsNewEntryDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Entry
                </Button>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <KpiCard title="Net Balance" value={formatCurrency(netBalance)} icon={DollarSign} isLoading={isLoading} description="Total Income - Total Expenses"/>
            <KpiCard title="Total Income" value={formatCurrency(totalIncome)} icon={TrendingUp} isLoading={isLoading} />
            <KpiCard title="Total Expenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} isLoading={isLoading} />
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                A detailed list of all your financial transactions.
                </CardDescription>
            </CardHeader>
            <CardContent>
            <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">All Records</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="expenses">All Expenses</TabsTrigger>
                    <TabsTrigger value="salaries">Salaries</TabsTrigger>
                    <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                    <TabsTrigger value="payroll">Payroll</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <FinanceTable data={filteredData} isLoading={isLoading} onEdit={openEditDialog} onDelete={openDeleteDialog}/>
                </TabsContent>
                <TabsContent value="income">
                    <FinanceTable data={incomeData} isLoading={isLoading} onEdit={openEditDialog} onDelete={openDeleteDialog}/>
                </TabsContent>
                 <TabsContent value="expenses">
                    <FinanceTable data={expensesData} isLoading={isLoading} onEdit={openEditDialog} onDelete={openDeleteDialog}/>
                </TabsContent>
                <TabsContent value="salaries">
                    <FinanceTable data={salariesData} isLoading={isLoading} onEdit={openEditDialog} onDelete={openDeleteDialog}/>
                </TabsContent>
                <TabsContent value="maintenance">
                    <FinanceTable data={maintenanceData} isLoading={isLoading} onEdit={openEditDialog} onDelete={openDeleteDialog}/>
                </TabsContent>
                <TabsContent value="payroll">
                    <PayrollTab employees={employees ?? []} onMarkAsPaid={handleMarkSalaryAsPaid} />
                </TabsContent>
            </Tabs>
            </CardContent>
        </Card>
      </div>
      <EntryDialog
        open={isNewEntryDialogOpen}
        onOpenChange={setIsNewEntryDialogOpen}
        onSave={handleEntryCreated}
      />
      <EntryDialog
        open={isEditEntryDialogOpen}
        onOpenChange={setIsEditEntryDialogOpen}
        onSave={handleEntryUpdated}
        entry={selectedEntry}
      />
       <AlertDialog open={isDeleteEntryDialogOpen} onOpenChange={setIsDeleteEntryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this financial record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEntry(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntry}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
