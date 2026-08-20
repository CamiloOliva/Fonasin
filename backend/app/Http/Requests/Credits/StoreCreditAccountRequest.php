<?php

namespace App\Http\Requests\Credits;

use Illuminate\Foundation\Http\FormRequest;

class StoreCreditAccountRequest extends FormRequest
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
            'associate_id' => ['required', 'uuid', 'exists:associates,id'],
            'credit_line' => ['required', 'string', 'max:120'],
            'initial_balance' => ['required', 'numeric', 'min:0'],
            'current_balance' => ['required', 'numeric', 'min:0'],
            'term_months' => ['required', 'integer', 'min:1'],
            'interest_rate' => ['required', 'numeric', 'min:0'],
            'installment_amount' => ['required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'in:active,settled,archived'],
        ];
    }
}
