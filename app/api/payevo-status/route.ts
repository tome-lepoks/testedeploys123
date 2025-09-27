import { type NextRequest, NextResponse } from "next/server"

const PAYEVO_SECRET_KEY = "sk_live_m6PLpc8L0EBrZSMu6uacZ0zK6D3etfamVREGjoqicQNGzmx3"

export async function GET(request: NextRequest) {
  // API DESCONTINUADA - Redirecionando para FreePay
  return NextResponse.json({
    success: false,
    error: "Esta API foi descontinuada. Use /api/freepay-status",
    deprecated: true,
    redirectTo: "/api/freepay-status"
  }, { status: 410 })
}
