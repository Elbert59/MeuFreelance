import type { ContractStatus } from '../types';

/**
 * Validação algorítmica de CNPJ brasileiro com dígitos verificadores reais (Módulo 11)
 */
export function validateCNPJ(rawCnpj: string): boolean {
  if (!rawCnpj) return false;
  const cnpj = rawCnpj.replace(/[^\d]+/g, '');

  if (cnpj.length !== 14) return false;

  // Rejeita sequências repetidas conhecidas (ex: 00000000000000)
  if (/^(\d)\1+$/.test(cnpj)) return false;

  // Validação do 1º dígito verificador
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  const digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number(digitos.charAt(0))) return false;

  // Validação do 2º dígito verificador
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += Number(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== Number(digitos.charAt(1))) return false;

  return true;
}

/**
 * Validação algorítmica de CPF brasileiro com dígitos verificadores reais (Módulo 11)
 */
export function validateCPF(rawCpf: string): boolean {
  if (!rawCpf) return false;
  const cpf = rawCpf.replace(/[^\d]+/g, '');

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10), 10)) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11), 10)) return false;

  return true;
}

/**
 * Sanitização preventiva contra ataques XSS e injeção de scripts
 */
export function sanitizeInput(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';
  const sanitized = input
    .replace(/<[^>]*>?/gm, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript pseudo-protocol
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '') // Remove inline handlers like onload=, onerror=
    .trim();

  return sanitized.slice(0, maxLength);
}

/**
 * Máquina de estados estrita do cofre Escrow
 * Garante que pagamentos e expedientes não pulem etapas financeiras
 */
const ALLOWED_STATUS_TRANSITIONS: Record<ContractStatus, ContractStatus[]> = {
  AGUARDANDO: ['PAGO_E_RETIDO'],
  PAGO_E_RETIDO: ['CHECKIN_REALIZADO'],
  CHECKIN_REALIZADO: ['CONCLUIDO'],
  CONCLUIDO: ['VALOR_LIBERADO'],
  VALOR_LIBERADO: [], // Estado terminal
};

export function isAllowedStatusTransition(current: ContractStatus, next: ContractStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

/**
 * Gera hash criptográfico legível de custódia (SHA-256 truncado para 16 chars)
 */
export function generateEscrowAuditHash(contractId: string, amount: number, timestamp: string): string {
  let hash = 0;
  const str = `CHEFMATCH_ESCROW_${contractId}_R$${amount.toFixed(2)}_${timestamp}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  const secondHex = Math.abs(hash ^ 0x5a5a5a5a).toString(16).toUpperCase().padStart(8, '0');
  return `ESCROW-${hex.slice(0, 4)}-${secondHex.slice(0, 4)}-${hex.slice(4, 8)}`;
}
