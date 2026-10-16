<?php

namespace App\Http\Requests\Credits;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCreditAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'credit_line' => ['sometimes', 'string', 'max:120'],
            'initial_balance' => ['sometimes', 'numeric', 'between:0,999999999999.99'],
            'current_balance' => ['sometimes', 'numeric', 'between:0,999999999999.99'],
            'term_months' => ['sometimes', 'integer', 'between:1,60'],
            'interest_rate' => ['sometimes', 'numeric', 'between:0,100'],
            'interest_rate_nominal_annual' => ['sometimes', 'nullable', 'numeric', 'between:0,100'],
            'installment_amount' => ['sometimes', 'numeric', 'between:0,999999999999.99'],
            'status' => ['sometimes', 'in:active,settled,archived'],
        ];
    }
}
