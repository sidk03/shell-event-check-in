import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const universityId = searchParams.get('university_id')

    if (!universityId) {
      return NextResponse.json(
        { error: 'University ID is required' },
        { status: 400 }
      )
    }

    // First, find the user by university ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, university_id, barcode_id')
      .eq('university_id', universityId.trim())
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get all check-ins for this user
    const { data: checkIns, error: checkInError } = await supabase
      .from('check_ins')
      .select('id, check_in_date, check_in_time')
      .eq('user_id', user.id)
      .order('check_in_date', { ascending: false })
      .order('check_in_time', { ascending: false })

    if (checkInError) {
      console.error('Check-in history error:', checkInError)
      return NextResponse.json(
        { error: 'Failed to fetch check-in history' },
        { status: 500 }
      )
    }

    // Format the check-ins
    const formattedCheckIns = checkIns?.map(checkIn => ({
      id: checkIn.id,
      date: checkIn.check_in_date,
      time: checkIn.check_in_time,  // Send raw timestamp for client-side formatting
      dateTime: checkIn.check_in_time
    })) || []

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          universityId: user.university_id,
          barcodeId: user.barcode_id
        },
        checkIns: formattedCheckIns,
        totalCheckIns: formattedCheckIns.length
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}