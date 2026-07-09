export const tokensService = {
  generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    for (let i = 0; i < 2; i++) {
      p2 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `VC-${p1}-${p2}`;
  },

  normalizeToken(token: string): string {
    return token.replace(/[^A-Z0-9]/ig, '').toUpperCase();
  }
};
