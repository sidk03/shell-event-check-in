import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  await clearAuthCookie()
  
  return NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  )
}