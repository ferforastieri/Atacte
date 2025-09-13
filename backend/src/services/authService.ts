import { Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, User } from '../infrastructure/prisma';
import { CryptoUtil } from '../utils/cryptoUtil';
import { AuditUtil } from '../utils/auditUtil';
import { PasswordUtil } from '../utils/passwordUtil';

export interface UserDto {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface SessionDto {
  id: string;
  deviceName?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastUsed: Date;
  expiresAt: Date;
  isCurrent?: boolean;
}

export interface LoginResult {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: UserDto;
  };
}

export interface RegisterResult {
  success: boolean;
  message: string;
  data: UserDto;
}

export class AuthService {
  // Registrar novo usuário
  async register(email: string, masterPassword: string, req?: Request): Promise<RegisterResult> {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // Verificar força da senha
    const passwordValidation = PasswordUtil.validatePasswordStrength(masterPassword, 3);
    if (!passwordValidation.isValid) {
      const error = new Error('Senha muito fraca. Use uma senha mais forte.');
      (error as any).suggestions = passwordValidation.strength.feedback.suggestions;
      throw error;
    }

    // Gerar salt e hash da senha master
    const salt = CryptoUtil.generateSalt();
    const hashedPassword = await bcrypt.hash(masterPassword + salt, 12);
    
    // Gerar chave de criptografia
    const encryptionKey = CryptoUtil.generateKey();

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        masterPasswordHash: hashedPassword,
        masterPasswordSalt: salt,
        encryptionKeyHash: encryptionKey
      }
    });

    // Log de auditoria
    await AuditUtil.log(user.id, 'USER_REGISTERED', 'USER', user.id, null, req);

    return {
      success: true,
      message: 'Usuário registrado com sucesso',
      data: this.mapUserToDto(user)
    };
  }

  // Login do usuário
  async login(
    email: string, 
    masterPassword: string, 
    deviceName?: string, 
    req?: Request
  ): Promise<LoginResult> {
    // Buscar usuário
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(
      masterPassword + user.masterPasswordSalt, 
      user.masterPasswordHash
    );

    if (!isValidPassword) {
      await AuditUtil.log(user.id, 'LOGIN_FAILED', 'USER', user.id, null, req);
      throw new Error('Credenciais inválidas');
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Criar sessão
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: CryptoUtil.hash(token),
        deviceName: deviceName || 'Dispositivo desconhecido',
        ipAddress: req?.ip,
        userAgent: req?.get('User-Agent'),
        expiresAt
      }
    });

    // Atualizar último login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    await AuditUtil.log(user.id, 'LOGIN_SUCCESS', 'USER', user.id, null, req);

    return {
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        token,
        user: this.mapUserToDto(updatedUser)
      }
    };
  }

  // Logout do usuário
  async logout(userId: string, sessionId: string, req?: Request): Promise<void> {
    await prisma.userSession.delete({
      where: { id: sessionId }
    });

    await AuditUtil.log(userId, 'LOGOUT', 'USER', userId, null, req);
  }

  // Buscar informações do usuário
  async getUserInfo(userId: string): Promise<UserDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return this.mapUserToDto(user);
  }

  // Buscar sessões ativas do usuário
  async getUserSessions(userId: string): Promise<SessionDto[]> {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastUsed: 'desc' }
    });

    return sessions.map(session => ({
      id: session.id,
      deviceName: session.deviceName || undefined,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      createdAt: session.createdAt,
      lastUsed: session.lastUsed,
      expiresAt: session.expiresAt
    }));
  }

  // Revogar sessão específica
  async revokeSession(userId: string, sessionId: string, req?: Request): Promise<void> {
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });

    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    await prisma.userSession.delete({
      where: { id: sessionId }
    });

    await AuditUtil.log(
      userId, 
      'SESSION_REVOKED', 
      'SESSION', 
      sessionId, 
      { deviceName: session.deviceName }, 
      req
    );
  }

  // Revogar todas as sessões do usuário (exceto a atual)
  async revokeAllSessions(userId: string, currentSessionId: string, req?: Request): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId }
      }
    });

    await AuditUtil.log(
      userId, 
      'BULK_DELETE', 
      'SESSION', 
      null, 
      { sessionsRevoked: result.count }, 
      req
    );

    return result.count;
  }

  // Limpar sessões expiradas
  async cleanExpiredSessions(): Promise<number> {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });

    return result.count;
  }

  // Mapear User para UserDto
  private mapUserToDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin || undefined
    };
  }
}

