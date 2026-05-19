import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val && process.env.NODE_ENV !== 'test') {
    console.error(
      `[Firebase] Variável de ambiente obrigatória não definida: ${key}\n` +
        'Copie .env.example para .env.local e preencha os valores do Firebase.',
    );
  }
  return val ?? '';
}

const firebaseConfig = {
  apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: requireEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: requireEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requireEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
