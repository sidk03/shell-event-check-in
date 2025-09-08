import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get today's date
    const today = new Date()
    const dateString = today.toISOString().split('T')[0]

    // Get total check-ins for today
    const { count: totalCheckedIn, error: countError } = await supabase
      .from('check_ins')
      .select('*', { count: 'exact', head: true })
      .eq('check_in_date', dateString)

    if (countError) {
      console.error('Count error:', countError)
      throw countError
    }

    // Get recent check-ins
    const { data: recentCheckIns, error: recentError } = await supabase
      .from('check_ins')
      .select('id, check_in_time, user_id')
      .eq('check_in_date', dateString)
      .order('check_in_time', { ascending: false })
      .limit(10)

    if (recentError) {
      console.error('Recent check-ins error:', recentError)
      throw recentError
    }

    // Get user details for recent check-ins (without university IDs for privacy)
    const formattedRecentCheckIns = []
    if (recentCheckIns && recentCheckIns.length > 0) {
      for (const checkIn of recentCheckIns) {
        const { data: user } = await supabase
          .from('users')
          .select('id, name')
          .eq('id', checkIn.user_id)
          .single()

        formattedRecentCheckIns.push({
          id: checkIn.id,
          time: new Date(checkIn.check_in_time).toLocaleTimeString(),
          timeStamp: checkIn.check_in_time,
          userName: user?.name || 'Student'
        })
      }
    }

    // Get total registered users
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('Users count error:', usersError)
      throw usersError
    }

    return NextResponse.json(
      {
        date: dateString,
        totalCheckedIn: totalCheckedIn || 0,
        totalRegistered: totalUsers || 0,
        attendanceRate: totalUsers ? ((totalCheckedIn || 0) / totalUsers * 100).toFixed(1) : '0',
        recentCheckIns: formattedRecentCheckIns
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { 
        date: new Date().toISOString().split('T')[0],
        totalCheckedIn: 0,
        totalRegistered: 0,
        attendanceRate: '0',
        recentCheckIns: [],
        error: 'Failed to fetch statistics' 
      },
      { status: 200 } // Return 200 with default data to prevent UI errors
    )
  }
}