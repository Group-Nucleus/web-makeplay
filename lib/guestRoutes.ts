/** Rotas acessíveis sem conta (convite / nome na lista). */
export function isGuestPathname(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname.startsWith('/match/') || pathname.startsWith('/invite/');
}

/** Shell/nav de convidado só quando a rota é de convite e não há sessão. */
export function shouldUseGuestShell(
  pathname: string | null | undefined,
  options: { user: unknown; loading: boolean },
): boolean {
  if (!isGuestPathname(pathname)) return false;
  if (options.loading) return false;
  return !options.user;
}

export function matchPathWithCode(matchId: string, code: string): string {
  return `/match/${matchId}?code=${encodeURIComponent(code)}`;
}
