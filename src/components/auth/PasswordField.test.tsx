import { createElement, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PasswordField from './PasswordField';

describe('Visibilidad de contrasena', () => {
  it('starts hidden, shows and hides the same value without submitting the form', () => {
    const submit = vi.fn(event => event.preventDefault());
    render(createElement('form', { onSubmit: submit }, createElement(PasswordField, {
      label: 'Nueva contrasena', value: 'SyntheticPass123!', onChange: vi.fn(), autoComplete: 'new-password',
    })));
    const input = screen.getByLabelText('Nueva contrasena', { exact: true });
    expect(input).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar nueva contrasena' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('SyntheticPass123!');
    expect(screen.getByRole('button', { name: 'Ocultar nueva contrasena' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar nueva contrasena' }));
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('autocomplete', 'new-password');
    expect(submit).not.toHaveBeenCalled();
  });

  it('keeps each field independent and returns to hidden after clearing', () => {
    function Form() {
      const [value, setValue] = useState('SyntheticPass123!');
      return createElement('div', null,
        createElement(PasswordField, { label: 'Nueva contrasena', value, onChange: event => setValue(event.target.value) }),
        createElement(PasswordField, { label: 'Confirmar contrasena', value: 'SyntheticPass123!', readOnly: true }));
    }
    render(createElement(Form));
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar nueva contrasena' }));
    expect(screen.getByLabelText('Confirmar contrasena', { exact: true })).toHaveAttribute('type', 'password');
    fireEvent.change(screen.getByLabelText('Nueva contrasena', { exact: true }), { target: { value: '' } });
    expect(screen.getByLabelText('Nueva contrasena', { exact: true })).toHaveAttribute('type', 'password');
  });
});
