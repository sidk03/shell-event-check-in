'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, TrendingUp, Clock } from 'lucide-react'

type StatsData = {
  totalCheckedIn: number
  totalRegistered: number
  attendanceRate: string
  recentCheckIns: Array<{
    id: string
    time: string
    userName: string
    universityId: string
  }>
  date: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    totalCheckedIn: 0,
    totalRegistered: 0,
    attendanceRate: '0',
    recentCheckIns: [],
    date: new Date().toISOString().split('T')[0]
  })

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/check-in/stats')
      const data = await response.json()
      if (response.ok && !data.error) {
        setStats({
          totalCheckedIn: data.totalCheckedIn || 0,
          totalRegistered: data.totalRegistered || 0,
          attendanceRate: data.attendanceRate || '0',
          recentCheckIns: data.recentCheckIns || [],
          date: data.date || new Date().toISOString().split('T')[0]
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Event check-in statistics and analytics for {stats.date}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRegistered}</div>
              <p className="text-xs text-muted-foreground">Students in database</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Checked In Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckedIn}</div>
              <p className="text-xs text-muted-foreground">Students checked in</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Of registered students</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-in Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Active</div>
              <p className="text-xs text-muted-foreground">System operational</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Check-ins */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recent Check-ins</CardTitle>
              <CardDescription>Latest student check-ins for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.recentCheckIns.length > 0 ? (
                  stats.recentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{checkIn.userName}</p>
                        <p className="text-sm text-muted-foreground">{checkIn.universityId}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-muted-foreground">{checkIn.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No check-ins yet today</p>
                    <p className="text-sm mt-1">Check-ins will appear here in real-time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Summary */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Event Overview</CardTitle>
              <CardDescription>Summary of today's event activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Event Date</span>
                  <span className="font-medium">{new Date(stats.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Check-in Progress</span>
                  <span className="font-medium">{stats.totalCheckedIn} / {stats.totalRegistered}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Attendance</span>
                    <span className="text-sm font-medium">{stats.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(parseFloat(stats.attendanceRate), 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <h4 className="text-sm font-medium">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-2 text-sm bg-background hover:bg-accent rounded-md transition-colors text-center">
                      Export Data
                    </button>
                    <button className="p-2 text-sm bg-background hover:bg-accent rounded-md transition-colors text-center">
                      View Reports
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}