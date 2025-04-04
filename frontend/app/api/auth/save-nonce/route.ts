import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const POST = async (req: NextRequest) => {
  try {
    const { nonce } = await req.json()
    
    if (!nonce) {
      return NextResponse.json({
        status: 'error',
        message: 'Nonce is required'
      }, { status: 400 })
    }
    
    // Set a server-side cookie with the nonce
    cookies().set('siwe', nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Allow cross-site requests for better compatibility
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    })
    
    console.log(`Server saved nonce: ${nonce}`)
    
    return NextResponse.json({
      status: 'success',
      message: 'Nonce saved successfully'
    })
  } catch (error: any) {
    console.error('Error saving nonce:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message || 'An error occurred while saving nonce'
    }, { status: 500 })
  }
} 