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
import { PlaceHolderImages } from "@/lib/placeholder-images"

const bookings = [
    { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "19.99", imageId: "employee1" },
    { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "39.00", imageId: "employee2" },
    { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: "29.50", imageId: "employee3" },
    { name: "William Kim", email: "will@email.com", amount: "99.00", imageId: "employee4" },
    { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "25.00", imageId: "employee5" },
]

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);


export function RecentBookings() {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
        <CardDescription>You have 265 bookings this month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {bookings.map((booking) => {
            const image = getImage(booking.imageId);
            return (
                <div key={booking.email} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={image?.imageUrl} alt="Avatar" data-ai-hint={image?.imageHint}/>
                        <AvatarFallback>{booking.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{booking.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.email}</p>
                    </div>
                    <div className="ml-auto font-medium">+${booking.amount}</div>
                </div>
            )
        })}
      </CardContent>
    </Card>
  )
}
