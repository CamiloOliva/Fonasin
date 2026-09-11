import { describe, expect, it } from 'vitest';
import { canManageAdminData, isAcceptedSpreadsheet } from './AdminFonasin';

describe('AdminFonasin permissions and imports', () => {
  it('allows administrative data actions only to admin users', () => {
    expect(canManageAdminData({ id: '1', email: 'admin@test', roles: ['admin'], must_change_password: false })).toBe(true);
    expect(canManageAdminData({ id: '2', email: 'reviewer@test', roles: ['reviewer'], must_change_password: false })).toBe(false);
    expect(canManageAdminData(null)).toBe(false);
  });

  it('accepts only XLSX files before sending them to the backend', () => {
    expect(isAcceptedSpreadsheet(new File(['content'], 'aportes.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))).toBe(true);
    expect(isAcceptedSpreadsheet(new File(['content'], 'aportes.csv', { type: 'text/csv' }))).toBe(false);
    expect(isAcceptedSpreadsheet(new File(['content'], 'aportes.xlsx', { type: 'text/plain' }))).toBe(false);
  });
});