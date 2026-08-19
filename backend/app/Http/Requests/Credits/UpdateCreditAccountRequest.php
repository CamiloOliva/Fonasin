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
            'initial_balance' => ['sometimes', 'numeric', 'min:0'],
            'current_balance' => ['sometimes', 'numeric', 'min:0'],
            'term_months' => ['sometimes', 'integer', 'min:1'],
            'interest_rate' => ['sometimes', 'numeric', 'min:0'],
            'installment_amount' => ['sometimes', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:active,settled,archived'],
        ];
    }
}
