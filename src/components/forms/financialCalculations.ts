export const MAX_COMPONENT_AMOUNT = 10_000_000_000;
export const MAX_MONTHLY_TOTAL = 2 * MAX_COMPONENT_AMOUNT;

export function financialPayload<T extends Record<string, unknown>>(values: T, formOnly: boolean): Record<string, unknown> {
  const payload = { ...values };
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

  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateFinancialAmounts<T extends FinancialAmounts>(values: T): T {
  return {
    ...values,
    totalIncome: String(amount(values.principalIncome) + amount(values.otherIncome)),
    totalExpenses: String(amount(values.monthlyExpenses) + amount(values.financialObligations)),
    equityValue: String(amount(values.assetsValue) - amount(values.liabilitiesValue)),
  };
}

export function synchronizePrincipalIncome<T extends FinancialAmounts>(values: T, monthlySalary: string): T {
  return calculateFinancialAmounts({
    ...values,
    principalIncome: monthlySalary,
  });
}
