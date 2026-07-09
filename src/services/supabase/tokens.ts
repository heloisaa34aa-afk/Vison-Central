export const tokensService = {
  normalizeToken(raw: string): string {
    const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return clean;
  },
  
  generateToken(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let result = 'VC-';
    for (let i = 0; i < 4; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }
    result += '-';
    for (let i = 0; i < 2; i++) {
      result += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return result; // VC-1234-AB
  }
};
