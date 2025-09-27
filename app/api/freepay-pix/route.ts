import { type NextRequest, NextResponse } from "next/server"
import { getCredentialsForTransaction } from "@/lib/credential-rotation"

export async function POST(request: NextRequest) {
  try {
    const { amount, cpf, name, phone, email, description, items } = await request.json()
    
    // Validações obrigatórias
    if (!cpf) {
      return NextResponse.json({ 
        success: false, 
        error: "CPF é obrigatório" 
      }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ 
        success: false, 
        error: "Nome é obrigatório" 
      }, { status: 400 })
    }

    if (!phone) {
      return NextResponse.json({ 
        success: false, 
        error: "Telefone é obrigatório" 
      }, { status: 400 })
    }

    console.log("[FreePay] Creating PIX payment:", { cpf, name, phone, amount })

    // Obter credenciais baseado no sistema de rotação (3:1)
    const credentials = getCredentialsForTransaction()
    
    // Limpar CPF (remover formatação)
    const cpfLimpo = cpf.replace(/\D/g, '')
    
    // Limpar telefone (remover formatação)
    const phoneLimpo = phone.replace(/\D/g, '')
    
    // Usar o valor fornecido ou o padrão
    const finalAmount = amount || 199.93
    const amountInCents = Math.round(finalAmount * 100)

    const url = 'https://api.freepaybr.com/functions/v1/transactions'
    
    // FreePay usa Basic Auth com SECRET_KEY:x (usando credenciais rotativas)
    const auth = 'Basic ' + Buffer.from(credentials.secretKey + ':x').toString('base64')
    
    // Credenciais selecionadas automaticamente

    // Preparar items - usar os fornecidos ou criar um padrão
    const transactionItems = items || [{
      title: 'Produto FreePay',
      unitPrice: amountInCents,
      quantity: 1,
      externalRef: `PRODUTO_FREEPAY_${cpfLimpo}`
    }]

    const payload = {
      paymentMethod: 'PIX',
      amount: amountInCents,
      items: transactionItems,
      customer: {
        name: name,
        email: email || `${cpfLimpo}@temp.com`,
        phone: phoneLimpo
      },
      shipping: {
        street: 'Rua Exemplo',
        streetNumber: '123',
        zipCode: '12345678',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        complement: 'Apto 1'
      },
      description: description || 'Pagamento via FreePay',
      metadata: JSON.stringify({
        cpf: cpf,
        phone: phone,
        source: 'FreePay-Integration',
        timestamp: new Date().toISOString()
      }),
      postbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://e34asd.netlify.app'}/api/freepay-webhook`
    }

    console.log("[FreePay] Payload:", payload)
    console.log("[FreePay] Webhook URL:", `${process.env.NEXT_PUBLIC_BASE_URL || 'https://e34asd.netlify.app'}/api/freepay-webhook`)
    console.log("[FreePay] Credentials:", { secretKey: credentials.secretKey.substring(0, 20) + "...", companyId: credentials.companyId })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
    })

    const responseText = await response.text()
    console.log("[FreePay] Response status:", response.status)
    console.log("[FreePay] Response body:", responseText)

    if (!response.ok) {
      console.log("[FreePay] Error - Status:", response.status, "Response:", responseText)
      
      // Tentar extrair mensagem de erro da resposta
      let errorMessage = `FreePay error: ${response.status}`
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        // Se não conseguir fazer parse, usar a resposta como string
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
      console.log("[FreePay] PIX transaction created successfully:", transactionData)
    } catch (parseError) {
      console.log("[FreePay] Failed to parse response as JSON:", parseError)
      return NextResponse.json({
        success: false,
        error: "Resposta inválida da FreePay",
        provider: 'freepay'
      }, { status: 500 })
    }

    // Extrair dados PIX da resposta FreePay
    console.log("[FreePay] Full transaction data:", JSON.stringify(transactionData, null, 2))
    
    const pixData = transactionData.pix
    const pixCode = pixData?.qrcode || transactionData.qrcode
    const transactionId = transactionData.id
    const expirationDate = pixData?.expirationDate
    const customerData = transactionData.customer

    console.log("[FreePay] PIX data extracted:", { pixData, pixCode, transactionId, expirationDate })

    if (!pixCode) {
      console.log("[FreePay] No PIX QR code found in response:", transactionData)
      return NextResponse.json({
        success: false,
        error: "Código PIX não foi gerado pela FreePay",
        provider: 'freepay'
      }, { status: 500 })
    }

    // Calcular tempo de expiração (30 minutos se não especificado)
    const expiresAt = expirationDate || new Date(Date.now() + 30 * 60 * 1000).toISOString()

    // Gerar QR Code usando API online (sem dependências)
    let qrCodeImage = null
    try {
      // Usar API gratuita para gerar QR code
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(pixCode)}`
      qrCodeImage = qrApiUrl
      console.log("[FreePay] QR Code URL generated successfully:", qrApiUrl)
    } catch (qrError) {
      console.log("[FreePay] Error generating QR Code URL:", qrError)
    }

    return NextResponse.json({
      success: true,
      pixCode: pixCode,
      qrCodeImage: qrCodeImage,
      amount: finalAmount,
      transactionId: transactionId,
      expiresAt: expiresAt,
      provider: 'freepay',
      status: transactionData.status || 'waiting_payment',
      customer: {
        name: customerData?.name || name,
        email: customerData?.email || email || `${cpfLimpo}@temp.com`,
        phone: customerData?.phone || phoneLimpo
      },
      metadata: {
        cpf: cpf,
        phone: phone,
        source: 'FreePay-Integration',
        timestamp: new Date().toISOString()
      },
      transaction: {
        id: transactionData.id,
        amount: transactionData.amount,
        status: transactionData.status,
        paymentMethod: transactionData.paymentMethod,
        createdAt: transactionData.createdAt,
        updatedAt: transactionData.updatedAt
      }
    })

  } catch (error) {
    console.error("[FreePay] Error creating PIX transaction:", error)
    
    // Log detalhado do erro para debugging
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
