import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PORT, CORS_ORIGIN, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, NODE_ENV } from './infrastructure/config';

const app = express();


app.use(helmet());
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));


const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  message: { 
    success: false, 
    message: 'Muitas tentativas. Tente novamente em 15 minutos.' 
  }
});
app.use(limiter);


app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});


import authRoutes from './controllers/auth/authController';
import passwordRoutes from './controllers/passwords/passwordController';
import userRoutes from './controllers/users/userController';
import totpRoutes from './controllers/totp/totpController';
import importExportRoutes from './controllers/importExport/importExportController';
import preferencesRoutes from './controllers/preferences/preferencesController';

app.use('/api/auth', authRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/users', userRoutes);
app.use('/api/totp', totpRoutes);
app.use('/api/import-export', importExportRoutes);
app.use('/api/preferences', preferencesRoutes);


app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});


app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});


if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Atacte Password Manager rodando na porta ${PORT}`);
    console.log(`🔐 API disponível em http://localhost:${PORT}/api`);
    console.log(`❤️  Health check em http://localhost:${PORT}/health`);
  });
}

export default app;
