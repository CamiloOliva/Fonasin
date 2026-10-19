import { describe, expect, it } from 'vitest';
import { calculateFinancialAmounts, synchronizePrincipalIncome, formatFinancialMoney, financialMoneyInput, financialPayload } from './financialCalculations';

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
  it('calculates cents exactly without binary floating point residue', () => {
    expect(calculateFinancialAmounts({ ...baseAmounts, principalIncome: '0.1', otherIncome: '0.2', monthlyExpenses: '10000000000', financialObligations: '9999999999.99', assetsValue: '0.1', liabilitiesValue: '0.3' }))
      .toMatchObject({ totalIncome: '0.3', totalExpenses: '19999999999.99', equityValue: '-0.2' });
  });

  it.each([['123.5', '123,5'], ['-500.25', '-500,25'], ['20000000000', '20.000.000.000'], ['0.01', '0,01'], ['', '']])('displays canonical %s without multiplying cents', (value, expected) => {
    expect(formatFinancialMoney(value)).toBe(expected);
  });

  it.each([['1.234,50', '1234.50'], ['0,1', '0.1'], ['123,', '123.'], ['10.000.000.000,01', '10000000000'], ['=123', ''], ['1e3', ''], ['1,234', '']])('parses editable local money %s explicitly', (value, expected) => {
    expect(financialMoneyInput(value)).toBe(expected);
  });

  it('finishes an intermediate decimal separator only for monetary fields', () => {
    expect(financialPayload({ monthlySalary: '123.', employer: '123.' }, false)).toEqual({ monthlySalary: '123', employer: '123.' });
  });
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

  it('synchronizes principal income from monthly salary and recalculates total income', () => {
    expect(synchronizePrincipalIncome({
      ...baseAmounts,
      principalIncome: '1000000',
      otherIncome: '500000',
    }, '2500000')).toMatchObject({
      principalIncome: '2500000',
      totalIncome: '3000000',
    });
  });
});
