'use client';

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  clearApiSession,
  createApiSession,
  createPhoneSession,
  restoreApiSession,
} from '@/lib/repositories/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { getSessionUser, type StoredUser } from '@/lib/api/token';

interface AuthContextValue {
  user: StoredUser | null;
  loading: boolean;
  apiSessionReady: boolean;
  signInWithPhone: (phone: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function firebaseToStored(u: FirebaseUser): StoredUser {
  return {
    uid: u.uid,
    displayName: u.displayName,
    email: u.email,
    photoURL: u.photoURL,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [phoneUser, setPhoneUser] = useState<StoredUser | null>(null);
  const phoneSessionRef = useRef(false);
  const [loading, setLoading] = useState(true);
  const [apiSessionReady, setApiSessionReady] = useState(false);

  const user = firebaseUser ? firebaseToStored(firebaseUser) : phoneUser;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const cached = getSessionUser();
      if (cached) {
        phoneSessionRef.current = true;
        setPhoneUser(cached);
        setApiSessionReady(true);
      }
    })();

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (cancelled) return;
      setFirebaseUser(fbUser);

      if (fbUser) {
        phoneSessionRef.current = false;
        setPhoneUser(null);

        const cachedUser = getSessionUser();

        if (cachedUser?.uid === fbUser.uid) {
          // Fast path: cached session is valid, unblock UI immediately
          if (!cancelled) {
            setApiSessionReady(true);
            setLoading(false);
          }
          // Refresh token in background without blocking
          void (async () => {
            try {
              const idToken = await fbUser.getIdToken();
              await createApiSession(idToken);
            } catch (err) {
              console.error('[Auth] Falha renovação sessão API (Google):', err);
            }
          })();
          return;
        }

        // Slow path: no cached session, must wait for API
        setApiSessionReady(false);
        try {
          const idToken = await fbUser.getIdToken();
          await createApiSession(idToken);
          if (!cancelled) setApiSessionReady(true);
        } catch (err) {
          console.error('[Auth] Falha sessão API (Google):', err);
          if (!cancelled) setApiSessionReady(false);
        }
      } else if (!phoneSessionRef.current) {
        const restored = await restoreApiSession();
        if (!cancelled) {
          if (restored) {
            phoneSessionRef.current = true;
            setPhoneUser(restored);
            setApiSessionReady(true);
          } else {
            setPhoneUser(null);
            setApiSessionReady(false);
          }
        }
      }

      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const signInWithPhone = useCallback(async (phone: string, password: string) => {
    const session = await createPhoneSession(phone, password);
    phoneSessionRef.current = true;
    setPhoneUser({
      uid: session.user.uid,
      displayName: session.user.displayName ?? null,
      email: session.user.email ?? null,
      photoURL: session.user.photoURL ?? null,
    });
    setApiSessionReady(true);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const signOut = useCallback(async () => {
    await clearApiSession();
    phoneSessionRef.current = false;
    setPhoneUser(null);
    setApiSessionReady(false);
    if (firebaseUser) {
      await firebaseSignOut(auth);
    }
  }, [firebaseUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        apiSessionReady,
        signInWithPhone,
        signInWithGoogle,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
