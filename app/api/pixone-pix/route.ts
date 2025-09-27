import { type NextRequest, NextResponse } from "next/server"

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

    console.log("[Pix One] Creating PIX payment:", { cpf, name, phone, amount })

    // Credenciais Pix One
    const privateKey = "pk_jy3gGCqhZy6TUFQ_i2O9lZy0tEaEl31qOS4cLb8U1YjjJNnr"
    const secretKey = "sk_mWaqc6CjBv9uqnTlmKyxUqASoA7HWoE0xPlQcOs9dUvaW7_w"
    
    // Criar autenticação Basic Auth
    const auth = btoa(`${secretKey}:${privateKey}`)
    
    // Converter valor para centavos
    const amountInCents = Math.round(amount * 100)
    
    // Gerar ID único para a transação
    const transactionId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Preparar payload para Pix One
    const payload = {
      paymentMethod: "pix",
      ip: request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
      pix: {
        expiresInDays: 1
      },
      items: items?.map((item: any) => ({
        title: item.title || "Produto Pix One",
        quantity: item.quantity || 1,
        tangible: false,
        unitPrice: Math.round((item.unitPrice || amount) * 100),
        product_image: "https://e34asd.netlify.app/placeholder.jpg"
      })) || [{
        title: "Produto Pix One",
        quantity: 1,
        tangible: false,
        unitPrice: amountInCents,
        product_image: "https://e34asd.netlify.app/placeholder.jpg"
      }],
      amount: amountInCents,
      customer: {
        name: name,
        email: email || "cliente@pixone.com",
        phone: phone,
        document: {
          type: "cpf",
          number: cpf.replace(/[.-]/g, "")
        }
      },
      metadata: JSON.stringify({
        provider: "Pix One",
        user_email: email || "cliente@pixone.com",
        cpf: cpf,
        phone: phone,
        source: 'PixOne-Integration',
        timestamp: new Date().toISOString()
      }),
      traceable: false,
      externalRef: transactionId,
      postbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://e34asd.netlify.app'}/api/pixone-webhook`
    }

    console.log("[Pix One] Payload:", payload)
    console.log("[Pix One] Webhook URL:", `${process.env.NEXT_PUBLIC_BASE_URL || 'https://e34asd.netlify.app'}/api/pixone-webhook`)

    const response = await fetch("https://api.pixone.com.br/api/v1/transactions", {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    console.log("[Pix One] Response status:", response.status)
    console.log("[Pix One] Response headers:", Object.fromEntries(response.headers.entries()))
    console.log("[Pix One] Response body:", JSON.stringify(result, null, 2))

    if (response.ok && result.success) {
      console.log("[Pix One] Full response data:", JSON.stringify(result, null, 2))
      
      // Verificar se os dados do PIX existem
      if (!result.data || !result.data.pix) {
        console.error("[Pix One] PIX data not found in response:", result)
        return NextResponse.json({
          success: false,
          error: "Dados do PIX não encontrados na resposta"
        }, { status: 500 })
      }

      const pixInfo = result.data.pix
      console.log("[Pix One] PIX info:", {
        qrcodeText: pixInfo.qrcodeText ? "Present" : "Missing",
        qrcode: pixInfo.qrcode ? "Present" : "Missing",
        expirationDate: pixInfo.expirationDate
      })

      // Converter resposta para formato compatível com FreePay
      // A Pix One retorna o código PIX no campo qrcode
      const pixCode = pixInfo.qrcode || ""
      
      const pixData = {
        success: true,
        pixCode: pixCode, // Código PIX para copiar
        qrCodeImage: pixCode, // Mesmo código para exibição
        amount: amount,
        transactionId: result.data.secureId || result.data.id,
        expiresAt: pixInfo.expirationDate,
        provider: "pixone",
        status: "waiting_payment",
        customer: {
          name: result.data.customer?.name || name,
          email: result.data.customer?.email || email || "cliente@pixone.com",
          phone: result.data.customer?.phone || phone,
          document: result.data.customer?.document?.number || cpf
        },
        metadata: {
          externalId: result.data.externalId,
          secureUrl: result.data.secureUrl,
          fees: result.data.fees,
          createdAt: result.data.createdAt
        }
      }

      console.log("[Pix One] Converted PIX data:", {
        success: pixData.success,
        pixCode: pixData.pixCode ? `Length: ${pixData.pixCode.length}` : "Missing",
        qrCodeImage: pixData.qrCodeImage ? `Length: ${pixData.qrCodeImage.length}` : "Missing",
        transactionId: pixData.transactionId
      })

      return NextResponse.json(pixData)
    } else {
      console.error("[Pix One] Error:", result)
      return NextResponse.json({
        success: false,
        error: result.message || "Erro ao gerar PIX"
      }, { status: response.status })
    }

  } catch (error) {
    console.error("[Pix One] Error:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}
