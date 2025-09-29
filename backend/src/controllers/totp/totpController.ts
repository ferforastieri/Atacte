import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { TOTPService } from '../../services/totp/totpService';

const router = Router();
const totpService = new TOTPService();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// POST /api/totp/generate - Gerar novo secret TOTP
router.post('/generate', [
  body('serviceName')
    .notEmpty()
    .withMessage('Nome do serviço é obrigatório'),
  body('accountName')
    .notEmpty()
    .withMessage('Nome da conta é obrigatório')
], async (req: AuthenticatedRequest, res: Response) => {
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

    const { serviceName, accountName } = req.body;
    const totpData = TOTPService.generateSecret(serviceName, accountName);

    res.json({
      success: true,
      data: {
        secret: totpData.secret,
        manualEntryKey: totpData.manualEntryKey,
        qrCodeUrl: totpData.qrCodeUrl
      }
    });
  } catch (error) {
    console.error('Erro ao gerar secret TOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/totp/qrcode - Gerar QR Code para um otpauth URL
router.post('/qrcode', [
  body('otpauthUrl')
    .notEmpty()
    .withMessage('URL otpauth é obrigatória')
    .matches(/^otpauth:\/\/totp\//)
    .withMessage('URL otpauth inválida')
], async (req: AuthenticatedRequest, res: Response) => {
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

    const { otpauthUrl } = req.body;
    const qrCodeDataUrl = await TOTPService.generateQRCode(otpauthUrl);

    res.json({
      success: true,
      data: {
        qrCode: qrCodeDataUrl
      }
    });
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/totp/validate - Validar um código TOTP
router.post('/validate', [
  body('secret')
    .notEmpty()
    .withMessage('Secret TOTP é obrigatório'),
  body('code')
    .notEmpty()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Código deve ter 6 dígitos numéricos')
], async (req: AuthenticatedRequest, res: Response) => {
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

    const { secret, code } = req.body;
    
    // Verificar se o secret é válido
    if (!TOTPService.isValidSecret(secret)) {
      res.status(400).json({
        success: false,
        message: 'Secret TOTP inválido'
      });
      return;
    }

    const validation = TOTPService.validateCode(secret, code);

    res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        delta: validation.delta
      }
    });
  } catch (error) {
    console.error('Erro ao validar código TOTP:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/totp/parse - Extrair informações de uma URL otpauth
router.post('/parse', [
  body('otpauthUrl')
    .notEmpty()
    .withMessage('URL otpauth é obrigatória')
], async (req: AuthenticatedRequest, res: Response) => {
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

    const { otpauthUrl } = req.body;
    const parsed = TOTPService.parseOtpAuthUrl(otpauthUrl);

    if (!parsed) {
      res.status(400).json({
        success: false,
        message: 'URL otpauth inválida'
      });
      return;
    }

    res.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    console.error('Erro ao analisar URL otpauth:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/totp/test - Gerar múltiplos códigos para teste (desenvolvimento)
router.post('/test', [
  body('secret')
    .notEmpty()
    .withMessage('Secret TOTP é obrigatório')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Só permitir em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({
        success: false,
        message: 'Endpoint não disponível em produção'
      });
      return;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
      return;
    }

    const { secret } = req.body;
    
    if (!TOTPService.isValidSecret(secret)) {
      res.status(400).json({
        success: false,
        message: 'Secret TOTP inválido'
      });
      return;
    }

    const codes = TOTPService.generateMultipleCodes(secret);

    res.json({
      success: true,
      data: {
        previous: TOTPService.formatCode(codes.previous),
        current: TOTPService.formatCode(codes.current),
        next: TOTPService.formatCode(codes.next),
        timeRemaining: codes.timeRemaining
      }
    });
  } catch (error) {
    console.error('Erro ao gerar códigos de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/totp/passwords/:id - Buscar código TOTP atual de uma senha
router.get('/passwords/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const totpCode = await totpService.getTotpCodeForEntry(req.user.id, id, req);

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
  } catch (error: any) {
    console.error('Erro ao buscar código TOTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// GET /api/totp/passwords/:id/secret - Buscar apenas o secret TOTP (para geração client-side)
router.get('/passwords/:id/secret', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const totpSecret = await totpService.getTotpSecretForEntry(req.user.id, id, req);

    if (!totpSecret) {
      res.status(404).json({
        success: false,
        message: 'Secret TOTP não encontrado ou não habilitado para esta entrada'
      });
      return;
    }

    res.json({
      success: true,
      data: totpSecret
    });
  } catch (error: any) {
    console.error('Erro ao buscar secret TOTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// POST /api/totp/passwords/:id - Adicionar TOTP a uma senha
router.post('/passwords/:id', [
  body('totpInput')
    .notEmpty()
    .withMessage('Chave TOTP ou URL otpauth é obrigatória')
], async (req: any, res: Response) => {
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
    const { totpInput } = req.body;

    const result = await totpService.addTotpToEntry(
      authReq.user.id, 
      id, 
      totpInput, 
      authReq
    );

    res.json({
      success: true,
      message: 'TOTP adicionado com sucesso',
      data: result
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
      message: error.message || 'Erro interno do servidor'
    });
  }
});

// DELETE /api/totp/passwords/:id - Remover TOTP de uma senha
router.delete('/passwords/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await totpService.removeTotpFromEntry(req.user.id, id, req);

    res.json({
      success: true,
      message: 'TOTP removido com sucesso',
      data: result
    });
  } catch (error: any) {
    console.error('Erro ao remover TOTP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro interno do servidor'
    });
  }
});

export default router;
