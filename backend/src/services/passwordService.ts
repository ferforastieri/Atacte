import { Request } from 'express';
import { prisma, PasswordEntry, CustomField } from '../infrastructure/prisma';
import { CryptoUtil } from '../utils/cryptoUtil';
import { AuditUtil } from '../utils/auditUtil';
import { PasswordUtil, PasswordGeneratorOptions } from '../utils/passwordUtil';
import { TOTPService, TOTPCode } from './totpService';

export interface PasswordEntryDto {
  id: string;
  name: string;
  website?: string;
  username?: string;
  password: string; // Descriptografado
  notes?: string;
  folder?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date;
  customFields?: CustomFieldDto[];
  // TOTP
  totpEnabled: boolean;
  totpCode?: TOTPCode; // Código atual se TOTP estiver habilitado
}

export interface CustomFieldDto {
  id: string;
  fieldName: string;
  value: string; // Descriptografado
  fieldType: string;
}

export interface CreatePasswordEntryData {
  name: string;
  website?: string;
  username?: string;
  password: string;
  notes?: string;
  folder?: string;
  isFavorite?: boolean;
  customFields?: Array<{
    fieldName: string;
    value: string;
    fieldType: 'text' | 'password' | 'email' | 'url' | 'number';
  }>;
  // TOTP
  totpSecret?: string; // Secret do TOTP (será criptografado)
  totpEnabled?: boolean;
}

export interface UpdatePasswordEntryData extends Partial<CreatePasswordEntryData> {}

export interface SearchFilters {
  query?: string;
  folder?: string;
  isFavorite?: boolean;
  limit: number;
  offset: number;
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'lastUsed';
  sortOrder: 'asc' | 'desc';
}

export interface SearchResult {
  passwords: PasswordEntryDto[];
  total: number;
}

export class PasswordService {
  // Buscar senhas com filtros
  async searchPasswords(userId: string, filters: SearchFilters, req?: Request): Promise<SearchResult> {
    const {
      query,
      folder,
      isFavorite,
      limit,
      offset,
      sortBy,
      sortOrder
    } = filters;

    // Construir where clause
    const where: any = { userId };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { website: { contains: query, mode: 'insensitive' } },
        { username: { contains: query, mode: 'insensitive' } },
        { notes: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (folder) {
      where.folder = folder;
    }

    if (isFavorite !== undefined) {
      where.isFavorite = isFavorite;
    }

    // Buscar senhas e total
    const [passwords, total] = await Promise.all([
      prisma.passwordEntry.findMany({
        where,
        include: {
          customFields: true
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset
      }),
      prisma.passwordEntry.count({ where })
    ]);

    // Buscar chave de criptografia do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Descriptografar senhas
    const decryptedPasswords = await Promise.all(
      passwords.map(password => this.decryptPasswordEntry(password, user.encryptionKeyHash))
    );

    return {
      passwords: decryptedPasswords,
      total
    };
  }

  // Buscar senha por ID
  async getPasswordById(userId: string, passwordId: string, req?: Request): Promise<PasswordEntryDto | null> {
    const password = await prisma.passwordEntry.findFirst({
      where: {
        id: passwordId,
        userId
      },
      include: {
        customFields: true
      }
    });

    if (!password) {
      return null;
    }

    // Buscar chave de criptografia
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Atualizar último uso
    await prisma.passwordEntry.update({
      where: { id: passwordId },
      data: { lastUsed: new Date() }
    });

    // Log de auditoria
    await AuditUtil.log(userId, 'PASSWORD_VIEWED', 'PASSWORD_ENTRY', passwordId, null, req);

    return this.decryptPasswordEntry(password, user.encryptionKeyHash);
  }

  // Criar nova senha
  async createPassword(userId: string, data: CreatePasswordEntryData, req?: Request): Promise<PasswordEntryDto> {
    // Buscar chave de criptografia
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Criptografar senha
    const encryptedPassword = CryptoUtil.encrypt(data.password, user.encryptionKeyHash);

    // Criptografar TOTP secret se fornecido
    let encryptedTotpSecret: string | undefined;
    if (data.totpSecret && data.totpEnabled) {
      // Validar se o secret TOTP é válido
      if (!TOTPService.isValidSecret(data.totpSecret)) {
        throw new Error('Secret TOTP inválido');
      }
      encryptedTotpSecret = TOTPService.encryptSecret(data.totpSecret, user.encryptionKeyHash);
    }

    // Criar entrada de senha
    const passwordEntry = await prisma.passwordEntry.create({
      data: {
        userId,
        name: data.name,
        website: data.website,
        username: data.username,
        encryptedPassword,
        notes: data.notes,
        folder: data.folder,
        isFavorite: data.isFavorite || false,
        totpSecret: encryptedTotpSecret,
        totpEnabled: data.totpEnabled || false,
        customFields: data.customFields ? {
          create: data.customFields.map(field => ({
            fieldName: field.fieldName,
            encryptedValue: CryptoUtil.encrypt(field.value, user.encryptionKeyHash),
            fieldType: field.fieldType
          }))
        } : undefined
      },
      include: {
        customFields: true
      }
    });

    // Log de auditoria
    await AuditUtil.log(
      userId, 
      'PASSWORD_CREATED', 
      'PASSWORD_ENTRY', 
      passwordEntry.id, 
      { name: data.name }, 
      req
    );

    return this.decryptPasswordEntry(passwordEntry, user.encryptionKeyHash);
  }

  // Atualizar senha
  async updatePassword(
    userId: string, 
    passwordId: string, 
    data: UpdatePasswordEntryData, 
    req?: Request
  ): Promise<PasswordEntryDto | null> {
    // Verificar se a senha existe
    const existingPassword = await prisma.passwordEntry.findFirst({
      where: {
        id: passwordId,
        userId
      }
    });

    if (!existingPassword) {
      return null;
    }

    // Buscar chave de criptografia
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Preparar dados para atualização
    const updateData: any = {
      name: data.name,
      website: data.website,
      username: data.username,
      notes: data.notes,
      folder: data.folder,
      isFavorite: data.isFavorite
    };

    if (data.password) {
      updateData.encryptedPassword = CryptoUtil.encrypt(data.password, user.encryptionKeyHash);
    }

    // Atualizar senha
    const updatedPassword = await prisma.passwordEntry.update({
      where: { id: passwordId },
      data: updateData,
      include: {
        customFields: true
      }
    });

    // Atualizar campos customizados se fornecidos
    if (data.customFields) {
      // Remover campos existentes
      await prisma.customField.deleteMany({
        where: { passwordEntryId: passwordId }
      });

      // Criar novos campos
      await prisma.customField.createMany({
        data: data.customFields.map(field => ({
          passwordEntryId: passwordId,
          fieldName: field.fieldName,
          encryptedValue: CryptoUtil.encrypt(field.value, user.encryptionKeyHash),
          fieldType: field.fieldType
        }))
      });
    }

    // Buscar senha atualizada com campos customizados
    const finalPassword = await prisma.passwordEntry.findUnique({
      where: { id: passwordId },
      include: {
        customFields: true
      }
    });

    // Log de auditoria
    await AuditUtil.log(
      userId, 
      'PASSWORD_UPDATED', 
      'PASSWORD_ENTRY', 
      passwordId, 
      { name: data.name }, 
      req
    );

    return this.decryptPasswordEntry(finalPassword!, user.encryptionKeyHash);
  }

  // Deletar senha
  async deletePassword(userId: string, passwordId: string, req?: Request): Promise<boolean> {
    const password = await prisma.passwordEntry.findFirst({
      where: {
        id: passwordId,
        userId
      }
    });

    if (!password) {
      return false;
    }

    await prisma.passwordEntry.delete({
      where: { id: passwordId }
    });

    // Log de auditoria
    await AuditUtil.log(
      userId, 
      'PASSWORD_DELETED', 
      'PASSWORD_ENTRY', 
      passwordId, 
      { name: password.name }, 
      req
    );

    return true;
  }

  // Gerar senha segura
  async generateSecurePassword(options: PasswordGeneratorOptions) {
    return PasswordUtil.generateSecurePassword(options);
  }

  // Buscar pastas do usuário
  async getUserFolders(userId: string): Promise<string[]> {
    const result = await prisma.passwordEntry.findMany({
      where: {
        userId,
        folder: { not: null }
      },
      select: {
        folder: true
      },
      distinct: ['folder']
    });

    return result
      .map(item => item.folder!)
      .filter(folder => folder)
      .sort();
  }

  // Adicionar TOTP a uma entrada existente
  async addTotpToEntry(
    userId: string, 
    passwordId: string, 
    totpSecret: string, 
    req?: Request
  ): Promise<PasswordEntryDto | null> {
    // Verificar se a entrada existe
    const existingEntry = await prisma.passwordEntry.findFirst({
      where: { id: passwordId, userId }
    });

    if (!existingEntry) {
      return null;
    }

    // Buscar chave de criptografia
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Validar secret TOTP
    if (!TOTPService.isValidSecret(totpSecret)) {
      throw new Error('Secret TOTP inválido');
    }

    // Criptografar e salvar
    const encryptedSecret = TOTPService.encryptSecret(totpSecret, user.encryptionKeyHash);

    const updatedEntry = await prisma.passwordEntry.update({
      where: { id: passwordId },
      data: {
        totpSecret: encryptedSecret,
        totpEnabled: true
      },
      include: { customFields: true }
    });

    await AuditUtil.log(
      userId,
      'PASSWORD_UPDATED',
      'PASSWORD_ENTRY',
      passwordId,
      { action: 'TOTP_ENABLED' },
      req
    );

    return this.decryptPasswordEntry(updatedEntry, user.encryptionKeyHash);
  }

  // Remover TOTP de uma entrada
  async removeTotpFromEntry(
    userId: string, 
    passwordId: string, 
    req?: Request
  ): Promise<PasswordEntryDto | null> {
    const existingEntry = await prisma.passwordEntry.findFirst({
      where: { id: passwordId, userId }
    });

    if (!existingEntry) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const updatedEntry = await prisma.passwordEntry.update({
      where: { id: passwordId },
      data: {
        totpSecret: null,
        totpEnabled: false
      },
      include: { customFields: true }
    });

    await AuditUtil.log(
      userId,
      'PASSWORD_UPDATED',
      'PASSWORD_ENTRY',
      passwordId,
      { action: 'TOTP_DISABLED' },
      req
    );

    return this.decryptPasswordEntry(updatedEntry, user.encryptionKeyHash);
  }

  // Buscar apenas código TOTP atual (sem dados sensíveis)
  async getTotpCode(userId: string, passwordId: string, req?: Request): Promise<TOTPCode | null> {
    const entry = await prisma.passwordEntry.findFirst({
      where: {
        id: passwordId,
        userId,
        totpEnabled: true,
        totpSecret: { not: null }
      }
    });

    if (!entry || !entry.totpSecret) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true }
    });

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
      console.error('Erro ao gerar código TOTP:', error);
      return null;
    }
  }

  // Descriptografar entrada de senha
  private async decryptPasswordEntry(
    password: PasswordEntry & { customFields: CustomField[] },
    encryptionKey: string
  ): Promise<PasswordEntryDto> {
    // Descriptografar TOTP se habilitado
    let totpCode: TOTPCode | undefined;
    if (password.totpEnabled && password.totpSecret) {
      try {
        const decryptedSecret = TOTPService.decryptSecret(password.totpSecret, encryptionKey);
        totpCode = TOTPService.generateCurrentCode(decryptedSecret);
      } catch (error) {
        console.error('Erro ao descriptografar TOTP secret:', error);
      }
    }

    return {
      id: password.id,
      name: password.name,
      website: password.website || undefined,
      username: password.username || undefined,
      password: CryptoUtil.decrypt(password.encryptedPassword, encryptionKey),
      notes: password.notes || undefined,
      folder: password.folder || undefined,
      isFavorite: password.isFavorite,
      createdAt: password.createdAt,
      updatedAt: password.updatedAt,
      lastUsed: password.lastUsed || undefined,
      totpEnabled: password.totpEnabled,
      totpCode,
      customFields: password.customFields.map(field => ({
        id: field.id,
        fieldName: field.fieldName,
        value: CryptoUtil.decrypt(field.encryptedValue, encryptionKey),
        fieldType: field.fieldType
      }))
    };
  }
}
