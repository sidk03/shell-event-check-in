import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getTodayInEST } from '@/lib/dateUtils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { barcode_id } = body

    if (!barcode_id) {
      return NextResponse.json(
        { error: 'Barcode ID is required' },
        { status: 400 }
      )
    }

    // Convert barcode_id to number and validate
    const barcodeNumber = parseInt(barcode_id)
    if (isNaN(barcodeNumber)) {
      return NextResponse.json(
        { error: 'Invalid barcode format' },
        { status: 400 }
      )
    }

    // Check if user exists with this barcode
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('barcode_id', barcodeNumber)
      .single()

    if (userError || !user) {
      // User doesn't exist, need registration
      return NextResponse.json(
        { 
          status: 'new_user_required',
          barcode_id: barcodeNumber,
          message: 'Please register this new user'
        },
        { status: 200 }
      )
    }

    // Get today's date in EST
    const dateString = getTodayInEST()

    // Check if user already checked in today
    const { data: existingCheckIn, error: checkInError } = await supabase
      .from('check_ins')
      .select('*')
      .eq('user_id', user.id)
      .eq('check_in_date', dateString)
      .single()

    if (existingCheckIn) {
      // Already checked in today
      return NextResponse.json(
        {
          status: 'already_checked_in',
          user: {
            id: user.id,
            name: user.name,
            university_id: user.university_id
          },
          check_in_time: existingCheckIn.check_in_time,
          message: `Already checked in today at ${new Date(existingCheckIn.check_in_time).toLocaleTimeString()}`
        },
        { status: 200 }
      )
    }

    // Create new check-in
    const { data: newCheckIn, error: insertError } = await supabase
      .from('check_ins')
      .insert({
        user_id: user.id,
        check_in_date: dateString,
        check_in_time: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Check-in error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create check-in' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        status: 'checked_in',
        user: {
          id: user.id,
          name: user.name,
          university_id: user.university_id
        },
        check_in_time: newCheckIn.check_in_time,
        message: `Successfully checked in ${user.name || user.university_id}`
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Barcode check-in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}