/**
 * Sistema de Credenciais Únicas FreePay
 * 
 * Este módulo implementa um sistema simplificado com credenciais únicas
 * para todas as transações, removendo a complexidade da rotação.
 * 
 * Todas as transações usam a mesma credencial da FreePay.
 */

interface FreePayCredentials {
  secretKey: string
  companyId: string
  name: string
}

// Credenciais únicas da FreePay (sem rotação)
const FREE_PAY_CREDENTIALS: FreePayCredentials = {
  secretKey: "sk_live_C4C97UanuShcerwwfBIWYnTdqthmTrh2s5hYXBntPdb8q3bL",
  companyId: "b16176ba-9c1c-49d1-ad5d-aa56ef88a05d",
  name: "unified"
}

// Contador global de transações (em produção, isso deveria ser persistido em banco de dados)
let transactionCounter = 0

/**
 * Obtém as credenciais únicas da FreePay (sem rotação)
 * 
 * Sistema simplificado: sempre retorna a mesma credencial
 */
export function getCredentialsForTransaction(): FreePayCredentials {
  // Incrementa o contador para estatísticas
  transactionCounter++
  
  // Sempre retorna a mesma credencial
  return FREE_PAY_CREDENTIALS
}

/**
 * Obtém as credenciais únicas (para casos especiais)
 */
export function getPrimaryCredentials(): FreePayCredentials {
  return FREE_PAY_CREDENTIALS
}

/**
 * Obtém as credenciais únicas (alias para compatibilidade)
 */
export function getSecondaryCredentials(): FreePayCredentials {
  return FREE_PAY_CREDENTIALS
}

/**
 * Reseta o contador de transações (para testes ou reinicialização)
 */
export function resetTransactionCounter(): void {
  transactionCounter = 0
}

/**
 * Obtém o contador atual (para debugging)
 */
export function getCurrentTransactionCount(): number {
  return transactionCounter
}

/**
 * Obtém informações sobre o sistema atual (para debugging)
 */
export function getNextCycleInfo(): {
  currentCount: number
  cyclePosition: number
  nextCredentials: string
  transactionsUntilSwitch: number
} {
  return {
    currentCount: transactionCounter,
    cyclePosition: 0,
    nextCredentials: "unified",
    transactionsUntilSwitch: 0
  }
}

/**
 * Valida se as credenciais estão configuradas corretamente
 */
export function validateCredentials(): {
  primaryValid: boolean
  secondaryValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Validar credenciais únicas
  const primaryValid = FREE_PAY_CREDENTIALS.secretKey.startsWith('sk_live_') && 
                      FREE_PAY_CREDENTIALS.companyId.length > 0
  
  if (!primaryValid) {
    errors.push("FreePay credentials are invalid")
  }
  
  return {
    primaryValid,
    secondaryValid: primaryValid, // Mesma validação para compatibilidade
    errors
  }
}

// Sistema de rotação inicializado silenciosamente
