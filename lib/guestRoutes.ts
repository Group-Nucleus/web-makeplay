/** Rotas acessíveis sem conta (convite / nome na lista). */
export function isGuestPathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/match/') || pathname.startsWith('/invite/');
}

export function matchPathWithCode(matchId: string, code: string): string {
  return `/match/${matchId}?code=${encodeURIComponent(code)}`;
}
