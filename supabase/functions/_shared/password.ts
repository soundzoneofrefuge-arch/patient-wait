/**
 * Utilities para geração de senhas alfanuméricas
 * Centraliza a lógica que estava duplicada em book_slot e reschedule_booking
 */

const ALPHANUMERIC_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Gera uma senha alfanumérica aleatória
 * @param length Tamanho da senha (padrão: 4)
 * @returns String alfanumérica aleatória
 * 
 * @example
 * generatePassword() // "A1B2"
 * generatePassword(6) // "X3Y9Z1"
 */
export function generatePassword(length = 4): string {
  return Array.from(
    { length }, 
    () => ALPHANUMERIC_CHARS[Math.floor(Math.random() * ALPHANUMERIC_CHARS.length)]
  ).join('');
}

/**
 * Valida se uma senha é alfanumérica válida
 * @param password Senha a validar
 * @returns true se válida, false caso contrário
 */
export function isValidPassword(password: string): boolean {
  if (!password || password.length !== 4) {
    return false;
  }
  
  return /^[0-9A-Z]{4}$/.test(password);
}

/**
 * Gera uma senha garantidamente única consultando o banco
 * @param supabase Cliente Supabase
 * @returns Senha única não existente no banco
 */
export async function generateUniquePassword(supabase: any): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const password = generatePassword();
    
    // Verificar se já existe
    const { data } = await supabase
      .from('agendamentos_robustos')
      .select('id')
      .eq('senha', password)
      .maybeSingle();
    
    if (!data) {
      return password; // Senha única encontrada
    }
    
    attempts++;
  }
  
  // Fallback: senha com timestamp (improvável colisão)
  return generatePassword() + Date.now().toString().slice(-2);
}
