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

    console.log("[PixONE] Creating PIX payment:", { cpf, name, phone, amount })

    // Obter credenciais da PixONE
    const credentials = getCredentialsForTransaction()
    
    // Limpar CPF (remover formatação)
    const cpfLimpo = cpf.replace(/\D/g, '')
    
    // Limpar telefone (remover formatação)
    const phoneLimpo = phone.replace(/\D/g, '')
    
    // Usar o valor fornecido ou o padrão
    const finalAmount = amount || 174.28
    const amountInCents = Math.round(finalAmount * 100)
    
    // Gerar ID único para a transação
    const transactionId = `pix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Criar autenticação Basic Auth
    const auth = btoa(`${credentials.secretKey}:${credentials.privateKey}`)
    
    // Preparar payload para PixONE
    const payload = {
      paymentMethod: "pix",
      ip: request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1',
      pix: {
        expiresInDays: 1
      },
      items: items?.map((item: any) => ({
        title: item.title || "Produto PixONE",
        quantity: item.quantity || 1,
        tangible: false,
        unitPrice: Math.round((item.unitPrice || finalAmount) * 100),
        product_image: "https://e34asd.netlify.app/placeholder.jpg"
      })) || [{
        title: "Produto PixONE",
        quantity: 1,
        tangible: false,
        unitPrice: amountInCents,
        product_image: "https://e34asd.netlify.app/placeholder.jpg"
      }],
      amount: amountInCents,
      customer: {
        name: name,
        email: email || `${cpfLimpo}@temp.com`,
        phone: phoneLimpo,
        document: {
          type: "cpf",
          number: cpfLimpo
        }
      },
      metadata: JSON.stringify({
        provider: "PixONE",
        user_email: email || `${cpfLimpo}@temp.com`,
        cpf: cpf,
        phone: phone,
        source: 'PixONE-Integration',
        timestamp: new Date().toISOString()
      }),
      traceable: false,
      externalRef: transactionId,
      postbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://e34asd.netlify.app'}/api/freepay-webhook`
    }

    console.log("[PixONE] Payload:", payload)
    console.log("[PixONE] Webhook URL:", `${process.env.NEXT_PUBLIC_BASE_URL || 'https://e34asd.netlify.app'}/api/freepay-webhook`)

    const response = await fetch("https://api.pixone.com.br/api/v1/transactions", {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()
    console.log("[PixONE] Response status:", response.status)
    console.log("[PixONE] Response body:", JSON.stringify(result, null, 2))

    if (response.ok && result.success) {
      console.log("[PixONE] Full response data:", JSON.stringify(result, null, 2))
      
      // Verificar se os dados do PIX existem
      if (!result.data || !result.data.pix) {
        console.error("[PixONE] PIX data not found in response:", result)
        return NextResponse.json({
          success: false,
          error: "Dados do PIX não encontrados na resposta"
        }, { status: 500 })
      }

      const pixInfo = result.data.pix
      console.log("[PixONE] PIX info:", {
        qrcodeText: pixInfo.qrcodeText ? "Present" : "Missing",
        qrcode: pixInfo.qrcode ? "Present" : "Missing",
        expirationDate: pixInfo.expirationDate
      })

      // Converter resposta para formato compatível
      const pixCode = pixInfo.qrcodeText || pixInfo.qrcode || ""
      
      const pixData = {
        success: true,
        pixCode: pixCode, // Código PIX para copiar
        qrCodeImage: pixCode, // Mesmo código para exibição
        amount: finalAmount,
        transactionId: result.data.secureId || result.data.id,
        expiresAt: pixInfo.expirationDate,
        provider: "pixone",
        status: "waiting_payment",
        customer: {
          name: result.data.customer?.name || name,
          email: result.data.customer?.email || email || `${cpfLimpo}@temp.com`,
          phone: result.data.customer?.phone || phoneLimpo,
          document: result.data.customer?.document?.number || cpfLimpo
        },
        metadata: {
          externalId: result.data.externalId,
          secureUrl: result.data.secureUrl,
          fees: result.data.fees,
          createdAt: result.data.createdAt
        }
      }

      console.log("[PixONE] Converted PIX data:", {
        success: pixData.success,
        pixCode: pixData.pixCode ? `Length: ${pixData.pixCode.length}` : "Missing",
        qrCodeImage: pixData.qrCodeImage ? `Length: ${pixData.qrCodeImage.length}` : "Missing",
        transactionId: pixData.transactionId
      })

      return NextResponse.json(pixData)
    } else {
      console.error("[PixONE] Error:", result)
      return NextResponse.json({
        success: false,
        error: result.message || "Erro ao gerar PIX"
      }, { status: response.status })
    }

  } catch (error) {
    console.error("[PixONE] Error creating PIX transaction:", error)
    
    // Log detalhado do erro para debugging
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
