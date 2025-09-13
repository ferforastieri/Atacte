import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import rateLimit from 'express-rate-limit';
import { prisma, User } from '../infrastructure/prisma';

// Estender o tipo Request para incluir dados do usuário
export interface AuthenticatedRequest extends Request {
  user: User;
  sessionId: string;
}

// Rate limiting para autenticação
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas por IP
  message: { 
    success: false, 
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de autenticação JWT
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Token de acesso necessário' 
      });
      return;
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string; 
      email: string; 
    };
    
    // Verificar se a sessão ainda existe e é válida
    const tokenHash = crypto.SHA256(token).toString();
    
    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.userId,
        tokenHash: tokenHash,
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (!session || !session.user.isActive) {
      res.status(401).json({ 
        success: false, 
        message: 'Sessão inválida ou expirada' 
      });
      return;
    }

    // Atualizar último uso da sessão
    try {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastUsed: new Date() }
      });
    } catch (updateError) {
      console.error('Erro ao atualizar sessão:', updateError);
      // Continuar mesmo com erro na atualização
    }

    // Adicionar dados do usuário ao request
    (req as AuthenticatedRequest).user = session.user;
    (req as AuthenticatedRequest).sessionId = session.id;
    
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(403).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

// Middleware opcional - não falha se não tiver token
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string; 
      email: string; 
    };
    
    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.userId,
        tokenHash: crypto.SHA256(token).toString(),
        expiresAt: { gt: new Date() }
      },
      include: { user: true }
    });

    if (session && session.user.isActive) {
      (req as AuthenticatedRequest).user = session.user;
      (req as AuthenticatedRequest).sessionId = session.id;
    }
    
    next();
  } catch (error) {
    // Em caso de erro, apenas continua sem autenticar
    next();
  }
};
