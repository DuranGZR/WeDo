import Constants from 'expo-constants';
import { z } from 'zod';

const envSchema = z.object({
  apiUrl: z.string().url(),
});

export const env = envSchema.parse({
  apiUrl: Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8000',
});
