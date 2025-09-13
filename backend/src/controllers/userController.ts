import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { UserService } from '../services/userService';

const router = Router();
const userService = new UserService();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// GET /api/users/profile - Buscar perfil do usuário
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

// GET /api/users/stats - Estatísticas do usuário
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

// GET /api/users/folders - Listar pastas do usuário
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

// GET /api/users/audit-logs - Logs de auditoria do usuário
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

// POST /api/users/export - Exportar dados do usuário
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

// DELETE /api/users/account - Deletar conta do usuário
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

export default router;

