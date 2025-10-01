import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type CheckInWithUser = {
  check_in_date: string
  check_in_time: string
  user_id: string
  users: {
    university_id: string
  }
}

export async function GET() {
  try {
    // Fetch all check-ins with user information
    const { data: checkIns, error } = await supabase
      .from('check_ins')
      .select(`
        check_in_date,
        check_in_time,
        user_id,
        users!inner (
          university_id
        )
      `)
      .order('check_in_date', { ascending: false })
      .order('check_in_time', { ascending: false })

    if (error) {
      console.error('CSV export error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch check-in data' },
        { status: 500 }
      )
    }

    if (!checkIns || checkIns.length === 0) {
      return NextResponse.json(
        { error: 'No check-in data available' },
        { status: 404 }
      )
    }

    // Cast to proper type
    const typedCheckIns = checkIns as unknown as CheckInWithUser[]

    // Generate CSV content
    const csvRows = [
      // Header row
      'University ID,Check-in Date,Check-in Time'
    ]

    // Data rows
    for (const checkIn of typedCheckIns) {
      const universityId = checkIn.users.university_id
      const date = checkIn.check_in_date // Already in YYYY-MM-DD format

      // Format time as HH:MM:SS only (no date)
      const time = new Date(checkIn.check_in_time).toLocaleTimeString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })

      csvRows.push(`${universityId},${date},${time}`)
    }

    const csvContent = csvRows.join('\n')

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="check-ins-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
