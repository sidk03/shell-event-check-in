import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getTodayInEST } from '@/lib/dateUtils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { barcode_id, university_id, name } = body

    if (!university_id) {
      return NextResponse.json(
        { error: 'University ID is required' },
        { status: 400 }
      )
    }

    // Convert barcode_id to number if provided
    let barcodeNumber: number | null = null
    if (barcode_id) {
      barcodeNumber = parseInt(barcode_id)
      if (isNaN(barcodeNumber)) {
        return NextResponse.json(
          { error: 'Invalid barcode format' },
          { status: 400 }
        )
      }
    }

    // Check if user already exists with this university ID
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('university_id', university_id.trim())
      .single()

    if (existingUser) {
      // Update existing user with barcode if they don't have one and barcode is provided
      if (!existingUser.barcode_id && barcodeNumber) {
        // Check if this barcode is already in use by another user
        const { data: barcodeUser } = await supabase
          .from('users')
          .select('*')
          .eq('barcode_id', barcodeNumber)
          .single()

        if (barcodeUser) {
          return NextResponse.json(
            { error: 'This barcode is already registered to another user' },
            { status: 400 }
          )
        }

        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            barcode_id: barcodeNumber,
            name: name?.trim() || existingUser.name,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)

        if (updateError) {
          console.error('Update error:', updateError)
          return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
          )
        }
      }

      // Create check-in for existing user
      const dateString = getTodayInEST()

      // Check if already checked in today
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', existingUser.id)
        .eq('check_in_date', dateString)
        .single()

      if (!existingCheckIn) {
        const { error: checkInError } = await supabase
          .from('check_ins')
          .insert({
            user_id: existingUser.id,
            check_in_date: dateString,
            check_in_time: new Date().toISOString()
          })

        if (checkInError) {
          console.error('Check-in error:', checkInError)
        }
      }

      return NextResponse.json(
        {
          status: 'user_updated',
          user: {
            id: existingUser.id,
            name: name || existingUser.name,
            university_id: existingUser.university_id
          },
          message: `User updated and checked in`
        },
        { status: 200 }
      )
    }

    // Check if barcode is already in use (only if barcode is provided)
    if (barcodeNumber) {
      const { data: barcodeUser } = await supabase
        .from('users')
        .select('*')
        .eq('barcode_id', barcodeNumber)
        .single()

      if (barcodeUser) {
        return NextResponse.json(
          { error: 'This barcode is already registered to another user' },
          { status: 400 }
        )
      }
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        barcode_id: barcodeNumber, // Can be null
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

    // Create first check-in
    const dateString = getTodayInEST()

    const { error: checkInError } = await supabase
      .from('check_ins')
      .insert({
        user_id: newUser.id,
        check_in_date: dateString,
        check_in_time: new Date().toISOString()
      })

    if (checkInError) {
      console.error('Check-in error:', checkInError)
    }

    return NextResponse.json(
      {
        status: 'registered',
        user: {
          id: newUser.id,
          name: newUser.name,
          university_id: newUser.university_id
        },
        message: `Successfully registered and checked in ${newUser.name || newUser.university_id}`
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}