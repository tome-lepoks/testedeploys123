import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[Pix One Webhook] ===== WEBHOOK CHAMADO PELA PIX ONE =====")
  console.log("[Pix One Webhook] Timestamp:", new Date().toISOString())
  console.log("[Pix One Webhook] URL:", request.url)
  console.log("[Pix One Webhook] Method:", request.method)
  
  try {
    const body = await request.json()
    
    console.log("[Pix One Webhook] Received postback:", JSON.stringify(body, null, 2))

    // Validar se é um postback válido da Pix One
    if (!body.data || !body.data.status) {
      console.log("[Pix One Webhook] Invalid postback format")
      return NextResponse.json({ 
        success: false, 
        error: "Formato de postback inválido" 
      }, { status: 400 })
    }

    const transactionData = body.data
    const status = transactionData.status

    console.log("[Pix One Webhook] Processing transaction:", {
      id: transactionData.secureId || transactionData.id,
      status: status,
      amount: transactionData.amount,
      customer: transactionData.customer?.name
    })

    // Processar diferentes status
    switch (status) {
      case 'approved':
        await handlePaidTransaction(transactionData)
        break
      case 'pending':
        await handleWaitingTransaction(transactionData)
        break
      case 'cancelled':
        await handleCancelledTransaction(transactionData)
        break
      case 'expired':
        await handleExpiredTransaction(transactionData)
        break
      case 'refunded':
        await handleRefundedTransaction(transactionData)
        break
      default:
        await handleUnknownStatus(transactionData)
    }

    return NextResponse.json({
      success: true,
      message: "Postback processado com sucesso",
      transactionId: transactionData.secureId || transactionData.id,
      status: status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("[Pix One Webhook] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}

async function handlePaidTransaction(transactionData: any) {
  console.log("[Pix One Webhook] Transaction APPROVED:", {
    id: transactionData.secureId || transactionData.id,
    status: transactionData.status,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para transações aprovadas:
  // - Enviar email de confirmação
  // - Atualizar banco de dados
  // - Liberar produto/serviço
  // - Enviar notificação push
  // - Integrar com sistema de estoque
  
  // Exemplo de integração com sistema externo
  try {
    // Simular envio de email de confirmação
    console.log("[Pix One Webhook] Sending confirmation email to:", transactionData.customer?.email)
    
    // Simular atualização de banco de dados
    console.log("[Pix One Webhook] Updating database for transaction:", transactionData.secureId || transactionData.id)
    
    // Simular liberação de produto
    console.log("[Pix One Webhook] Releasing product for customer:", transactionData.customer?.name)
    
  } catch (error) {
    console.error("[Pix One Webhook] Error in paid transaction processing:", error)
  }
}

async function handleWaitingTransaction(transactionData: any) {
  console.log("[Pix One Webhook] Transaction PENDING:", {
    id: transactionData.secureId || transactionData.id,
    status: transactionData.status,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para transações em espera/processamento:
  // - Atualizar status no sistema
  // - Enviar lembretes se necessário
  // - Monitorar tempo de expiração
  
  try {
    console.log("[Pix One Webhook] Transaction is waiting for payment:", transactionData.secureId || transactionData.id)
    
  } catch (error) {
    console.error("[Pix One Webhook] Error in waiting transaction processing:", error)
  }
}

async function handleCancelledTransaction(transactionData: any) {
  console.log("[Pix One Webhook] Transaction CANCELLED:", {
    id: transactionData.secureId || transactionData.id,
    status: transactionData.status,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para transações canceladas:
  // - Atualizar status no sistema
  // - Liberar estoque se necessário
  // - Notificar cliente
  
  try {
    console.log("[Pix One Webhook] Transaction was cancelled:", transactionData.secureId || transactionData.id)
    
  } catch (error) {
    console.error("[Pix One Webhook] Error in cancelled transaction processing:", error)
  }
}

async function handleExpiredTransaction(transactionData: any) {
  console.log("[Pix One Webhook] Transaction EXPIRED:", {
    id: transactionData.secureId || transactionData.id,
    status: transactionData.status,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para transações expiradas:
  // - Atualizar status no sistema
  // - Liberar estoque se necessário
  // - Notificar cliente sobre expiração
  
  try {
    console.log("[Pix One Webhook] Transaction expired:", transactionData.secureId || transactionData.id)
    
  } catch (error) {
    console.error("[Pix One Webhook] Error in expired transaction processing:", error)
  }
}

async function handleRefundedTransaction(transactionData: any) {
  console.log("[Pix One Webhook] Transaction REFUNDED:", {
    id: transactionData.secureId || transactionData.id,
    status: transactionData.status,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para transações estornadas:
  // - Atualizar status no sistema
  // - Processar estorno
  // - Notificar cliente
  
  try {
    console.log("[Pix One Webhook] Transaction was refunded:", transactionData.secureId || transactionData.id)
    
  } catch (error) {
    console.error("[Pix One Webhook] Error in refunded transaction processing:", error)
  }
}

async function handleUnknownStatus(transactionData: any) {
  console.log("[Pix One Webhook] Transaction with UNKNOWN STATUS:", {
    id: transactionData.secureId || transactionData.id,
    status: transactionData.status,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para status desconhecidos:
  // - Log para análise
  // - Notificar administradores
  // - Investigar com suporte da Pix One
  
  try {
    console.log("[Pix One Webhook] Unknown status requires investigation:", transactionData.status)
    
  } catch (error) {
    console.error("[Pix One Webhook] Error in unknown status processing:", error)
  }
}
