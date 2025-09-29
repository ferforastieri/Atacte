import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto-js';
import rateLimit from 'express-rate-limit';
import { prisma, User } from '../infrastructure/prisma';


export interface AuthenticatedRequest extends Request {
  user: User;
  sessionId: string;
}


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { 
    success: false, 
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});


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

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
      userId: string; 
      email: string; 
    };
    
    
    const tokenHash = crypto.SHA256(token).toString();
    
    const session = await prisma.userSession.findFirst({
      where: {
        userId: decoded.userId,
        tokenHash: tokenHash,
        expiresAt: { gt: new Date() }
      },
      include: { 
        user: {
          include: {
            preferences: true
          }
        }
      }
    });

    if (!session || !session.user.isActive) {
      res.status(401).json({ 
        success: false, 
        message: 'Sessão inválida ou expirada' 
      });
      return;
    }

    
    if (session.user.preferences?.autoLock && session.user.preferences.autoLock > 0) {
      const lastUsed = new Date(session.lastUsed);
      const now = new Date();
      const minutesSinceLastUse = (now.getTime() - lastUsed.getTime()) / (1000 * 60);
      
      if (minutesSinceLastUse > session.user.preferences.autoLock) {
        
        await prisma.userSession.delete({
          where: { id: session.id }
        });
        
        res.status(401).json({ 
          success: false, 
          message: 'Sessão expirada por inatividade' 
        });
        return;
      }
    }

    
    try {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastUsed: new Date() }
      });
    } catch (updateError) {
      console.error('Erro ao atualizar sessão:', updateError);
      
    }

    
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
      include: { 
        user: {
          include: {
            preferences: true
          }
        }
      }
    });

    if (session && session.user.isActive) {
      (req as AuthenticatedRequest).user = session.user;
      (req as AuthenticatedRequest).sessionId = session.id;
    }
    
    next();
  } catch (error) {
    
    next();
  }
};
