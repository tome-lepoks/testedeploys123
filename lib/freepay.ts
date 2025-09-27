/**
 * FreePay API Client
 * 
 * This module provides a comprehensive client for interacting with the FreePay API.
 * It includes methods for creating transactions, checking status, and handling webhooks.
 */

export interface FreePayConfig {
  secretKey: string
  companyId: string
  baseUrl?: string
}

export interface FreePayCustomer {
  name: string
  email: string
  phone: string
}

export interface FreePayShipping {
  street: string
  streetNumber: string
  zipCode: string
  neighborhood: string
  city: string
  state: string
  complement?: string
}

export interface FreePayItem {
  title: string
  unitPrice: number
  quantity: number
  externalRef: string
}

export interface FreePayTransactionRequest {
  paymentMethod: 'PIX' | 'CARD' | 'BOLETO'
  amount: number
  items: FreePayItem[]
  customer: FreePayCustomer
  shipping: FreePayShipping
  description?: string
  metadata?: string
  postbackUrl?: string
  installments?: number
}

export interface FreePayTransaction {
  id: string
  status: 'processing' | 'authorized' | 'paid' | 'refunded' | 'waiting_payment' | 'refused' | 'chargedback' | 'canceled' | 'in_protest' | 'partially_paid'
  amount: number
  paidAmount?: number
  refundedAmount?: number
  paymentMethod: string
  installments: number
  customer: FreePayCustomer
  shipping: FreePayShipping
  card?: any
  pix?: {
    qrcode: string
    expirationDate: string
    end2EndId?: string
    receiptUrl?: string
  }
  boleto?: any
  companyId: string
  postbackUrl?: string
  metadata: string
  createdAt: string
  updatedAt: string
  paidAt?: string
  ip: string
  refusedReason?: any
  items: FreePayItem[]
  splits?: any[]
  fee?: {
    fixedAmount: number
    spreadPercentage: number
    estimatedFee: number
    netAmount: number
  }
}

export interface FreePayResponse {
  success: boolean
  data?: FreePayTransaction
  error?: string
  message?: string
}

export class FreePayClient {
  private config: FreePayConfig
  private baseUrl: string

  constructor(config: FreePayConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'https://api.freepaybr.com'
  }

  /**
   * Create a new transaction
   */
  async createTransaction(request: FreePayTransactionRequest): Promise<FreePayResponse> {
    try {
      const url = `${this.baseUrl}/functions/v1/transactions`
      const auth = 'Basic ' + Buffer.from(this.config.secretKey + ':x').toString('base64')

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = `FreePay error: ${response.status}`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          errorMessage = responseText || errorMessage
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      const transactionData = JSON.parse(responseText)
      
      return {
        success: true,
        data: transactionData
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get transaction status by ID
   */
  async getTransactionStatus(transactionId: string): Promise<FreePayResponse> {
    try {
      const url = `${this.baseUrl}/functions/v1/transactions/${transactionId}`
      const auth = 'Basic ' + Buffer.from(this.config.secretKey + ':x').toString('base64')

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const responseText = await response.text()

      if (!response.ok) {
        let errorMessage = `FreePay error: ${response.status}`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          errorMessage = responseText || errorMessage
        }
        
        return {
          success: false,
          error: errorMessage
        }
      }

      const transactionData = JSON.parse(responseText)
      
      return {
        success: true,
        data: transactionData
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a PIX transaction with simplified parameters
   */
  async createPixTransaction(params: {
    amount: number
    customer: FreePayCustomer
    description?: string
    items?: FreePayItem[]
    postbackUrl?: string
  }): Promise<FreePayResponse> {
    const defaultItems: FreePayItem[] = params.items || [{
      title: 'Produto FreePay',
      unitPrice: params.amount,
      quantity: 1,
      externalRef: `PRODUTO_FREEPAY_${Date.now()}`
    }]

    const defaultShipping: FreePayShipping = {
      street: 'Rua Exemplo',
      streetNumber: '123',
      zipCode: '12345678',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      complement: 'Apto 1'
    }

    const request: FreePayTransactionRequest = {
      paymentMethod: 'PIX',
      amount: params.amount,
      items: defaultItems,
      customer: params.customer,
      shipping: defaultShipping,
      description: params.description || 'Pagamento via FreePay',
      metadata: JSON.stringify({
        source: 'FreePay-Integration',
        timestamp: new Date().toISOString()
      }),
      postbackUrl: params.postbackUrl
    }

    return this.createTransaction(request)
  }

  /**
   * Validate webhook signature (if FreePay provides signature validation)
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    // FreePay doesn't seem to provide signature validation in their docs
    // This is a placeholder for future implementation
    return true
  }

  /**
   * Parse webhook payload
   */
  parseWebhookPayload(payload: any): {
    type: string
    objectId: string
    data: FreePayTransaction
  } | null {
    if (!payload.type || payload.type !== 'transaction') {
      return null
    }

    if (!payload.data || !payload.data.id) {
      return null
    }

    return {
      type: payload.type,
      objectId: payload.objectId,
      data: payload.data
    }
  }
}

// Utility functions
export function formatAmountToCents(amount: number): number {
  return Math.round(amount * 100)
}

export function formatAmountFromCents(cents: number): number {
  return cents / 100
}

export function getStatusText(status: string): string {
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

export function isPaidStatus(status: string): boolean {
  return status === 'paid' || status === 'authorized'
}

export function isWaitingStatus(status: string): boolean {
  return status === 'waiting_payment' || status === 'processing'
}

export function isRefusedStatus(status: string): boolean {
  return status === 'refused'
}

export function isRefundedStatus(status: string): boolean {
  return status === 'refunded'
}

export function isCanceledStatus(status: string): boolean {
  return status === 'canceled'
}

// Default client instance
export const freepay = new FreePayClient({
  secretKey: process.env.FREEPAY_SECRET_KEY || 'sk_live_C4C97UanuShcerwwfBIWYnTdqthmTrh2s5hYXBntPdb8q3bL',
  companyId: process.env.FREEPAY_COMPANY_ID || 'b16176ba-9c1c-49d1-ad5d-aa56ef88a05d'
})
