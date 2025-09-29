import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { CryptoUtil } from '../../utils/cryptoUtil';
import { PasswordRepository } from '../../repositories/passwords/passwordRepository';
import { AuditUtil } from '../../utils/auditUtil';
import { Request } from 'express';

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
  private passwordRepository: PasswordRepository;
  private static readonly TOTP_WINDOW = 2; // Janela de tolerância (±2 períodos)
  private static readonly TOTP_PERIOD = 30; // 30 segundos por período

  constructor() {
    this.passwordRepository = new PasswordRepository();
  }

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
    
    // Limpar e normalizar o secret
    const cleanSecret = secret.trim().replace(/\s/g, '').toUpperCase();
    
    if (!cleanSecret) {
      throw new Error('Secret TOTP vazio');
    }

    
    const token = speakeasy.totp({
      secret: cleanSecret,
      encoding: 'base32',
      step: this.TOTP_PERIOD
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
      
      // Remover espaços e normalizar
      const cleanUrl = otpauthUrl.trim();
      
      // Verificar se é uma URL otpauth válida
      if (!cleanUrl.startsWith('otpauth://totp/')) {
        return null;
      }
      
      // Extrair a parte após otpauth://totp/
      const urlPart = cleanUrl.substring(15); // Remove 'otpauth://totp/'
      
      // Separar o pathname dos query parameters
      const [pathname, queryString] = urlPart.split('?');
      
      if (!queryString) {
        return null;
      }
      
      // Parse dos query parameters
      const params = new URLSearchParams(queryString);
      const secret = params.get('secret');
      
      if (!secret) {
        return null;
      }
      
      // Parse do pathname: serviceName:accountName
      const pathParts = pathname.split(':');
      const serviceName = decodeURIComponent(pathParts[0] || '');
      const accountName = pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : '';

      const result = {
        secret: secret.trim(),
        serviceName,
        accountName
      };
      
      return result;
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

  // === MÉTODOS DE INSTÂNCIA PARA GERENCIAR TOTP DE SENHAS ===

  /**
   * Adicionar TOTP a uma entrada de senha
   */
  async addTotpToEntry(
    userId: string, 
    passwordId: string, 
    totpInput: string, // Pode ser uma chave TOTP ou URL otpauth://
    req?: Request
  ): Promise<any> {
    // Verificar se a entrada existe
    const existingEntry = await this.passwordRepository.findById(passwordId, userId);

    if (!existingEntry) {
      throw new Error('Senha não encontrada');
    }

    // Buscar chave de criptografia
    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    let totpSecret: string;

    // Verificar se é uma URL otpauth://
    if (totpInput.startsWith('otpauth://')) {
      const parsed = TOTPService.parseOtpAuthUrl(totpInput);
      
      if (!parsed) {
        throw new Error('URL otpauth inválida');
      }
      
      totpSecret = parsed.secret;
    } else {
      // É uma chave TOTP direta
      totpSecret = totpInput;
    }

    // Validar secret TOTP
    if (!TOTPService.isValidSecret(totpSecret)) {
      throw new Error('Secret TOTP inválido');
    }

    // Criptografar e salvar
    const encryptedSecret = TOTPService.encryptSecret(totpSecret, user.encryptionKeyHash);

    const updatedEntry = await this.passwordRepository.update(passwordId, {
      totpSecret: encryptedSecret,
      totpEnabled: true
    });

    await AuditUtil.log(
      userId,
      'PASSWORD_UPDATED',
      'PASSWORD_ENTRY',
      passwordId,
      { action: 'TOTP_ADDED' },
      req
    );

    return updatedEntry;
  }

  /**
   * Remover TOTP de uma entrada de senha
   */
  async removeTotpFromEntry(
    userId: string, 
    passwordId: string, 
    req?: Request
  ): Promise<any> {
    const existingEntry = await this.passwordRepository.findById(passwordId, userId);

    if (!existingEntry) {
      throw new Error('Senha não encontrada');
    }

    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updatedEntry = await this.passwordRepository.update(passwordId, {
      totpSecret: undefined,
      totpEnabled: false
    } as any);

    await AuditUtil.log(
      userId,
      'PASSWORD_UPDATED',
      'PASSWORD_ENTRY',
      passwordId,
      { action: 'TOTP_REMOVED' },
      req
    );

    return updatedEntry;
  }

  /**
   * Buscar código TOTP atual para uma entrada
   */
  async getTotpCodeForEntry(
    userId: string, 
    passwordId: string, 
    req?: Request
  ): Promise<TOTPCode | null> {
    const entry = await this.passwordRepository.findById(passwordId, userId);
    
    if (!entry || !entry.totpEnabled || !entry.totpSecret) {
      return null;
    }

    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    try {
      const decryptedSecret = TOTPService.decryptSecret(entry.totpSecret, user.encryptionKeyHash);
      
      const totpCode = TOTPService.generateCurrentCode(decryptedSecret);

      // Log do acesso ao TOTP
      await AuditUtil.log(
        userId,
        'PASSWORD_VIEWED',
        'PASSWORD_ENTRY',
        passwordId,
        { action: 'TOTP_CODE_ACCESSED' },
        req
      );

      return totpCode;
    } catch (error) {
      console.error('Erro ao descriptografar TOTP secret:', error);
      return null;
    }
  }

  /**
   * Buscar apenas o secret TOTP para uma entrada (para geração client-side)
   */
  async getTotpSecretForEntry(
    userId: string, 
    passwordId: string, 
    req?: Request
  ): Promise<{ secret: string } | null> {
    const entry = await this.passwordRepository.findById(passwordId, userId);
    
    if (!entry || !entry.totpEnabled || !entry.totpSecret) {
      return null;
    }

    const user = await this.passwordRepository.getUserEncryptionKey(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    try {
      const decryptedSecret = TOTPService.decryptSecret(entry.totpSecret, user.encryptionKeyHash);
      
      // Log do acesso ao secret TOTP
      await AuditUtil.log(
        userId,
        'PASSWORD_VIEWED',
        'PASSWORD_ENTRY',
        passwordId,
        { action: 'TOTP_SECRET_ACCESSED' },
        req
      );

      return { secret: decryptedSecret };
    } catch (error) {
      console.error('Erro ao descriptografar TOTP secret:', error);
      return null;
    }
  }

}
