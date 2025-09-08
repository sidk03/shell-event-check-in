import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome to the Startup Shell admin portal</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Event Management</CardTitle>
              <CardDescription>Manage upcoming events and registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No active events</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Check-in Statistics</CardTitle>
              <CardDescription>View check-in analytics and reports</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No data available</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}