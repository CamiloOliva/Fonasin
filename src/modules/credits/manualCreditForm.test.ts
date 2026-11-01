import { describe, expect, it } from 'vitest';
import { canPasteCreditBalance, formatCreditBalance, readCreditBalanceInput } from './manualCreditForm';

describe('manual credit balances', () => {
  it.each([
    ['', ''], ['0', '0'], ['1250000', '1.250.000'], ['1250000.50', '1.250.000,50'],
    ['0.01', '0,01'], ['1250.', '1.250,'], ['999999999999.99', '999.999.999.999,99'],
  ])('formats %s without numeric conversion', (canonical, displayed) => {
    expect(formatCreditBalance(canonical)).toBe(displayed);
    expect(readCreditBalanceInput(displayed)).toBe(canonical);
  });
  it.each(['-1', '1e9', '1,234', '1000000000000', 'abc', '=1+1'])('rejects invalid or oversized input %s without clamping', (value) => {
    expect(readCreditBalanceInput(value)).toBeNull();
  });
  it('keeps grouping edits and comma cents exact', () => {
    expect(readCreditBalanceInput('1.00')).toBe('100');
    expect(readCreditBalanceInput(',5')).toBe('0.5');
    expect(readCreditBalanceInput('00012,50')).toBe('12.50');
  });
  it.each(['1250000.50', '12.34', '1,250,000.50', '1e6', '-1', '1000000000000'])('blocks ambiguous or invalid paste %s', value => {
    expect(canPasteCreditBalance(value)).toBe(false);
  });
  it.each(['1250000', '1.250.000,50', '0,00', '999.999.999.999,99'])('accepts localized paste %s', value => {
    expect(canPasteCreditBalance(value)).toBe(true);
  });
});
