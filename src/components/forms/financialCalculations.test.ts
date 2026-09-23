import { describe, expect, it } from 'vitest';
import { calculateFinancialAmounts } from './financialCalculations';

const baseAmounts = {
  principalIncome: '',
  otherIncome: '',
  totalIncome: '',
  monthlyExpenses: '',
  financialObligations: '',
  totalExpenses: '',
  assetsValue: '',
  liabilitiesValue: '',
  equityValue: '',
};

describe('calculateFinancialAmounts', () => {
  it('recalculates income, expenses and equity from their source fields', () => {
    expect(calculateFinancialAmounts({
      ...baseAmounts,
      principalIncome: '2500000',
      otherIncome: '500000',
      monthlyExpenses: '900000',
      financialObligations: '300000',
      assetsValue: '20000000',
      liabilitiesValue: '7000000',
    })).toMatchObject({
      totalIncome: '3000000',
      totalExpenses: '1200000',
      equityValue: '13000000',
    });
  });

  it('treats temporarily empty editable fields as zero', () => {
    expect(calculateFinancialAmounts({
      ...baseAmounts,
      principalIncome: '',
      otherIncome: '2',
    })).toMatchObject({
      principalIncome: '',
      totalIncome: '2',
    });
  });

  it('keeps a negative equity when liabilities exceed assets', () => {
    expect(calculateFinancialAmounts({
      ...baseAmounts,
      assetsValue: '1000',
      liabilitiesValue: '1500',
    }).equityValue).toBe('-500');
  });
});
