const SESSION_USER_KEY = 'boraplay_session_user';

export interface StoredUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
}

export function getSessionUser(): StoredUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setSessionUser(user: StoredUser): void {
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearSessionUser(): void {
  localStorage.removeItem(SESSION_USER_KEY);
}

export function clearSession(): void {
  clearSessionUser();
}
