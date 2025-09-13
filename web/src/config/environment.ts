// Configuração de ambiente para o frontend
export const config = {
  // API
  API_URL: import.meta.env.VITE_API_URL || '/api',
  
  // App
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Atacte',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  
  // Features
  ENABLE_DEV_TOOLS: import.meta.env.NODE_ENV === 'development',
  
  // URLs
  get apiUrl() {
    return this.API_URL
  },
  
  get isDevelopment() {
    return this.NODE_ENV === 'development'
  },
  
  get isProduction() {
    return this.NODE_ENV === 'production'
  }
}

export default config
