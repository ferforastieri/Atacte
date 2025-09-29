import dotenv from 'dotenv'
import path from 'path'

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../../config.env') })

export interface EnvironmentConfig {
  // Server
  PORT: number
  NODE_ENV: 'development' | 'production' | 'test'
  
  // Database
  DATABASE_URL: string
  
  // JWT
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  
  // Encryption
  ENCRYPTION_KEY: string
  
  // Security
  BCRYPT_ROUNDS: number
  RATE_LIMIT_WINDOW_MS: number
  RATE_LIMIT_MAX_REQUESTS: number
  
  // CORS
  CORS_ORIGIN: string
  
  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug'
}

class Environment {
  private config: EnvironmentConfig

  constructor() {
    this.config = this.loadConfig()
    this.validateConfig()
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // Server
      PORT: this.getNumber('PORT', 3001),
      NODE_ENV: this.getString('NODE_ENV', 'development') as 'development' | 'production' | 'test',
      
      // Database
      DATABASE_URL: this.getString('DATABASE_URL', 'postgresql://username:password@localhost:5432/atacte?sslmode=disable'),
      
      // JWT
      JWT_SECRET: this.getString('JWT_SECRET', 'your-super-secret-jwt-key-change-this-in-production'),
      JWT_EXPIRES_IN: this.getString('JWT_EXPIRES_IN', '7d'),
      
      // Encryption
      ENCRYPTION_KEY: this.getString('ENCRYPTION_KEY', 'your-32-character-encryption-key-here'),
      
      // Security
      BCRYPT_ROUNDS: this.getNumber('BCRYPT_ROUNDS', 12),
      RATE_LIMIT_WINDOW_MS: this.getNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
      RATE_LIMIT_MAX_REQUESTS: this.getNumber('RATE_LIMIT_MAX_REQUESTS', 500),
      
      // CORS
      CORS_ORIGIN: this.getString('CORS_ORIGIN', '*'),
      
      // Logging
      LOG_LEVEL: this.getString('LOG_LEVEL', 'info') as 'error' | 'warn' | 'info' | 'debug'
    }
  }

  private getString(key: string, defaultValue: string): string {
    const value = process.env[key]
    return value !== undefined ? value : defaultValue
  }

  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key]
    if (value === undefined) return defaultValue
    
    const parsed = parseInt(value, 10)
    if (isNaN(parsed)) {
      throw new Error(`Environment variable ${key} must be a valid number`)
    }
    
    return parsed
  }

  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key]
    if (value === undefined) return defaultValue
    
    return value.toLowerCase() === 'true'
  }

  private validateConfig(): void {
    const requiredFields: (keyof EnvironmentConfig)[] = [
      'DATABASE_URL',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ]

    for (const field of requiredFields) {
      if (!this.config[field]) {
        throw new Error(`Required environment variable ${field} is not set`)
      }
    }

    // Validações específicas
    if (this.config.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long')
    }

    if (this.config.ENCRYPTION_KEY.length !== 32) {
      throw new Error(`ENCRYPTION_KEY must be exactly 32 characters long, got ${this.config.ENCRYPTION_KEY.length}`)
    }

    if (!this.config.DATABASE_URL.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
    }
  }

  public get<K extends keyof EnvironmentConfig>(key: K): EnvironmentConfig[K] {
    return this.config[key]
  }

  public getAll(): EnvironmentConfig {
    return { ...this.config }
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development'
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production'
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test'
  }
}

// Singleton instance
export const env = new Environment()

// Export individual getters for convenience
export const {
  PORT,
  NODE_ENV,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ENCRYPTION_KEY,
  BCRYPT_ROUNDS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  CORS_ORIGIN,
  LOG_LEVEL
} = env.getAll()

export default env
