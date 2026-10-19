import { describe, expect, it } from 'vitest';
import { monthlyCreditRateLabel } from './portalService';
import { creditRateLabel } from './creditRate';

describe('unidad de la tasa mensual', () => {
  it('muestra la tasa mensual conocida aunque no exista tasa anual', () => {
    expect(monthlyCreditRateLabel({ interest_rate: '1.5000', interest_rate_basis: 'monthly' })).toBe('1,5%');
    expect(monthlyCreditRateLabel({ interest_rate: '0.0000', interest_rate_basis: 'monthly' })).toBe('0%');
  });

  it('no reinterpreta una tasa historica sin unidad declarada', () => {
    expect(monthlyCreditRateLabel({ interest_rate: '18.0000', interest_rate_basis: null })).toBe('No informada');
  });

  it.each([
    ['18.0000', '18%'], ['1.5000', '1,5%'], ['1.2345', '1,2345%'], ['0.0001', '0,0001%'],
    ['0.0000', '0%'], [null, 'No informada'], ['', 'No informada'], ['not-a-rate', 'No informada'],
  ])('formats %s without rounding or converting its unit', (value, expected) => {
    expect(creditRateLabel(value)).toBe(expected);
  });
});
