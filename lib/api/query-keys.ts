export const matchKeys = {
  detail: (matchId: string, codeNorm = '', guestToken = '', userId = '') =>
    ['match-detail', matchId, codeNorm, guestToken, userId] as const,
};

export const seriesKeys = {
  detail: (seriesId: string, codeNorm = '', userId = '') =>
    ['series-detail', seriesId, codeNorm, userId] as const,
};
