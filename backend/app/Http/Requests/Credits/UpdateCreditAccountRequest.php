<?php

namespace App\Http\Requests\Credits;

use App\Domain\Credits\Enums\CreditLine;
use App\Rules\ExactDecimal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCreditAccountRequest extends FormRequest
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
            'credit_line' => ['sometimes', 'string', Rule::enum(CreditLine::class)],
            'initial_balance' => ['bail', 'sometimes', new ExactDecimal(12, 2), 'numeric', 'between:0,999999999999.99'],
            'current_balance' => ['bail', 'sometimes', new ExactDecimal(12, 2), 'numeric', 'between:0,999999999999.99'],
            'last_payment_date' => ['bail', 'sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:1000-01-01', 'before_or_equal:9999-12-31'],
            'term_months' => ['sometimes', 'integer', 'between:1,60'],
            'interest_rate' => ['bail', 'sometimes', new ExactDecimal(3, 4), 'numeric', 'between:0,100'],
            'interest_rate_nominal_annual' => ['bail', 'sometimes', 'nullable', new ExactDecimal(3, 4), 'numeric', 'between:0,100'],
            'installment_amount' => ['bail', 'sometimes', new ExactDecimal(12, 2), 'numeric', 'between:0,999999999999.99'],
            'status' => ['sometimes', 'in:active,settled,archived'],
        ];
    }
}
