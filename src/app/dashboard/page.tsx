'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Users, Clock, Search, Calendar } from 'lucide-react'
import { formatDateInEST } from '@/lib/dateUtils'

type StatsData = {
  totalCheckedIn: number
  totalRegistered: number
  attendanceRate: string
  recentCheckIns: Array<{
    id: string
    time: string
    timeStamp?: string
    userName: string
  }>
  date: string
}

type UserHistory = {
  user: {
    id: string
    name?: string
    universityId: string
    barcodeId?: number
  }
  checkIns: Array<{
    id: string
    date: string
    time: string
    dateTime: string
  }>
  totalCheckIns: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData>({
    totalCheckedIn: 0,
    totalRegistered: 0,
    attendanceRate: '0',
    recentCheckIns: [],
    date: new Date().toISOString().split('T')[0]
  })

  const [searchUniversityId, setSearchUniversityId] = useState('')
  const [userHistory, setUserHistory] = useState<UserHistory | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

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

  // Search user history
  const searchUserHistory = async () => {
    if (!searchUniversityId.trim()) {
      setSearchError('Please enter a University ID')
      return
    }

    setIsSearching(true)
    setSearchError('')
    setUserHistory(null)

    try {
      const response = await fetch(`/api/users/history?university_id=${encodeURIComponent(searchUniversityId)}`)
      const data = await response.json()
      
      if (response.ok) {
        setUserHistory(data)
      } else {
        setSearchError(data.error || 'User not found')
      }
    } catch (error) {
      setSearchError('Failed to fetch user history')
    } finally {
      setIsSearching(false)
    }
  }

  // Clear search results
  const clearSearch = () => {
    setSearchUniversityId('')
    setUserHistory(null)
    setSearchError('')
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
          <p className="text-muted-foreground mt-2">Event statistics and check-in management</p>
        </div>

        <div className="space-y-8">
          {/* Section 1: Total Registrations and Event History */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Total Registrations */}
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registered Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalRegistered}</div>
                <p className="text-xs text-muted-foreground mt-1">Students in database</p>
              </CardContent>
            </Card>

            {/* Event History */}
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Event History</CardTitle>
                <CardDescription>Today's event attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Date</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDateInEST(stats.date)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Attendance</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {stats.totalCheckedIn} / {stats.totalRegistered} ({stats.attendanceRate}%)
                      </span>
                    </div>
                    <div className="w-full bg-background rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(parseFloat(stats.attendanceRate), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 2: Recent Check-ins */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recent Check-ins</CardTitle>
              <CardDescription>Latest students checked in today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentCheckIns.length > 0 ? (
                  stats.recentCheckIns.slice(0, 5).map((checkIn) => (
                    <div 
                      key={checkIn.id} 
                      className="flex items-center justify-between py-2 px-3 rounded bg-background/50"
                    >
                      <span className="font-medium text-sm">{checkIn.userName}</span>
                      <span className="text-sm text-muted-foreground">{checkIn.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">No check-ins yet today</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Check-in History Lookup */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Check-in History Lookup</CardTitle>
              <CardDescription>Search for a student's check-in history by University ID</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={searchUniversityId}
                  onChange={(e) => setSearchUniversityId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUserHistory()}
                  placeholder="Enter University ID"
                  className="bg-background border-input"
                />
                <Button
                  onClick={searchUserHistory}
                  disabled={isSearching}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {(userHistory || searchError) && (
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                  >
                    Clear
                  </Button>
                )}
              </div>

              {searchError && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                  {searchError}
                </div>
              )}

              {userHistory && (
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-lg">{userHistory.user.name || 'Unknown Student'}</h4>
                      <p className="text-sm text-muted-foreground">University ID: {userHistory.user.universityId}</p>
                      {userHistory.user.barcodeId && (
                        <p className="text-xs text-muted-foreground mt-1">Barcode: {userHistory.user.barcodeId}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{userHistory.totalCheckIns}</p>
                      <p className="text-xs text-muted-foreground">Total Check-ins</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-muted-foreground mb-2">History</h5>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {userHistory.checkIns.length > 0 ? (
                        userHistory.checkIns.map((checkIn) => (
                          <div key={checkIn.id} className="flex items-center justify-between py-2 px-3 rounded bg-background/50">
                            <span className="text-sm">
                              {new Date(checkIn.date).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                            <span className="text-sm text-muted-foreground">{checkIn.time}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No check-ins found</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}