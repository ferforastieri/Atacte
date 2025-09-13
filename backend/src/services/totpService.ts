import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { CryptoUtil } from '../utils/cryptoUtil';

export interface TOTPData {
  secret: string;
  qrCodeUrl?: string;
  manualEntryKey: string;
}

export interface TOTPCode {
  code: string;
  timeRemaining: number; // segundos restantes até expirar
  period: number; // período total (30s)
}

export interface TOTPValidation {
  isValid: boolean;
  delta?: number; // diferença de tempo
}

export class TOTPService {
  private static readonly TOTP_WINDOW = 2; // Janela de tolerância (±2 períodos)
  private static readonly TOTP_PERIOD = 30; // 30 segundos por período

  /**
   * Gerar um novo secret TOTP
   */
  static generateSecret(serviceName: string, accountName: string): TOTPData {
    const secret = speakeasy.generateSecret({
      name: `${serviceName} (${accountName})`,
      issuer: 'Atacte Password Manager',
      length: 32
    });

    return {
      secret: secret.base32!,
      qrCodeUrl: secret.otpauth_url,
      manualEntryKey: secret.base32!
    };
  }

  /**
   * Gerar código TOTP atual baseado no secret
   */
  static generateCurrentCode(secret: string): TOTPCode {
    const token = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      step: this.TOTP_PERIOD,
      window: 0
    });

    // Calcular tempo restante
    const now = Date.now();
    const timeStep = Math.floor(now / 1000 / this.TOTP_PERIOD);
    const timeRemaining = this.TOTP_PERIOD - (Math.floor(now / 1000) % this.TOTP_PERIOD);

    return {
      code: token,
      timeRemaining,
      period: this.TOTP_PERIOD
    };
  }

  /**
   * Validar um código TOTP
   */
  static validateCode(secret: string, userCode: string): TOTPValidation {
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: userCode,
      step: this.TOTP_PERIOD,
      window: this.TOTP_WINDOW
    });

    return {
      isValid: !!isValid,
      delta: isValid ? (isValid as any).delta : undefined
    };
  }

  /**
   * Gerar QR Code como Data URL para configuração manual
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      return qrCodeDataUrl;
    } catch (error) {
      throw new Error('Erro ao gerar QR Code');
    }
  }

  /**
   * Extrair informações de uma URL otpauth://
   */
  static parseOtpAuthUrl(otpauthUrl: string): {
    service: string;
    account: string;
    secret: string;
    issuer?: string;
  } | null {
    try {
      const url = new URL(otpauthUrl);
      
      if (url.protocol !== 'otpauth:' || url.hostname !== 'totp') {
        return null;
      }

      const pathParts = url.pathname.slice(1).split(':');
      const params = new URLSearchParams(url.search);
      
      const secret = params.get('secret');
      if (!secret) return null;

      let service = '';
      let account = '';

      if (pathParts.length === 2) {
        [service, account] = pathParts;
      } else if (pathParts.length === 1) {
        account = pathParts[0];
        service = params.get('issuer') || '';
      }

      return {
        service: decodeURIComponent(service),
        account: decodeURIComponent(account),
        secret,
        issuer: params.get('issuer') || undefined
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Criptografar secret TOTP para armazenamento
   */
  static encryptSecret(secret: string, encryptionKey: string): string {
    return CryptoUtil.encrypt(secret, encryptionKey);
  }

  /**
   * Descriptografar secret TOTP
   */
  static decryptSecret(encryptedSecret: string, encryptionKey: string): string {
    return CryptoUtil.decrypt(encryptedSecret, encryptionKey);
  }

  /**
   * Verificar se um secret é válido
   */
  static isValidSecret(secret: string): boolean {
    try {
      // Tentar gerar um código para verificar se o secret é válido
      speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        step: this.TOTP_PERIOD
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gerar múltiplos códigos (atual, próximo, anterior) para debug
   */
  static generateMultipleCodes(secret: string): {
    previous: string;
    current: string;
    next: string;
    timeRemaining: number;
  } {
    const now = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(now / this.TOTP_PERIOD);

    const previous = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      step: this.TOTP_PERIOD,
      time: (currentStep - 1) * this.TOTP_PERIOD
    });

    const current = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      step: this.TOTP_PERIOD,
      time: currentStep * this.TOTP_PERIOD
    });

    const next = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      step: this.TOTP_PERIOD,
      time: (currentStep + 1) * this.TOTP_PERIOD
    });

    const timeRemaining = this.TOTP_PERIOD - (now % this.TOTP_PERIOD);

    return {
      previous,
      current,
      next,
      timeRemaining
    };
  }

  /**
   * Formatar código TOTP com espaço no meio (123 456)
   */
  static formatCode(code: string): string {
    if (code.length === 6) {
      return `${code.slice(0, 3)} ${code.slice(3)}`;
    }
    return code;
  }
}

