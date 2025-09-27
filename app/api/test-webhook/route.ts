import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[TEST WEBHOOK] ===== WEBHOOK DE TESTE CHAMADO =====")
  console.log("[TEST WEBHOOK] Timestamp:", new Date().toISOString())
  console.log("[TEST WEBHOOK] URL:", request.url)
  console.log("[TEST WEBHOOK] Method:", request.method)
  
  try {
    const body = await request.json()
    console.log("[TEST WEBHOOK] Body:", JSON.stringify(body, null, 2))
    
    return NextResponse.json({ 
      success: true, 
      message: "Test webhook received successfully",
      timestamp: new Date().toISOString(),
      receivedData: body
    })
    
  } catch (error) {
    console.error("[TEST WEBHOOK] Error:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Test webhook error" 
    }, { status: 500 })
  }
}
