import { type NextRequest, NextResponse } from "next/server"

const PAYEVO_SECRET_KEY = "sk_live_m6PLpc8L0EBrZSMu6uacZ0zK6D3etfamVREGjoqicQNGzmx3"
const PAYEVO_COMPANY_ID = "4475bdde-d261-4fdf-a61c-94d98ffa8cf1"

export async function POST(request: NextRequest) {
  // API DESCONTINUADA - Redirecionando para FreePay
  return NextResponse.json({
    success: false,
    error: "Esta API foi descontinuada. Use /api/freepay-pix",
    deprecated: true,
    redirectTo: "/api/freepay-pix"
  }, { status: 410 })
}
