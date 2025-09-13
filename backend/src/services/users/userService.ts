import { Request } from 'express';
import { AuditUtil } from '../../utils/auditUtil';
import { CryptoUtil } from '../../utils/cryptoUtil';
import { PasswordUtil } from '../../utils/passwordUtil';
import { UserRepository } from '../../repositories/users/userRepository';

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
    createdAt: Date;
    updatedAt: Date;
    lastUsed?: Date;
    totpEnabled: boolean;
  }>;
  exportedAt: Date;
}

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // Buscar perfil do usuário
  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findById(userId);

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
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Buscar estatísticas usando repository
    const stats = await this.userRepository.getUserStats(userId);

    return {
      totalPasswords: stats.totalPasswords,
      favoritePasswords: stats.favoritePasswords,
      folders: stats.folders,
      weakPasswords: stats.weakPasswords,
      duplicatedPasswords: stats.duplicatedPasswords,
      lastActivity: stats.lastActivity,
      accountAge: stats.accountAge,
      totalLogins: stats.totalLogins
    };
  }

  // Buscar pastas do usuário
  async getUserFolders(userId: string): Promise<string[]> {
    return await this.userRepository.getUserFolders(userId);
  }

  // Buscar logs de auditoria do usuário
  async getUserAuditLogs(
    userId: string, 
    options: { limit: number; offset: number }
  ): Promise<{ logs: AuditLogDto[]; total: number }> {
    const { limit, offset } = options;

    const result = await this.userRepository.getUserAuditLogs(userId, limit, offset);

    const auditLogs: AuditLogDto[] = result.logs.map(log => ({
      id: log.id,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      details: log.details,
      createdAt: log.createdAt
    }));

    return { logs: auditLogs, total: result.total };
  }

  // Exportar dados do usuário
  async exportUserData(userId: string, req?: Request): Promise<ExportDataDto> {
    // Buscar dados do usuário
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Buscar dados usando repository
    const exportData = await this.userRepository.exportUserData(userId);

    // Log de auditoria
    await AuditUtil.log(
      userId, 
      'EXPORT_DATA', 
      'USER', 
      userId, 
      { passwordCount: exportData.passwords.length }, 
      req
    );

    return {
      user: exportData.user,
      passwords: exportData.passwords,
      exportedAt: new Date()
    };
  }

  // Deletar conta do usuário
  async deleteUserAccount(userId: string, req?: Request): Promise<void> {
    // Verificar se usuário existe
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Deletar em cascata (senhas, logs, etc.)
    await this.userRepository.delete(userId);

    // Log de auditoria antes de deletar
    await AuditUtil.log(
      userId, 
      'ACCOUNT_DELETED', 
      'USER', 
      userId, 
      { email: user.email }, 
      req
    );
  }

  // Atualizar último login
  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.updateLastLogin(userId);
  }

  // Desativar conta do usuário
  async deactivateAccount(userId: string, req?: Request): Promise<void> {
    await this.userRepository.update(userId, { isActive: false });

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
    await this.userRepository.update(userId, { isActive: true });

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
