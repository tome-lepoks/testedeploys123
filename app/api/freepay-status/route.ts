import { type NextRequest, NextResponse } from "next/server"
import { getCredentialsForTransaction } from "@/lib/credential-rotation"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    
    if (!transactionId) {
      return NextResponse.json({ 
        success: false, 
        error: "ID da transação é obrigatório" 
      }, { status: 400 })
    }

    console.log("[PixONE] Checking transaction status:", transactionId)

    // Obter credenciais da PixONE
    const credentials = getCredentialsForTransaction()
    const auth = btoa(`${credentials.secretKey}:${credentials.privateKey}`)

    const response = await fetch(`https://api.pixone.com.br/api/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()
    console.log("[PixONE] Status response:", response.status)
    console.log("[PixONE] Status body:", JSON.stringify(result, null, 2))

    if (response.ok && result.success) {
      const transactionData = result.data
      
      // Mapear status da PixONE para formato padrão
      const status = transactionData.status
      const isPaid = status === 'approved'
      const isWaiting = status === 'pending'
      const isRefused = status === 'cancelled'
      const isRefunded = status === 'refunded'
      const isCanceled = status === 'cancelled'
      const isExpired = status === 'expired'

      return NextResponse.json({
        success: true,
        transaction: {
          id: transactionId,
          status: status,
          amount: transactionData.amount,
          paidAmount: transactionData.paidAmount,
          refundedAmount: transactionData.refundedAmount,
          paymentMethod: transactionData.paymentMethod,
          createdAt: transactionData.createdAt,
          updatedAt: transactionData.updatedAt,
          paidAt: transactionData.paidAt,
          customer: transactionData.customer,
          pix: transactionData.pix,
          refusedReason: transactionData.refusedReason
        },
        payment: {
          isPaid: isPaid,
          isWaiting: isWaiting,
          isRefused: isRefused,
          isRefunded: isRefunded,
          isCanceled: isCanceled,
          isExpired: isExpired,
          statusText: getStatusText(status)
        },
        provider: 'pixone',
        timestamp: new Date().toISOString()
      })
    } else {
      console.error("[PixONE] Status error:", result)
      return NextResponse.json({
        success: false,
        error: result.message || "Erro ao consultar status da transação"
      }, { status: response.status })
    }

  } catch (error) {
    console.error("[PixONE] Error checking transaction status:", error)
    
    if (error instanceof Error) {
      console.error("[PixONE] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        provider: 'pixone',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Função auxiliar para traduzir status
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Aguardando Pagamento',
    'approved': 'Pago',
    'cancelled': 'Cancelado',
    'expired': 'Expirado',
    'refunded': 'Estornado'
  }
  
  return statusMap[status] || status
}
