import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { CryptoUtil } from '../../utils/cryptoUtil';

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

    const timeRemaining = this.TOTP_PERIOD - (Math.floor(Date.now() / 1000) % this.TOTP_PERIOD);

    return {
      code: token,
      timeRemaining,
      period: this.TOTP_PERIOD
    };
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
    });

    return {
      isValid: verified,
      delta: verified ? 0 : undefined
    };
  }

  /**
   * Gerar múltiplos códigos para teste
   */
  static generateMultipleCodes(secret: string): {
    previous: number;
    current: number;
    next: number;
    timeRemaining: number;
  } {
    const now = Math.floor(Date.now() / 1000);
    const step = Math.floor(now / this.TOTP_PERIOD);

    const previous = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: (step - 1) * this.TOTP_PERIOD,
      step: this.TOTP_PERIOD
    });

    const current = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: step * this.TOTP_PERIOD,
      step: this.TOTP_PERIOD
    });

    const next = speakeasy.totp({
      secret: secret,
      encoding: 'base32',
      time: (step + 1) * this.TOTP_PERIOD,
      step: this.TOTP_PERIOD
    });

    const timeRemaining = this.TOTP_PERIOD - (now % this.TOTP_PERIOD);

    return {
      previous: parseInt(previous),
      current: parseInt(current),
      next: parseInt(next),
      timeRemaining
    };
  }

  /**
   * Formatar código TOTP com zeros à esquerda
   */
  static formatCode(code: number): string {
    return code.toString().padStart(6, '0');
  }

  /**
   * Verificar se um secret TOTP é válido
   */
  static isValidSecret(secret: string): boolean {
    try {
      // Tentar gerar um código para validar o secret
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
   * Gerar QR Code para uma URL otpauth
   */
  static async generateQRCode(otpauthUrl: string): Promise<string> {
    try {
      return await qrcode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new Error('Erro ao gerar QR Code');
    }
  }

  /**
   * Extrair informações de uma URL otpauth
   */
  static parseOtpAuthUrl(otpauthUrl: string): {
    secret: string;
    serviceName: string;
    accountName: string;
  } | null {
    try {
      const url = new URL(otpauthUrl);
      
      if (url.protocol !== 'otpauth:' || url.hostname !== 'totp') {
        return null;
      }

      const pathParts = url.pathname.split(':');
      const serviceName = decodeURIComponent(pathParts[0]);
      const accountName = pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : '';

      const secret = url.searchParams.get('secret');
      if (!secret) {
        return null;
      }

      return {
        secret,
        serviceName,
        accountName
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Criptografar secret TOTP
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
}
