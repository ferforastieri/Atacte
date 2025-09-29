import speakeasy from 'speakeasy'

export interface TOTPCode {
  code: string
  timeRemaining: number // segundos restantes até expirar
  period: number // período total (30s)
}

export interface TOTPValidation {
  isValid: boolean
  delta?: number | undefined // diferença de tempo
}

/**
 * Classe para geração de códigos TOTP no cliente
 * Reduz drasticamente as requisições ao servidor
 */
export class TOTPClient {
  private static readonly TOTP_PERIOD = 30 // 30 segundos por período
  private static readonly TOTP_WINDOW = 2 // Janela de tolerância (±2 períodos)

  /**
   * Gerar código TOTP atual baseado no secret
   */
  static generateCurrentCode(secret: string): TOTPCode {
    // Limpar e normalizar o secret
    const cleanSecret = secret.trim().replace(/\s/g, '').toUpperCase()
    
    if (!cleanSecret) {
      throw new Error('Secret TOTP vazio')
    }

    const token = speakeasy.totp({
      secret: cleanSecret,
      encoding: 'base32',
      step: this.TOTP_PERIOD
    })

    // Calcular tempo restante até o próximo período
    const timeRemaining = this.TOTP_PERIOD - (Math.floor(Date.now() / 1000) % this.TOTP_PERIOD)

    return {
      code: token,
      timeRemaining,
      period: this.TOTP_PERIOD
    }
  }

  /**
   * Validar um código TOTP
   */
  static validateCode(secret: string, code: string): TOTPValidation {
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: this.TOTP_WINDOW,
      step: this.TOTP_PERIOD
    })

    return {
      isValid: verified,
      delta: verified ? 0 : undefined
    }
  }

  /**
   * Gerar múltiplos códigos para teste
   */
  static generateTestCodes(secret: string, count: number = 5): TOTPCode[] {
    const codes: TOTPCode[] = []
    const now = Math.floor(Date.now() / 1000)
    
    for (let i = -count; i <= count; i++) {
      const time = now + (i * this.TOTP_PERIOD)
      
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        step: this.TOTP_PERIOD,
        time: time
      })

      const timeRemaining = this.TOTP_PERIOD - (time % this.TOTP_PERIOD)

      codes.push({
        code: token,
        timeRemaining,
        period: this.TOTP_PERIOD
      })
    }

    return codes
  }

  /**
   * Calcular tempo restante para o próximo período
   */
  static getTimeRemaining(): number {
    return this.TOTP_PERIOD - (Math.floor(Date.now() / 1000) % this.TOTP_PERIOD)
  }

  /**
   * Verificar se o código está próximo de expirar (últimos 5 segundos)
   */
  static isNearExpiry(timeRemaining: number): boolean {
    return timeRemaining <= 5
  }
}

export default TOTPClient
