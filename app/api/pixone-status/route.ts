import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: "Transaction ID é obrigatório"
      }, { status: 400 })
    }

    console.log("[Pix One] Checking transaction status:", transactionId)

    // Credenciais Pix One
    const privateKey = "pk_jy3gGCqhZy6TUFQ_i2O9lZy0tEaEl31qOS4cLb8U1YjjJNnr"
    const secretKey = "sk_mWaqc6CjBv9uqnTlmKyxUqASoA7HWoE0xPlQcOs9dUvaW7_w"
    
    // Criar autenticação Basic Auth
    const auth = btoa(`${secretKey}:${privateKey}`)

    // Buscar transação na Pix One
    const response = await fetch(`https://api.pixone.com.br/api/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error("[Pix One] Error fetching transaction:", response.status)
      return NextResponse.json({
        success: false,
        error: "Transação não encontrada"
      }, { status: 404 })
    }

    const result = await response.json()
    console.log("[Pix One] Transaction status:", result)

    if (result.success && result.data) {
      const transaction = result.data
      
      // Mapear status da Pix One para formato compatível
      let status = 'waiting_payment'
      switch (transaction.status) {
        case 'approved':
          status = 'paid'
          break
        case 'pending':
          status = 'waiting_payment'
          break
        case 'cancelled':
          status = 'cancelled'
          break
        case 'expired':
          status = 'expired'
          break
        case 'refunded':
          status = 'refunded'
          break
        default:
          status = 'waiting_payment'
      }

      return NextResponse.json({
        success: true,
        status: status,
        amount: transaction.amount / 100, // Converter de centavos para reais
        transactionId: transaction.secureId || transaction.id,
        customer: transaction.customer,
        createdAt: transaction.createdAt,
        paidAt: transaction.status === 'approved' ? transaction.updatedAt : null,
        pix: transaction.pix
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Erro ao buscar transação"
      }, { status: 500 })
    }

  } catch (error) {
    console.error("[Pix One] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}
