import { z } from 'zod';

// Schema para validação das variáveis de ambiente
const envSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z
    .string()
    .url('EXPO_PUBLIC_API_BASE_URL deve ser uma URL válida'),
});

// Validar e exportar as variáveis de ambiente
export const env = envSchema.parse(process.env);

// Exportar tipos para TypeScript
export type Env = z.infer<typeof envSchema>;
