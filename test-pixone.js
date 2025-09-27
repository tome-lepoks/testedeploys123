// Teste manual da API Pix One
const testPixOne = async () => {
  const testData = {
    cpf: "12345678909",
    name: "João Silva",
    phone: "11987654321",
    amount: 174.28
  }
  
  try {
    console.log('🧪 Testando API Pix One...')
    console.log('📦 Dados:', testData)
    
    const response = await fetch('https://e34asd.netlify.app/api/pixone-pix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    console.log('✅ Resposta da API:', result)
    console.log('📊 Status:', response.status)
    
    if (result.success) {
      console.log('🎯 QR Code presente:', !!result.qrCodeImage)
      console.log('🎯 Código PIX presente:', !!result.pixCode)
      console.log('🎯 Transaction ID:', result.transactionId)
    } else {
      console.error('❌ Erro na API:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar teste
testPixOne()
