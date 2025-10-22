import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { NotificationService } from '../../services/notification/notificationService';

const router = Router();
const notificationService = new NotificationService();

interface CreateNotificationRequest {
  receiverId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

interface SOSRequest {
  latitude: number;
  longitude: number;
}

interface GeofenceRequest {
  zoneName: string;
  eventType: 'enter' | 'exit';
  zoneId: string;
}

interface NotificationQuery {
  isRead?: string;
  limit?: string;
  offset?: string;
}

// Validações
const createNotificationValidation = [
  body('receiverId')
    .notEmpty()
    .withMessage('ID do receptor é obrigatório'),
  body('type')
    .notEmpty()
    .withMessage('Tipo de notificação é obrigatório'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Título é obrigatório e deve ter até 200 caracteres'),
  body('body')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Corpo é obrigatório e deve ter até 500 caracteres'),
];

const sosValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude inválida'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude inválida'),
];

const geofenceValidation = [
  body('zoneName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome da zona é obrigatório e deve ter até 100 caracteres'),
  body('eventType')
    .isIn(['enter', 'exit'])
    .withMessage('Tipo de evento deve ser "enter" ou "exit"'),
  body('zoneId')
    .notEmpty()
    .withMessage('ID da zona é obrigatório'),
];

// Rotas
router.use(authenticateToken);

// Listar notificações do usuário
router.get(
  '/',
  async (req: Request<{}, {}, {}, NotificationQuery>, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const isRead = req.query.isRead ? req.query.isRead === 'true' : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset) : 0;

      const notifications = await notificationService.getNotifications(
        authReq.user.id,
        isRead,
        limit,
        offset
      );

      res.json({
        success: true,
        data: notifications,
        count: notifications.length,
      });
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
);

// Obter contagem de não lidas
router.get('/unread-count', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error('Erro ao buscar contagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Criar notificação (admin)
router.post(
  '/',
  createNotificationValidation,
  async (req: Request<{}, {}, CreateNotificationRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const notification = await notificationService.createNotification({
        senderId: authReq.user.id,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Notificação criada',
        data: notification,
      });
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
);

// Marcar como lida
router.patch('/:id/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const notification = await notificationService.markAsRead(req.user.id, id);

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
      data: notification,
    });
  } catch (error: any) {
    console.error('Erro ao marcar notificação:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao marcar notificação',
    });
  }
});

// Marcar todas como lidas
router.patch('/read-all', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `${count} notificações marcadas como lidas`,
      data: { count },
    });
  } catch (error) {
    console.error('Erro ao marcar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Deletar notificação
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await notificationService.deleteNotification(req.user.id, id);

    res.json({
      success: true,
      message: 'Notificação deletada',
    });
  } catch (error: any) {
    console.error('Erro ao deletar notificação:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao deletar notificação',
    });
  }
});

// Enviar SOS
router.post(
  '/sos',
  sosValidation,
  async (req: Request<{}, {}, SOSRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const { latitude, longitude } = req.body;

      await notificationService.sendSOSAlert(
        authReq.user.id,
        latitude,
        longitude
      );

      res.json({
        success: true,
        message: 'Alerta SOS enviado para sua família',
      });
    } catch (error) {
      console.error('Erro ao enviar SOS:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao enviar SOS',
      });
    }
  }
);

// Notificar família sobre geofencing
router.post(
  '/geofence',
  geofenceValidation,
  async (req: Request<{}, {}, GeofenceRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array(),
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const { zoneName, eventType, zoneId } = req.body;

      await notificationService.sendGeofenceToFamily(
        authReq.user.id,
        zoneName,
        eventType,
        zoneId
      );

      res.json({
        success: true,
        message: 'Família notificada sobre o movimento na zona',
      });
    } catch (error) {
      console.error('Erro ao notificar família sobre geofencing:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao notificar família',
      });
    }
  }
);

export default router;

