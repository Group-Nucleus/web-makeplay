'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/lib/auth/context';
import { inputClass } from '@/components/ui/Field';

export function LoginPage() {
  const { signInWithPhone, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithPhone(phone.trim(), password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login com Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#BFFF00] text-lg font-black text-black">
            B
          </span>
          <span className="text-xl font-extrabold tracking-widest text-[#BFFF00]">BORAPLAY</span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-white">Bem-vindo de volta</h1>
        <p className="mb-8 text-sm text-[#888]">
          Entra com Google ou com telefone e senha da tua conta.
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || loading}
          className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-[#333] bg-white py-3.5 text-sm font-semibold text-black disabled:opacity-60">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? 'A conectar...' : 'Continuar com Google'}
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#333]" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-[#888]">ou</span>
          </div>
        </div>

        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold tracking-wider text-[#888]">
              TELEFONE
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+55 98 99999-9999"
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold tracking-wider text-[#888]">
              SENHA
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full rounded-xl bg-[#BFFF00] py-3.5 text-sm font-bold text-black disabled:opacity-60">
            {loading ? 'A entrar...' : 'ENTRAR COM TELEFONE'}
          </button>
        </form>
      </div>
    </div>
  );
}
