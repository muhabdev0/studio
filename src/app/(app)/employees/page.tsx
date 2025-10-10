import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function EmployeesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Management</CardTitle>
        <CardDescription>
          Here you can add, edit, and manage all employee profiles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Employee management interface will be built here.</p>
      </CardContent>
    </Card>
  );
}
