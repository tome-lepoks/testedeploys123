import { type NextRequest, NextResponse } from "next/server"

const UNIPAY_SECRET_KEY = "sk_a0aab6155b590896932e3c92f49df02c59108c74"
const UNIPAY_API_URL = "https://api.fastsoftbrasil.com/api"

export async function GET(request: NextRequest) {
  try {
    console.log("[v0] Testing UNIPAY API connection...")

    // Testar endpoint de saldo (conforme documentação)
    const url = `${UNIPAY_API_URL}/user/wallet/balance`
    
    // UNIPAY usa Basic Auth com x:SECRET_KEY
    const auth = 'Basic ' + Buffer.from(`x:${UNIPAY_SECRET_KEY}`).toString('base64')
    
    console.log("[v0] UNIPAY Test URL:", url)
    console.log("[v0] UNIPAY Auth header:", auth.substring(0, 30) + "...")

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': auth,
        'Accept': 'application/json'
      }
    })

    const responseText = await response.text()
    console.log("[v0] UNIPAY Test response status:", response.status)
    console.log("[v0] UNIPAY Test response body:", responseText)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `UNIPAY API Error: ${response.status}`,
        response: responseText,
        url: url,
        authHeader: auth.substring(0, 30) + "..."
      }, { status: response.status })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: "Failed to parse UNIPAY response",
        response: responseText
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "UNIPAY API connection successful",
      data: data,
      url: url
    })

  } catch (error) {
    console.error("[v0] Error testing UNIPAY API:", error)
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
