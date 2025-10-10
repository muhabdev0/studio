import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function TripsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Management</CardTitle>
        <CardDescription>
          Here you can add, edit, and manage all trips.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Trip management interface and AI assignment tool will be built here.</p>
      </CardContent>
    </Card>
  );
}
