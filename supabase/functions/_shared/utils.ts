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
  // Representação consistente do “agora” no fuso do Brasil (America/Sao_Paulo)
  // Observação: Date em JS não carrega timezone; aqui usamos as partes formatadas.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  const hh = Number(get("hour"));
  const mm = Number(get("minute"));
  const ss = Number(get("second"));

  return new Date(Date.UTC(y, m - 1, d, hh, mm, ss));
}

export function getBrazilDateString(): string {
  // YYYY-MM-DD no fuso do Brasil
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getBrazilTimeString(): string {
  // HH:mm no fuso do Brasil
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
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
