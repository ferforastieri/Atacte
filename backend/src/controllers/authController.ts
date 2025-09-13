import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, authLimiter, AuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/authService';

const router = Router();
const authService = new AuthService();

// Tipos para as requisições
interface RegisterRequest {
  email: string;
  masterPassword: string;
}

interface LoginRequest {
  email: string;
  masterPassword: string;
  deviceName?: string;
}

// Validações
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('masterPassword')
    .isLength({ min: 8 })
    .withMessage('Senha master deve ter pelo menos 8 caracteres'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('masterPassword')
    .notEmpty()
    .withMessage('Senha master é obrigatória'),
];

// POST /api/auth/register
router.post('/register', authLimiter, registerValidation, async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
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

    const { email, masterPassword } = req.body;
    const result = await authService.register(email, masterPassword, req);

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Erro no registro:', error);
    
    if (error.message === 'Email já está em uso') {
      res.status(409).json({
        success: false,
        message: error.message
      });
      return;
    }
    
    if (error.message.includes('Senha muito fraca')) {
      res.status(400).json({
        success: false,
        message: error.message,
        suggestions: error.suggestions
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, loginValidation, async (req: Request<{}, {}, LoginRequest>, res: Response) => {
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

    const { email, masterPassword, deviceName } = req.body;
    const result = await authService.login(email, masterPassword, deviceName, req);

    res.json(result);
  } catch (error: any) {
    console.error('Erro no login:', error);
    
    if (error.message === 'Credenciais inválidas') {
      res.status(401).json({
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

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await authService.logout(req.user.id, req.sessionId, req);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/auth/verify - Verificar se token é válido
router.get('/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userInfo = await authService.getUserInfo(req.user.id);
    
    res.json({
      success: true,
      data: { user: userInfo }
    });
  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/auth/sessions - Listar sessões ativas
router.get('/sessions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await authService.getUserSessions(req.user.id);
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/auth/sessions/:sessionId - Revogar sessão específica
router.delete('/sessions/:sessionId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    await authService.revokeSession(req.user.id, sessionId, req);
    
    res.json({
      success: true,
      message: 'Sessão revogada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao revogar sessão:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;

