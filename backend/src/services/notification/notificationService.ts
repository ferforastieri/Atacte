import { Request } from 'express';
import { NotificationRepository } from '../../repositories/notification/notificationRepository';
import { FamilyRepository } from '../../repositories/family/familyRepository';
import { Notification } from '../../../node_modules/.prisma/client';

export interface NotificationDto {
  id: string;
  sender?: {
    id: string;
    name: string | null;
    email: string;
    profilePicture: string | null;
  };
  receiverId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  isSent: boolean;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export interface CreateNotificationData {
  senderId?: string;
  receiverId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendPushNotificationData {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
}

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private familyRepository: FamilyRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.familyRepository = new FamilyRepository();
  }

  async createNotification(data: CreateNotificationData): Promise<NotificationDto> {
    const notification = await this.notificationRepository.create(data);
    
    // Enviar push notification
    await this.sendPushNotification(notification);

    return this.mapNotificationToDto(notification as any);
  }

  async getNotifications(
    userId: string,
    isRead?: boolean,
    limit?: number,
    offset?: number
  ): Promise<NotificationDto[]> {
    const notifications = await this.notificationRepository.findByReceiverId(userId, {
      isRead,
      limit,
      offset,
    });

    return notifications.map((notification) =>
      this.mapNotificationToDto(notification as any)
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.countUnreadByReceiverId(userId);
  }

  async markAsRead(userId: string, notificationId: string): Promise<NotificationDto> {
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification || notification.receiverId !== userId) {
      throw new Error('Notificação não encontrada');
    }

    const updated = await this.notificationRepository.markAsRead(notificationId);

    return this.mapNotificationToDto(updated as any);
  }

  async markAllAsRead(userId: string): Promise<number> {
    return await this.notificationRepository.markAllAsReadByReceiverId(userId);
  }

  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const notification = await this.notificationRepository.findById(notificationId);
    
    if (!notification || notification.receiverId !== userId) {
      throw new Error('Notificação não encontrada');
    }

    await this.notificationRepository.delete(notificationId);
    
    return true;
  }

  // Notificações específicas do sistema

  async sendFamilyInviteNotification(
    inviterId: string,
    inviteeId: string,
    familyId: string,
    familyName: string
  ): Promise<void> {
    await this.createNotification({
      senderId: inviterId,
      receiverId: inviteeId,
      type: 'family_invite',
      title: 'Convite para Família',
      body: `Você foi convidado para se juntar à família "${familyName}"`,
      data: {
        familyId,
        familyName,
      },
    });
  }

  async sendMemberJoinedNotification(
    familyId: string,
    newMemberId: string,
    newMemberName: string
  ): Promise<void> {
    // Enviar notificação para todos os membros da família
    const family = await this.familyRepository.findById(familyId);
    
    if (!family) return;

    const notifications = family.members
      .filter((member) => member.userId !== newMemberId)
      .map((member) => ({
        senderId: newMemberId,
        receiverId: member.userId,
        type: 'member_joined',
        title: 'Novo Membro',
        body: `${newMemberName} entrou na família`,
        data: {
          familyId,
          newMemberId,
        },
      }));

    await this.notificationRepository.createBatch(notifications);
  }

  async sendLowBatteryAlert(userId: string, batteryLevel: number): Promise<void> {
    // Enviar alerta para todos os membros das famílias do usuário
    const families = await this.familyRepository.findByUserId(userId);
    
    const notifications: CreateNotificationData[] = [];

    for (const family of families) {
      for (const member of family.members) {
        if (member.userId !== userId) {
          notifications.push({
            senderId: userId,
            receiverId: member.userId,
            type: 'battery_low',
            title: 'Bateria Baixa',
            body: `A bateria de ${member.user.name || 'um membro'} está em ${Math.round(
              batteryLevel * 100
            )}%`,
            data: {
              userId,
              batteryLevel,
              familyId: family.id,
            },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await this.notificationRepository.createBatch(notifications);
    }
  }

  async sendSOSAlert(userId: string, latitude: number, longitude: number): Promise<void> {
    // Enviar SOS para todos os membros das famílias do usuário
    const families = await this.familyRepository.findByUserId(userId);
    
    const notifications: CreateNotificationData[] = [];

    for (const family of families) {
      for (const member of family.members) {
        if (member.userId !== userId) {
          notifications.push({
            senderId: userId,
            receiverId: member.userId,
            type: 'sos',
            title: '🆘 ALERTA DE EMERGÊNCIA',
            body: `${member.user.name || 'Um membro'} ativou um alerta de emergência!`,
            data: {
              userId,
              latitude,
              longitude,
              familyId: family.id,
            },
          });
        }
      }
    }

    if (notifications.length > 0) {
      await this.notificationRepository.createBatch(notifications);
    }
  }

  // Notificar família sobre geofencing
  async sendGeofenceToFamily(
    userId: string, 
    zoneName: string, 
    eventType: 'enter' | 'exit',
    zoneId: string
  ): Promise<void> {
    // Buscar todas as famílias do usuário
    const families = await this.familyRepository.findByUserId(userId);
    
    const notifications: CreateNotificationData[] = [];

    for (const family of families) {
      // Buscar todos os membros da família (exceto o próprio usuário)
      const members = family.members.filter(member => member.userId !== userId);
      
      for (const member of members) {
        const memberName = member.nickname || member.user.name || 'Membro da família';
        const title = eventType === 'enter' 
          ? `📍 ${memberName} chegou em ${zoneName}` 
          : `🚶 ${memberName} saiu de ${zoneName}`;
        
        const body = eventType === 'enter'
          ? `${memberName} entrou na zona ${zoneName}`
          : `${memberName} saiu da zona ${zoneName}`;

        notifications.push({
          senderId: userId,
          receiverId: member.userId,
          type: 'family_geofence',
          title,
          body,
          data: {
            zoneId,
            zoneName,
            eventType,
            memberName,
            familyId: family.id,
            familyName: family.name,
          },
        });
      }
    }

    if (notifications.length > 0) {
      await this.notificationRepository.createBatch(notifications);
    }
  }

  async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    return await this.notificationRepository.deleteOldNotifications(daysToKeep);
  }

  // Enviar push notification via Expo Push Notifications
  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      // Buscar o push token do receptor
      const receiver = await this.notificationRepository.findById(notification.id);
      
      if (!receiver) return;

      const pushToken = (receiver as any).receiver?.pushToken;
      
      if (!pushToken || !pushToken.startsWith('ExponentPushToken')) {
        console.log('Push token inválido ou não encontrado');
        return;
      }

      // Enviar via Expo Push Notifications
      const message = {
        to: pushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data,
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        await this.notificationRepository.markAsSent(notification.id);
      } else {
        console.error('Erro ao enviar push notification:', await response.text());
      }
    } catch (error) {
      console.error('Erro ao enviar push notification:', error);
    }
  }

  private mapNotificationToDto(
    notification: Notification & {
      sender?: {
        id: string;
        name: string | null;
        email: string;
        profilePicture: string | null;
      };
    }
  ): NotificationDto {
    return {
      id: notification.id,
      sender: notification.sender,
      receiverId: notification.receiverId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data as Record<string, unknown> | undefined,
      isRead: notification.isRead,
      isSent: notification.isSent,
      sentAt: notification.sentAt || undefined,
      readAt: notification.readAt || undefined,
      createdAt: notification.createdAt,
    };
  }
}

