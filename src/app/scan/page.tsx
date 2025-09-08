'use client'

import { useState, useEffect, useRef } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
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
      }, 10000) // Keep success messages for 10 seconds
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
        setLastCheckedInUser({
          name: data.user?.name,
          universityId: data.user?.university_id || ''
        })
      } else if (data.status === 'already_checked_in') {
        setCheckInStatus('already')
        setStatusMessage(data.message || 'Already checked in today')
        setLastCheckedInUser({
          name: data.user?.name,
          universityId: data.user?.university_id || ''
        })
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
        setLastCheckedInUser({
          name: registerName || undefined,
          universityId: registerUniversityId
        })
        setShowRegistrationModal(false)
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
          setLastCheckedInUser({
            name: data.user?.name || manualName || undefined,
            universityId: data.user?.university_id || manualUniversityId
          })
        } else if (data.status === 'already_checked_in') {
          setCheckInStatus('already')
          setStatusMessage(data.message || 'Already checked in today')
          setLastCheckedInUser({
            name: data.user?.name || manualName || undefined,
            universityId: data.user?.university_id || manualUniversityId
          })
        }
        // Clear form on success
        setManualUniversityId('')
        setManualName('')
      } else {
        setCheckInStatus('error')
        setStatusMessage(data.error || 'Check-in failed')
      }
    } catch (error) {
      setCheckInStatus('error')
      setStatusMessage('Failed to process check-in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Event Check-in</h1>
          <p className="text-muted-foreground mt-2">Process student check-ins using barcode scanner or manual entry</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Barcode Scanner Tile */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Barcode Scanner</CardTitle>
              <CardDescription>Scan student ID cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="barcode" className="text-sm text-muted-foreground">
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
                  Note: If scanner doesn't work, click inside the box above to refocus
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Manual Entry Tile */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Manual Entry</CardTitle>
              <CardDescription>For students without ID cards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-uid">University ID *</Label>
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
                <Label htmlFor="manual-name">Name (Optional)</Label>
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
              <CardTitle>Check-in Status</CardTitle>
              <CardDescription>Latest check-in confirmation</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[250px] text-center">
              {checkInStatus ? (
                <div className="space-y-4">
                  {checkInStatus === 'success' && (
                    <>
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-green-500">Success!</p>
                        <p className="text-sm text-muted-foreground mt-2">{statusMessage}</p>
                        {lastCheckedInUser && (
                          <div className="mt-4 p-3 bg-background rounded-lg">
                            <p className="font-medium">{lastCheckedInUser.name || 'Student'}</p>
                            <p className="text-sm text-muted-foreground">{lastCheckedInUser.universityId}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {checkInStatus === 'already' && (
                    <>
                      <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-yellow-500">Already Checked In</p>
                        <p className="text-sm text-muted-foreground mt-2">{statusMessage}</p>
                        {lastCheckedInUser && (
                          <div className="mt-4 p-3 bg-background rounded-lg">
                            <p className="font-medium">{lastCheckedInUser.name || 'Student'}</p>
                            <p className="text-sm text-muted-foreground">{lastCheckedInUser.universityId}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {checkInStatus === 'error' && (
                    <>
                      <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-red-500">Error</p>
                        <p className="text-sm text-muted-foreground mt-2">{statusMessage}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <div className="w-16 h-16 border-4 border-dashed border-border rounded-full mx-auto mb-4" />
                  <p>Ready for check-in</p>
                  <p className="text-sm mt-2">Scan a barcode or use manual entry</p>
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
              This barcode is not registered. Please enter the student's information.
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
                placeholder="Enter student name"
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