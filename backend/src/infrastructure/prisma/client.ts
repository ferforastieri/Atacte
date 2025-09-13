import { PrismaClient } from '@prisma/client';
import { NODE_ENV } from '../config';

// Singleton do cliente Prisma
class PrismaService {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        errorFormat: 'pretty',
      });

      // Conectar ao banco
      PrismaService.instance.$connect();

      // Graceful shutdown
      process.on('beforeExit', async () => {
        await PrismaService.instance.$disconnect();
      });

      process.on('SIGINT', async () => {
        await PrismaService.instance.$disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await PrismaService.instance.$disconnect();
        process.exit(0);
      });
    }

    return PrismaService.instance;
  }

  public static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
    }
  }
}

// Exportar instância singleton
export const prisma = PrismaService.getInstance();
export default PrismaService;
