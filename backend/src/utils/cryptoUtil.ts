import crypto from 'crypto-js';

export class CryptoUtil {
  // Criptografar dados
  static encrypt(data: string, key: string): string {
    try {
      return crypto.AES.encrypt(data, key).toString();
    } catch (error) {
      throw new Error('Erro ao criptografar dados');
    }
  }

  // Descriptografar dados
  static decrypt(encryptedData: string, key: string): string {
    try {
      const bytes = crypto.AES.decrypt(encryptedData, key);
      const decrypted = bytes.toString(crypto.enc.Utf8);
      
      if (!decrypted) {
        throw new Error('Falha na descriptografia');
      }
      
      return decrypted;
    } catch (error) {
      throw new Error('Erro ao descriptografar dados');
    }
  }

  // Gerar chave aleatória
  static generateKey(bits: number = 256): string {
    return crypto.lib.WordArray.random(bits / 8).toString();
  }

  // Gerar salt
  static generateSalt(bits: number = 128): string {
    return crypto.lib.WordArray.random(bits / 8).toString();
  }

  // Hash de dados
  static hash(data: string): string {
    return crypto.SHA256(data).toString();
  }

  // Verificar se uma string é um hash válido
  static isValidHash(hash: string): boolean {
    return /^[a-f0-9]{64}$/i.test(hash);
  }
}

