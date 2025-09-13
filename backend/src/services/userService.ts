import { Request } from 'express';
import { prisma } from '../infrastructure/prisma';
import { AuditUtil } from '../utils/auditUtil';
import { CryptoUtil } from '../utils/cryptoUtil';
import { PasswordUtil } from '../utils/passwordUtil';

export interface UserProfileDto {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface UserStatsDto {
  totalPasswords: number;
  favoritePasswords: number;
  folders: string[];
  weakPasswords: number;
  duplicatedPasswords: number;
  lastActivity?: Date;
  accountAge: number; // em dias
  totalLogins: number;
}

export interface AuditLogDto {
  id: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: any;
  createdAt: Date;
}

export interface ExportDataDto {
  user: UserProfileDto;
  passwords: Array<{
    name: string;
    website?: string;
    username?: string;
    password: string;
    notes?: string;
    folder?: string;
    isFavorite: boolean;
    customFields?: Array<{
      fieldName: string;
      value: string;
      fieldType: string;
    }>;
  }>;
  exportedAt: Date;
}

export class UserService {
  // Buscar perfil do usuário
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin || undefined,
      isActive: user.isActive
    };
  }

  // Buscar estatísticas do usuário
  async getUserStats(userId: string): Promise<UserStatsDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        encryptionKeyHash: true
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Buscar senhas do usuário
    const passwords = await prisma.passwordEntry.findMany({
      where: { userId },
      include: { customFields: true }
    });

    // Descriptografar senhas para análise
    const decryptedPasswords = passwords.map(password => {
      try {
        return CryptoUtil.decrypt(password.encryptedPassword, user.encryptionKeyHash);
      } catch {
        return ''; // Senha corrompida ou chave inválida
      }
    }).filter(password => password);

    // Analisar força das senhas
    const weakPasswords = decryptedPasswords.filter(password => {
      const strength = PasswordUtil.evaluatePasswordStrength(password);
      return strength.score < 3;
    });

    // Encontrar senhas duplicadas
    const duplicatedPasswords = PasswordUtil.findDuplicatePasswords(decryptedPasswords);

    // Buscar pastas únicas
    const folders = await this.getUserFolders(userId);

    // Contar favoritos
    const favoritePasswords = passwords.filter(p => p.isFavorite).length;

    // Buscar última atividade
    const lastActivity = await prisma.auditLog.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    // Contar total de logins
    const totalLogins = await prisma.auditLog.count({
      where: {
        userId,
        action: 'LOGIN_SUCCESS'
      }
    });

    // Calcular idade da conta em dias
    const accountAge = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      totalPasswords: passwords.length,
      favoritePasswords,
      folders,
      weakPasswords: weakPasswords.length,
      duplicatedPasswords: duplicatedPasswords.length,
      lastActivity: lastActivity?.createdAt,
      accountAge,
      totalLogins
    };
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

  // Buscar logs de auditoria do usuário
  async getUserAuditLogs(
    userId: string, 
    options: { limit: number; offset: number }
  ): Promise<{ logs: AuditLogDto[]; total: number }> {
    const { logs, total } = await AuditUtil.getUserLogs(userId, options);

    return {
      logs: logs.map(log => ({
        id: log.id,
        action: log.action,
        resourceType: log.resourceType || undefined,
        resourceId: log.resourceId || undefined,
        ipAddress: log.ipAddress || undefined,
        userAgent: log.userAgent || undefined,
        details: log.details,
        createdAt: log.createdAt
      })),
      total
    };
  }

  // Exportar dados do usuário
  async exportUserData(userId: string, req?: Request): Promise<ExportDataDto> {
    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Buscar todas as senhas
    const passwords = await prisma.passwordEntry.findMany({
      where: { userId },
      include: { customFields: true },
      orderBy: { name: 'asc' }
    });

    // Descriptografar senhas
    const decryptedPasswords = passwords.map(password => ({
      name: password.name,
      website: password.website || undefined,
      username: password.username || undefined,
      password: CryptoUtil.decrypt(password.encryptedPassword, user.encryptionKeyHash),
      notes: password.notes || undefined,
      folder: password.folder || undefined,
      isFavorite: password.isFavorite,
      customFields: password.customFields.map(field => ({
        fieldName: field.fieldName,
        value: CryptoUtil.decrypt(field.encryptedValue, user.encryptionKeyHash),
        fieldType: field.fieldType
      }))
    }));

    // Log de auditoria
    await AuditUtil.log(
      userId, 
      'EXPORT_DATA', 
      'USER', 
      userId, 
      { passwordCount: passwords.length }, 
      req
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin || undefined,
        isActive: user.isActive
      },
      passwords: decryptedPasswords,
      exportedAt: new Date()
    };
  }

  // Deletar conta do usuário
  async deleteUserAccount(userId: string, req?: Request): Promise<void> {
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Log de auditoria antes de deletar
    await AuditUtil.log(
      userId, 
      'ACCOUNT_DELETED', 
      'USER', 
      userId, 
      { email: user.email }, 
      req
    );

    // Deletar usuário (cascata deletará senhas, sessões, etc.)
    await prisma.user.delete({
      where: { id: userId }
    });
  }

  // Atualizar último login
  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() }
    });
  }

  // Desativar conta do usuário
  async deactivateAccount(userId: string, req?: Request): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    });

    // Revogar todas as sessões
    await prisma.userSession.deleteMany({
      where: { userId }
    });

    await AuditUtil.log(
      userId, 
      'ACCOUNT_DELETED', 
      'USER', 
      userId, 
      { action: 'deactivated' }, 
      req
    );
  }

  // Reativar conta do usuário
  async reactivateAccount(userId: string, req?: Request): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: true }
    });

    await AuditUtil.log(
      userId, 
      'USER_REGISTERED', 
      'USER', 
      userId, 
      { action: 'reactivated' }, 
      req
    );
  }
}

