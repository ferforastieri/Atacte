import { PrismaClient } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export class TOTPRepository {
  
  
  
  async getUserEncryptionKey(userId: string): Promise<{ encryptionKeyHash: string } | null> {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { encryptionKeyHash: true },
    });
  }

  async findPasswordEntryWithTOTP(passwordEntryId: string, userId: string): Promise<any> {
    return await prisma.passwordEntry.findFirst({
      where: {
        id: passwordEntryId,
        userId,
        totpEnabled: true,
        totpSecret: { not: null },
      },
    });
  }

  async updatePasswordEntryTOTP(passwordEntryId: string, data: {
    totpSecret?: string | null;
    totpEnabled?: boolean;
  }): Promise<any> {
    return await prisma.passwordEntry.update({
      where: { id: passwordEntryId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: { customFields: true },
    });
  }
}
