'use client'

import { useState } from 'react'
import Header from '@/components/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ScanPage() {
  const [scanCode, setScanCode] = useState('')
  const [scanResult, setScanResult] = useState<string | null>(null)

  const handleScan = async () => {
    if (scanCode.trim()) {
      setScanResult(`Scanned: ${scanCode}`)
      setScanCode('')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Event Check-in</h1>
          <p className="text-muted-foreground mt-2">Scan QR codes or enter attendee information</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>QR Code Scanner</CardTitle>
              <CardDescription>Scan or manually enter check-in codes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-background/50">
                <p className="text-muted-foreground text-center p-4">
                  QR Scanner will be implemented here
                </p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code manually"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  className="bg-background border-input"
                />
                <Button onClick={handleScan}>Check In</Button>
              </div>

              {scanResult && (
                <div className="p-3 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-md">
                  {scanResult}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recent Check-ins</CardTitle>
              <CardDescription>Latest attendee check-ins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">No recent check-ins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border bg-card mt-6">
          <CardHeader>
            <CardTitle>Event Statistics</CardTitle>
            <CardDescription>Current event check-in summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Registered</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Checked In</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">0%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}