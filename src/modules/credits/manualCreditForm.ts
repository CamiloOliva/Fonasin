// The input displays es-CO separators; application state keeps exact decimal strings.
export function formatCreditBalance(value: string): string {
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(value);
  if (!match) return value;
  return `${match[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${match[2] !== undefined ? `,${match[2]}` : ''}`;
}

export function readCreditBalanceInput(value: string): string | null {
  const match = /^(\d{0,12})(?:,(\d{0,2}))?$/.exec(value.replace(/\./g, ''));
  if (!match) return null;
  const integer = match[1].replace(/^0+(?=\d)/, '') || (match[2] !== undefined ? '0' : '');
  return `${integer}${match[2] !== undefined ? `.${match[2]}` : ''}`;
}

// Reject ambiguous pasted decimal dots instead of silently multiplying an amount.
export function canPasteCreditBalance(value: string): boolean {
  return /^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{0,2})?$/.test(value)
    && readCreditBalanceInput(value) !== null;
}
