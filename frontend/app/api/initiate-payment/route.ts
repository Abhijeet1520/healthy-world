import { NextRequest, NextResponse } from 'next/server'

// In a production app, you would store payment references in a database
// This is a simple in-memory store for demonstration purposes
const paymentReferences = new Map()

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { planId, amount } = body
    
    // Generate a unique reference ID
    const referenceId = crypto.randomUUID().replace(/-/g, '')
    
    // Store the payment details (in a real app, this would go to a database)
    paymentReferences.set(referenceId, {
      planId,
      amount,
      timestamp: new Date().toISOString(),
      status: 'pending'
    })
    
    // Return the reference ID to the client
    return NextResponse.json({ id: referenceId })
  } catch (error) {
    console.error('Error initiating payment:', error)
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
