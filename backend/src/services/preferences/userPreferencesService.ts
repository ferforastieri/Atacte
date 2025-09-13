import { UserPreferencesRepository, CreateUserPreferencesData, UpdateUserPreferencesData } from '../../repositories/preferences/userPreferencesRepository';

export interface UserPreferencesDto {
  id: string;
  userId: string;
  theme: string;
  language: string;
  autoLock: number;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPreferencesService {
  private userPreferencesRepository: UserPreferencesRepository;

  constructor() {
    this.userPreferencesRepository = new UserPreferencesRepository();
  }

  async getUserPreferences(userId: string): Promise<UserPreferencesDto | null> {
    const preferences = await this.userPreferencesRepository.findByUserId(userId);
    
    if (!preferences) {
      return null;
    }

    return this.mapToDto(preferences);
  }

  async createUserPreferences(userId: string, data: CreateUserPreferencesData): Promise<UserPreferencesDto> {
    const preferences = await this.userPreferencesRepository.create({
      userId,
      theme: data.theme || 'light',
      language: data.language || 'pt-BR',
      autoLock: data.autoLock || 15,
    });

    return this.mapToDto(preferences);
  }

  async updateUserPreferences(userId: string, data: UpdateUserPreferencesData): Promise<UserPreferencesDto | null> {
    const existingPreferences = await this.userPreferencesRepository.findByUserId(userId);
    
    if (!existingPreferences) {
      return null;
    }

    const preferences = await this.userPreferencesRepository.update(userId, data);
    return this.mapToDto(preferences);
  }

  async upsertUserPreferences(userId: string, data: CreateUserPreferencesData): Promise<UserPreferencesDto> {
    const preferences = await this.userPreferencesRepository.upsert(userId, {
      userId,
      theme: data.theme || 'light',
      language: data.language || 'pt-BR',
      autoLock: data.autoLock || 15,
    });

    return this.mapToDto(preferences);
  }

  async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      await this.userPreferencesRepository.delete(userId);
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapToDto(preferences: any): UserPreferencesDto {
    return {
      id: preferences.id,
      userId: preferences.userId,
      theme: preferences.theme,
      language: preferences.language,
      autoLock: preferences.autoLock,
      createdAt: preferences.createdAt,
      updatedAt: preferences.updatedAt,
    };
  }
}
