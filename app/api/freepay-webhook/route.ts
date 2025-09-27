import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[FreePay Webhook] ===== WEBHOOK CHAMADO PELA FREEPAY =====")
  console.log("[FreePay Webhook] Timestamp:", new Date().toISOString())
  console.log("[FreePay Webhook] URL:", request.url)
  console.log("[FreePay Webhook] Method:", request.method)
  
  try {
    const body = await request.json()
    
    console.log("[FreePay Webhook] Received postback:", JSON.stringify(body, null, 2))

    // Validar se é um postback válido da FreePay
    if (!body.type || body.type !== 'transaction') {
      console.log("[FreePay Webhook] Invalid postback type:", body.type)
      return NextResponse.json({ 
        success: false, 
        error: "Tipo de postback inválido" 
      }, { status: 400 })
    }

    if (!body.data || !body.data.id) {
      console.log("[FreePay Webhook] Missing transaction data or ID")
      return NextResponse.json({ 
        success: false, 
        error: "Dados da transação inválidos" 
      }, { status: 400 })
    }

    const transactionData = body.data
    const transactionId = transactionData.id
    const status = transactionData.status
    const amount = transactionData.amount
    const paidAmount = transactionData.paidAmount
    const customer = transactionData.customer
    const paymentMethod = transactionData.paymentMethod
    const createdAt = transactionData.createdAt
    const updatedAt = transactionData.updatedAt
    const paidAt = transactionData.paidAt
    const refusedReason = transactionData.refusedReason

    console.log("[FreePay Webhook] Processing transaction:", {
      id: transactionId,
      status: status,
      amount: amount,
      paidAmount: paidAmount,
      paymentMethod: paymentMethod,
      customer: customer?.name,
      paidAt: paidAt
    })

    // Processar diferentes status de transação
    switch (status) {
      case 'paid':
      case 'authorized':
        await handlePaidTransaction(transactionData)
        break
        
      case 'refused':
        await handleRefusedTransaction(transactionData)
        break
        
      case 'refunded':
        await handleRefundedTransaction(transactionData)
        break
        
      case 'canceled':
        await handleCanceledTransaction(transactionData)
        break
        
      case 'waiting_payment':
      case 'processing':
        await handleWaitingTransaction(transactionData)
        break
        
      default:
        console.log("[FreePay Webhook] Unknown status:", status)
        await handleUnknownStatus(transactionData)
    }

    // Log da atualização para auditoria
    console.log("[FreePay Webhook] Transaction updated successfully:", {
      transactionId: transactionId,
      status: status,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: "Postback processado com sucesso",
      transactionId: transactionId,
      status: status,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("[FreePay Webhook] Error processing postback:", error)
    
    if (error instanceof Error) {
      console.error("[FreePay Webhook] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    
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

// Funções para processar diferentes status de transação
async function handlePaidTransaction(transactionData: any) {
  console.log("[FreePay Webhook] Transaction PAID:", {
    id: transactionData.id,
    amount: transactionData.amount,
    paidAmount: transactionData.paidAmount,
    customer: transactionData.customer?.name,
    paidAt: transactionData.paidAt
  })
  
  // Aqui você pode implementar lógica específica para transações pagas:
  // - Enviar email de confirmação
  // - Atualizar banco de dados
  // - Liberar produto/serviço
  // - Enviar notificação push
  // - Integrar com sistema de estoque
  
  // Exemplo de integração com sistema externo
  try {
    // Simular envio de email de confirmação
    console.log("[FreePay Webhook] Sending confirmation email to:", transactionData.customer?.email)
    
    // Simular atualização de banco de dados
    console.log("[FreePay Webhook] Updating database for transaction:", transactionData.id)
    
    // Simular liberação de produto
    console.log("[FreePay Webhook] Releasing product for customer:", transactionData.customer?.name)
    
  } catch (error) {
    console.error("[FreePay Webhook] Error in paid transaction processing:", error)
  }
}

async function handleRefusedTransaction(transactionData: any) {
  console.log("[FreePay Webhook] Transaction REFUSED:", {
    id: transactionData.id,
    amount: transactionData.amount,
    refusedReason: transactionData.refusedReason,
    customer: transactionData.customer?.name
  })
  
  // Lógica para transações recusadas:
  // - Notificar cliente sobre a recusa
  // - Sugerir método de pagamento alternativo
  // - Registrar motivo da recusa para análise
  
  try {
    console.log("[FreePay Webhook] Notifying customer about refused payment")
    console.log("[FreePay Webhook] Refused reason:", transactionData.refusedReason)
    
  } catch (error) {
    console.error("[FreePay Webhook] Error in refused transaction processing:", error)
  }
}

async function handleRefundedTransaction(transactionData: any) {
  console.log("[FreePay Webhook] Transaction REFUNDED:", {
    id: transactionData.id,
    amount: transactionData.amount,
    refundedAmount: transactionData.refundedAmount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para estornos:
  // - Notificar cliente sobre o estorno
  // - Reverter liberação de produto/serviço
  // - Atualizar relatórios financeiros
  
  try {
    console.log("[FreePay Webhook] Processing refund for transaction:", transactionData.id)
    console.log("[FreePay Webhook] Refunded amount:", transactionData.refundedAmount)
    
  } catch (error) {
    console.error("[FreePay Webhook] Error in refunded transaction processing:", error)
  }
}

async function handleCanceledTransaction(transactionData: any) {
  console.log("[FreePay Webhook] Transaction CANCELED:", {
    id: transactionData.id,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para transações canceladas:
  // - Liberar recursos reservados
  // - Notificar cliente se necessário
  // - Atualizar estoque se aplicável
  
  try {
    console.log("[FreePay Webhook] Processing cancellation for transaction:", transactionData.id)
    
  } catch (error) {
    console.error("[FreePay Webhook] Error in canceled transaction processing:", error)
  }
}

async function handleWaitingTransaction(transactionData: any) {
  console.log("[FreePay Webhook] Transaction WAITING/PROCESSING:", {
    id: transactionData.id,
    status: transactionData.status,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para transações em espera/processamento:
  // - Atualizar status no sistema
  // - Enviar lembretes se necessário
  // - Monitorar tempo de expiração
  
  try {
    console.log("[FreePay Webhook] Transaction is waiting for payment:", transactionData.id)
    
  } catch (error) {
    console.error("[FreePay Webhook] Error in waiting transaction processing:", error)
  }
}

async function handleUnknownStatus(transactionData: any) {
  console.log("[FreePay Webhook] Transaction with UNKNOWN STATUS:", {
    id: transactionData.id,
    status: transactionData.status,
    amount: transactionData.amount,
    customer: transactionData.customer?.name
  })
  
  // Lógica para status desconhecidos:
  // - Log para análise
  // - Notificar administradores
  // - Investigar com suporte da FreePay
  
  try {
    console.log("[FreePay Webhook] Unknown status requires investigation:", transactionData.status)
    
  } catch (error) {
    console.error("[FreePay Webhook] Error in unknown status processing:", error)
  }
}
