'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type CheckInStatus = 'success' | 'already' | 'error' | null
type CheckInResponse = {
  status: string
  user?: {
    id: string
    name?: string
    university_id: string
  }
  message?: string
  barcode_id?: number
  check_in_time?: string
}

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
}

export default function ScanPage() {
  // Barcode scanner state
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  
  // Manual check-in state
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualUniversityId, setManualUniversityId] = useState('')
  const [manualName, setManualName] = useState('')
  
  // Registration modal state
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [pendingBarcodeId, setPendingBarcodeId] = useState<number | null>(null)
  const [registerUniversityId, setRegisterUniversityId] = useState('')
  const [registerName, setRegisterName] = useState('')
  
  // Feedback state
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>(null)
  const [statusMessage, setStatusMessage] = useState('')
  
  // Statistics state
  const [stats, setStats] = useState<StatsData>({
    totalCheckedIn: 0,
    totalRegistered: 0,
    attendanceRate: '0',
    recentCheckIns: []
  })
  
  const [isLoading, setIsLoading] = useState(false)

  // Always keep focus on barcode input
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showRegistrationModal && !showManualForm && barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [showRegistrationModal, showManualForm])

  // Fetch statistics on mount and after each check-in
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/check-in/stats')
      const data = await response.json()
      if (response.ok && !data.error) {
        setStats({
          totalCheckedIn: data.totalCheckedIn || 0,
          totalRegistered: data.totalRegistered || 0,
          attendanceRate: data.attendanceRate || '0',
          recentCheckIns: data.recentCheckIns || []
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Keep existing stats on error
    }
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  // Clear status message after timeout
  useEffect(() => {
    if (checkInStatus) {
      const timer = setTimeout(() => {
        setCheckInStatus(null)
        setStatusMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [checkInStatus, statusMessage])

  // Handle barcode scan
  const handleBarcodeScan = async (value: string) => {
    if (!value.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/check-in/barcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode_id: value })
      })
      
      const data: CheckInResponse = await response.json()
      
      if (data.status === 'new_user_required') {
        // Open registration modal
        setPendingBarcodeId(data.barcode_id || null)
        setShowRegistrationModal(true)
        setRegisterUniversityId('')
        setRegisterName('')
      } else if (data.status === 'checked_in') {
        setCheckInStatus('success')
        setStatusMessage(data.message || 'Successfully checked in')
        fetchStats()
      } else if (data.status === 'already_checked_in') {
        setCheckInStatus('already')
        setStatusMessage(data.message || 'Already checked in today')
      }
    } catch (error) {
      setCheckInStatus('error')
      setStatusMessage('Failed to process check-in')
    } finally {
      setIsLoading(false)
      setBarcodeInput('')
      barcodeInputRef.current?.focus()
    }
  }

  // Handle barcode input change
  const handleBarcodeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBarcodeInput(value)
    
    // Auto-submit on Enter or if input looks complete
    if (value.includes('\n') || value.includes('\r')) {
      handleBarcodeScan(value.replace(/[\n\r]/g, ''))
    }
  }

  // Handle Enter key for barcode scanner
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBarcodeScan(barcodeInput)
    }
  }

  // Handle new user registration
  const handleRegisterUser = async () => {
    if (!registerUniversityId.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barcode_id: pendingBarcodeId,
          university_id: registerUniversityId,
          name: registerName
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setCheckInStatus('success')
        setStatusMessage(data.message || 'Successfully registered and checked in')
        setShowRegistrationModal(false)
        fetchStats()
      } else {
        setCheckInStatus('error')
        setStatusMessage(data.error || 'Registration failed')
      }
    } catch (error) {
      setCheckInStatus('error')
      setStatusMessage('Failed to register user')
    } finally {
      setIsLoading(false)
      setPendingBarcodeId(null)
      barcodeInputRef.current?.focus()
    }
  }

  // Handle manual check-in
  const handleManualCheckIn = async () => {
    if (!manualUniversityId.trim()) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/check-in/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          university_id: manualUniversityId,
          name: manualName
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        if (data.status === 'checked_in') {
          setCheckInStatus('success')
          setStatusMessage(data.message || 'Successfully checked in')
        } else if (data.status === 'already_checked_in') {
          setCheckInStatus('already')
          setStatusMessage(data.message || 'Already checked in today')
        }
        setManualUniversityId('')
        setManualName('')
        setShowManualForm(false)
        fetchStats()
      } else {
        setCheckInStatus('error')
        setStatusMessage(data.error || 'Check-in failed')
      }
    } catch (error) {
      setCheckInStatus('error')
      setStatusMessage('Failed to process check-in')
    } finally {
      setIsLoading(false)
      barcodeInputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Event Check-in</h1>
          <p className="text-muted-foreground mt-2">Scan ID cards or enter information manually</p>
        </div>

        {/* Status Alert */}
        {checkInStatus && (
          <Alert className={`mb-6 ${
            checkInStatus === 'success' ? 'border-green-500 bg-green-500/10' :
            checkInStatus === 'already' ? 'border-yellow-500 bg-yellow-500/10' :
            'border-red-500 bg-red-500/10'
          }`}>
            <AlertDescription className={
              checkInStatus === 'success' ? 'text-green-500' :
              checkInStatus === 'already' ? 'text-yellow-500' :
              'text-red-500'
            }>
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Barcode Scanner Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Barcode Scanner</CardTitle>
              <CardDescription>Scan student ID cards for quick check-in</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Waiting for scan...</Label>
                <Input
                  ref={barcodeInputRef}
                  id="barcode"
                  type="text"
                  value={barcodeInput}
                  onChange={handleBarcodeInputChange}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Scanner input appears here"
                  className="bg-background border-input text-2xl py-6"
                  disabled={isLoading}
                  autoFocus
                  autoComplete="off"
                />
                <p className="text-sm text-muted-foreground">
                  Scanner will auto-submit. Keep this field focused.
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowManualForm(!showManualForm)}
                  className="w-full"
                >
                  {showManualForm ? 'Hide Manual Entry' : 'Manual Entry (No ID Card)'}
                </Button>
              </div>

              {/* Manual Check-in Form */}
              {showManualForm && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-background/50">
                  <div className="space-y-2">
                    <Label htmlFor="manual-uid">University ID</Label>
                    <Input
                      id="manual-uid"
                      type="text"
                      value={manualUniversityId}
                      onChange={(e) => setManualUniversityId(e.target.value)}
                      placeholder="Enter university ID"
                      className="bg-background border-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-name">Name (Optional)</Label>
                    <Input
                      id="manual-name"
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Enter name"
                      className="bg-background border-input"
                    />
                  </div>
                  <Button
                    onClick={handleManualCheckIn}
                    disabled={!manualUniversityId.trim() || isLoading}
                    className="w-full"
                  >
                    Check In Manually
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Check-ins Card */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recent Check-ins</CardTitle>
              <CardDescription>Latest student check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stats.recentCheckIns.length > 0 ? (
                  stats.recentCheckIns.map((checkIn) => (
                    <div key={checkIn.id} className="flex justify-between items-center p-2 rounded bg-background/50">
                      <div>
                        <p className="font-medium">{checkIn.userName}</p>
                        <p className="text-sm text-muted-foreground">{checkIn.universityId}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{checkIn.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No check-ins yet today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Card */}
        <Card className="border-border bg-card mt-6">
          <CardHeader>
            <CardTitle>Today\'s Statistics</CardTitle>
            <CardDescription>Current event check-in summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Registered</p>
                <p className="text-2xl font-bold">{stats.totalRegistered}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Checked In Today</p>
                <p className="text-2xl font-bold">{stats.totalCheckedIn}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Registration Modal */}
      <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New User Registration</DialogTitle>
            <DialogDescription>
              This barcode is not registered. Please enter the user\'s information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="register-uid">University ID (Required)</Label>
              <Input
                id="register-uid"
                type="text"
                value={registerUniversityId}
                onChange={(e) => setRegisterUniversityId(e.target.value)}
                placeholder="Enter university ID"
                className="bg-background border-input"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-name">Name (Optional)</Label>
              <Input
                id="register-name"
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Enter name"
                className="bg-background border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRegistrationModal(false)
                setPendingBarcodeId(null)
                barcodeInputRef.current?.focus()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRegisterUser}
              disabled={!registerUniversityId.trim() || isLoading}
            >
              Register & Check In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}