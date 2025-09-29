import { TOTP } from 'otpauth'

export interface TOTPCode {
  code: string
  timeRemaining: number 
  period: number 
}

export interface TOTPValidation {
  isValid: boolean
  delta?: number | undefined 
}

/**
 * Classe para geração de códigos TOTP no cliente
 * Reduz drasticamente as requisições ao servidor
 * Compatível com browser usando otpauth
 */
export class TOTPClient {
  private static readonly TOTP_PERIOD = 30 
  private static readonly TOTP_WINDOW = 2 

  /**
   * Gerar código TOTP atual baseado no secret
   */
  static generateCurrentCode(secret: string): TOTPCode {
    
    const cleanSecret = secret.trim().replace(/\s/g, '').toUpperCase()
    
    if (!cleanSecret) {
      throw new Error('Secret TOTP vazio')
    }

    try {
      
      const totp = new TOTP({
        secret: cleanSecret,
        algorithm: 'SHA1',
        digits: 6,
        period: this.TOTP_PERIOD
      })

      
      const token = totp.generate()

      
      const timeRemaining = this.TOTP_PERIOD - (Math.floor(Date.now() / 1000) % this.TOTP_PERIOD)

      return {
        code: token,
        timeRemaining,
        period: this.TOTP_PERIOD
      }
    } catch (error) {
      console.error('Erro ao gerar código TOTP:', error)
      throw new Error('Erro ao gerar código TOTP')
    }
  }

  /**
   * Validar um código TOTP
   */
  static validateCode(secret: string, code: string): TOTPValidation {
    try {
      const totp = new TOTP({
        secret: secret,
        algorithm: 'SHA1',
        digits: 6,
        period: this.TOTP_PERIOD
      })

      const verified = totp.validate({ token: code, window: this.TOTP_WINDOW })

      return {
        isValid: verified !== null,
        delta: verified || undefined
      }
    } catch (error) {
      console.error('Erro ao validar código TOTP:', error)
      return {
        isValid: false,
        delta: undefined
      }
    }
  }

  /**
   * Gerar múltiplos códigos para teste
   */
  static generateTestCodes(secret: string, count: number = 5): TOTPCode[] {
    const codes: TOTPCode[] = []
    const now = Math.floor(Date.now() / 1000)
    
    try {
      const totp = new TOTP({
        secret: secret,
        algorithm: 'SHA1',
        digits: 6,
        period: this.TOTP_PERIOD
      })
      
      for (let i = -count; i <= count; i++) {
        const time = now + (i * this.TOTP_PERIOD)
        
        const token = totp.generate({ timestamp: time * 1000 })
        const timeRemaining = this.TOTP_PERIOD - (time % this.TOTP_PERIOD)

        codes.push({
          code: token,
          timeRemaining,
          period: this.TOTP_PERIOD
        })
      }
    } catch (error) {
      console.error('Erro ao gerar códigos de teste:', error)
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
