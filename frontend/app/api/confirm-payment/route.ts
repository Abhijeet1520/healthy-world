import { NextRequest, NextResponse } from 'next/server'
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload
  referenceId: string
}

// In a production app, you would retrieve payment references from a database
// This is just for demonstration purposes
const paymentReferences = new Map()

export async function POST(req: NextRequest) {
  try {
    const { payload, referenceId } = (await req.json()) as IRequestPayload
    
    // Get the reference from our store (in a real app, this would be from a database)
    const paymentDetails = paymentReferences.get(referenceId)
    
    if (!paymentDetails) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid payment reference'
      })
    }
    
    // Verify that the transaction reference from World App matches our stored reference
    if (payload.reference !== referenceId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Reference mismatch'
      })
    }
    
    // In a production app, you would call the World Developer API to verify the transaction
    // For the purpose of this demo, we'll just check the status
    if (payload.status === 'success') {
      // Update the payment status
      paymentReferences.set(referenceId, {
        ...paymentDetails,
        status: 'completed',
        transactionId: payload.transaction_id
      })
      
      // Here you would also:
      // 1. Update the user's subscription status in the database
      // 2. Send confirmation email/notification
      // 3. Create any necessary records for the purchase
      
      return NextResponse.json({ 
        success: true,
        message: 'Payment verified successfully'
      })
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Payment was not successful'
      })
    }
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process payment confirmation',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
