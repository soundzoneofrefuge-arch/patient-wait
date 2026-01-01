/**
 * Utilities para trabalhar com datas e horários no timezone do Brasil
 * Centraliza toda a lógica de timezone que estava duplicada
 */

/**
 * Retorna a data/hora atual do Brasil (America/Sao_Paulo)
 */
export function getBrazilDateTime(): Date {
  const now = new Date();
  const brazilTimeStr = now.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo"
  });
  return new Date(brazilTimeStr);
}

/**
 * Retorna apenas a data atual do Brasil no formato YYYY-MM-DD
 */
export function getBrazilDateString(): string {
  const brazilDate = getBrazilDateTime();
  return brazilDate.toISOString().split('T')[0];
}

/**
 * Retorna apenas a hora atual do Brasil no formato HH:MM
 */
export function getBrazilTimeString(): string {
  const brazilDate = getBrazilDateTime();
  const hours = brazilDate.getHours().toString().padStart(2, '0');
  const minutes = brazilDate.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formata uma data Date para o formato ISO do Brasil (para inserção no banco)
 */
export function toBrazilISOString(date?: Date): string {
  const targetDate = date || getBrazilDateTime();
  return targetDate.toISOString();
}

/**
 * Verifica se uma data está no passado (considerando timezone do Brasil)
 */
export function isDateInPast(dateStr: string): boolean {
  const today = getBrazilDateString();
  return dateStr < today;
}

/**
 * Verifica se um horário já passou no dia de hoje (considerando timezone do Brasil)
 */
export function isTimeInPast(dateStr: string, timeStr: string): boolean {
  const today = getBrazilDateString();
  
  // Se não é hoje, não está no passado
  if (dateStr !== today) {
    return false;
  }
  
  // É hoje, verificar horário
  const currentTime = getBrazilTimeString();
  return timeStr <= currentTime;
}

/**
 * Converte minutos em formato HH:MM
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const mins = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

/**
 * Converte formato HH:MM para minutos
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}
