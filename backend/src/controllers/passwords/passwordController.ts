import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { PasswordService } from '../../services/passwords/passwordService';

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
  totpEnabled?: string;
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
    .withMessage('Secret TOTP deve ser uma string')
    .custom((value) => {
      if (value) {
        // Validar se é uma chave TOTP válida (base32)
        const cleanValue = value.replace(/\s/g, '').toUpperCase();
        const base32Regex = /^[A-Z2-7]+=*$/;
        
        // Verificar se tem pelo menos 16 caracteres (chave TOTP mínima)
        if (cleanValue.length < 16) {
          throw new Error('Chave TOTP muito curta. Deve ter pelo menos 16 caracteres.');
        }
        
        // Verificar se contém apenas caracteres base32 válidos
        if (!base32Regex.test(cleanValue)) {
          throw new Error('Chave TOTP inválida. Deve conter apenas letras A-Z e números 2-7 (ex: ABCD EFGH IJKL MNOP)');
        }
        
        // Tentar gerar um código para validar se a chave funciona
        try {
          const speakeasy = require('speakeasy');
          const cleanSecret = value.replace(/\s/g, '').toUpperCase();
          console.log('🔍 Validando chave TOTP:', cleanSecret);
          const testCode = speakeasy.totp({
            secret: cleanSecret,
            encoding: 'base32',
            step: 30
          });
          console.log('🔍 Código de teste gerado:', testCode);
        } catch (error) {
          console.log('🔍 Erro ao validar chave TOTP:', error);
          throw new Error('Chave TOTP inválida. Verifique se a chave está correta.');
        }
      }
      return true;
    }),
  body('totpEnabled')
    .optional()
    .isBoolean()
    .withMessage('TOTP enabled deve ser booleano'),
];

const searchValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Limit deve ser um número inteiro positivo'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset deve ser >= 0'),
  query('totpEnabled')
    .optional()
    .isBoolean()
    .withMessage('totpEnabled deve ser boolean'),
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
      totpEnabled: req.query.totpEnabled ? req.query.totpEnabled === 'true' : undefined,
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

    const authReq = req as any;
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


export default router;
