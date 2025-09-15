/**
 * Utilitário para cópia de texto para a área de transferência
 * Lida com diferentes cenários: HTTPS, HTTP, navegadores antigos
 */

export interface CopyResult {
  success: boolean
  message: string
}

/**
 * Copia texto para a área de transferência
 * @param text - Texto a ser copiado
 * @returns Promise com resultado da operação
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  try {
    // Verificar se o navegador suporta a API de clipboard moderna
    if (navigator.clipboard && window.isSecureContext) {
      // Usar a API moderna do clipboard (requer HTTPS ou localhost)
      await navigator.clipboard.writeText(text)
      return {
        success: true,
        message: 'Copiado!'
      }
    } else {
      // Fallback para navegadores mais antigos ou contextos não seguros
      return await fallbackCopyToClipboard(text)
    }
  } catch (error) {
    console.error('Erro ao copiar:', error)
    return {
      success: false,
      message: 'Erro ao copiar. Tente selecionar e copiar manualmente.'
    }
  }
}

/**
 * Fallback para cópia usando document.execCommand
 * @param text - Texto a ser copiado
 * @returns Promise com resultado da operação
 */
async function fallbackCopyToClipboard(text: string): Promise<CopyResult> {
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    textArea.style.opacity = '0'
    textArea.style.pointerEvents = 'none'
    textArea.setAttribute('readonly', '')
    
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, 99999) // Para dispositivos móveis
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    if (successful) {
      return {
        success: true,
        message: 'Copiado!'
      }
    } else {
      throw new Error('Falha ao copiar usando fallback')
    }
  } catch (error) {
    console.error('Erro no fallback de cópia:', error)
    return {
      success: false,
      message: 'Erro ao copiar. Tente selecionar e copiar manualmente.'
    }
  }
}

/**
 * Verifica se a API de clipboard está disponível
 * @returns boolean indicando se a API está disponível
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext)
}

/**
 * Verifica se o fallback de cópia está disponível
 * @returns boolean indicando se o fallback está disponível
 */
export function isFallbackCopySupported(): boolean {
  return !!(document.queryCommandSupported && document.queryCommandSupported('copy'))
}
