import {
  verifyCloudProof,
  IVerifyResponse,
  ISuccessResult,
} from "@worldcoin/minikit-js";
import { NextRequest, NextResponse } from "next/server";

interface IRequestPayload {
  payload: ISuccessResult;
  action: string;
  signal?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { payload, action, signal } = (await req.json()) as IRequestPayload;

    // Use your app_id from environment variables
    const app_id = process.env.WORLD_APP_ID as `app_${string}` || 'app_test_id'; // Replace with your actual app_id in production

    // Verify the proof with World ID
    const verifyRes = (await verifyCloudProof(
      payload,
      app_id,
      action,
      signal
    )) as IVerifyResponse;

    if (verifyRes.success) {
      // Success! This is where you could:
      // 1. Update a user's verification status in your database
      // 2. Grant access to exclusive features
      // 3. Award tokens or rewards

      // For now, we'll just return success
      return NextResponse.json({
        verifyRes,
        status: 200,
        message: "Verification successful!"
      });
    } else {
      // Verification failed, handle the error
      return NextResponse.json({
        verifyRes,
        status: 400,
        message: "Verification failed"
      });
    }
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      status: 500,
      message: "Server error during verification"
    });
  }
}
