export const WEB_BASE_URL =
  typeof window !== 'undefined' ? window.location.origin : 'https://boraapp.web.app';

export function buildInviteUrl(code: string): string {
  return `${WEB_BASE_URL}/invite/${code}`;
}
