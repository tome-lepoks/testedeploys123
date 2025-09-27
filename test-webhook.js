// Teste manual do webhook UTMFY
const testWebhook = async () => {
  const webhookUrl = 'https://e34asd.netlify.app/api/freepay-webhook'
  
  const payload = {
    type: 'transaction',
    data: {
      id: '9660c32e-ae3c-4090-a48c-d3bb4ccbf562',
      status: 'waiting_payment',
      amount: 26323,
      customer: {
        name: 'Pedro Fernandes Lima',
        email: 'pedro@email.com',
        phone: '11999999999'
      },
      paymentMethod: 'PIX',
      createdAt: '2024-01-15T10:25:00Z',
      items: [{
        title: 'Produto FreePay',
        unitPrice: 26323,
        quantity: 1,
        externalRef: '9660c32e-ae3c-4090-a48c-d3bb4ccbf562'
      }]
    }
  }
  
  try {
    console.log('🧪 Testando webhook manualmente...')
    console.log('📡 URL:', webhookUrl)
    console.log('📦 Payload:', JSON.stringify(payload, null, 2))
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    const result = await response.text()
    console.log('✅ Resposta do webhook:', result)
    console.log('📊 Status:', response.status)
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar teste
testWebhook()
