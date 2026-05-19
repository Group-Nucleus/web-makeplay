export const matchKeys = {
  detail: (matchId: string, codeNorm = '', guestToken = '') =>
    ['match-detail', matchId, codeNorm, guestToken] as const,
};

export const seriesKeys = {
  detail: (seriesId: string, codeNorm = '') =>
    ['series-detail', seriesId, codeNorm] as const,
};
