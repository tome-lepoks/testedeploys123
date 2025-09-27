import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { eventName, userData, eventId } = await request.json()
    
    // Capturar IP do cliente
    const clientIp = request.ip || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      request.headers.get('x-real-ip') || 
      'unknown'
    
    // Capturar User Agent
    const clientUserAgent = request.headers.get('user-agent') || 'unknown'
    
    // Capturar URL de origem
    const eventSourceUrl = request.headers.get('referer') || 'unknown'
    
    console.log('[UTMFY Server] Capturando dados do servidor:', {
      clientIp,
      clientUserAgent: clientUserAgent.substring(0, 100) + '...',
      eventSourceUrl
    })
    
    // Retornar dados capturados para o cliente
    return NextResponse.json({
      success: true,
      serverData: {
        client_ip_address: clientIp,
        client_user_agent: clientUserAgent,
        event_source_url: eventSourceUrl
      }
    })
    
  } catch (error) {
    console.error('[UTMFY Server] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
