"use client";

import * as React from "react";
import {
  CaretSortIcon,
  ChevronDownIcon,
  DotsHorizontalIcon,
} from "@radix-ui/react-icons";
import { PlusCircle } from "lucide-react";
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
import type { FinanceEntry } from "@/lib/types";

const data: FinanceEntry[] = [
    { id: "FIN-001", type: "Income", category: "Ticket Sale", amount: 45.50, date: "2023-10-26T10:00:00Z", description: "Ticket for TRIP-101" },
    { id: "FIN-002", type: "Expense", category: "Salary", amount: 2000.00, date: "2023-10-31T00:00:00Z", description: "October salary for DRV-A" },
    { id: "FIN-003", type: "Income", category: "Ticket Sale", amount: 35.00, date: "2023-10-25T14:30:00Z", description: "Ticket for TRIP-102" },
    { id: "FIN-004", type: "Expense", category: "Maintenance", amount: 500.00, date: "2023-10-28T00:00:00Z", description: "Repair for BUS-03" },
    { id: "FIN-005", type: "Income", category: "Ticket Sale", amount: 60.00, date: "2023-10-24T09:00:00Z", description: "Ticket for TRIP-103" },
    { id: "FIN-006", type: "Expense", category: "Rent", amount: 1500.00, date: "2023-11-01T00:00:00Z", description: "Office rent for November" },
    { id: "FIN-007", type: "Income", category: "Ticket Sale", amount: 50.00, date: "2023-11-01T12:00:00Z", description: "Ticket for TRIP-104" },
    { id: "FIN-008", type: "Expense", category: "Other", amount: 75.00, date: "2023-11-02T00:00:00Z", description: "Office supplies" },
];


const getCategoryBadgeVariant = (category: FinanceEntry["category"]) => {
    switch(category) {
        case "Ticket Sale": return "default";
        case "Salary": return "destructive";
        case "Maintenance": return "secondary";
        case "Rent": return "secondary";
        default: return "outline";
    }
}


export const columns: ColumnDef<FinanceEntry>[] = [
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
        const category = row.getValue("category") as FinanceEntry["category"];
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
      return <div>{new Date(row.getValue("date")).toLocaleDateString()}</div>;
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

export default function FinancePage() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Finance Management</CardTitle>
                <CardDescription>
                 Here you can track income, expenses, and view financial summaries.
                </CardDescription>
            </div>
             <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Entry
            </Button>
        </div>
      </CardHeader>
      <CardContent>
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
  );
}
