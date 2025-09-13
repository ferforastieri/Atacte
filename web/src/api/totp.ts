import api from './index'

// Tipos específicos para TOTP
export interface TOTPData {
  secret: string
  qrCodeUrl?: string
  manualEntryKey: string
}

export interface TOTPCode {
  code: string
  timeRemaining: number
  period: number
}

export interface TOTPValidation {
  isValid: boolean
  delta?: number
}

export interface ParsedOtpAuth {
  service: string
  account: string
  secret: string
  issuer?: string
}

// API de TOTP
const totpApi = {
  // Gerar novo secret TOTP
  async generateSecret(serviceName: string, accountName: string) {
    const response = await api.post('/totp/generate', {
      serviceName,
      accountName
    })
    return response.data
  },

  // Gerar QR Code
  async generateQRCode(otpauthUrl: string) {
    const response = await api.post('/totp/qrcode', { otpauthUrl })
    return response.data
  },

  // Validar código TOTP
  async validateCode(secret: string, code: string) {
    const response = await api.post('/totp/validate', { secret, code })
    return response.data
  },

  // Analisar URL otpauth
  async parseOtpAuthUrl(otpauthUrl: string) {
    const response = await api.post('/totp/parse', { otpauthUrl })
    return response.data
  },

  // Gerar códigos de teste (desenvolvimento)
  async testCodes(secret: string) {
    const response = await api.post('/totp/test', { secret })
    return response.data
  },

  // === FUNÇÕES PARA GERENCIAR TOTP DE SENHAS ===

  // Buscar código TOTP atual de uma senha
  async getTotpCode(passwordId: string) {
    const response = await api.get(`/totp/passwords/${passwordId}`)
    return response.data
  },

  // Adicionar TOTP a uma senha
  async addTotpToPassword(passwordId: string, totpInput: string) {
    const response = await api.post(`/totp/passwords/${passwordId}`, {
      totpInput
    })
    return response.data
  },

  // Remover TOTP de uma senha
  async removeTotpFromPassword(passwordId: string) {
    const response = await api.delete(`/totp/passwords/${passwordId}`)
    return response.data
  }
}

export default totpApi

