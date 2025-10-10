"use client";

import * as React from "react";
import Image from "next/image";
import { PlusCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";

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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Bus } from "@/lib/types";

const busesData: Bus[] = [
  {
    id: "BUS-01",
    name: "City Cruiser 1",
    plateNumber: "NYC-1234",
    capacity: 50,
    maintenanceStatus: "Operational",
    assignedDriverId: "DRV-A",
    imageUrl: PlaceHolderImages.find(img => img.id === 'bus1')?.imageUrl,
  },
  {
    id: "BUS-02",
    name: "MetroLink 5",
    plateNumber: "LA-5678",
    capacity: 45,
    maintenanceStatus: "Operational",
    assignedDriverId: "DRV-B",
    imageUrl: "https://picsum.photos/seed/bus2/600/400"
  },
  {
    id: "BUS-03",
    name: "Downtown Express",
    plateNumber: "CHI-9101",
    capacity: 55,
    maintenanceStatus: "Maintenance",
    assignedDriverId: "DRV-C",
    imageUrl: "https://picsum.photos/seed/bus3/600/400"
  },
  {
    id: "BUS-04",
    name: "Sunshine Shuttle",
    plateNumber: "MIA-1121",
    capacity: 40,
    maintenanceStatus: "Operational",
    assignedDriverId: "DRV-D",
    imageUrl: "https://picsum.photos/seed/bus4/600/400"
  },
  {
    id: "BUS-05",
    name: "Mountain Mover",
    plateNumber: "DEN-3141",
    capacity: 60,
    maintenanceStatus: "Out of Service",
    assignedDriverId: "DRV-E",
    imageUrl: "https://picsum.photos/seed/bus5/600/400"
  },
];


const StatusBadge = ({ status }: { status: Bus["maintenanceStatus"] }) => {
  const variant = {
    "Operational": "default",
    "Maintenance": "secondary",
    "Out of Service": "destructive",
  }[status] as "default" | "secondary" | "destructive";
  return <Badge variant={variant}>{status}</Badge>;
};

export default function BusesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Bus Management</h1>
          <p className="text-muted-foreground">
            Here you can add, edit, and manage all company buses.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Bus
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {busesData.map((bus) => (
          <Card key={bus.id}>
            <CardHeader className="relative">
              {bus.imageUrl && (
                <div className="relative h-40 w-full rounded-t-lg overflow-hidden">
                    <Image
                    src={bus.imageUrl}
                    alt={`Image of ${bus.name}`}
                    fill
                    className="object-cover"
                    data-ai-hint="bus"
                  />
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
                    <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Bus
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Bus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
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
  );
}
