/**
 * Sistema de Credenciais Únicas PixONE
 * 
 * Este módulo implementa um sistema simplificado com credenciais únicas
 * para todas as transações, removendo a complexidade da rotação.
 * 
 * Todas as transações usam a mesma credencial da PixONE.
 */

interface PixOneCredentials {
  secretKey: string
  privateKey: string
  name: string
}

// Credenciais únicas da PixONE (sem rotação)
const PIXONE_CREDENTIALS: PixOneCredentials = {
  secretKey: "sk_hxOVqqWK5ueF4kZUZ1JUww61E-NGmXi7Xd5vwN7uuwafGDFy",
  privateKey: "pk_pDKKPyxc4TOKmcmfczYlnva2njH8nXqlwTnRJhAhOhS8ydUu",
  name: "unified"
}

// Contador global de transações (em produção, isso deveria ser persistido em banco de dados)
let transactionCounter = 0

/**
 * Obtém as credenciais únicas da PixONE (sem rotação)
 * 
 * Sistema simplificado: sempre retorna a mesma credencial
 */
export function getCredentialsForTransaction(): PixOneCredentials {
  // Incrementa o contador para estatísticas
  transactionCounter++
  
  // Sempre retorna a mesma credencial
  return PIXONE_CREDENTIALS
}

/**
 * Obtém as credenciais únicas (para casos especiais)
 */
export function getPrimaryCredentials(): PixOneCredentials {
  return PIXONE_CREDENTIALS
}

/**
 * Obtém as credenciais únicas (alias para compatibilidade)
 */
export function getSecondaryCredentials(): PixOneCredentials {
  return PIXONE_CREDENTIALS
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
  const primaryValid = PIXONE_CREDENTIALS.secretKey.startsWith('sk_') && 
                      PIXONE_CREDENTIALS.privateKey.startsWith('pk_')
  
  if (!primaryValid) {
    errors.push("PixONE credentials are invalid")
  }
  
  return {
    primaryValid,
    secondaryValid: primaryValid, // Mesma validação para compatibilidade
    errors
  }
}

// Sistema de rotação inicializado silenciosamente
