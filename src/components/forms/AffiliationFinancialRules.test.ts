import { describe, expect, it } from 'vitest';
import { createInitialState, validateCurrentStep } from './AffiliationForm';
import { calculateFinancialAmounts, financialPayload } from './financialCalculations';

function stateWithMaximums() {
  const state = createInitialState();
  state.financial = calculateFinancialAmounts({
    ...state.financial, principalIncome: '10000000000', otherIncome: '10000000000',
    monthlyExpenses: '10000000000', financialObligations: '10000000000',
    assetsValue: '0', liabilitiesValue: '0', incomeBand: 'Mas de 4 SMMLV',
  });
  return state;
}

describe('approved financial limits and profile-only forms', () => {
  it('accepts two maximum components and calculates both 20 billion totals', () => {
    const state = stateWithMaximums();
    expect(state.financial.totalIncome).toBe('20000000000');
    expect(state.financial.totalExpenses).toBe('20000000000');
    expect(validateCurrentStep(2, state)).toBeNull();
  });

  it.each(['totalIncome', 'totalExpenses'] as const)('rejects %s above the approved total', (field) => {
    const state = stateWithMaximums();
    state.financial[field] = '20000000001';
    expect(validateCurrentStep(2, state)).toContain('$20.000.000.000');
  });

  it.each(['principalIncome', 'otherIncome', 'monthlyExpenses', 'financialObligations', 'assetsValue', 'liabilitiesValue'] as const)(
    'does not widen the individual %s limit', (field) => {
      const state = stateWithMaximums();
      state.financial[field] = '10000000001';
      expect(validateCurrentStep(2, state)).toContain('Cada componente');
    });

  it('omits savings instructions and does not require them for profile-only forms', () => {
    const state = stateWithMaximums();
    state.financial.voluntarySavings = 'Si';
    state.financial.voluntarySavingsValue = '';
    expect(validateCurrentStep(2, state, new Set(), true)).toBeNull();
    expect(validateCurrentStep(2, state, new Set(), false)).toContain('valor mensual del ahorro');
    const payload = financialPayload(state.financial, true);
    expect(payload).not.toHaveProperty('voluntarySavings');
    expect(payload).not.toHaveProperty('voluntarySavingsValue');
    expect(payload.totalIncome).toBe('20000000000');
    expect(state.financial.voluntarySavings).toBe('Si');
    expect(financialPayload(state.financial, false)).toHaveProperty('voluntarySavings', 'Si');
  });
});
