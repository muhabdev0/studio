import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { TicketBooking } from "@/lib/types";

interface RecentBookingsProps {
    bookingsData: TicketBooking[] | null | undefined;
    isLoading: boolean;
}

export function RecentBookings({ bookingsData, isLoading }: RecentBookingsProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>
            A list of the most recent ticket bookings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-4 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="ml-auto h-5 w-12" />
            </div>
        ))}
        {!isLoading && bookingsData?.map((booking) => {
            return (
                <div key={booking.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://picsum.photos/seed/${booking.customerName}/100/100`} alt="Avatar" data-ai-hint="person portrait"/>
                        <AvatarFallback>{booking.customerName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{booking.customerName}</p>
                    <p className="text-sm text-muted-foreground">Trip ID: {booking.tripId.substring(0,6)}...</p>
                    </div>
                    <div className="ml-auto font-medium">+${booking.price.toFixed(2)}</div>
                </div>
            )
        })}
         {!isLoading && !bookingsData?.length && (
            <p className="text-sm text-muted-foreground text-center">No recent bookings.</p>
         )}
      </CardContent>
    </Card>
  )
}
