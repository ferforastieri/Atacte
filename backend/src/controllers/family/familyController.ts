import { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { FamilyService } from '../../services/family/familyService';

const router = Router();
const familyService = new FamilyService();

interface CreateFamilyRequest {
  name: string;
  description?: string;
}

interface UpdateFamilyRequest {
  name?: string;
  description?: string;
}

interface JoinFamilyRequest {
  inviteCode: string;
  nickname?: string;
}

interface UpdateMemberSettingsRequest {
  nickname?: string;
  shareLocation?: boolean;
  showOnMap?: boolean;
}

interface UpdateMemberRoleRequest {
  role: string;
}

// Validações
const createFamilyValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nome é obrigatório e deve ter até 100 caracteres'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter até 500 caracteres'),
];

const joinFamilyValidation = [
  body('inviteCode')
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('Código de convite inválido'),
  body('nickname')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Apelido deve ter até 50 caracteres'),
];

const updateMemberRoleValidation = [
  body('role')
    .isIn(['admin', 'member'])
    .withMessage('Função deve ser "admin" ou "member"'),
];

// Rotas
router.use(authenticateToken);

// Listar todas as famílias do usuário
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const families = await familyService.getUserFamilies(req.user.id);

    res.json({
      success: true,
      data: families,
    });
  } catch (error) {
    console.error('Erro ao buscar famílias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
    });
  }
});

// Buscar família específica
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const family = await familyService.getFamilyById(req.user.id, id);

    if (!family) {
      res.status(404).json({
        success: false,
        message: 'Família não encontrada',
      });
      return;
    }

    res.json({
      success: true,
      data: family,
    });
  } catch (error: any) {
    console.error('Erro ao buscar família:', error);
    res.status(error.message.includes('permissão') ? 403 : 500).json({
      success: false,
      message: error.message || 'Erro interno do servidor',
    });
  }
});

// Criar nova família
router.post(
  '/',
  createFamilyValidation,
  async (req: Request<{}, {}, CreateFamilyRequest>, res: Response) => {
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
      const family = await familyService.createFamily(
        authReq.user.id,
        req.body,
        authReq
      );

      res.status(201).json({
        success: true,
        message: 'Família criada com sucesso',
        data: family,
      });
    } catch (error) {
      console.error('Erro ao criar família:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
      });
    }
  }
);

// Atualizar família
router.put(
  '/:id',
  createFamilyValidation,
  async (req: AuthenticatedRequest, res: Response) => {
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

      const { id } = req.params;
      const updateData = req.body as UpdateFamilyRequest;

      const family = await familyService.updateFamily(
        req.user.id,
        id,
        updateData,
        req
      );

      if (!family) {
        res.status(404).json({
          success: false,
          message: 'Família não encontrada',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Família atualizada com sucesso',
        data: family,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar família:', error);
      res.status(error.message.includes('admin') ? 403 : 500).json({
        success: false,
        message: error.message || 'Erro interno do servidor',
      });
    }
  }
);

// Deletar família
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await familyService.deleteFamily(req.user.id, id, req);

    res.json({
      success: true,
      message: 'Família excluída com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao deletar família:', error);
    res.status(error.message.includes('admin') ? 403 : 500).json({
      success: false,
      message: error.message || 'Erro interno do servidor',
    });
  }
});

// Entrar em família via código de convite
router.post(
  '/join',
  joinFamilyValidation,
  async (req: Request<{}, {}, JoinFamilyRequest>, res: Response) => {
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
      const family = await familyService.joinFamily(
        authReq.user.id,
        req.body,
        authReq
      );

      res.status(201).json({
        success: true,
        message: 'Você entrou na família com sucesso',
        data: family,
      });
    } catch (error: any) {
      console.error('Erro ao entrar na família:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao entrar na família',
      });
    }
  }
);

// Sair da família
router.post('/:id/leave', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await familyService.leaveFamily(req.user.id, id, req);

    res.json({
      success: true,
      message: 'Você saiu da família',
    });
  } catch (error: any) {
    console.error('Erro ao sair da família:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erro ao sair da família',
    });
  }
});

// Remover membro
router.delete(
  '/:id/members/:userId',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, userId } = req.params;
      await familyService.removeMember(req.user.id, id, userId, req);

      res.json({
        success: true,
        message: 'Membro removido com sucesso',
      });
    } catch (error: any) {
      console.error('Erro ao remover membro:', error);
      res.status(error.message.includes('admin') ? 403 : 400).json({
        success: false,
        message: error.message || 'Erro ao remover membro',
      });
    }
  }
);

// Atualizar função de membro
router.patch(
  '/:id/members/:userId/role',
  updateMemberRoleValidation,
  async (req: AuthenticatedRequest, res: Response) => {
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

      const { id, userId } = req.params;
      const body = req.body as UpdateMemberRoleRequest;
      const { role } = body;

      const member = await familyService.updateMemberRole(
        req.user.id,
        id,
        userId,
        role,
        req
      );

      res.json({
        success: true,
        message: 'Função do membro atualizada',
        data: member,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar função:', error);
      res.status(error.message.includes('admin') ? 403 : 400).json({
        success: false,
        message: error.message || 'Erro ao atualizar função',
      });
    }
  }
);

// Atualizar configurações do membro (próprio usuário)
router.patch(
  '/:id/settings',
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const settingsData = req.body as UpdateMemberSettingsRequest;

      const member = await familyService.updateMemberSettings(
        req.user.id,
        id,
        settingsData,
        req
      );

      res.json({
        success: true,
        message: 'Configurações atualizadas',
        data: member,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar configurações:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar configurações',
      });
    }
  }
);

export default router;

