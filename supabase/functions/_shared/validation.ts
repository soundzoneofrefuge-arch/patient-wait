/**
 * Utilities para validação de dados de entrada
 * Padroniza validações em todas as Edge Functions
 */

/**
 * Valida formato de data YYYY-MM-DD
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  
  const date = new Date(dateStr + 'T00:00:00');
  return !isNaN(date.getTime());
}

/**
 * Valida formato de hora HH:MM ou HH:MM:SS
 */
export function isValidTime(timeStr: string): boolean {
  if (!timeStr) return false;
  const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])(:[0-5][0-9])?$/;
  return regex.test(timeStr);
}

/**
 * Valida formato de telefone brasileiro
 * Aceita: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const regex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$/;
  return regex.test(phone);
}

/**
 * Valida se uma string não está vazia (após trim)
 */
export function isNonEmptyString(value: any): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Valida campos obrigatórios de agendamento
 */
export interface BookingData {
  date: string;
  time: string;
  name: string;
  contact: string;
  professional: string;
  service: string;
}

export function validateBookingData(data: Partial<BookingData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!isValidDate(data.date || '')) {
    errors.push('Data inválida (formato esperado: YYYY-MM-DD)');
  }
  
  if (!isValidTime(data.time || '')) {
    errors.push('Horário inválido (formato esperado: HH:MM)');
  }
  
  if (!isNonEmptyString(data.name)) {
    errors.push('Nome é obrigatório');
  }
  
  if (!isNonEmptyString(data.contact)) {
    errors.push('Contato é obrigatório');
  }
  
  if (!isNonEmptyString(data.professional)) {
    errors.push('Profissional é obrigatório');
  }
  
  if (!isNonEmptyString(data.service)) {
    errors.push('Serviço é obrigatório');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Normaliza formato de hora (adiciona :00 se necessário)
 */
export function normalizeTime(timeStr: string): string {
  if (!timeStr) return '';
  
  // Se já tem segundos, retorna como está
  if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return timeStr;
  }
  
  // Se tem apenas HH:MM, adiciona :00
  if (timeStr.match(/^\d{2}:\d{2}$/)) {
    return `${timeStr}:00`;
  }
  
  return timeStr;
}
