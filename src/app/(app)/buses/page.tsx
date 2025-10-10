"use client";

import * as React from "react";
import Image from "next/image";
import { PlusCircle, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
import { PlaceHolderImages } from "@/lib/placeholder-images";
import type { Bus } from "@/lib/types";
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking } from "@/firebase";

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

  const handleDelete = (busId: string) => {
    if (window.confirm("Are you sure you want to delete this bus?")) {
      const busRef = doc(firestore, "buses", busId);
      deleteDocumentNonBlocking(busRef);
    }
  };

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
                    <Bus className="h-16 w-16 text-muted-foreground" />
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
  );
}
