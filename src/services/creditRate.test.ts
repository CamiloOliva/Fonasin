import { describe, expect, it } from 'vitest';
import { monthlyCreditRateLabel } from './portalService';

describe('unidad de la tasa mensual', () => {
  it('muestra la tasa mensual conocida aunque no exista tasa anual', () => {
    expect(monthlyCreditRateLabel({ interest_rate: '1.5000', interest_rate_basis: 'monthly' })).toBe('1.5000%');
    expect(monthlyCreditRateLabel({ interest_rate: '0.0000', interest_rate_basis: 'monthly' })).toBe('0.0000%');
  });

  it('no reinterpreta una tasa historica sin unidad declarada', () => {
    expect(monthlyCreditRateLabel({ interest_rate: '18.0000', interest_rate_basis: null })).toBe('No informada');
  });
});
