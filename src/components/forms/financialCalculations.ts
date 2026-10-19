export const MAX_COMPONENT_AMOUNT = 10_000_000_000;
export const MAX_MONTHLY_TOTAL = 2 * MAX_COMPONENT_AMOUNT;

export function formatFinancialMoney(value: string): string {
  if (value === '') return '';
  const match = /^(-?)(\d+)(?:\.(\d{0,2}))?$/.exec(value);
  if (!match) return value;
  return `${match[1]}${match[2].replace(/\B(?=(\d{3})+(?!\d))/g, '.')}${match[3] !== undefined ? `,${match[3]}` : ''}`;
}

export function financialMoneyInput(value: string): string {
  const ungrouped = value.replace(/\./g, '');
  const match = /^(\d*)(?:,(\d{0,2}))?$/.exec(ungrouped);
  if (!match) return '';
  const integer = match[1].replace(/^0+(?=\d)/, '') || (match[2] !== undefined ? '0' : '');
  const canonical = `${integer}${match[2] !== undefined ? `.${match[2]}` : ''}`;
  return Number(canonical || '0') > MAX_COMPONENT_AMOUNT ? String(MAX_COMPONENT_AMOUNT) : canonical;
}

export function financialPayload<T extends Record<string, unknown>>(values: T, formOnly: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...values };
  const moneyFields = ['monthlySalary', 'principalIncome', 'otherIncome', 'totalIncome', 'monthlyExpenses', 'financialObligations', 'totalExpenses', 'assetsValue', 'liabilitiesValue', 'equityValue', 'voluntarySavingsValue'];
  for (const key of moneyFields) {
    const value = payload[key];
    if (typeof value === 'string' && /^-?\d+\.$/.test(value)) payload[key] = value.slice(0, -1);
  }
  if (formOnly) {
    delete payload.voluntarySavings;
    delete payload.voluntarySavingsValue;
  }
  return payload;
}

export type FinancialAmounts = {
  principalIncome: string;
  otherIncome: string;
  totalIncome: string;
  monthlyExpenses: string;
  financialObligations: string;
  totalExpenses: string;
  assetsValue: string;
  liabilitiesValue: string;
  equityValue: string;
};

function amount(value: string): number {
  const parsed = Number(value || '0');

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

function decimal(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const fraction = String(absolute % 100).padStart(2, '0').replace(/0+$/, '');
  return `${sign}${Math.floor(absolute / 100)}${fraction ? `.${fraction}` : ''}`;
}

export function calculateFinancialAmounts<T extends FinancialAmounts>(values: T): T {
  return {
    ...values,
    totalIncome: decimal(amount(values.principalIncome) + amount(values.otherIncome)),
    totalExpenses: decimal(amount(values.monthlyExpenses) + amount(values.financialObligations)),
    equityValue: decimal(amount(values.assetsValue) - amount(values.liabilitiesValue)),
  };
}

export function synchronizePrincipalIncome<T extends FinancialAmounts>(values: T, monthlySalary: string): T {
  return calculateFinancialAmounts({
    ...values,
    principalIncome: monthlySalary,
  });
}
