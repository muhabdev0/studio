
"use client";

import * as React from "react";
import Image from "next/image";
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
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { Employee, UserRole } from "@/lib/types";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useDataCache } from "@/lib/data-cache";

const userRoles: UserRole[] = ["Admin", "Manager", "Driver", "Employee", "Mechanic"];

const getRoleBadgeVariant = (role: UserRole) => {
    switch(role) {
        case "Admin": return "default";
        case "Manager": return "secondary";
        case "Driver": return "outline";
        default: return "outline";
    }
}

function EditEmployeeDialog({
    open,
    onOpenChange,
    employee,
    onEmployeeUpdated,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
    onEmployeeUpdated: (employeeId: string, updatedData: Partial<Employee>) => Promise<void>;
  }) {
    const [fullName, setFullName] = React.useState("");
    const [role, setRole] = React.useState<UserRole>("Employee");
    const [contactInfo, setContactInfo] = React.useState("");
    const [salary, setSalary] = React.useState<number>(0);
    const [salaryPayday, setSalaryPayday] = React.useState<number>(1);
    const [profilePhotoUrl, setProfilePhotoUrl] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const { toast } = useToast();
  
    React.useEffect(() => {
      if (employee) {
        setFullName(employee.fullName);
        setRole(employee.role);
        setContactInfo(employee.contactInfo);
        setSalary(employee.salary);
        setSalaryPayday(employee.salaryPayday || 1);
        setProfilePhotoUrl(employee.profilePhotoUrl || null);
      }
    }, [employee]);
  
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhotoUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateEmployee = async () => {
      if (!employee || !fullName || !role || !contactInfo || salary <= 0 || salaryPayday < 1 || salaryPayday > 31) {
          toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields correctly."});
          return;
      }
      
      setIsLoading(true);
      const updatedData: Partial<Employee> = {
        fullName,
        role,
        contactInfo,
        salary,
        salaryPayday,
        profilePhotoUrl: profilePhotoUrl || `https://picsum.photos/seed/${fullName}/100/100`,
      };
      
      try {
          await onEmployeeUpdated(employee.id, updatedData);
          onOpenChange(false);
      } finally {
          setIsLoading(false);
      }
    };
  
    if (!employee) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update the employee's details. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">
                Full Name
              </Label>
              <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select onValueChange={(value) => setRole(value as UserRole)} value={role}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contactInfo" className="text-right">
                Contact Info
              </Label>
              <Input id="contactInfo" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salary" className="text-right">
                Salary
              </Label>
              <Input id="salary" type="number" value={salary} onChange={e => setSalary(Number(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salaryPayday" className="text-right">
                Salary Payday
              </Label>
              <Input id="salaryPayday" type="number" min="1" max="31" value={salaryPayday} onChange={e => setSalaryPayday(Number(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                Photo
                </Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
            </div>
            {profilePhotoUrl && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Preview</Label>
                    <div className="col-span-3">
                        <Image src={profilePhotoUrl} alt="Employee preview" width={100} height={100} className="rounded-md object-cover" />
                    </div>
                </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateEmployee} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

function NewEmployeeDialog({
  open,
  onOpenChange,
  onEmployeeCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmployeeCreated: (employee: Omit<Employee, "id">) => Promise<void>;
}) {
  const [fullName, setFullName] = React.useState("");
  const [role, setRole] = React.useState<UserRole>("Employee");
  const [contactInfo, setContactInfo] = React.useState("");
  const [salary, setSalary] = React.useState<number>(0);
  const [salaryPayday, setSalaryPayday] = React.useState<number>(1);
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFullName("");
    setRole("Employee");
    setContactInfo("");
    setSalary(0);
    setSalaryPayday(1);
    setProfilePhotoUrl(null);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfilePhotoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleCreateEmployee = async () => {
    if (!fullName || !role || !contactInfo || salary <= 0 || salaryPayday < 1 || salaryPayday > 31) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please fill out all required fields correctly."});
        return;
    }
    
    setIsLoading(true);
    const newEmployee: Omit<Employee, "id"> = {
      fullName,
      role,
      contactInfo,
      salary,
      salaryPayday,
      profilePhotoUrl: profilePhotoUrl || `https://picsum.photos/seed/${fullName}/100/100`
    };
    
    try {
        await onEmployeeCreated(newEmployee);
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
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Enter the details for the new employee.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fullName" className="text-right">
              Full Name
            </Label>
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select onValueChange={(value) => setRole(value as UserRole)} value={role}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {userRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="contactInfo" className="text-right">
              Contact Info
            </Label>
            <Input id="contactInfo" value={contactInfo} onChange={e => setContactInfo(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="salary" className="text-right">
              Salary
            </Label>
            <Input id="salary" type="number" value={salary} onChange={e => setSalary(Number(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="salaryPayday" className="text-right">
                Salary Payday (Day of Month)
              </Label>
              <Input id="salaryPayday" type="number" min="1" max="31" value={salaryPayday} onChange={e => setSalaryPayday(Number(e.target.value))} className="col-span-3" />
            </div>
           <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">
                Photo
                </Label>
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
            </div>
            {profilePhotoUrl && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Preview</Label>
                    <div className="col-span-3">
                        <Image src={profilePhotoUrl} alt="Customer preview" width={100} height={100} className="rounded-md object-cover" />
                    </div>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleCreateEmployee} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function EmployeesPage() {
  const firestore = useFirestore();
  const { data: employeesData, isLoading } = useDataCache();
  const { toast } = useToast();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isNewEmployeeDialogOpen, setIsNewEmployeeDialogOpen] = React.useState(false);
  const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null);

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEditEmployeeDialogOpen(true);
  };

  const openDeleteDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const columns: ColumnDef<Employee>[] = [
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
      accessorKey: "fullName",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <CaretSortIcon className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
          const employee = row.original;
          return (
              <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                      <AvatarImage src={employee.profilePhotoUrl} alt={employee.fullName} data-ai-hint="person portrait" />
                      <AvatarFallback>{employee.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="font-medium">{employee.fullName}</div>
              </div>
          )
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
          const role = row.getValue("role") as UserRole;
          return <Badge variant={getRoleBadgeVariant(role)}>{role}</Badge>
      }
    },
    {
      accessorKey: "contactInfo",
      header: "Contact Info",
    },
    {
      accessorKey: "salary",
      header: () => <div className="text-right">Salary</div>,
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("salary"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
  
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
        accessorKey: "salaryPayday",
        header: () => <div className="text-center">Salary Payday</div>,
        cell: ({ row }) => {
          const day = row.getValue("salaryPayday");
          return <div className="text-center">{day}</div>;
        },
      },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const employee = row.original;
  
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
                  onClick={() => navigator.clipboard.writeText(employee.id)}
                  >
                  Copy Employee ID
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openEditDialog(employee)}>Edit Profile</DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => openDeleteDialog(employee)}
                  >
                      Delete Profile
                  </DropdownMenuItem>
              </DropdownMenuContent>
              </DropdownMenu>
          </div>
        );
      },
    },
  ];


  const table = useReactTable({
    data: employeesData ?? [],
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

  const handleEmployeeCreated = async (newEmployee: Omit<Employee, "id">) => {
    const employeesCollection = collection(firestore, 'employees');
    try {
        await addDoc(employeesCollection, newEmployee);
        toast({ title: "Employee Added", description: `${newEmployee.fullName} has been added.` });
    } catch (error) {
        console.error("Error creating employee: ", error);
        toast({ variant: "destructive", title: "Error", description: "Could not add the new employee." });
    }
  };

  const handleEmployeeUpdated = async (employeeId: string, updatedData: Partial<Employee>) => {
    const employeeRef = doc(firestore, 'employees', employeeId);
    try {
        await updateDoc(employeeRef, updatedData);
        toast({ title: "Employee Updated", description: "The employee's details have been successfully updated."});
    } catch (error) {
        console.error("Error updating employee:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not update the employee's details."});
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    const employeeRef = doc(firestore, "employees", selectedEmployee.id);
    try {
        await deleteDoc(employeeRef);
        toast({ title: "Employee Deleted", description: "The employee has been removed."});
    } catch (error) {
        console.error("Error deleting employee:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not delete the employee."});
    }
    setIsDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };


  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
              <div>
                  <CardTitle>Employee Management</CardTitle>
                  <CardDescription>
                  Here you can add, edit, and manage all employee profiles.
                  </CardDescription>
              </div>
              <Button onClick={() => setIsNewEmployeeDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Employee
              </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <div className="flex items-center py-4">
              <Input
                placeholder="Filter by name..."
                value={
                  (table.getColumn("fullName")?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table
                    .getColumn("fullName")
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
                          {column.id === 'fullName' ? 'Name' : column.id.replace(/([A-Z])/g, ' $1')}
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
      <NewEmployeeDialog 
        open={isNewEmployeeDialogOpen}
        onOpenChange={setIsNewEmployeeDialogOpen}
        onEmployeeCreated={handleEmployeeCreated}
      />
       <EditEmployeeDialog
        open={isEditEmployeeDialogOpen}
        onOpenChange={setIsEditEmployeeDialogOpen}
        employee={selectedEmployee}
        onEmployeeUpdated={handleEmployeeUpdated}
      />
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee's profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
