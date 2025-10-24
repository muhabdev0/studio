
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
import { collection, Timestamp, addDoc } from "firebase/firestore";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from "date-fns";
import { enUS } from 'date-fns/locale';

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
import type { FinanceRecord } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { KpiCard } from "@/components/dashboard/KpiCard";

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

export const columns: ColumnDef<FinanceRecord>[] = [
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
                <DropdownMenuItem>Edit Entry</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                    Delete Entry
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      );
    },
  },
];

function FinanceTable({ data, isLoading }: { data: FinanceRecord[] | null | undefined, isLoading: boolean }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

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

function NewEntryDialog({
    open,
    onOpenChange,
    onEntryCreated
} : {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onEntryCreated: (entry: Omit<FinanceRecord, "id">) => Promise<void>;
}) {
    const [type, setType] = React.useState<FinanceRecord["type"]>("Expense");
    const [category, setCategory] = React.useState<FinanceRecord["category"]>("Other");
    const [amount, setAmount] = React.useState<number>(0);
    const [date, setDate] = React.useState<Date>();
    const [description, setDescription] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();

    const resetForm = () => {
        setType("Expense");
        setCategory("Other");
        setAmount(0);
        setDate(undefined);
        setDescription("");
    }

    const handleCreateEntry = async () => {
        if (!type || !category || amount <= 0 || !date || !description) {
            toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields."});
            return;
        }

        setIsLoading(true);
        const newEntry: Omit<FinanceRecord, "id"> = {
            type,
            category,
            amount,
            date: Timestamp.fromDate(date),
            description,
        };
        
        try {
            await onEntryCreated(newEntry);
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
                    <DialogTitle>Add New Finance Entry</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new financial record.
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
                    <Button onClick={handleCreateEntry} disabled={isLoading}>
                        {isLoading ? "Creating..." : "Create Entry"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

type DateRangePreset = "all" | "today" | "week" | "month" | "year";

export default function FinancePage() {
  const firestore = useFirestore();
  const financeQuery = useMemoFirebase(() => collection(firestore, "financeRecords"), [firestore]);
  const { data, isLoading } = useCollection<FinanceRecord>(financeQuery);
  const { toast } = useToast();
  
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = React.useState(false);
  const [dateRange, setDateRange] = React.useState<DateRangePreset>("all");

  const filteredData = React.useMemo(() => {
    if (!data) return [];
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (dateRange) {
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

    return data.filter(record => {
        const recordDate = record.date.toDate();
        return recordDate >= startDate! && recordDate <= endDate!;
    });
  }, [data, dateRange]);


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

  const handleEntryCreated = async (newEntry: Omit<FinanceRecord, "id">) => {
    const financeCollection = collection(firestore, 'financeRecords');
    try {
        await addDoc(financeCollection, newEntry);
        toast({ title: "Entry Created", description: "The new financial record has been added."});
    } catch (error) {
        console.error("Error creating finance entry:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not create the new entry."});
    }
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  }

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
                <Select onValueChange={(value) => setDateRange(value as DateRangePreset)} value={dateRange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a date range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
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
                <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All Records</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
                <TabsTrigger value="expenses">All Expenses</TabsTrigger>
                <TabsTrigger value="salaries">Salaries</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                <FinanceTable data={filteredData} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="income">
                <FinanceTable data={incomeData} isLoading={isLoading} />
                </TabsContent>
                 <TabsContent value="expenses">
                <FinanceTable data={expensesData} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="salaries">
                <FinanceTable data={salariesData} isLoading={isLoading} />
                </TabsContent>
                <TabsContent value="maintenance">
                <FinanceTable data={maintenanceData} isLoading={isLoading} />
                </TabsContent>
            </Tabs>
            </CardContent>
        </Card>
      </div>
      <NewEntryDialog
        open={isNewEntryDialogOpen}
        onOpenChange={setIsNewEntryDialogOpen}
        onEntryCreated={handleEntryCreated}
      />
    </>
  );
}

    