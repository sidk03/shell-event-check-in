import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { university_id, name } = body

    if (!university_id) {
      return NextResponse.json(
        { error: 'University ID is required' },
        { status: 400 }
      )
    }

    // Check if user exists with this university ID
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('university_id', university_id.trim())
      .single()

    if (userError || !user) {
      // User doesn't exist, create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          university_id: university_id.trim(),
          name: name?.trim() || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('User creation error:', createError)
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        )
      }

      user = newUser
    } else if (name && !user.name) {
      // Update user name if provided and not already set
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          name: name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (!updateError) {
        user.name = name.trim()
      }
    }

    // Get today's date
    const today = new Date()
    const dateString = today.toISOString().split('T')[0]

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
    console.error('Manual check-in error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}