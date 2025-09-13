import { Request } from 'express';
import { prisma } from '../infrastructure/prisma';

export type AuditAction = 
  | 'USER_REGISTERED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CREATED'
  | 'PASSWORD_UPDATED'
  | 'PASSWORD_DELETED'
  | 'PASSWORD_VIEWED'
  | 'PASSWORD_COPIED'
  | 'BULK_DELETE'
  | 'EXPORT_DATA'
  | 'IMPORT_DATA'
  | 'SESSION_REVOKED'
  | 'ACCOUNT_DELETED';

export type ResourceType = 
  | 'USER'
  | 'PASSWORD_ENTRY'
  | 'SESSION'
  | 'SYSTEM';

export class AuditUtil {
  // Criar log de auditoria
  static async log(
    userId: string | null,
    action: AuditAction,
    resourceType: ResourceType | null = null,
    resourceId: string | null = null,
    details: any = null,
    req?: Request
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          resourceType,
          resourceId,
          ipAddress: req?.ip || null,
          userAgent: req?.get('User-Agent') || null,
          details: details || {}
        }
      });
    } catch (error) {
      console.error('Erro ao criar log de auditoria:', error);
    }
  }

  // Buscar logs de auditoria de um usuário
  static async getUserLogs(
    userId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0 } = options;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          ipAddress: true,
          userAgent: true,
          details: true,
          createdAt: true
        }
      }),
      prisma.auditLog.count({
        where: { userId }
      })
    ]);

    return { logs, total };
  }

  // Buscar logs de auditoria por recurso
  static async getResourceLogs(
    resourceType: ResourceType,
    resourceId: string,
    options: { limit?: number; offset?: number } = {}
  ) {
    const { limit = 50, offset = 0 } = options;

    return prisma.auditLog.findMany({
      where: {
        resourceType,
        resourceId
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
  }
}

