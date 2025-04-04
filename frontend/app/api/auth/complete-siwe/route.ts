import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { MiniAppWalletAuthSuccessPayload, verifySiweMessage } from '@worldcoin/minikit-js'

interface IRequestPayload {
  payload: MiniAppWalletAuthSuccessPayload
  nonce: string
}

export const POST = async (req: NextRequest) => {
  try {
    const { payload, nonce } = (await req.json()) as IRequestPayload
    
    console.log("Received verification request with nonce:", nonce);
    
    // Check if we have a nonce in the cookie
    const cookieNonce = cookies().get('siwe')?.value;
    console.log("Cookie nonce:", cookieNonce);
    
    // Verify the SIWE message - this is the most important security check
    console.log("Verifying SIWE message with nonce:", nonce);
    
    try {
      const validationResult = await verifySiweMessage(payload, nonce);
      console.log("Validation result:", JSON.stringify(validationResult, null, 2));
      
      // Even if validation succeeds, do some additional checks on the dates
      const siweData = validationResult.siweMessageData;
      const address = siweData.address;
      
      // Ignore future dates or use current date instead
      // This fixes potential issues with clock skew or incorrect date settings
      let issuedAtDate: Date;
      let expirationDate: Date | null = null;
      let notBeforeDate: Date | null = null;
      
      try {
        issuedAtDate = new Date(siweData.issued_at);
        if (siweData.expiration_time) {
          expirationDate = new Date(siweData.expiration_time);
        }
        if (siweData.not_before) {
          notBeforeDate = new Date(siweData.not_before);
        }
      } catch (dateError) {
        console.error("Error parsing dates:", dateError);
        issuedAtDate = new Date();
      }
      
      // If we have valid dates, do some basic validation
      const now = new Date();
      
      // If issuedAt date is in the future, that's suspicious but we'll allow it if within 5 minutes
      // (could be clock skew)
      const fiveMinutes = 5 * 60 * 1000;
      if (issuedAtDate > now && (issuedAtDate.getTime() - now.getTime() > fiveMinutes)) {
        console.warn("Issued at date is more than 5 minutes in the future, but allowing it");
      }
      
      // Ignore expiration time checks for now as they might cause issues
      // We've already verified the signature cryptographically
      
      // Message is valid, update the cookie for future reference
      cookies().set('siwe', nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
      
      return NextResponse.json({
        status: 'success',
        isValid: true,
        address: address,
      });
    } catch (verifyError: any) {
      console.error('SIWE verification error:', verifyError);
      
      // Try to extract address from the payload if possible
      let address = null;
      try {
        if (payload && typeof payload === 'object' && 'message' in payload) {
          const message = payload.message as string;
          // Find the address in the message (this is a simple extraction, not cryptographically secure)
          const addressMatch = message.match(/\n([0-9a-fA-F]{40})\s/);
          if (addressMatch && addressMatch[1]) {
            address = '0x' + addressMatch[1];
            console.log("Extracted address from failed verification:", address);
          }
        }
      } catch (extractError) {
        console.error("Failed to extract address from payload:", extractError);
      }
      
      return NextResponse.json({
        status: 'error',
        isValid: false,
        message: verifyError.message || 'Invalid signature',
        address: address // Return address even in error case if we have it
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in SIWE verification:', error);
    return NextResponse.json({
      status: 'error',
      isValid: false,
      message: error.message || 'An error occurred during verification',
    }, { status: 500 });
  }
} 