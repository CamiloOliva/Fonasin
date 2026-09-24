<?php

namespace App\Http\Requests\Contributions;

use Illuminate\Foundation\Http\FormRequest;

class StoreVoluntarySavingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'monthly_amount' => ['required', 'integer', 'min:1', 'max:10000000000'],
            'accept_terms' => ['accepted'],
        ];
    }

    public function messages(): array
    {
        return [
            'monthly_amount.required' => 'Indica el valor mensual del ahorro voluntario.',
            'monthly_amount.integer' => 'El valor mensual debe indicarse en pesos enteros.',
            'monthly_amount.max' => 'El valor mensual no puede superar $10.000.000.000.',
            'accept_terms.accepted' => 'Debes aceptar la autorizacion para enviar la solicitud.',
        ];
    }
}
