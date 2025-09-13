import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { PasswordService } from '../services/passwordService';

const router = Router();
const passwordService = new PasswordService();

// Tipos para as requisições
interface CreatePasswordRequest {
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
  totpSecret?: string;
  totpEnabled?: boolean;
}

interface UpdatePasswordRequest extends Partial<CreatePasswordRequest> {}

interface SearchQuery {
  query?: string;
  folder?: string;
  isFavorite?: string;
  limit?: string;
  offset?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastUsed';
  sortOrder?: 'asc' | 'desc';
}

// Validações
const createPasswordValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Nome é obrigatório e deve ter até 255 caracteres'),
  body('website')
    .optional()
    .isURL()
    .withMessage('URL inválida'),
  body('username')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Username deve ter até 255 caracteres'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notas devem ter até 1000 caracteres'),
  body('folder')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Pasta deve ter até 255 caracteres'),
  body('totpSecret')
    .optional()
    .isString()
    .withMessage('Secret TOTP deve ser uma string'),
  body('totpEnabled')
    .optional()
    .isBoolean()
    .withMessage('TOTP enabled deve ser booleano'),
];

const searchValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit deve ser entre 1 e 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser >= 0'),
];

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// GET /api/passwords - Listar senhas com filtros
router.get('/', searchValidation, async (req: Request<{}, {}, {}, SearchQuery>, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Parâmetros inválidos',
        errors: errors.array()
      });
      return;
    }

    const authReq = req as AuthenticatedRequest;
    const filters = {
      query: req.query.query,
      folder: req.query.folder,
      isFavorite: req.query.isFavorite === 'true',
      limit: parseInt(req.query.limit || '50'),
      offset: parseInt(req.query.offset || '0'),
      sortBy: req.query.sortBy || 'name',
      sortOrder: req.query.sortOrder || 'asc'
    };

    const result = await passwordService.searchPasswords(authReq.user.id, filters, authReq);

    res.json({
      success: true,
      data: result.passwords,
      pagination: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset
      }
    });
  } catch (error) {
    console.error('Erro ao buscar senhas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/passwords/:id - Buscar senha específica
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const password = await passwordService.getPasswordById(req.user.id, id, req);

    if (!password) {
      res.status(404).json({
        success: false,
        message: 'Senha não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      data: password
    });
  } catch (error) {
    console.error('Erro ao buscar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/passwords - Criar nova senha
router.post('/', createPasswordValidation, async (req: Request<{}, {}, CreatePasswordRequest>, res: Response) => {
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
    const passwordData = req.body;
    
    const newPassword = await passwordService.createPassword(authReq.user.id, passwordData, authReq);

    res.status(201).json({
      success: true,
      message: 'Senha criada com sucesso',
      data: newPassword
    });
  } catch (error) {
    console.error('Erro ao criar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/passwords/:id - Atualizar senha
router.put('/:id', createPasswordValidation, async (req: Request<{id: string}, {}, UpdatePasswordRequest>, res: Response) => {
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
    const { id } = req.params;
    const updateData = req.body;

    const updatedPassword = await passwordService.updatePassword(authReq.user.id, id, updateData, authReq);

    if (!updatedPassword) {
      res.status(404).json({
        success: false,
        message: 'Senha não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso',
      data: updatedPassword
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/passwords/:id - Deletar senha
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await passwordService.deletePassword(req.user.id, id, req);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: 'Senha não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Senha deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/passwords/generate - Gerar senha segura
router.get('/generate', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const options = {
      length: parseInt(req.query.length as string) || 16,
      includeUppercase: req.query.includeUppercase !== 'false',
      includeLowercase: req.query.includeLowercase !== 'false',
      includeNumbers: req.query.includeNumbers !== 'false',
      includeSymbols: req.query.includeSymbols !== 'false',
    };

    const generatedPassword = await passwordService.generateSecurePassword(options);

    res.json({
      success: true,
      data: {
        password: generatedPassword.password,
        strength: generatedPassword.strength
      }
    });
  } catch (error) {
    console.error('Erro ao gerar senha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// === ROTAS TOTP ===

// GET /api/passwords/:id/totp - Buscar código TOTP atual
router.get('/:id/totp', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const totpCode = await passwordService.getTotpCode(req.user.id, id, req);

    if (!totpCode) {
      res.status(404).json({
        success: false,
        message: 'TOTP não encontrado ou não habilitado para esta entrada'
      });
      return;
    }

    res.json({
      success: true,
      data: totpCode
    });
  } catch (error) {
    console.error('Erro ao buscar código TOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/passwords/:id/totp - Adicionar TOTP a entrada existente
router.post('/:id/totp', [
  body('totpSecret')
    .notEmpty()
    .withMessage('Secret TOTP é obrigatório')
], async (req: Request<{id: string}, {}, {totpSecret: string}>, res: Response) => {
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
    const { id } = req.params;
    const { totpSecret } = req.body;

    const updatedPassword = await passwordService.addTotpToEntry(
      authReq.user.id, 
      id, 
      totpSecret, 
      authReq
    );

    if (!updatedPassword) {
      res.status(404).json({
        success: false,
        message: 'Senha não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'TOTP adicionado com sucesso',
      data: updatedPassword
    });
  } catch (error: any) {
    console.error('Erro ao adicionar TOTP:', error);
    
    if (error.message === 'Secret TOTP inválido') {
      res.status(400).json({
        success: false,
        message: error.message
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/passwords/:id/totp - Remover TOTP da entrada
router.delete('/:id/totp', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updatedPassword = await passwordService.removeTotpFromEntry(req.user.id, id, req);

    if (!updatedPassword) {
      res.status(404).json({
        success: false,
        message: 'Senha não encontrada'
      });
      return;
    }

    res.json({
      success: true,
      message: 'TOTP removido com sucesso',
      data: updatedPassword
    });
  } catch (error) {
    console.error('Erro ao remover TOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;
