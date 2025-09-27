import { z } from 'zod';
import { Alert } from 'react-native';

// Schema para validação das variáveis de ambiente
const envSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z
    .string()
    .url('EXPO_PUBLIC_API_BASE_URL deve ser uma URL válida'),
});

// Validar e exportar as variáveis de ambiente
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error('❌ Erro na validação das variáveis de ambiente:');
  console.error(error);
  
  // Mostrar erro mais detalhado
  if (error instanceof z.ZodError) {
    console.error('📋 Detalhes dos erros:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    
    // Mostrar erro no toast/alert
    const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
    Alert.alert(
      '❌ Erro de Configuração',
      `Variáveis de ambiente inválidas:\n\n${errorMessages}`,
      [{ text: 'OK' }]
    );
  }
  
  // Re-throw para parar a aplicação
  throw error;
}

export { env };

// Exportar tipos para TypeScript
export type Env = z.infer<typeof envSchema>;
