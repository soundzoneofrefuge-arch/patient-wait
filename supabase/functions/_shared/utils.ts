/**
 * Utilities compartilhadas para Edge Functions
 */

// === CORS ===
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// === DATETIME ===
export function getBrazilDateTime(): Date {
  const now = new Date();
  const brazilTimeStr = now.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo"
  });
  return new Date(brazilTimeStr);
}

export function getBrazilDateString(): string {
  const brazilDate = getBrazilDateTime();
  return brazilDate.toISOString().split('T')[0];
}

export function getBrazilTimeString(): string {
  const brazilDate = getBrazilDateTime();
  const hours = brazilDate.getHours().toString().padStart(2, '0');
  const minutes = brazilDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// === PASSWORD ===
const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function generatePassword(length = 4): string {
  return Array.from(
    { length }, 
    () => ALPHANUMERIC_CHARS[Math.floor(Math.random() * ALPHANUMERIC_CHARS.length)]
  ).join('');
}

export function isValidPassword(password: string): boolean {
  if (!password || password.length !== 4) {
    return false;
  }
  return /^[0-9A-Z]{4}$/.test(password);
}
