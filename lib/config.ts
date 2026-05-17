export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:3000/v1';

export const WEB_BASE_URL =
  typeof window !== 'undefined' ? window.location.origin : 'https://boraapp.web.app';

export function buildInviteUrl(code: string): string {
  return `${WEB_BASE_URL}/invite/${code}`;
}
