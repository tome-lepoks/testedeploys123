import { type NextRequest, NextResponse } from "next/server"
import { getPrimaryCredentials, getSecondaryCredentials } from "@/lib/credential-rotation"

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

    console.log("[FreePay] Checking transaction status:", transactionId)

    const url = `https://api.freepaybr.com/functions/v1/transactions/${transactionId}`
    
    // Tentar primeiro com credenciais primárias, depois secundárias se falhar
    let credentials = getPrimaryCredentials()
    let auth = 'Basic ' + Buffer.from(credentials.secretKey + ':x').toString('base64')
    
    // Consultando status da transação

    let response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    let responseText = await response.text()
    console.log("[FreePay] Status response:", response.status)
    console.log("[FreePay] Status body:", responseText)

    // Se falhar com credenciais primárias, tentar com secundárias
    if (!response.ok && response.status === 401) {
      credentials = getSecondaryCredentials()
      auth = 'Basic ' + Buffer.from(credentials.secretKey + ':x').toString('base64')
      
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
      
      responseText = await response.text()
    }

    if (!response.ok) {
      console.log("[FreePay] Status error - Status:", response.status, "Response:", responseText)
      
      // Tentar extrair mensagem de erro da resposta
      let errorMessage = `FreePay status error: ${response.status}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        errorMessage = responseText || errorMessage
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        provider: 'freepay'
      }, { status: response.status })
    }

    let transactionData
    try {
      transactionData = JSON.parse(responseText)
      console.log("[FreePay] Transaction status retrieved successfully:", transactionData)
    } catch (parseError) {
      console.log("[FreePay] Failed to parse status response as JSON:", parseError)
      return NextResponse.json({
        success: false,
        error: "Resposta inválida da FreePay",
        provider: 'freepay'
      }, { status: 500 })
    }

    // Extrair informações relevantes da transação
    const status = transactionData.status
    const amount = transactionData.amount
    const paidAmount = transactionData.paidAmount
    const refundedAmount = transactionData.refundedAmount
    const paymentMethod = transactionData.paymentMethod
    const createdAt = transactionData.createdAt
    const updatedAt = transactionData.updatedAt
    const paidAt = transactionData.paidAt
    const customer = transactionData.customer
    const pix = transactionData.pix
    const refusedReason = transactionData.refusedReason

    // Determinar se o pagamento foi concluído
    const isPaid = status === 'paid' || status === 'authorized'
    const isWaiting = status === 'waiting_payment' || status === 'processing'
    const isRefused = status === 'refused'
    const isRefunded = status === 'refunded'
    const isCanceled = status === 'canceled'

    return NextResponse.json({
      success: true,
      transaction: {
        id: transactionId,
        status: status,
        amount: amount,
        paidAmount: paidAmount,
        refundedAmount: refundedAmount,
        paymentMethod: paymentMethod,
        createdAt: createdAt,
        updatedAt: updatedAt,
        paidAt: paidAt,
        customer: customer,
        pix: pix,
        refusedReason: refusedReason
      },
      payment: {
        isPaid: isPaid,
        isWaiting: isWaiting,
        isRefused: isRefused,
        isRefunded: isRefunded,
        isCanceled: isCanceled,
        statusText: getStatusText(status)
      },
      provider: 'freepay',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("[FreePay] Error checking transaction status:", error)
    
    if (error instanceof Error) {
      console.error("[FreePay] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro interno do servidor",
        provider: 'freepay',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Função auxiliar para traduzir status
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'processing': 'Processando',
    'authorized': 'Autorizado',
    'paid': 'Pago',
    'refunded': 'Estornado',
    'waiting_payment': 'Aguardando Pagamento',
    'refused': 'Recusado',
    'chargedback': 'Chargeback',
    'canceled': 'Cancelado',
    'in_protest': 'Em Protesto',
    'partially_paid': 'Parcialmente Pago'
  }
  
  return statusMap[status] || status
}
