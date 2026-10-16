<?php

namespace App\Http\Requests\Credits;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCreditAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'associate_id' => ['required', 'uuid', 'exists:associates,id'],
            'credit_line' => ['required', 'string', Rule::in([
                'FONALIBRE',
                'FONAPEN',
                'FONAPRIMA',
                'FONAROTATIVO',
                'FONAPORTES',
                'CONVENIOS',
                'CREDIRAPIDO',
                'LIBRE INVERSION',
                'APORTES',
            ])],
            'initial_balance' => ['required', 'numeric', 'between:0,999999999999.99'],
            'current_balance' => ['required', 'numeric', 'between:0,999999999999.99'],
            'term_months' => ['required', 'integer', 'between:1,60'],
            'interest_rate' => ['required', 'numeric', 'between:0,100'],
            'interest_rate_nominal_annual' => ['nullable', 'numeric', 'between:0,100'],
            'installment_amount' => ['required', 'numeric', 'between:0,999999999999.99'],
            'status' => ['sometimes', 'in:active,settled,archived'],
        ];
    }
}
