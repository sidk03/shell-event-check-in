'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, AlertCircle, ScanLine } from 'lucide-react'
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

export default function ScanPage() {
  // Barcode scanner state
  const [barcodeInput, setBarcodeInput] = useState('')
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  
  // Manual check-in state
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
  const [lastCheckedInUser, setLastCheckedInUser] = useState<{name?: string, universityId: string} | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)

  // Always keep focus on barcode input when not in modal or manual form
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showRegistrationModal && document.activeElement?.tagName !== 'INPUT' && barcodeInputRef.current) {
        barcodeInputRef.current.focus()
      }
    }, 500)
    
    return () => clearInterval(interval)
  }, [showRegistrationModal])

  // Clear status message after timeout
  useEffect(() => {
    if (checkInStatus && checkInStatus !== 'error') {
      const timer = setTimeout(() => {
        setCheckInStatus(null)
        setStatusMessage('')
        setLastCheckedInUser(null)
      }, 5000) // Keep success messages for 10 seconds
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
        credentials: 'same-origin',
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
        setLastCheckedInUser({
          name: data.user?.name,
          universityId: data.user?.university_id || ''
        })
      } else if (data.status === 'already_checked_in') {
        setCheckInStatus('already')
        // Format the check-in time if provided
        let message = data.message || 'Already checked in today'
        if (data.check_in_time) {
          const localTime = new Date(data.check_in_time).toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })
          message = `Already checked in today at ${localTime}`
        }
        setStatusMessage(message)
        setLastCheckedInUser({
          name: data.user?.name,
          universityId: data.user?.university_id || ''
        })
      }
    } catch {
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
        credentials: 'same-origin',
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
        setLastCheckedInUser({
          name: registerName || undefined,
          universityId: registerUniversityId
        })
        setShowRegistrationModal(false)
      } else {
        setCheckInStatus('error')
        setStatusMessage(data.error || 'Registration failed')
      }
    } catch {
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
        credentials: 'same-origin',
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
          setLastCheckedInUser({
            name: data.user?.name || manualName || undefined,
            universityId: data.user?.university_id || manualUniversityId
          })
        } else if (data.status === 'already_checked_in') {
          setCheckInStatus('already')
          // Format the check-in time if provided
          let message = data.message || 'Already checked in today'
          if (data.check_in_time) {
            const localTime = new Date(data.check_in_time).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
            message = `Already checked in today at ${localTime}`
          }
          setStatusMessage(message)
          setLastCheckedInUser({
            name: data.user?.name || manualName || undefined,
            universityId: data.user?.university_id || manualUniversityId
          })
        }
        // Clear form on success
        setManualUniversityId('')
        setManualName('')
        // Refocus on barcode input
        barcodeInputRef.current?.focus()
      } else {
        setCheckInStatus('error')
        setStatusMessage(data.error || 'Check-in failed')
      }
    } catch {
      setCheckInStatus('error')
      setStatusMessage('Failed to process check-in')
    } finally {
      setIsLoading(false)
      // Always refocus on barcode input after manual check-in attempt
      setTimeout(() => {
        barcodeInputRef.current?.focus()
      }, 100)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Event Check-in</h1>
          <p className="text-muted-foreground mt-2">Process student check-ins using barcode scanner or manual entry</p>
          <p className="text-sm text-muted-foreground mt-1">To view check-in history and statistics, go to the <a href="/dashboard" className="underline hover:text-foreground">Dashboard</a></p>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Note:</strong> This is a new system. The first time you scan your ID, you will need to enter your University ID to link it to your barcode.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Barcode Scanner Tile */}
          <Card className="border-border bg-card">
            <CardHeader className="relative">
              <div className="absolute top-4 right-4">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-500 text-xs font-semibold rounded-full animate-pulse">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  READY
                </span>
              </div>
              <CardTitle className="text-xl">Barcode Scanner</CardTitle>
              <CardDescription className="text-base">Scan student ID cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="animate-pulse">
                    <ScanLine className="w-16 h-16 text-primary/60" />
                  </div>
                </div>
                <Label htmlFor="barcode" className="text-base text-muted-foreground text-center block">
                  Waiting for scan...
                </Label>
                <Input
                  ref={barcodeInputRef}
                  id="barcode"
                  type="text"
                  value={barcodeInput}
                  onChange={handleBarcodeInputChange}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Scanner input appears here"
                  className="bg-background border-input text-2xl py-8 text-center font-mono"
                  disabled={isLoading}
                  autoFocus
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Keep this field focused for scanning
                </p>
                <p className="text-xs text-muted-foreground text-center mt-1 italic">
                  Note: If scanner doesn&apos;t work, click inside the box above to refocus
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry Tile */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-xl">Manual Entry</CardTitle>
              <CardDescription className="text-base">For students without ID cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-uid" className="text-base">University ID *</Label>
                <Input
                  id="manual-uid"
                  type="text"
                  value={manualUniversityId}
                  onChange={(e) => setManualUniversityId(e.target.value)}
                  placeholder="Enter university ID"
                  className="bg-background border-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualUniversityId.trim()) {
                      handleManualCheckIn()
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-name" className="text-base">Name (Optional)</Label>
                <Input
                  id="manual-name"
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Enter student name"
                  className="bg-background border-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualUniversityId.trim()) {
                      handleManualCheckIn()
                    }
                  }}
                />
              </div>
              <Button
                onClick={handleManualCheckIn}
                disabled={!manualUniversityId.trim() || isLoading}
                className="w-full"
              >
                Check In
              </Button>
            </CardContent>
          </Card>

          {/* Confirmation/Status Tile */}
          <Card className={`border-border bg-card ${
            checkInStatus === 'success' ? 'border-green-500/50' :
            checkInStatus === 'already' ? 'border-yellow-500/50' :
            checkInStatus === 'error' ? 'border-red-500/50' : ''
          }`}>
            <CardHeader>
              <CardTitle className="text-xl">Check-in Status</CardTitle>
              <CardDescription className="text-base">Latest check-in confirmation</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[250px] text-center">
              {checkInStatus ? (
                <div className="space-y-4">
                  {checkInStatus === 'success' && (
                    <>
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                      <div>
                        <p className="text-xl font-semibold text-green-500">Success!</p>
                        <p className="text-base text-muted-foreground mt-2">{statusMessage}</p>
                        {lastCheckedInUser && (
                          <div className="mt-4 p-3 bg-background rounded-lg">
                            <p className="font-medium text-lg">{lastCheckedInUser.name || 'Student'}</p>
                            <p className="text-base text-muted-foreground">{lastCheckedInUser.universityId}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {checkInStatus === 'already' && (
                    <>
                      <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
                      <div>
                        <p className="text-xl font-semibold text-yellow-500">Already Checked In</p>
                        <p className="text-base text-muted-foreground mt-2">{statusMessage}</p>
                        {lastCheckedInUser && (
                          <div className="mt-4 p-3 bg-background rounded-lg">
                            <p className="font-medium text-lg">{lastCheckedInUser.name || 'Student'}</p>
                            <p className="text-base text-muted-foreground">{lastCheckedInUser.universityId}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {checkInStatus === 'error' && (
                    <>
                      <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                      <div>
                        <p className="text-xl font-semibold text-red-500">Error</p>
                        <p className="text-base text-muted-foreground mt-2">{statusMessage}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <div className="w-16 h-16 border-4 border-dashed border-border rounded-full mx-auto mb-4" />
                  <p className="text-lg">Ready for check-in</p>
                  <p className="text-base mt-2">Scan a barcode or use manual entry</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Registration Modal */}
      <Dialog open={showRegistrationModal} onOpenChange={setShowRegistrationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New User Registration</DialogTitle>
            <DialogDescription>
              This barcode is not registered. Please enter the student&apos;s information.
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && registerUniversityId.trim()) {
                    handleRegisterUser()
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-name">Name (Optional)</Label>
              <Input
                id="register-name"
                type="text"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="Enter student name"
                className="bg-background border-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && registerUniversityId.trim()) {
                    handleRegisterUser()
                  }
                }}
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