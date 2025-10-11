"use client";

import * as React from "react";
import Image from "next/image";
import { PlusCircle, MoreVertical, Pencil, Trash2, Bus as BusIcon } from "lucide-react";
import { collection, doc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Bus } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase";

const maintenanceStatuses: Bus["maintenanceStatus"][] = ["Operational", "Maintenance", "Out of Service"];

function BusDialog({ 
    open, 
    onOpenChange, 
    onSave,
    bus
}: { 
    open: boolean; 
    onOpenChange: (open: boolean) => void; 
    onSave: (bus: Partial<Bus>) => void;
    bus?: Bus | null;
}) {
  const [name, setName] = React.useState("");
  const [plateNumber, setPlateNumber] = React.useState("");
  const [capacity, setCapacity] = React.useState<number>(0);
  const [maintenanceStatus, setMaintenanceStatus] = React.useState<Bus["maintenanceStatus"]>("Operational");
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);

  const isEditMode = !!bus;

  React.useEffect(() => {
      if (bus) {
          setName(bus.name || "");
          setPlateNumber(bus.plateNumber || "");
          setCapacity(bus.capacity || 0);
          setMaintenanceStatus(bus.maintenanceStatus || "Operational");
          setImageUrl(bus.imageUrl || null);
      } else {
          // Reset for new bus
          setName("");
          setPlateNumber("");
          setCapacity(0);
          setMaintenanceStatus("Operational");
          setImageUrl(null);
      }
  }, [bus, open]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setImageUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSave = () => {
    if (!name || !plateNumber || capacity <= 0) return;

    const busData: Partial<Bus> = {
      name,
      plateNumber,
      capacity,
      maintenanceStatus,
      imageUrl: imageUrl || `https://picsum.photos/seed/${plateNumber}/600/400`,
    };

    onSave(busData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Bus' : 'Add New Bus'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details of the bus.' : 'Enter the details for the new bus.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name/Number
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="plateNumber" className="text-right">
              Plate Number
            </Label>
            <Input id="plateNumber" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="capacity" className="text-right">
              Capacity
            </Label>
            <Input id="capacity" type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select onValueChange={(value) => setMaintenanceStatus(value as Bus["maintenanceStatus"])} value={maintenanceStatus}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {maintenanceStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">
              Image
            </Label>
            <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="col-span-3" />
          </div>
          {imageUrl && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Preview</Label>
                <div className="col-span-3">
                    <Image src={imageUrl} alt="Bus preview" width={150} height={100} className="rounded-md object-cover" />
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>{isEditMode ? 'Save Changes' : 'Create Bus'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


const StatusBadge = ({ status }: { status: Bus["maintenanceStatus"] }) => {
  const variant = {
    "Operational": "default",
    "Maintenance": "secondary",
    "Out of Service": "destructive",
  }[status] as "default" | "secondary" | "destructive";
  return <Badge variant={variant}>{status}</Badge>;
};

export default function BusesPage() {
  const firestore = useFirestore();
  const busesQuery = useMemoFirebase(() => collection(firestore, "buses"), [firestore]);
  const { data: busesData, isLoading } = useCollection<Bus>(busesQuery);
  
  const [isNewBusDialogOpen, setIsNewBusDialogOpen] = React.useState(false);
  const [isEditBusDialogOpen, setIsEditBusDialogOpen] = React.useState(false);
  const [selectedBus, setSelectedBus] = React.useState<Bus | null>(null);

  const handleDelete = (busId: string) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      const busRef = doc(firestore, "buses", busId);
      deleteDocumentNonBlocking(busRef);
    }
  };

  const handleBusCreated = (newBus: Partial<Bus>) => {
    const busesCollection = collection(firestore, 'buses');
    addDocumentNonBlocking(busesCollection, newBus);
  };

  const handleBusUpdated = (updatedBus: Partial<Bus>) => {
    if (!selectedBus) return;
    const busRef = doc(firestore, 'buses', selectedBus.id);
    updateDocumentNonBlocking(busRef, updatedBus);
  };
  
  const openEditDialog = (bus: Bus) => {
      setSelectedBus(bus);
      setIsEditBusDialogOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Bus Management</h1>
            <p className="text-muted-foreground">
              Here you can add, edit, and manage all company buses.
            </p>
          </div>
          <Button onClick={() => setIsNewBusDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Bus
          </Button>
        </div>
          {isLoading && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                      <Card key={i}>
                          <CardHeader className="relative">
                              <div className="relative h-40 w-full rounded-t-lg overflow-hidden bg-muted animate-pulse"></div>
                          </CardHeader>
                          <CardContent className="space-y-2 pt-6">
                              <div className="h-6 w-3/4 rounded bg-muted animate-pulse"></div>
                              <div className="h-4 w-1/2 rounded bg-muted animate-pulse"></div>
                              <div className="h-4 w-1/4 rounded bg-muted animate-pulse"></div>
                          </CardContent>
                          <CardFooter>
                              <div className="h-10 w-full rounded bg-muted animate-pulse"></div>
                          </CardFooter>
                      </Card>
                  ))}
              </div>
          )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {busesData?.map((bus) => (
            <Card key={bus.id}>
              <CardHeader className="relative p-0">
                {bus.imageUrl ? (
                  <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                      <Image
                      src={bus.imageUrl}
                      alt={`Image of ${bus.name}`}
                      fill
                      className="object-cover"
                      data-ai-hint="bus"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full rounded-t-lg bg-muted flex items-center justify-center">
                      <BusIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                 <div className="absolute top-2 right-2">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/50 hover:bg-background/80">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openEditDialog(bus)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Bus
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                        onClick={() => handleDelete(bus.id)}
                      >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Bus
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">
                  <CardTitle className="text-lg">{bus.name}</CardTitle>
                  <CardDescription>Plate: {bus.plateNumber}</CardDescription>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Capacity: {bus.capacity}</span>
                      <StatusBadge status={bus.maintenanceStatus} />
                  </div>
              </CardContent>
               <CardFooter>
                   <Button variant="outline" className="w-full">View Details</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      <BusDialog 
        open={isNewBusDialogOpen} 
        onOpenChange={setIsNewBusDialogOpen} 
        onSave={handleBusCreated}
      />
      <BusDialog
        open={isEditBusDialogOpen}
        onOpenChange={setIsEditBusDialogOpen}
        onSave={handleBusUpdated}
        bus={selectedBus}
      />
    </>
  );
}
