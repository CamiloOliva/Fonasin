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
