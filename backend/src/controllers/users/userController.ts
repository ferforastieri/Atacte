import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { UserService } from '../../services/users/userService';

const router = Router();
const userService = new UserService();

interface UpdateProfileRequest {
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
}

interface UpdatePushTokenRequest {
  pushToken: string;
}


router.use(authenticateToken);


router.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userProfile = await userService.getUserProfile(req.user.id);

    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});


router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await userService.getUserStats(req.user.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});


router.get('/folders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const folders = await userService.getUserFolders(req.user.id);

    res.json({
      success: true,
      data: folders
    });
  } catch (error) {
    console.error('Erro ao buscar pastas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});


router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const auditLogs = await userService.getUserAuditLogs(req.user.id, { limit, offset });

    res.json({
      success: true,
      data: auditLogs.logs,
      pagination: {
        total: auditLogs.total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});


router.post('/export', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const exportData = await userService.exportUserData(req.user.id, req);

    res.json({
      success: true,
      message: 'Dados exportados com sucesso',
      data: exportData
    });
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});


router.delete('/account', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await userService.deleteUserAccount(req.user.id, req);

    res.json({
      success: true,
      message: 'Conta deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar perfil
router.patch(
  '/profile',
  [
    body('name').optional().trim().isLength({ max: 255 }).withMessage('Nome deve ter até 255 caracteres'),
    body('phoneNumber').optional().trim().isMobilePhone('any').withMessage('Número de telefone inválido'),
    body('profilePicture').optional().isURL().withMessage('URL da foto inválida'),
  ],
  async (req: Request<{}, {}, UpdateProfileRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      const updatedProfile = await userService.updateUserProfile(authReq.user.id, req.body, authReq);

      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: updatedProfile
      });
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
);

// Atualizar push token
router.patch(
  '/push-token',
  [
    body('pushToken').notEmpty().withMessage('Push token é obrigatório'),
  ],
  async (req: Request<{}, {}, UpdatePushTokenRequest>, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: errors.array()
        });
        return;
      }

      const authReq = req as AuthenticatedRequest;
      await userService.updatePushToken(authReq.user.id, req.body.pushToken);

      res.json({
        success: true,
        message: 'Push token atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar push token:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
);

export default router;
