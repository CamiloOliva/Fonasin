<?php

namespace App\Http\Requests\Associates;

use Illuminate\Foundation\Http\FormRequest;

class CorrectAssociateEmailRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        foreach (['email', 'email_confirmation', 'expected_email'] as $field) {
            if (is_string($this->input($field))) {
                $this->merge([$field => mb_strtolower(trim($this->input($field)))]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email:rfc', 'max:255', 'confirmed'],
            'expected_email' => ['required', 'email:rfc', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Escribe el nuevo correo.',
            'email.email' => 'Escribe un correo valido.',
            'email.confirmed' => 'Los dos correos deben coincidir.',
            'expected_email.required' => 'Actualiza el listado antes de editar el correo.',
        ];
    }
}
