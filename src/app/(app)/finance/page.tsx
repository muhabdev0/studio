import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function FinancePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Finance Management</CardTitle>
        <CardDescription>
          Here you can track income, expenses, and view financial summaries.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Finance management interface will be built here.</p>
      </CardContent>
    </Card>
  );
}
