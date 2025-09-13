import { PrismaClient, UserPreferences } from '../../../node_modules/.prisma/client';

const prisma = new PrismaClient();

export interface CreateUserPreferencesData {
  userId: string;
  theme?: string;
  language?: string;
  autoLock?: number;
}

export interface UpdateUserPreferencesData {
  theme?: string;
  language?: string;
  autoLock?: number;
}

export class PreferencesRepository {
  async create(data: CreateUserPreferencesData): Promise<UserPreferences> {
    return await prisma.userPreferences.create({
      data: data as any,
    });
  }

  async findByUserId(userId: string): Promise<UserPreferences | null> {
    return await prisma.userPreferences.findUnique({
      where: { userId },
    });
  }

  async update(userId: string, data: UpdateUserPreferencesData): Promise<UserPreferences> {
    return await prisma.userPreferences.update({
      where: { userId },
      data: {
        theme: data.theme,
        language: data.language,
        autoLock: data.autoLock,
        updatedAt: new Date(),
      },
    });
  }

  async delete(userId: string): Promise<void> {
    await prisma.userPreferences.delete({
      where: { userId },
    });
  }

  async upsert(userId: string, data: CreateUserPreferencesData): Promise<UserPreferences> {
    return await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        theme: data.theme,
        language: data.language,
        autoLock: data.autoLock,
        updatedAt: new Date(),
      },
      create: {
        userId: data.userId,
        theme: data.theme,
        language: data.language,
        autoLock: data.autoLock,
      },
    });
  }
}
